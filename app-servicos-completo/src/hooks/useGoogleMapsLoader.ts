import { useJsApiLoader } from '@react-google-maps/api';

import { GMAPS_KEY } from '../config';

const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

/**
 * Hook singleton para carregar a Google Maps JavaScript API.
 * Usar este hook único em vez de múltiplas instâncias de useJsApiLoader
 * evita o erro ApiTargetBlockedMapError por duplo carregamento.
 */
export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: 'izi-google-maps',
    googleMapsApiKey: GMAPS_KEY,
    libraries: LIBRARIES,
    language: 'pt-BR',
    region: 'BR',
  });
}
