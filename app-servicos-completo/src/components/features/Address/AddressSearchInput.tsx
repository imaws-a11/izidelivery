import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { GMAPS_KEY } from '../../../config';

interface AddressSearchInputProps {
  placeholder: string;
  initialValue?: string;
  onSelect: (addr: { formatted_address: string; lat?: number; lng?: number }) => void;
  onClear?: () => void;
  className?: string;
  /** Localização do usuário para usar como referência de bias nas sugestões */
  userCoords?: { lat: number; lng: number } | null;
  /** Se true, o input está dentro de um modal/overlay com fundo escuro */
  darkMode?: boolean;
}

export const AddressSearchInput = ({
  placeholder,
  initialValue,
  onSelect,
  onClear,
  className,
  userCoords,
}: AddressSearchInputProps) => {
  const [query, setQuery] = useState(initialValue || "");
  useEffect(() => {
    setQuery(initialValue || "");
  }, [initialValue]);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateDropdownPos = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, any> = {
        input,
        includedRegionCodes: ["br"],
        languageCode: "pt-BR",
      };

      // Adiciona locationBias e origin se temos coordenadas do usuário para ranking e distância
      if (userCoords?.lat && userCoords?.lng) {
        body.locationBias = {
          circle: {
            center: { latitude: userCoords.lat, longitude: userCoords.lng },
            radius: 5000, // 5km de raio de preferência mais forte
          },
        };
        body.origin = {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        };
      }

      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GMAPS_KEY,
            "X-Goog-FieldMask": "suggestions.placePrediction.text,suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.distanceMeters",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      const predictions = (data.suggestions || [])
        .map((s: any) => ({
          description: s.placePrediction?.text?.text || "",
          place_id: s.placePrediction?.placeId || "",
          distanceMeters: s.placePrediction?.distanceMeters || 0,
          structured_formatting: {
            main_text: s.placePrediction?.structuredFormat?.mainText?.text || "",
            secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text || "",
          },
        }))
        .filter((p: any) => p.description);

      if (predictions.length > 0) {
        setSuggestions(predictions);
        updateDropdownPos();
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formata a distância de forma amigável
   */
  const formatDistance = (meters: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  /**
   * Busca lat/lng do place selecionado via Places API (New) GET
   */
  const fetchPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${GMAPS_KEY}&languageCode=pt-BR`,
        { method: "GET" }
      );
      const data = await res.json();
      if (data?.location) {
        return { lat: data.location.latitude, lng: data.location.longitude };
      }
    } catch { /* silent */ }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val) {
      setSuggestions([]);
      setOpen(false);
      if (onClear) onClear();
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    if (onClear) onClear();
  };

  const handleSelect = async (prediction: any) => {
    const description = prediction.description || "";
    setQuery(description);
    setOpen(false);
    setSuggestions([]);

    // Busca coordenadas do lugar para melhor precisão de rota
    let coords: { lat: number; lng: number } | null = null;
    if (prediction.place_id) {
      coords = await fetchPlaceDetails(prediction.place_id);
    }

    onSelect({
      formatted_address: description,
      ...(coords ?? {}),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length > 2) {
      e.preventDefault();
      setOpen(false);
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        onSelect({ formatted_address: query });
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const dropdown =
    open && suggestions.length > 0
      ? createPortal(
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              borderRadius: "20px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
              zIndex: 2147483647,
              overflow: "hidden",
              maxHeight: "340px",
              overflowY: "auto",
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header da lista */}
            <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "4px", height: "12px", background: "#ffd900", borderRadius: "10px" }} />
              <span style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                {userCoords ? "📍 Sugestões por proximidade" : "💡 Sugestões de endereço"}
              </span>
            </div>

            {suggestions.map((s: any, i: number) => (
              <div
                key={i}
                onMouseDown={() => handleSelect(s)}
                style={{
                  padding: "14px 18px",
                  cursor: "pointer",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,217,0,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "12px",
                  background: "rgba(255,217,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#ffd900" }}>location_on</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.structured_formatting?.main_text || s.description}
                    </span>
                    {s.distanceMeters > 0 && (
                      <span style={{ 
                        fontSize: "9px", 
                        background: "rgba(255,255,255,0.06)", 
                        color: "rgba(255,255,255,0.4)", 
                        padding: "2px 6px", 
                        borderRadius: "6px",
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {formatDistance(s.distanceMeters)}
                      </span>
                    )}
                  </div>
                  {s.structured_formatting?.secondary_text && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>north_west</span>
              </div>
            ))}

            {/* Powered by Google */}
            <div style={{
              padding: "8px 18px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
            }}>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>powered by</span>
              <svg height="10" viewBox="0 0 74 24" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
                <path d="M6.24 2.4C3.6 2.4 1.44 4.56 1.44 7.2s2.16 4.8 4.8 4.8c1.68 0 2.64-.48 3.36-1.2l.96.96c-1.08.96-2.52 1.56-4.32 1.56C2.76 13.32 0 10.56 0 7.2S2.76 1.08 6.24 1.08c1.8 0 3.12.6 4.2 1.56L9.6 3.48C8.88 2.88 7.68 2.4 6.24 2.4z" fill="#4285F4"/>
                <path d="M9.84 6.48H6.24V7.8h3.6c-.12 2.04-1.8 3.48-3.6 3.48-2.04 0-3.6-1.56-3.6-3.6s1.56-3.6 3.6-3.6c.96 0 1.8.36 2.4.96l.96-.96C8.64 3.12 7.56 2.64 6.24 2.64 3.72 2.64 1.68 4.68 1.68 7.2s2.04 4.56 4.56 4.56 4.44-1.68 4.44-4.44c0-.24 0-.6-.12-.84H9.84z" fill="#4285F4"/>
              </svg>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{ paddingRight: query ? "2.5rem" : undefined }}
          onFocus={() => {
            updateDropdownPos();
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {loading && (
          <div style={{ position: "absolute", right: query ? "2.8rem" : "0.75rem", display: "flex", alignItems: "center" }}>
            <svg style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite", color: "rgba(255,217,0,0.6)" }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {query && !loading && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            style={{
              position: "absolute",
              right: "10px",
              background: "rgba(100,116,139,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "13px", color: "#94a3b8" }}>close</span>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
};
