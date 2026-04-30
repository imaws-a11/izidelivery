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
  isLoadingWallet: boolean;
  fetchWalletData: () => Promise<void>;
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

  useEffect(() => {
    if (!userId) {
      setWalletBalance(0);
      setWalletTransactions([]);
      return;
    }

    fetchWalletData();

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

    return () => {
      supabase.removeChannel(userProfileSub);
      supabase.removeChannel(walletTxSub);
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
      isLoadingWallet,
      fetchWalletData
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
