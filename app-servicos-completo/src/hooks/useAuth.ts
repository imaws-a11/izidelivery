import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authInitLoading, setAuthInitLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Carregar dados salvos se existirem
    const savedEmail = localStorage.getItem("izi_remembered_email");
    const savedPass = localStorage.getItem("izi_remembered_pass");
    const isRemembered = localStorage.getItem("izi_remember_me") === "true";

    if (isRemembered) {
      setRememberMe(true);
      if (savedEmail) setLoginEmail(savedEmail);
      if (savedPass) setLoginPassword(savedPass);
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao recuperar sessão inicial (auth):", error.message);
        if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
          // Limpa estado local se a sessão for fatalmente inválida
          setUser(null);
          setUserId(null);
          return;
        }
      }
      const u = session?.user || null;
      setUser(u);
      setUserId(u ? u.id : null);
      if (u) {
        setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Usuário");
        checkRoles(u.id);
      }
      setAuthInitLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      setUser(u);
      setUserId(u ? u.id : null);
      if (u) {
        setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Usuário");
        checkRoles(u.id);
      } else {
        setIsUserAdmin(false);
      }
      setAuthInitLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRoles = async (uid: string) => {
    const { data: admin } = await supabase.from("admin_users").select("id").eq("id", uid).maybeSingle();
    setIsUserAdmin(!!admin);
  };

  const handleLogin = async () => {
    setLoginError("");
    setIsLoading(true);
    if (!loginEmail || !loginPassword) { 
      setLoginError("Preencha email e senha."); 
      setIsLoading(false);
      return; 
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;

      // Persistir se rememberMe estiver ativo
      if (rememberMe) {
        localStorage.setItem("izi_remembered_email", loginEmail);
        localStorage.setItem("izi_remembered_pass", loginPassword);
        localStorage.setItem("izi_remember_me", "true");
      } else {
        localStorage.removeItem("izi_remembered_email");
        localStorage.removeItem("izi_remembered_pass");
        localStorage.setItem("izi_remember_me", "false");
      }

    } catch (err: any) {
      console.error("Login error:", err); 
      setLoginError(err.message === 'Invalid login credentials' ? 'Email ou senha inválidos.' : err.message); 
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
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
        options: {
          data: {
            name: userName.trim(),
            phone: phone.trim(),
          }
        }
      });
      if (error) throw error;
      
      const user = data.user;
      if (user) {
        // Sincronizar com perfil publico
        await supabase.from("users_delivery").upsert({ 
          id: user.id, 
          name: userName.trim(), 
          email: loginEmail,
          phone: phone.trim(),
          created_at: new Date().toISOString()
        });

        if (rememberMe) {
          localStorage.setItem("izi_remembered_email", loginEmail);
          localStorage.setItem("izi_remembered_pass", loginPassword);
          localStorage.setItem("izi_remember_me", "true");
        }
      }

    } catch (err: any) {
      console.error("SignUp error:", err);
      setLoginError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsUserAdmin(false);
    await supabase.auth.signOut();
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
    rememberMe,
    setRememberMe,
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
    logout,
    isAdmin: isUserAdmin
  };
};

