import React, { useState } from 'react';
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
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
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
  handleSignUp,
  rememberMe,
  setRememberMe
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const logoPremium = "/logo_principal.png";

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 items-center justify-center px-6 relative overflow-hidden">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px #0a0a0a20 !important;
        }
      `}</style>

      {/* Background Decor - Claymorphism Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[60%] bg-yellow-400/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] bg-zinc-900/50 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
          >
            <img src={logoPremium} className="w-32 h-32 object-contain" alt="Izi Delivery" />
          </motion.div>
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">
              {authMode === 'login' ? 'Bem-vindo' : 'Junte-se a nós'}
            </h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
              {authMode === 'login' ? 'Stealth Luxury Delivery' : 'Experiência Premium IZI'}
            </p>
          </motion.div>
        </div>

        {/* Main Card - Claymorphism style */}
        <div className="bg-[#121212] rounded-[50px] p-8 shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.03)] border border-white/5 relative overflow-hidden">
           {/* Animated shine line */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />

           <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); }}>
             <AnimatePresence mode="wait">
               <motion.div 
                 key={authMode}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-5"
               >
                 {authMode === 'register' && (
                   <>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Nome Completo</label>
                       <div className="bg-[#0a0a0a] rounded-[24px] shadow-inner border border-white/5 flex items-center px-5 focus-within:border-yellow-400/30 transition-all">
                          <span className="material-symbols-outlined text-zinc-700 text-xl">person</span>
                          <input 
                            type="text" 
                            value={userName} 
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Como deseja ser chamado?"
                            className="w-full bg-transparent py-4 pl-4 text-white placeholder:text-zinc-800 outline-none text-sm font-bold italic" 
                          />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Telefone / WhatsApp</label>
                       <div className="bg-[#0a0a0a] rounded-[24px] shadow-inner border border-white/5 flex items-center px-5 focus-within:border-yellow-400/30 transition-all">
                          <span className="material-symbols-outlined text-zinc-700 text-xl">call</span>
                          <input 
                            type="tel" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 0 0000-0000"
                            className="w-full bg-transparent py-4 pl-4 text-white placeholder:text-zinc-800 outline-none text-sm font-bold italic" 
                          />
                       </div>
                     </div>
                   </>
                 )}

                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">E-mail de acesso</label>
                   <div className="bg-[#0a0a0a] rounded-[24px] shadow-inner border border-white/5 flex items-center px-5 focus-within:border-yellow-400/30 transition-all">
                      <span className="material-symbols-outlined text-zinc-700 text-xl">alternate_email</span>
                      <input 
                        type="email" 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-transparent py-4 pl-4 text-white placeholder:text-zinc-800 outline-none text-sm font-bold italic" 
                      />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Sua Chave Premium</label>
                   <div className="bg-[#0a0a0a] rounded-[24px] shadow-inner border border-white/5 flex items-center px-5 focus-within:border-yellow-400/30 transition-all">
                      <span className="material-symbols-outlined text-zinc-700 text-xl">lock</span>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignUp())}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent py-4 pl-4 text-white placeholder:text-zinc-800 outline-none text-sm font-bold italic" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-700 hover:text-yellow-400 transition-colors"
                      >
                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                   </div>
                 </div>
               </motion.div>
             </AnimatePresence>

             {/* Features Section */}
             <div className="flex items-center justify-between px-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-800 bg-[#0a0a0a]'}`}>
                    {rememberMe && <span className="material-symbols-outlined text-[14px] font-black text-black">check</span>}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${rememberMe ? 'text-white' : 'text-zinc-600'}`}>Salvar dados</span>
                </button>
                
                {authMode === 'login' && (
                  <button type="button" className="text-[9px] font-black uppercase tracking-widest text-yellow-400/50 hover:text-yellow-400">Esqueci Senha</button>
                )}
             </div>

             <div className="pt-4 space-y-4">
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => authMode === 'login' ? handleLogin() : handleSignUp()}
                 disabled={isLoading}
                 className="w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 bg-yellow-400 text-black shadow-[10px_10px_30px_rgba(250,204,21,0.1),inset_4px_4px_8px_rgba(255,255,255,0.6)] italic"
               >
                 {isLoading ? (
                   <div className="size-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                 ) : (
                   <>
                     <span>{authMode === 'login' ? 'Acessar Conta' : 'Criar Conta Premium'}</span>
                     <div className="size-8 rounded-xl bg-black/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                     </div>
                   </>
                 )}
               </motion.button>
               
               <button 
                 type="button"
                 onClick={() => {
                   setAuthMode(authMode === 'login' ? 'register' : 'login');
                   setLoginError("");
                 }}
                 className="w-full py-4 rounded-[22px] font-black text-[9px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all bg-black/20 border border-white/5 active:scale-95"
               >
                 {authMode === 'login' ? 'Novo por aqui? Criar Cadastro' : 'Já possui conta? Fazer Login'}
               </button>
             </div>
           </form>
        </div>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 rounded-[28px] bg-red-400/5 border border-red-400/10 flex items-center gap-4 shadow-xl"
          >
            <div className="size-10 rounded-xl bg-red-400/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-xl font-black">warning</span>
            </div>
            <p className="text-red-400 text-xs font-black italic">{loginError}</p>
          </motion.div>
        )}
        
        {/* Footer info */}
        <div className="mt-12 text-center opacity-30">
           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.8em]">Powered by IZI Delivery Group</p>
        </div>
      </div>
    </div>
  );
};
