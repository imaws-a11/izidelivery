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
  const [adminProfile, setAdminProfile] = useState<any>(null);

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

    // Timer de segurança para evitar carregamento infinito
    const authTimeout = setTimeout(() => {
      setAuthInitLoading(prev => {
        if (prev) {
          console.warn("[AUTH] Timeout de inicialização atingido. Forçando encerramento do loading.");
        }
        return false;
      });
    }, 10000);

    let isMounted = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao recuperar sessão inicial (auth):", error.message);
          if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_refresh_token")) {
            console.warn("[AUTH] Refresh token inválido detectado no início. Limpando sessão...");
            if (isMounted) {
              setUser(null);
              setUserId(null);
            }
            return;
          }
        }
        if (!isMounted) return;
        const u = session?.user || null;
        setUser(u);
        setUserId(u ? u.id : null);
        if (u) {
          setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Usuário");
          checkRoles(u.id);
        }
      } catch (err: any) {
        console.error("Exceção fatal no getSession:", err);
      } finally {
        if (isMounted) {
          setAuthInitLoading(false);
          clearTimeout(authTimeout);
        }
      }
    };

    checkSession();

    // Listener multi-dispositivo: captura login/logout de outras abas e dispositivos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED': {
          const u = session?.user || null;
          setUser(u);
          setUserId(u ? u.id : null);
          if (u) {
            setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Usuário");
            checkRoles(u.id);
          }
          break;
        }
        case 'SIGNED_OUT':
          setUser(null);
          setUserId(null);
          setIsUserAdmin(false);
          setAdminProfile(null);
          break;
        default: {
          const u = session?.user || null;
          setUser(u);
          setUserId(u ? u.id : null);
          if (u) {
            setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Usuário");
          } else {
            setIsUserAdmin(false);
            setAdminProfile(null);
          }
          break;
        }
      }
      setAuthInitLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkRoles = async (uid: string) => {
    const { data: admin } = await supabase.from("admin_users").select("*").eq("id", uid).maybeSingle();
    setIsUserAdmin(!!admin);
    setAdminProfile(admin);
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
        const userRole = user.user_metadata?.role;
        const isNotSpecialAccount = !userRole || userRole === 'user' || userRole === 'customer';

        if (!isNotSpecialAccount) {
          console.warn("[AUTH] Cadastro detectado para papel especial. Sincronização de perfil de cliente abortada.");
        }

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
    try {
      setIsUserAdmin(false);
      setAdminProfile(null);
      await supabase.auth.signOut();
      
      // Limpeza de chaves de "Lembrar-me"
      localStorage.removeItem("izi_remembered_email");
      localStorage.removeItem("izi_remembered_pass");
      localStorage.removeItem("izi_remember_me");
    } catch (error) {
      console.error("[AUTH] Erro no logout:", error);
    }
    // Sempre limpa estado local
    setUser(null);
    setUserId(null);
    window.location.href = '/';
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
    isAdmin: isUserAdmin,
    adminProfile
  };
};
