import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../common/Icon';

interface PersonalDataModalProps {
    show: boolean;
    onClose: () => void;
    editProfileData: {
        name: string;
        phone: string;
        email: string;
        cpf: string;
        address: string;
    };
    onUpdateData: (data: any) => void;
    onSave: () => void;
    isSaving: boolean;
}

const PersonalDataModal: React.FC<PersonalDataModalProps> = ({
    show,
    onClose,
    editProfileData,
    onUpdateData,
    onSave,
    isSaving
}) => {
    if (!show) return null;

    return (
        <motion.div 
            key="personal-data-modal"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[400] bg-white flex flex-col no-scrollbar overflow-y-auto font-['Plus_Jakarta_Sans']"
        >
            <div className="sticky top-0 z-50 bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100">
                <button 
                    onClick={onClose}
                    className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
                >
                    <Icon name="arrow_back" className="text-white" size={24} />
                </button>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Perfil</p>
                    <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Meus Dados</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-10 space-y-12 no-scrollbar">
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">Dados Pessoais</h3>
                    <p className="text-[11px] text-zinc-400 font-bold leading-relaxed max-w-xs">
                        Mantenha seus dados atualizados para garantir segurança.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Campo: Nome */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">Nome Completo</label>
                        <input 
                            type="text"
                            value={editProfileData.name}
                            onChange={(e) => onUpdateData({ ...editProfileData, name: e.target.value })}
                            placeholder="Seu nome completo"
                            className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
                        />
                    </div>

                    {/* Campo: Telefone */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">WhatsApp / Telefone</label>
                        <input 
                            type="tel"
                            value={editProfileData.phone}
                            onChange={(e) => onUpdateData({ ...editProfileData, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                            className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
                        />
                    </div>

                    {/* Campo: E-mail */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">E-mail</label>
                        <input 
                            type="email"
                            value={editProfileData.email}
                            onChange={(e) => onUpdateData({ ...editProfileData, email: e.target.value })}
                            placeholder="seu@email.com"
                            className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
                        />
                    </div>

                    {/* Campo: CPF */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">CPF</label>
                        <input 
                            type="text"
                            value={editProfileData.cpf}
                            onChange={(e) => onUpdateData({ ...editProfileData, cpf: e.target.value.replace(/\D/g, '') })}
                            placeholder="000.000.000-00"
                            maxLength={11}
                            className="w-full h-16 bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-black text-xl placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none"
                        />
                    </div>

                    {/* Campo: Endereço */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block">Endereço Completo</label>
                        <textarea 
                            value={editProfileData.address}
                            onChange={(e) => onUpdateData({ ...editProfileData, address: e.target.value })}
                            placeholder="Rua, Número, Bairro, Cidade"
                            rows={2}
                            className="w-full bg-zinc-50 border-b-2 border-zinc-100 px-0 text-zinc-900 font-bold text-lg placeholder:text-zinc-200 focus:border-zinc-900 transition-all outline-none resize-none"
                        />
                    </div>
                </div>
            </div>

            <div className="p-8 pb-12 bg-white/95 backdrop-blur-md">
                <button 
                    onClick={onSave}
                    disabled={isSaving || !editProfileData.name}
                    className="w-full h-18 bg-zinc-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Icon name="check_circle" size={18} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default PersonalDataModal;
