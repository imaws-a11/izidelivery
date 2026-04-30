import { useApp } from "./useApp";

/**
 * Hook useOrder (Alias/Proxy)
 * Este hook serve como um atalho para as funcionalidades de carrinho e pedidos
 * centralizadas no AppContext. Ele resolve as dependências de componentes 
 * modulares que foram criados esperando um hook específico de pedidos.
 */
export const useOrder = () => {
  const {
    cart,
    setCart,
    getCartSubtotal,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    useCoins,
    setUseCoins,
    iziCoins,
    setIziCoins,
    selectedShop,
    setSelectedShop,
  } = useApp();

  return {
    cart,
    setCart,
    getCartSubtotal,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    useCoins,
    setUseCoins,
    iziCoins,
    setIziCoins,
    selectedShop,
    setSelectedShop,
  };
};
