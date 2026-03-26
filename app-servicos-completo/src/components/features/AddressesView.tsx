import React from 'react';
import { motion } from 'framer-motion';

interface AddressesViewProps {
  userAddresses: any[];
  userLocation: any;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  setUserLocation: (loc: any) => void;
  toastSuccess: (msg: string) => void;
}

export const AddressesView: React.FC<AddressesViewProps> = ({
  userAddresses,
  userLocation,
  setSubView,
  navigateSubView,
  setUserLocation,
  toastSuccess
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-6 border-b border-zinc-900/60 backdrop-blur-xl">
        <button onClick={() => setSubView("profile")} className="size-11 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-300">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Meus Endereços</h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Gerencie seus Locais</p>
        </div>
      </header>

      <main className="px-5 py-8 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Endereço Atual</h2>
            <div className="size-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[32px] flex items-center gap-5 transition-all">
            <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
              <span className="material-symbols-outlined text-yellow-500 scale-110">location_on</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Localização em Tempo Real</p>
              <p className="text-white font-black text-sm truncate uppercase tracking-tight">{userLocation?.address || "Detectando seu local..."}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Favoritos e Histórico</h2>
            <button className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">+ Novo</button>
          </div>
          <div className="flex flex-col gap-3">
            {userAddresses.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 bg-zinc-900/20 border border-zinc-900/50 rounded-[40px]">
                <span className="material-symbols-outlined text-4xl text-zinc-800">wrong_location</span>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhum endereço salvo</p>
              </div>
            ) : userAddresses.map((addr: any, idx) => (
              <motion.div key={addr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className={`group p-5 rounded-[32px] border transition-all cursor-pointer ${userLocation?.id === addr.id ? 'bg-zinc-900 border-yellow-400/20' : 'bg-transparent border-zinc-900/60 hover:border-zinc-800'}`}
                onClick={() => { setUserLocation(addr); toastSuccess("Endereço selecionado!"); }}>
                <div className="flex items-center gap-5">
                  <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${userLocation?.id === addr.id ? 'bg-yellow-400 text-black' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'}`}>
                    <span className="material-symbols-outlined text-xl">{addr.type === 'home' ? 'home' : addr.type === 'work' ? 'work' : 'location_on'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-sm uppercase tracking-tight mb-1">{addr.label || addr.type}</h4>
                    <p className="text-xs text-zinc-600 font-medium truncate">{addr.address}</p>
                  </div>
                  {userLocation?.id === addr.id && <div className="size-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400 text-sm font-black">check</span>
                  </div>}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="bg-yellow-400/5 border border-yellow-400/10 p-6 rounded-[40px] flex flex-col items-center text-center gap-4">
          <div className="size-16 rounded-full bg-yellow-400/10 flex items-center justify-center mb-1">
             <span className="material-symbols-outlined text-3xl text-yellow-500">add_location_alt</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Entregar em Outro Local?</h3>
            <p className="text-zinc-600 text-xs px-10">Você pode adicionar novos endereços ou sincronizar via GPS.</p>
          </div>
          <button onClick={() => navigateSubView('map')} className="w-full h-12 rounded-2xl bg-yellow-400 text-black font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(255,215,9,0.1)] active:scale-95 transition-all">
            Abrir Mapa
          </button>
        </div>
      </main>
    </div>
  );
};
