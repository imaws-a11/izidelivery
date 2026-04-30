import { useApp as useGlobalContext } from "../contexts/AppContext";
import { useAuth } from "./useAuth";
import { useWallet } from "../contexts/WalletContext";
import { useOrders } from "../contexts/OrderContext";
import { useAddresses } from "../contexts/AddressContext";
import { toastSuccess, toastError, toastWarning, showConfirm } from "../lib/useToast";

/**
 * Super Hook useApp
 * Centraliza o acesso a todos os contextos do aplicativo para simplificar
 * a migração de componentes modulares do monólito App.tsx.
 */
export const useApp = () => {
  const global = useGlobalContext();
  const auth = useAuth();
  const wallet = useWallet();
  const orders = useOrders();
  const addresses = useAddresses();

  return {
    // Configurações e Orquestração (AppContext)
    ...global,

    // Autenticação (useAuth)
    ...auth,

    // Financeiro (WalletContext)
    ...wallet,

    // Pedidos (OrderContext)
    ...orders,

    // Endereços (AddressContext)
    ...addresses,

    // Toasts e Modais (lib/useToast)
    toastSuccess,
    toastError,
    toastWarning,
    showConfirm,
  };
};
