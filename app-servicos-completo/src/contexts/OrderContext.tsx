import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface OrderContextData {
  orders: any[];
  activeOrder: any | null;
  isLoadingOrders: boolean;
  fetchOrders: () => Promise<void>;
  setActiveOrder: (order: any | null) => void;
}

const OrderContext = createContext<OrderContextData>({} as OrderContextData);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders_delivery")
        .select(`
          *,
          merchants_delivery (name, logo_url),
          drivers_delivery (name, avatar_url, phone, lat, lng)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
        const active = data.find((o: any) => 
          !['completed', 'cancelled', 'rejected'].includes(o.status)
        );
        if (active) setActiveOrder(active);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setActiveOrder(null);
      return;
    }

    fetchOrders();

    const ordersSub = supabase
      .channel(`orders_sync_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders_delivery', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("[REALTIME] Mudança no pedido:", payload);
          fetchOrders(); // Recarrega para pegar joins
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSub);
    };
  }, [userId, fetchOrders]);

  return (
    <OrderContext.Provider value={{
      orders,
      activeOrder,
      isLoadingOrders,
      fetchOrders,
      setActiveOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
