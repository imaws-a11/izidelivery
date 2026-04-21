import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { ExcursionDetail } from "./ExcursionDetail";

interface Excursion {
  id: string;
  title: string;
  image: string;
  price: number;
  origin: string;
  includes: string[];
  vagas: number;
  transporte: string;
  hospedagem?: string;
  destaque?: boolean;
  atividades?: string;
}

interface ExcursionWizardProps {
  userName?: string;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
}

export const ExcursionWizard: React.FC<ExcursionWizardProps> = ({
  userName = "Viajante",
  setSubView,
  navigateSubView,
}) => {
  const [activeFilter, setActiveFilter] = useState('Bate e Volta');
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | null>(null);

  const excursions: Excursion[] = [
    {
      id: '1',
      title: 'Rio: Carnaval & Praia',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi7Gxumiz9ubc__Lw4nx2HLr7wZvtdHjq6K0gS4wgXPcu1aXNOkItRm1y_Q-K88nQKTqkQJVf-MpZX_L3ey97bUfqblqEDwPK-h6Rm1s3DqoV1_Js5WE7MLWn-0JODqU3M7kvESc40dzwX609K79K2gIN4CNHJwV06kfXV1BwaDc99Z5-Z-1qtGM6hkXHtIgtppoqWr2tcCO0O-BT5Tt1cjk8ztkTPLdIIpRHZ4m3tEFXS-hXWIcz9O1FR9ha-nEbyW7CfpfsTnIc',
      price: 480,
      origin: 'Belo Horizonte',
      includes: ['Café & Almoço'],
      hospedagem: 'Hotel 4 Estrelas',
      vagas: 42,
      transporte: 'Ônibus DD Luxo',
      destaque: true
    },
    {
      id: '2',
      title: 'Magia de Salvador',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATmqkUMQC8L3Gj_eRdVe4g-JtPWFCSZF2XIzsbw0BMTe5sGWu4eUq4NkPDy8P-nIl1-xh8XKtx2AtM8qaYBC6BFXyT1JRAvr4iElZ6i6gEnEez5xwG9MP3dM6cMvOZVVuhux9DVa5LBPW1qcNIBBUlA7pAHPQzcQonKtXkEIN--Pbo8MZ0e7LhmjbeTGmqJmv0oR32mlHbpl23-jLBTYCFk8H19tpizMSp5guS1trQRVfM6Q0jwhujBs4mfvFH87byn1JxNwCXOW8',
      price: 1250,
      origin: 'São Paulo',
      includes: ['Guias & Festas'],
      hospedagem: 'Hostel Boutique',
      vagas: 18,
      transporte: 'Van Executiva'
    },
    {
      id: '3',
      title: 'Serra do Cipó: Natureza',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR5Ggeqe8PujPnn__ej2cLOjzIuYFAfnEo05U8vAQOV6lZYkxn565Vz9Rec5aqnhyJXcuhzN7HLvpX-VQxruwfdE2qEfJTg4bAIUbzUcjpblRBMssuqxAXjSmH9mQ7SoLKr6SD4-HCIC1_uBAMLBg0n9vdlY6MYJu-9afz5QGQm3VtvsTyU7_bD71x8qKpHHbg_LSD-dNtAXkZUjQRb7rpUS1YdUpEE55ZLzPx1FHFtQP8Mwqb8IO__FVK8fdvRXyjyvSentn3Idc',
      price: 320,
      origin: 'Rio de Janeiro',
      atividades: 'Trilhas & Cachoeiras',
      hospedagem: 'Casa de Campo',
      vagas: 12,
      transporte: 'Van Premium'
    }
  ];

  if (selectedExcursion) {
    return (
      <AnimatePresence>
        <ExcursionDetail 
          excursion={selectedExcursion} 
          onBack={() => setSelectedExcursion(null)} 
          onConfirmReservation={() => navigateSubView('checkout')} 
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="absolute inset-0 z-[120] bg-black text-white flex flex-col overflow-y-auto no-scrollbar font-['Plus_Jakarta_Sans']">
      
      {/* Header Estilo Luxury */}
      <header className="px-6 pt-8 pb-4 shrink-0">
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-5 flex items-center justify-between border border-white/5 shadow-[inset_4px_4px_10px_rgba(255,255,255,0.02),0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-yellow-400 p-0.5">
                <img 
                  className="w-full h-full rounded-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9r2uWjyR4PJIf6ve4uL4A4TkYfzqzager2hIBJOkez7m46emVfyxo4qidZfP1NpLUTkdihXg55-KY7zWBAoMrDVGFNgFkT19wIwHSTM4ITCy-pyeDG6jldusiLrjRsYAdfBcrKky55hw1bHMAoM1SUVockuz4-GDzYgm-whjWQQDiGf__cnXpOb2clsreHouY5bJnF7flNke2liMyNpKff29uBzaLJ4taEisPyd3oBYiOrs2gqoklHfCJjfmgq2bMIP7j-03NBHg" 
                  alt="Perfil"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-900">
                <span className="material-symbols-outlined text-[14px] fill-1">star</span>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Olá, Viajante</p>
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">{userName}</h1>
            </div>
          </div>
          <button onClick={() => setSubView("none")} className="size-12 rounded-full bg-zinc-800 flex items-center justify-center text-yellow-400 active:scale-95 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Título e Filtros */}
      <section className="px-6 py-4">
        <h2 className="text-yellow-400 font-black text-3xl uppercase italic mb-6 tracking-tighter">Excursões</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {['Bate e Volta', 'Final de Semana', 'Ônibus', 'Vans'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter 
                ? 'bg-yellow-400 text-black shadow-[0_8px_20px_rgba(250,204,21,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4)]' 
                : 'bg-zinc-900 text-zinc-500 border border-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="px-6 space-y-8 pb-32">
        {excursions.map((ex, idx) => (
          <motion.article 
            key={ex.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900 border border-white/5 rounded-[40px] overflow-hidden relative group shadow-2xl"
          >
            <div className="relative h-72 overflow-hidden">
              <img src={ex.image} alt={ex.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              {ex.destaque && (
                <div className="absolute top-6 left-6 bg-yellow-400 text-black font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-xl">
                  Destaque
                </div>
              )}
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-tight">{ex.title}</h3>
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <span className="material-symbols-outlined text-sm fill-1">location_on</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Saída: {ex.origin}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">A partir de</p>
                  <p className="text-3xl font-black text-yellow-400 italic tracking-tighter">R$ {ex.price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">
                    {ex.atividades ? 'hiking' : 'restaurant'}
                  </span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{ex.atividades ? 'Atividade' : 'Inclui'}</p>
                    <p className="text-[11px] font-black text-white uppercase italic leading-none mt-0.5">{ex.atividades || ex.includes?.[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">hotel</span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Hospedagem</p>
                    <p className="text-[11px] font-black text-white uppercase italic leading-none mt-0.5">{ex.hospedagem}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">groups</span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Vagas</p>
                    <p className="text-[11px] font-black text-white uppercase italic leading-none mt-0.5">{ex.vagas} Pessoas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">directions_bus</span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Transporte</p>
                    <p className="text-[11px] font-black text-white uppercase italic leading-none mt-0.5">{ex.transporte}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedExcursion(ex)}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_15px_30px_rgba(250,204,21,0.2),inset_4px_4px_8px_rgba(255,255,255,0.4)] transition-all active:scale-95"
              >
                Detalhes da Viagem
              </button>
            </div>
          </motion.article>
        ))}
      </main>

      {/* Navegação Inferior (Mock) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-24 px-6 bg-zinc-900/60 backdrop-blur-3xl rounded-t-[40px] border-t border-white/5 z-[130] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button className="flex flex-col items-center gap-1.5 opacity-40">
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 bg-yellow-400 text-black px-6 py-2.5 rounded-full shadow-[inset_0_4px_8px_rgba(255,255,255,0.4)]">
          <span className="material-symbols-outlined text-2xl fill-1">explore</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Explorar</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 opacity-40">
          <span className="material-symbols-outlined text-2xl">confirmation_number</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Reservas</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 opacity-40">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};
