import React from 'react';
import Icon from '../common/Icon';
import { showConfirm } from '../../lib/useToast';

interface ProfileViewProps {
 driverName: string;
 driverAvatar: string | null;
 driverPlate: string;
 driverVehicle: string;
 authEmail: string;
 stats: { level: number; count: number };
 isUploadingAvatar: boolean;
 driverId: string | null;
 onNavigateToDashboard: () => void;
 onShowPersonalDataModal: () => void;
 onShowBankDetails: () => void;
 onShowPlateModal: () => void;
 onShowPreferences: () => void;
 onShowHelpModal: () => void;
 onLogout: () => void;
 onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 onOpenOverlaySettings: () => void;
 onSyncMission: () => void;
 onResetMission: () => void;
 onSetEditProfileData: (data: any) => void;
 onLoadProfile: (uid: string, email: string, name: string) => void;
}

const ProfileView = React.memo<ProfileViewProps>(({ 
 driverName, driverAvatar, driverPlate, driverVehicle, authEmail, stats,
 isUploadingAvatar, driverId,
 onNavigateToDashboard, onShowPersonalDataModal, onShowBankDetails, 
 onShowPlateModal, onShowPreferences, onShowHelpModal, onLogout,
 onAvatarUpload, onOpenOverlaySettings, onSyncMission, onResetMission,
 onSetEditProfileData, onLoadProfile
}) => {
 const menuItems = [
 { label: 'Meus Dados', icon: 'badge', color: 'bg-zinc-900 text-white' },
 { label: 'Dados Bancários', icon: 'account_balance', color: 'bg-zinc-100 text-zinc-900' },
 { label: 'Veículo & Placa', icon: 'directions_car', color: 'bg-zinc-100 text-zinc-900' },
 { label: 'Preferências', icon: 'settings', color: 'bg-zinc-100 text-zinc-900' },
 { label: 'Ajuda', icon: 'support_agent', color: 'bg-zinc-100 text-zinc-900' }
 ];

 return (
 <div className="flex-1 flex flex-col h-full bg-white font-['Plus_Jakarta_Sans']">
 {/* Header com botão voltar */}
 <div className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 bg-white z-10">
 <button 
 onClick={onNavigateToDashboard}
 className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
 >
 <Icon name="arrow_back" className="text-white" size={24} />
 </button>
 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Meu Perfil</h2>
 <div className="size-11" />
 </div>

 <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar">
 <div className="flex flex-col items-center">
 {/* Avatar */}
 <label
 htmlFor="avatar-upload"
 className="size-32 rounded-xl bg-zinc-900 flex items-center justify-center mb-6 relative group cursor-pointer overflow-hidden"
 >
 {driverAvatar ? (
 <img
 src={driverAvatar}
 alt="Foto de Perfil"
 className="w-full h-full object-cover"
 loading="lazy"
 />
 ) : (
 <Icon name="person" size={48} className="text-white/50" />
 )}

 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 {isUploadingAvatar ? (
 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <Icon name="photo_camera" size={28} className="text-white" />
 )}
 </div>
 </label>

 <input
 id="avatar-upload"
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={onAvatarUpload}
 />
 
 <div className="text-center space-y-1">
 <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">{driverName}</h2>
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Nível {stats.level} • {stats.count} Viagens</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-3">
 {menuItems.map((item, i) => (
 <button 
 key={i} 
 onClick={() => {
 if (item.label === 'Meus Dados') {
 onSetEditProfileData({
 name: driverName || localStorage.getItem('izi_driver_name') || '',
 email: authEmail || localStorage.getItem('izi_driver_email') || '',
 phone: localStorage.getItem('izi_driver_phone') || '',
 cpf: localStorage.getItem('izi_driver_cpf') || '',
 vehicle_type: driverVehicle || localStorage.getItem('izi_driver_vehicle') || '',
 plate: driverPlate || localStorage.getItem('izi_driver_plate') || '',
 address: localStorage.getItem('izi_driver_address') || '',
 vehicle_model: localStorage.getItem('izi_driver_vehicle_model') || ''
 });
 onShowPersonalDataModal();
 if (driverId) {
 onLoadProfile(driverId, authEmail || localStorage.getItem('izi_driver_email') || '', driverName);
 }
 }
 if (item.label === 'Dados Bancários') onShowBankDetails();
 if (item.label === 'Veículo & Placa') onShowPlateModal();
 if (item.label === 'Preferências') onShowPreferences();
 if (item.label === 'Ajuda') onShowHelpModal();
 }}
 className="w-full h-20 bg-white border border-zinc-100 rounded-xl px-6 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-zinc-50"
 >
 <div className="flex items-center gap-4">
 <div className={`size-12 rounded-2xl flex items-center justify-center ${item.color}`}>
 <Icon name={item.icon} size={22} />
 </div>
 <span className="text-sm font-black text-zinc-900">{item.label}</span>
 </div>
 <Icon name="chevron_right" className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
 </button>
 ))}
 </div>
 
 <div className="bg-zinc-900 rounded-xl p-6 text-white flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
 <Icon name="layers" />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-black">Sobreposição</span>
 <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Ativar em outros apps</span>
 </div>
 </div>
 <button 
 onClick={onOpenOverlaySettings}
 className="px-6 py-3 bg-white text-zinc-900 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
 >
 Configurar
 </button>
 </div>

 <div className="space-y-4">
 <button 
 onClick={async () => {
 if (await showConfirm({ 
 title: 'Encerrar Sessão', 
 message: 'Deseja realmente sair da sua conta?', 
 confirmLabel: 'Sair agora',
 danger: true 
 })) {
 onLogout();
 }
 }} 
 className="w-full h-18 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] bg-rose-50 text-rose-600 active:scale-95 transition-all border border-rose-100"
 >
 Encerrar Sessão
 </button>

 <div className="p-8 rounded-xl bg-zinc-50 border border-zinc-100 space-y-6">
 <div className="space-y-2 text-center">
 <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center justify-center gap-2">
 <Icon name="admin_panel_settings" size={16} /> Zona de Segurança
 </h3>
 <p className="text-[11px] text-zinc-400 leading-relaxed">
 Use apenas em caso de erros de sincronização.
 </p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={onSyncMission}
 className="flex-1 h-12 bg-white border border-zinc-200 text-zinc-600 font-black text-[9px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
 >
 Sincronizar
 </button>
 <button 
 onClick={onResetMission}
 className="flex-1 h-12 bg-white border border-rose-200 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
 >
 Resetar
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
});

ProfileView.displayName = 'ProfileView';

export default ProfileView;
