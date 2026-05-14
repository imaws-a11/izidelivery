import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../common/Icon';

interface BankDetailsModalProps {
 show: boolean;
 onClose: () => void;
 bankName: string;
 onBankNameChange: (val: string) => void;
 pixKey: string;
 onPixKeyChange: (val: string) => void;
 onSave: () => void;
 isSaving: boolean;
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
 show,
 onClose,
 bankName,
 onBankNameChange,
 pixKey,
 onPixKeyChange,
 onSave,
 isSaving
}) => {
 if (!show) return null;

 return (
 <motion.div
 key="bank-details-modal"
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 className="fixed inset-0 z-[400] bg-white flex flex-col no-scrollbar overflow-y-auto font-['Plus_Jakarta_Sans']"
 >
 <header className="sticky top-0 z-50 bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100">
 <button 
 onClick={onClose}
 className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
 >
 <Icon name="arrow_back" className="text-white" size={24} />
 </button>
 <div className="flex flex-col items-end">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Financeiro</p>
 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Recebimento</h2>
 </div>
 </header>

 <div className="px-6 pt-10 pb-32 space-y-12 flex-1 overflow-y-auto no-scrollbar">
 <div className="space-y-2">
 <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">Dados Bancários</h3>
 <p className="text-[11px] text-zinc-400 font-bold leading-relaxed max-w-xs">
 Cadastre sua chave PIX para receber seus ganhos automaticamente.
 </p>
 </div>

 <div className="space-y-10">
 <div className="space-y-4">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">
 Nome do Banco
 </label>
 <input 
 type="text"
 value={bankName}
 onChange={(e) => onBankNameChange(e.target.value)}
 placeholder="Itaú, Nubank, Inter..."
 className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">
 Sua Chave PIX
 </label>
 <input 
 type="text"
 value={pixKey}
 onChange={(e) => onPixKeyChange(e.target.value)}
 placeholder="CPF, Celular, E-mail..."
 className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
 />
 </div>

 <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
 <p className="text-[10px] font-bold text-zinc-400 leading-relaxed">
 A chave fornecida será vinculada de forma definitiva ao seu perfil para garantir a segurança dos seus recebimentos.
 </p>
 </div>
 </div>
 </div>

 <div className="p-8 pb-12 bg-white/95 ">
 <button 
 onClick={onSave}
 disabled={pixKey.length < 5 || bankName.length < 2 || isSaving}
 className="w-full h-18 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
 >
 {isSaving ? (
 <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <Icon name="check_circle" size={18} />
 Salvar Dados
 </>
 )}
 </button>
 </div>
 </motion.div>
 );
};

export default BankDetailsModal;
