import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface WalletContextData {
  walletBalance: number;
  iziCoins: number;
  userXP: number;
  iziCashbackEarned: number;
  isIziBlackMembership: boolean;
  walletTransactions: any[];
  savedCards: any[];
  isLoadingWallet: boolean;
  fetchWalletData: () => Promise<void>;
  fetchSavedCards: () => Promise<void>;
  handleDeleteCard: (id: string) => Promise<void>;
  setUserXP: React.Dispatch<React.SetStateAction<number>>;
  setIziCoins: React.Dispatch<React.SetStateAction<number>>;
  processCardPayment: (params: { 
    orderId: string, 
    amount: number, 
    cardObj?: any,
    email: string,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  }) => Promise<void>;
}

const WalletContext = createContext<WalletContextData>({} as WalletContextData);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [iziCoins, setIziCoins] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [iziCashbackEarned, setIziCashbackEarned] = useState(0);
  const [isIziBlackMembership, setIsIziBlackMembership] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;
    setIsLoadingWallet(true);
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("wallet_balance, is_izi_black, cashback_earned, user_xp, izi_coins")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setWalletBalance(data.wallet_balance || 0);
        setIsIziBlackMembership(data.is_izi_black || false);
        setIziCashbackEarned(data.cashback_earned || 0);
        setUserXP(data.user_xp || 0);
        setIziCoins(data.izi_coins || 0);
      }

      const { data: txs } = await supabase
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txs) {
        // Filtra transações que pertencem exclusivamente ao fluxo de entregador
        const userTxs = txs.filter(tx => {
          if (tx.type === 'vaga_dedicada') return false;
          if (tx.description && (
            tx.description.startsWith('Ganhos:') || 
            tx.description.includes('pagamento em Dinheiro') ||
            tx.description.startsWith('Saque') ||
            tx.description.toLowerCase().includes('corrida finalizada')
          )) return false;
          return true;
        });
        setWalletTransactions(userTxs);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da carteira:", e);
    } finally {
      setIsLoadingWallet(false);
    }
  }, [userId]);

  const fetchSavedCards = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedCards(data || []);
    } catch (err) {
      console.error("Erro ao buscar cartões:", err);
    }
  }, [userId]);

  const handleDeleteCard = async (id: string) => {
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      setSavedCards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar cartão:", err);
    }
  };

  const processCardPayment = async ({ orderId, amount, cardObj, email, onSuccess, onError }: any) => {
    try {
      const brand = (cardObj.brand || "Visa").toLowerCase();
      const token = cardObj.mp_token || cardObj.token;

      // Mapeamento correto para IDs do Mercado Pago
      let mpMethodId = "master";
      if (brand.includes("visa")) mpMethodId = "visa";
      else if (brand.includes("master")) mpMethodId = "master";
      else if (brand.includes("amex")) mpMethodId = "amex";
      else if (brand.includes("elo")) mpMethodId = "elo";
      else if (brand.includes("hiper")) mpMethodId = "hipercard";

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
        body: {
          amount: Number(amount.toFixed(2)),
          orderId: orderId,
          payment_method_id: mpMethodId,
          token: token,
          email: email,
          installments: 1
        },
      });

      if (fnErr || (fnData && (fnData.status !== 'approved' && fnData.status !== 'in_process'))) {
         const mpMsg = fnData?.details || fnData?.error || fnErr?.message || "O cartão foi recusado pela operadora.";
         onError?.(mpMsg);
         return;
      }

      onSuccess?.();
    } catch (err: any) {
      console.error("Card processing error:", err);
      onError?.("Erro ao processar pagamento");
    }
  };

  useEffect(() => {
    if (!userId) {
      setWalletBalance(0);
      setWalletTransactions([]);
      return;
    }

    fetchWalletData();
    fetchSavedCards();

    const userProfileSub = supabase
      .channel(`user_sync_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users_delivery', filter: `id=eq.${userId}` },
        (payload) => {
          const data = payload.new as any;
          if (data) {
            setWalletBalance(data.wallet_balance || 0);
            setIsIziBlackMembership(data.is_izi_black || false);
            setIziCashbackEarned(data.cashback_earned || 0);
            setUserXP(data.user_xp || 0);
            setIziCoins(data.izi_coins || 0);
          }
        }
      )
      .subscribe();

    const walletTxSub = supabase
      .channel(`wallet_tx_sync_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions_delivery', filter: `user_id=eq.${userId}` },
        (payload) => {
          const tx = payload.new as any;
          // Filtros de negócio que estavam no App.tsx
          if (tx.type === 'vaga_dedicada') return;
          if (tx.description && (
            tx.description.startsWith('Ganhos:') || 
            tx.description.includes('pagamento em Dinheiro') ||
            tx.description.startsWith('Saque') ||
            tx.description.toLowerCase().includes('corrida finalizada')
          )) return;
          
          setWalletTransactions(prev => [tx, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    const cardsSub = supabase
      .channel(`cards_sync_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_methods', filter: `user_id=eq.${userId}` },
        () => fetchSavedCards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userProfileSub);
      supabase.removeChannel(walletTxSub);
      supabase.removeChannel(cardsSub);
    };
  }, [userId, fetchWalletData]);

  return (
    <WalletContext.Provider value={{
      walletBalance,
      iziCoins,
      userXP,
      iziCashbackEarned,
      isIziBlackMembership,
      walletTransactions,
      savedCards,
      isLoadingWallet,
      fetchWalletData,
      fetchSavedCards,
      handleDeleteCard,
      setUserXP,
      setIziCoins,
      processCardPayment
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
