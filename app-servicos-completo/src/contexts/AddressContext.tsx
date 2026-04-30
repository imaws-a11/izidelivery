import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toastSuccess, toastError } from '../lib/useToast';
import type { SavedAddress } from '../types';

interface AddressContextData {
  savedAddresses: SavedAddress[];
  isLoadingAddresses: boolean;
  fetchAddresses: () => Promise<void>;
  saveAddress: (address: Partial<SavedAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setActiveAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextData>({} as AddressContextData);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;
    setIsLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      
      if (data) {
        setSavedAddresses(data.map((addr: any) => ({
          id: addr.id,
          label: addr.label,
          street: addr.street,
          details: addr.details,
          city: addr.city,
          active: addr.is_active,
          lat: addr.lat,
          lng: addr.lng,
        })));
      }
    } catch (e) {
      console.error("Erro ao carregar endereços:", e);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [userId]);

  const saveAddress = async (addr: Partial<SavedAddress>) => {
    if (!userId) return;
    try {
      if (addr.id) {
        await supabase.from('saved_addresses').update({
          label: addr.label,
          street: addr.street,
          address: addr.street,
          details: addr.details,
          city: addr.city,
        }).eq('id', addr.id);
        toastSuccess('Endereço atualizado!');
      } else {
        await supabase.from('saved_addresses').insert({
          user_id: userId,
          label: addr.label,
          street: addr.street,
          address: addr.street,
          details: addr.details,
          city: addr.city,
          is_active: savedAddresses.length === 0,
        });
        toastSuccess('Endereço salvo com sucesso!');
      }
      fetchAddresses();
    } catch (e: any) {
      toastError('Erro ao salvar: ' + e.message);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await supabase.from('saved_addresses').delete().eq('id', id);
      toastSuccess('Endereço removido.');
      fetchAddresses();
    } catch (e: any) {
      toastError('Erro ao remover: ' + e.message);
    }
  };

  const setActiveAddress = async (id: string) => {
    if (!userId) return;
    try {
      await supabase.from('saved_addresses').update({ is_active: false }).eq('user_id', userId);
      await supabase.from('saved_addresses').update({ is_active: true }).eq('id', id);
      toastSuccess('Endereço padrão atualizado!');
      fetchAddresses();
    } catch (e: any) {
      toastError('Erro ao definir endereço: ' + e.message);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return (
    <AddressContext.Provider value={{
      savedAddresses,
      isLoadingAddresses,
      fetchAddresses,
      saveAddress,
      deleteAddress,
      setActiveAddress
    }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => useContext(AddressContext);
