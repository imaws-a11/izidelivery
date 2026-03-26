import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface LoginViewProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  userName: string;
  setUserName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  setLoginError: (val: string) => void;
  isLoading: boolean;
  handleLogin: () => void;
  handleSignUp: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  authMode,
  setAuthMode,
  userName,
  setUserName,
  phone,
  setPhone,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  setLoginError,
  isLoading,
  handleLogin,
  handleSignUp
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-yellow-400/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-800/30 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm space-y-12 relative z-10 transition-all duration-500">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-3xl bg-zinc-900 shadow-2xl border border-zinc-800 mb-2"
          >
            <h1 className="text-4xl font-black tracking-[0.2em] italic text-yellow-400 uppercase"
              style={{ textShadow: "0 0 30px rgba(255,215,9,0.3)" }}>
              IZI
            </h1>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'login' ? 'Seja bem-vindo de volta' : 'Crie sua conta IZI'}
            </h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              {authMode === 'login' ? 'Stealth Luxury Delivery' : 'Experiência Premium em Segundos'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={authMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {authMode === 'register' && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Nome Completo</p>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Como deseja ser chamado?"
                      className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Telefone / WhatsApp</p>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 0 0000-0000"
                      className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Endereço de E-mail</p>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Sua Chave de Acesso</p>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignUp())}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-6 space-y-4">
            <button 
              onClick={() => authMode === 'login' ? handleLogin() : handleSignUp()}
              disabled={isLoading}
              className="w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
              style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 10px 30px rgba(255,215,9,0.15)" }}
            >
              {isLoading && <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
              <span>{authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}</span>
              <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setLoginError("");
              }}
              className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-900 text-zinc-500 hover:border-yellow-400/20 hover:text-yellow-400 transition-all active:scale-95"
            >
              {authMode === 'login' ? 'Novo por aqui? Criar uma conta' : 'Já possui conta? Fazer Login'}
            </button>
          </div>
        </div>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-red-400 text-lg">error</span>
            <p className="text-red-400 text-xs font-bold">{loginError}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
