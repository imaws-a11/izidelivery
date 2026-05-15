import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  setSession: (s: Session | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AUTH] Erro no signOut:', error);
    }
    // Limpeza local independente do resultado do signOut
    setSession(null);
    window.location.href = '/';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AUTH] Erro ao recuperar sessão:', error.message);
          if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_refresh_token")) {
             console.warn("[AUTH] Refresh token inválido. Limpando...");
             if (isMounted) setSession(null);
             return;
          }
        }
        if (isMounted) setSession(currentSession);
      } catch (err) {
        console.error('[AUTH] Erro fatal na inicialização:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listener multi-dispositivo: captura login/logout de outras abas e dispositivos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      console.log("[AUTH] Evento:", event);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          // Sessão renovada ou login em outro dispositivo — sincroniza
          if (newSession) {
            setSession(newSession);
          }
          break;
        case 'SIGNED_OUT':
          // Logout local ou remoto
          setSession(null);
          break;
        case 'USER_UPDATED':
          // Perfil atualizado em outro dispositivo
          if (newSession) {
            setSession(newSession);
          }
          break;
        default:
          if (newSession) {
            setSession(newSession);
          }
          break;
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
