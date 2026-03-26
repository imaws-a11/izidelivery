import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import type { User } from "firebase/auth";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authInitLoading, setAuthInitLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setUserId(u ? u.uid : null);
      if (u) {
        setUserName(u.displayName || u.email?.split("@")[0] || "Usuário");
        
        // Sincronizar com o banco de dados Supabase (Somente se NAO for lojista ou entregador)
        const { data: isAdmin } = await supabase.from("admin_users").select("id").eq("id", u.uid).maybeSingle();
        const { data: isDriver } = await supabase.from("drivers_delivery").select("id").eq("id", u.uid).maybeSingle();

        if (!isAdmin && !isDriver) {
          await supabase.from("users_delivery").upsert({ 
            id: u.uid, 
            name: u.displayName || u.email?.split("@")[0] || "Usuário",
            email: u.email,
          });
        }
      }
      setAuthInitLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    setIsLoading(true);
    if (!loginEmail || !loginPassword) { 
      setLoginError("Preencha email e senha."); 
      setIsLoading(false);
      return; 
    }
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error("Login error:", err); 
      setLoginError(err.code === 'auth/invalid-credential' ? 'Email ou senha inválidos.' : err.message); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoginError("");
    setIsLoading(true);
    if (!loginEmail || !loginPassword) { 
      setLoginError("Preencha email e senha."); 
      setIsLoading(false);
      return; 
    }
    if (loginPassword.length < 6) { 
      setLoginError("Senha deve ter pelo menos 6 caracteres."); 
      setIsLoading(false);
      return; 
    }
    if (!userName.trim()) {
      setLoginError("Informe seu nome completo.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: userName.trim()
      });

      // Sincronizar com Supabase
      await supabase.from("users_delivery").upsert({ 
        id: user.uid, 
        name: userName.trim(), 
        email: loginEmail,
        phone: phone.trim(),
        created_at: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("SignUp error:", err);
      setLoginError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    userId,
    userName,
    setUserName,
    phone,
    setPhone,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    authMode,
    setAuthMode,
    isLoading,
    setIsLoading,
    loginError,
    setLoginError,
    authInitLoading,
    setAuthInitLoading,
    handleLogin,
    handleSignUp,
    logout
  };
};
