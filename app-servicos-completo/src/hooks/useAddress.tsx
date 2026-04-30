import { useApp } from "./useApp";

/**
 * Hook useAddress (Alias/Proxy)
 * Este hook centraliza as operações de endereço e geolocalização.
 * Ele serve como uma ponte para os componentes que foram criados esperando 
 * um hook isolado de endereços, consumindo os dados do AppContext.
 */
export const useAddress = () => {
  const {
    savedAddresses,
    saveAddress,
    deleteAddress,
    setActiveAddress,
    userLocation,
    updateLocation,
    setUserLocation
  } = useApp();

  return {
    savedAddresses,
    saveAddress,
    deleteAddress,
    setActiveAddress,
    userLocation,
    updateLocation,
    setUserLocation
  };
};
