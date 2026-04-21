import React, { useState } from "react";
import { motion } from "framer-motion";

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
  category: string;
}

interface ExcursionWizardProps {
  userName?: string;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  onSelectExcursion: (excursion: any) => void;
}

export const ExcursionWizard: React.FC<ExcursionWizardProps> = ({
  userName = "Marcos Silva",
  setSubView,
  navigateSubView,
  onSelectExcursion,
}) => {
  const [activeFilter, setActiveFilter] = useState('Todos');

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
      destaque: true,
      category: 'Bate e Volta'
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
      transporte: 'Van Executiva',
      category: 'Final de Semana'
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
      transporte: 'Van Premium',
      category: 'Bate e Volta'
    }
  ];

  const categories = ['Todos', 'Bate e Volta', 'Final de Semana', 'Ônibus', 'Vans'];

  const filteredExcursions = activeFilter === 'Todos' 
    ? excursions 
    : excursions.filter(ex => ex.category === activeFilter);

  return (
    <div className="absolute inset-0 z-[120] bg-black text-white flex flex-col overflow-y-auto no-scrollbar font-['Plus_Jakarta_Sans'] pb-20">
      <style>{`
        .clay-card {
            box-shadow: inset 4px 4px 10px rgba(255, 255, 255, 0.05), 
                        inset -4px -4px 10px rgba(0, 0, 0, 0.5),
                        0 10px 30px rgba(0, 0, 0, 0.6);
        }
        .clay-button-primary {
            background: linear-gradient(135deg, #facc15 0%, #fde047 100%);
            box-shadow: inset 4px 4px 8px rgba(255, 255, 255, 0.4),
                        0 8px 16px rgba(250, 204, 21, 0.2);
        }
        .clay-filter {
            box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.1),
                        0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .clay-filter-active {
            background: linear-gradient(135deg, #facc15 0%, #fde047 100%);
            box-shadow: inset 4px 4px 8px rgba(255, 255, 255, 0.4),
                        0 8px 16px rgba(250, 204, 21, 0.2);
        }
        .neon-glow {
            text-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Custom Luxury Profile Header */}
      <header className="px-6 pt-8 pb-4 sticky top-0 z-[130] bg-black/50 backdrop-blur-xl">
        <div className="clay-card bg-zinc-900/80 rounded-2xl p-5 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-yellow-400 p-0.5">
                <img 
                  className="w-full h-full object-cover rounded-full" 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
                  alt="Perfil"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-lg scale-90">
                <span className="material-symbols-outlined text-[14px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Olá, Viajante</p>
              <h1 className="text-xl font-black tracking-tight text-white uppercase neon-glow">{userName}</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setSubView("none")}
              className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center clay-filter text-yellow-400 transition-transform active:scale-95 border border-white/10"
            >
              <span className="material-symbols-outlined font-black">close</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <section className="px-6 py-4 relative z-20">
        <h2 className="text-yellow-400 font-black text-2xl uppercase mb-4 tracking-tighter">Excursões</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {categories.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter 
                ? 'clay-filter-active text-black' 
                : 'clay-filter bg-zinc-900 text-zinc-500 border border-white/5 active:scale-95'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Main Excursions Content */}
      <main className="px-6 space-y-10 relative z-10">
        {filteredExcursions.map((ex, idx) => (
          <motion.article 
            key={ex.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            className="clay-card bg-zinc-900/40 rounded-[40px] overflow-hidden relative group border border-white/5"
          >
            <div className="relative h-72 overflow-hidden">
              <img 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1.5s]" 
                src={ex.image} 
                alt={ex.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"></div>
              {ex.destaque && (
                <div className="absolute top-6 left-6 bg-yellow-400 text-black font-black px-5 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] fill-1">verified</span>
                  Destaque
                </div>
              )}
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none truncate max-w-[200px] mb-2">{ex.title}</h3>
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <span className="material-symbols-outlined text-sm font-black" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{ex.origin}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">A partir de</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-yellow-400 font-black text-sm uppercase">R$</span>
                    <span className="text-3xl font-black text-white neon-glow leading-none">{ex.price}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl clay-filter border border-white/5">
                  <span className="material-symbols-outlined text-yellow-400 text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {ex.atividades ? 'hiking' : 'restaurant'}
                  </span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">{ex.atividades ? 'Atividade' : 'Inclui'}</p>
                    <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight">{ex.atividades || ex.includes[0]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl clay-filter border border-white/5">
                  <span className="material-symbols-outlined text-yellow-400 text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {ex.hospedagem ? 'hotel' : 'home'}
                  </span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Hospedagem</p>
                    <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight">{ex.hospedagem || 'Day Use'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl clay-filter border border-white/5">
                  <span className="material-symbols-outlined text-yellow-400 text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Vagas</p>
                    <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight">{ex.vagas} Pessoas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl clay-filter border border-white/5">
                  <span className="material-symbols-outlined text-yellow-400 text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {ex.transporte.includes('Van') ? 'airport_shuttle' : 'directions_bus'}
                  </span>
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Transporte</p>
                    <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight">{ex.transporte}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onSelectExcursion(ex)}
                className="w-full clay-button-primary py-5 rounded-[24px] font-black text-black uppercase tracking-[0.2em] text-[12px] active:scale-95 transition-all"
              >
                Reservar Agora
              </button>
            </div>
          </motion.article>
        ))}
      </main>
    </div>
  );
};
