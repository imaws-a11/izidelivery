import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExperienceDetailViewProps {
  item: any;
  onBack: () => void;
  onConfirmReservation: (details: any) => void;
}

export const ExperienceDetailView: React.FC<ExperienceDetailViewProps> = ({
  item,
  onBack,
  onConfirmReservation
}) => {
  const [adults, setAdults] = useState(1);
  const [selectedDate, setSelectedDate] = useState(item.date || '2024-05-20');

  const totalPrice = (item.price || 0) * adults;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[170] bg-white flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
        {/* IMAGEM E BOTÃO VOLTAR */}
        <div className="relative h-[45vh] w-full">
           <img src={item.image} className="size-full object-cover" alt={item.title} />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
           
           <button 
             onClick={onBack}
             className="absolute top-6 left-6 size-12 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-zinc-900 active:scale-90 transition-all shadow-xl"
           >
             <span className="material-symbols-rounded">close</span>
           </button>

           <div className="absolute bottom-8 left-8 right-8">
              <span className="bg-yellow-400 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg">Confirmado</span>
              <h1 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{item.title}</h1>
              <div className="flex items-center gap-4 mt-4">
                 <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-100 shadow-sm">
                    <span className="material-symbols-rounded text-yellow-500 text-sm fill-1">star</span>
                    <span className="text-xs font-black text-zinc-900">{item.rating}</span>
                 </div>
                 <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{item.location}</span>
              </div>
           </div>
        </div>

        <div className="px-8 py-10 space-y-12">
           {/* DESCRIÇÃO */}
           <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Sobre a Experiência</h3>
              <p className="text-zinc-500 leading-relaxed text-base font-medium">
                {item.description}
              </p>
           </section>

           {/* DETALHES DO AGENDAMENTO */}
           <section className="bg-zinc-50 border border-zinc-100 rounded-[40px] p-8 space-y-8 shadow-inner">
              <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Detalhes da Reserva</h3>
              
              <div className="space-y-4">
                 {/* DATA SELECTION */}
                 <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="size-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                          <span className="material-symbols-rounded text-zinc-400">calendar_month</span>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Data selecionada</p>
                          <p className="text-sm font-black text-zinc-900 uppercase mt-0.5 tracking-tighter">{selectedDate}</p>
                       </div>
                    </div>
                    <button className="text-yellow-600 text-[10px] font-black uppercase tracking-widest">Alterar</button>
                 </div>

                 {/* QUANTIDADE DE PESSOAS */}
                 <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="size-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                          <span className="material-symbols-rounded text-zinc-400">person_add</span>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Quantidade</p>
                          <p className="text-sm font-black text-zinc-900 uppercase mt-0.5 tracking-tighter">{adults} {adults === 1 ? 'Pessoa' : 'Pessoas'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => setAdults(Math.max(1, adults - 1))}
                         className="size-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 active:scale-90 transition-all shadow-sm"
                       >
                         <span className="material-symbols-rounded">remove</span>
                       </button>
                       <span className="text-lg font-black text-zinc-900 w-6 text-center">{adults}</span>
                       <button 
                         onClick={() => setAdults(adults + 1)}
                         className="size-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black active:scale-90 transition-all shadow-lg"
                       >
                         <span className="material-symbols-rounded">add</span>
                       </button>
                    </div>
                 </div>
              </div>
           </section>

           {/* O QUE ESTÁ INCLUSO */}
           <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">O que está incluso</h3>
              <div className="grid grid-cols-2 gap-4">
                 {(item.features || ['Seguro Viagem', 'Guia Especializado', 'Almoço Premium', 'Transporte Executivo']).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                       <span className="material-symbols-rounded text-emerald-500 text-xl">check_circle</span>
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tight">{feat}</span>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {/* FOOTER FIXO DE RESERVA */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-3xl border-t border-zinc-50 flex items-center justify-between gap-6 z-[180]">
         <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total da Reserva</span>
            <div className="flex items-baseline gap-1">
               <span className="text-sm font-black text-zinc-900 uppercase">R$</span>
               <span className="text-3xl font-black text-zinc-900 tracking-tighter">{totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
         </div>
         <button 
           onClick={() => onConfirmReservation({ ...item, adults, totalPrice })}
           className="flex-1 h-18 bg-zinc-900 text-yellow-400 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-zinc-200 active:scale-95 transition-all flex items-center justify-center gap-3"
         >
            Reservar Agora
            <span className="material-symbols-rounded text-xl">payments</span>
         </button>
      </footer>
    </motion.div>
  );
};
