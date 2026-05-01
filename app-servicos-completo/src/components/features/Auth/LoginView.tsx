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
  const logoPrincipal = "/logo_principal.png";

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[40%] bg-yellow-400/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[30%] bg-zinc-50 blur-[80px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-10"
        >
          <img src={logoPrincipal} className="w-40 h-40 object-contain" alt="Izi Delivery" />
        </motion.div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-none mb-2">
            {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-zinc-400 text-sm font-medium">
            {authMode === 'login' ? 'Entre com seus dados para continuar' : 'Preencha os campos abaixo para começar'}
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full space-y-5">
           <AnimatePresence mode="wait">
             <motion.div 
               key={authMode}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
             >
               {authMode === 'register' && (
                 <>
                   <div className="space-y-1">
                     <div className="bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center px-5 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/10 transition-all">
                        <span className="material-symbols-rounded text-zinc-400 text-xl">person</span>
                        <input 
                          type="text" 
                          value={userName} 
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Nome completo"
                          className="w-full bg-transparent py-5 pl-4 text-zinc-900 placeholder:text-zinc-300 outline-none text-[15px] font-bold" 
                        />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <div className="bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center px-5 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/10 transition-all">
                        <span className="material-symbols-rounded text-zinc-400 text-xl">call</span>
                        <input 
                          type="tel" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Celular (DDD)"
                          className="w-full bg-transparent py-5 pl-4 text-zinc-900 placeholder:text-zinc-300 outline-none text-[15px] font-bold" 
                        />
                     </div>
                   </div>
                 </>
               )}

               <div className="space-y-1">
                 <div className="bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center px-5 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/10 transition-all">
                    <span className="material-symbols-rounded text-zinc-400 text-xl">alternate_email</span>
                    <input 
                      type="email" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="E-mail"
                      className="w-full bg-transparent py-5 pl-4 text-zinc-900 placeholder:text-zinc-300 outline-none text-[15px] font-bold" 
                    />
                 </div>
               </div>

               <div className="space-y-1">
                 <div className="bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center px-5 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/10 transition-all">
                    <span className="material-symbols-rounded text-zinc-400 text-xl">lock</span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignUp())}
                      placeholder="Senha"
                      className="flex-1 bg-transparent py-5 pl-4 text-zinc-900 placeholder:text-zinc-300 outline-none text-[15px] font-bold" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-300 hover:text-zinc-600 transition-colors"
                    >
                      <span className="material-symbols-rounded">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                 </div>
               </div>
             </motion.div>
           </AnimatePresence>

           <div className="flex items-center justify-between px-1">
              <button 
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2"
              >
                <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-200 bg-white'}`}>
                  {rememberMe && <span className="material-symbols-rounded text-[14px] font-black text-black">check</span>}
                </div>
                <span className="text-[12px] font-bold text-zinc-500">Lembrar de mim</span>
              </button>
              
              {authMode === 'login' && (
                <button type="button" className="text-[12px] font-black text-yellow-600">Esqueci a senha</button>
              )}
           </div>

           <div className="pt-4 space-y-4">
             <motion.button 
               whileTap={{ scale: 0.98 }}
               onClick={() => authMode === 'login' ? handleLogin() : handleSignUp()}
               disabled={isLoading}
               className="w-full py-5 rounded-2xl font-black text-base transition-all disabled:opacity-50 bg-yellow-400 text-black shadow-xl shadow-yellow-100"
             >
               {isLoading ? (
                 <div className="size-6 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
               ) : (
                 authMode === 'login' ? 'Entrar' : 'Cadastrar'
               )}
             </motion.button>
             
             <button 
               type="button"
               onClick={() => {
                 setAuthMode(authMode === 'login' ? 'register' : 'login');
                 setLoginError("");
               }}
               className="w-full py-4 font-black text-[13px] text-zinc-400 hover:text-zinc-900 transition-all"
             >
               {authMode === 'login' ? 'Criar uma conta gratuita' : 'Já tenho uma conta'}
             </button>
           </div>
        </div>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center gap-3 w-full"
          >
            <span className="material-symbols-rounded text-yellow-600">error</span>
            <p className="text-yellow-800 text-xs font-bold">{loginError}</p>
          </motion.div>
        )}
        
        <div className="mt-20 opacity-20">
           <p className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Izi Delivery Group</p>
        </div>
      </div>
    </div>
  );
};
