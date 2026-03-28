import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as firebaseAuth } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  session: any;
  setSession: (s: any) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('izi_admin_session');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        const mockSession = {
          user: {
            id: user.uid,
            email: user.email,
          },
          access_token: 'firebase-token',
        };
        setSession(mockSession);
        localStorage.setItem('izi_admin_session', JSON.stringify(mockSession));
      } else {
        setSession(null);
        localStorage.removeItem('izi_admin_session');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(firebaseAuth);
    setSession(null);
    localStorage.removeItem('izi_admin_session');
  };

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
