import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? '';

// Carrega o Google Maps dinamicamente e chama callback quando pronto
function loadGoogleMapsScript(callback: () => void) {
  if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
    callback();
    return;
  }
  const existingScript = document.getElementById("gmaps-script");
  if (existingScript) {
    existingScript.addEventListener("load", callback);
    return;
  }
  (window as any).__gmapsCallback = callback;
  const script = document.createElement("script");
  script.id = "gmaps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places,geometry&language=pt-BR&callback=__gmapsCallback`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

interface AddressSearchInputProps {
  placeholder: string;
  initialValue?: string;
  onSelect: (addr: { formatted_address: string }) => void;
  onClear?: () => void;
  className?: string;
}

export const AddressSearchInput = ({ placeholder, initialValue, onSelect, onClear, className }: AddressSearchInputProps) => {
  const [query, setQuery] = useState(initialValue || "");
  useEffect(() => {
    setQuery(initialValue || "");
  }, [initialValue]);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [googleReady, setGoogleReady] = useState(!!(window as any).google?.maps?.places);
  const debounceRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!googleReady) {
      loadGoogleMapsScript(() => setGoogleReady(true));
    }
  }, [googleReady]);

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
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) { setSuggestions([]); setOpen(false); return; }
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GMAPS_KEY },
          body: JSON.stringify({ input, includedRegionCodes: ["br"], languageCode: "pt-BR" }),
        }
      );
      const data = await res.json();
      const predictions = (data.suggestions || []).map((s: any) => ({
        description: s.placePrediction?.text?.text || "",
        place_id: s.placePrediction?.placeId || "",
        structured_formatting: {
          main_text: s.placePrediction?.structuredFormat?.mainText?.text || "",
          secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text || "",
        }
      })).filter((p: any) => p.description);
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
    }
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
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    if (onClear) onClear();
  };

  const handleSelect = (prediction: any) => {
    const description = prediction.description || "";
    setQuery(description);
    setOpen(false);
    setSuggestions([]);
    onSelect({ formatted_address: description });
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
  };

  const dropdown = open && suggestions.length > 0 ? createPortal(
    <div
      onMouseDown={e => e.preventDefault()}
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        zIndex: 2147483647,
        overflow: "hidden",
        border: "1px solid #f1f5f9",
        maxHeight: "320px",
        overflowY: "auto",
      }}
    >
      {suggestions.map((s: any, i: number) => (
        <div
          key={i}
          onMouseDown={() => handleSelect(s)}
          style={{
            padding: "14px 20px",
            cursor: "pointer",
            borderTop: i > 0 ? "1px solid #f8fafc" : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            background: "white",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.background = "white")}
        >
          <span style={{ fontSize: "18px", marginTop: "2px", flexShrink: 0 }}>📍 </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.structured_formatting?.main_text || s.description}
            </div>
            {s.structured_formatting?.secondary_text && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.structured_formatting.secondary_text}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

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
          style={{ paddingRight: query ? "2.5rem" : undefined }}
          onFocus={() => {
            updateDropdownPos();
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            style={{ position: "absolute", right: "12px", background: "rgba(100,116,139,0.15)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, zIndex: 10 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#94a3b8" }}>close</span>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
};
