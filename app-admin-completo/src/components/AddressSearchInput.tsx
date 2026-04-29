import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../context/AdminContext";

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
  /** Se true, desloca o botão de limpar para a esquerda para dar espaço a um botão externo */
  extraRightPadding?: boolean;
  /** Dispara a cada letra digitada, útil para capturar complementos manuais (Apto, Bloco) */
  onChangeRaw?: (val: string) => void;
}

export const AddressSearchInput = ({
  placeholder,
  initialValue,
  onSelect,
  onClear,
  className,
  userCoords,
  extraRightPadding,
  onChangeRaw,
}: AddressSearchInputProps) => {
  const { isLoaded } = useAdmin();
  const [query, setQuery] = useState(initialValue || "");
  useEffect(() => {
    setQuery(initialValue || "");
  }, [initialValue]);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
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

  useEffect(() => {
    if (!userCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectedCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn("Erro ao obter geolocalização para bias:", err)
      );
    }
  }, [userCoords]);

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

  const sessionTokenRef = useRef<any>(null);

  const getSessionToken = () => {
    if (!sessionTokenRef.current && window.google) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  };

  const [apiError, setApiError] = useState<string | null>(null);

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3 || !isLoaded || !window.google) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    setApiError(null);
    
    if (!isLoaded) {
      console.warn("Maps SDK nÃ£o carregado ainda...");
      return;
    }

    try {
      const bias = userCoords || detectedCoords;
      console.log("GOOGLE STATUS:", { 
        maps: !!window.google?.maps, 
        places: !!window.google?.maps?.places,
        AutocompleteService: !!window.google?.maps?.places?.AutocompleteService
      });

      const sessionToken = getSessionToken();
      let results: any[] = [];

      // ESTRATÉGIA 1: New Places API (AutocompleteSuggestion - RECOMENDADO PARA 2025)
      try {
        console.log("Tentando Strategy 1: AutocompleteSuggestion (New API)...");
        const placesLib = await (window.google.maps as any).importLibrary("places");
        const AutocompleteSuggestion = placesLib.AutocompleteSuggestion;
        
        if (AutocompleteSuggestion && (typeof AutocompleteSuggestion.fetchAutocompletePredictions === 'function' || typeof (AutocompleteSuggestion as any).fetchAutocompleteSuggestions === 'function')) {
          const fetchMethod = AutocompleteSuggestion.fetchAutocompletePredictions || (AutocompleteSuggestion as any).fetchAutocompleteSuggestions;
          const request: any = {
            input,
            includedRegionCodes: ['br'],
            language: 'pt-BR',
            sessionToken: sessionToken
          };
          if (bias) {
            request.locationBias = { center: bias, radius: 15000 };
            request.origin = bias;
          }
          const response = await fetchMethod.call(AutocompleteSuggestion, request);
          if (response?.suggestions?.length > 0) {
            results = response.suggestions.map((s: any) => ({
              description: s.placePrediction.text.text,
              place_id: s.placePrediction.placeId,
              structured_formatting: {
                main_text: s.placePrediction.text.text.split(',')[0],
                secondary_text: s.placePrediction.text.text.split(',').slice(1).join(',').trim(),
              },
              distance_meters: s.placePrediction.distanceMeters
            }));
          }
        } else {
          console.warn("Strategy 1: AutocompleteSuggestion não disponível no SDK carregado.");
        }
      } catch (e) {
        console.warn("Estratégia 1 falhou:", e);
      }

      // ESTRATÉGIA 2: New Places API (Place Class Fallback)
      if (results.length === 0) {
        try {
          console.log("Tentando Strategy 2: Place.fetchAutocompletePredictions...");
          const { Place } = await (window.google.maps as any).importLibrary("places");
          if (Place && typeof Place.fetchAutocompletePredictions === 'function') {
            const response = await Place.fetchAutocompletePredictions({
              input,
              includedRegionCodes: ['br'],
              language: 'pt-BR',
              sessionToken: sessionToken,
              locationBias: bias ? { center: bias, radius: 15000 } : undefined
            });
            if (response?.suggestions?.length > 0) {
              results = response.suggestions.map((s: any) => ({
                description: s.placePrediction.text.text,
                place_id: s.placePrediction.placeId,
                structured_formatting: {
                  main_text: s.placePrediction.text.text.split(',')[0],
                },
                distance_meters: s.placePrediction.distanceMeters
              }));
            }
          }
        } catch (e) {
          console.warn("Estratégia 2 falhou:", e);
        }
      }

      // ESTRATÉGIA 3: AutocompleteService (Fallback Legado - Apenas para clientes antigos)
      if (results.length === 0) {
        try {
          console.log("Tentando Strategy 3: AutocompleteService (Legacy Fallback)...");
          const legacyResults = await new Promise<any[]>((resolve) => {
            if (!window.google?.maps?.places?.AutocompleteService) {
              resolve([]);
              return;
            }
            const service = new window.google.maps.places.AutocompleteService();
            service.getPlacePredictions({
              input,
              componentRestrictions: { country: 'br' },
              locationBias: bias ? new window.google.maps.LatLng(bias.lat, bias.lng) : undefined,
              radius: bias ? 15000 : undefined,
              sessionToken: sessionToken
            }, (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions);
              } else {
                console.warn("Estratégia 3 Status:", status);
                resolve([]);
              }
            });
          });
          results = legacyResults;
        } catch (e) {
          console.warn("Estratégia 3 falhou:", e);
        }
      }

      // ESTRATÃ‰GIA 4: SearchByText (Ãšltimo recurso)
      if (results.length === 0 && input.length > 5) {
        try {
          const { Place } = await (window.google.maps as any).importLibrary("places");
          const { places } = await Place.searchByText({
            textQuery: input,
            includedType: 'address',
            locationBias: bias ? { center: bias, radius: 20000 } : undefined,
            language: 'pt-BR'
          });
          if (places?.length > 0) {
            results = places.map((p: any) => ({
              description: p.formattedAddress,
              place_id: p.id,
              structured_formatting: { main_text: p.displayName },
            }));
          }
        } catch (e) {
          console.warn("EstratÃ©gia 4 falhou:", e);
        }
      }

      if (results.length === 0) {
        setApiError("NÃ£o foi possÃ­vel carregar sugestÃµes. Verifique sua chave de API ou conexÃ£o.");
      }

      setSuggestions(results);
      updateDropdownPos();
    } catch (error) {
      console.error("Falha crÃ­tica na busca:", error);
      setApiError("Erro ao processar busca de endereÃ§o.");
      setSuggestions([]);
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
    if (!isLoaded || !window.google) return null;
    
    try {
      // Tenta API Moderna primeiro
      const { Place } = await (window.google.maps as any).importLibrary("places");
      if (Place) {
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ['location'] });
        if (place.location) {
          return {
            lat: place.location.lat(),
            lng: place.location.lng()
          };
        }
      }
    } catch (e) {
      console.warn("Falha ao buscar detalhes via Place Class, tentando fallback...", e);
    }

    // Fallback legado (apenas se a nova API falhar)
    return new Promise((resolve) => {
      try {
        const div = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(div);
        service.getDetails({
          placeId,
          fields: ['geometry.location']
        }, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          } else {
            resolve(null);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onChangeRaw) onChangeRaw(val);
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
      place_id: prediction.place_id,
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
    open 
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

            {suggestions.length === 0 && (
              <div style={{ padding: "32px 18px", textAlign: "center" }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "24px", height: "24px", border: "3px solid rgba(255,217,0,0.1)", borderTopColor: "#ffd900", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Buscando sugestões...</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: apiError ? "#ef4444" : "rgba(255,255,255,0.1)" }}>
                      {apiError ? "error" : "location_off"}
                    </span>
                    <span style={{ fontSize: "11px", color: apiError ? "#ef4444" : "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                      {apiError || "Nenhum endereço encontrado"}
                    </span>
                    {apiError && (
                      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>Verifique o console para detalhes técnicos</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {suggestions.map((s: any, i: number) => (
              <div
                key={i}
                onMouseDown={() => handleSelect(s)}
                style={{
                  padding: "14px 18px",
                  cursor: "pointer",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  display: "flex",
                  gap: "14px",
                  transition: "all 0.2s",
                }}
                className="hover:bg-white/5"
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
                    {s.distance_meters > 0 && (
                      <span style={{ 
                        fontSize: "9px", 
                        background: "rgba(255,255,255,0.06)", 
                        color: "rgba(255,255,255,0.4)", 
                        padding: "2px 6px", 
                        borderRadius: "6px",
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {formatDistance(s.distance_meters)}
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
          style={{ paddingRight: extraRightPadding ? "8.5rem" : (query ? "2.5rem" : "0.75rem") }}
          onFocus={() => {
            updateDropdownPos();
            setOpen(true);
            if (query.length >= 3) {
              fetchSuggestions(query);
            }
          }}
        />
        {loading && (
          <div style={{ 
            position: "absolute", 
            right: extraRightPadding ? (query ? "155px" : "118px") : (query ? "2.8rem" : "0.75rem"), 
            display: "flex", 
            alignItems: "center" 
          }}>
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
              right: extraRightPadding ? "132px" : "10px",
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
