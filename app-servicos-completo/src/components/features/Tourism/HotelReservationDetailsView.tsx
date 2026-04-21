import React, { useState } from "react";

interface HotelReservationDetailsViewProps {
  onBack: () => void;
  onProceedToPayment: () => void;
}

export const HotelReservationDetailsView: React.FC<HotelReservationDetailsViewProps> = ({ onBack, onProceedToPayment }) => {
  const [guestName, setGuestName] = useState("Ricardo Oliveira Silva");
  const [guestEmail, setGuestEmail] = useState("ricardo.os@email.com");
  const [guestPhone, setGuestPhone] = useState("+55 (11) 98765-4321");

  return (
    <div className="fixed inset-0 z-[150] h-[100dvh] overflow-y-auto w-full bg-zinc-950 text-white font-['Plus_Jakarta_Sans'] pb-36">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-20 bg-zinc-950/70 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] border-b border-white/5">
        <div className="absolute left-6">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-[20px] bg-zinc-900 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:bg-zinc-800 transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined text-yellow-400 font-black">arrow_back</span>
          </button>
        </div>
        <div className="flex-1 text-center font-['Plus_Jakarta_Sans']">
          <h1 className="font-black tracking-widest text-zinc-100 text-[10px] uppercase">Detalhes da Reserva</h1>
        </div>
      </header>
      
      <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8">
        {/* Hero Stay Summary Card (Asymmetric Bento Style) */}
        <section className="relative">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded-[32px] overflow-hidden bg-zinc-900 aspect-[16/9] relative group shadow-[12px_12px_30px_rgba(0,0,0,0.6),inset_4px_4px_8px_rgba(255,255,255,0.05),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] border border-white/5">
              <img alt="Hotel Photo" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCkTj7oslVYbDlxJPML7V0AIwhKd9onEbXoXgFcoD4QL809xamKca-kRpjEES04_tar74TIJEA4h3v5DJ0IrwAshCuGxeVfBMWKamUEeqJSn8AqgNJZ2sw0x-s3HRMEki7LZs4t9TugjfHQPpvGG35Mwf9FH9kZDE-1U2BpEx201gOCoJiLp8QhLtS0IuPdzqnnCdqnkTHjsI8KByzCCDVERlCSBW7ZUpH3eY_OqhVIQogplMNTTGddoWRvMJMNdDcg_Hy8PnnIeM"/>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent">
                <span className="inline-block px-3 py-1 bg-yellow-400 text-zinc-950 rounded-[12px] text-[10px] font-black uppercase tracking-widest mb-2 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">Luxury Stay</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none drop-shadow-xl mb-1">Vila Aurora Boutique</h2>
                <div className="flex items-center gap-2 text-zinc-300 text-xs mt-1 drop-shadow-md font-medium">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>Lagoa da Conceição, Florianópolis</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Reservation Details: Detalhes da Reserva */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <h3 className="text-xl font-black tracking-tighter uppercase text-zinc-100">Sua Reserva</h3>
          </div>
          <div className="bg-zinc-900 rounded-[32px] p-6 shadow-[12px_12px_30px_rgba(0,0,0,0.6),inset_4px_4px_12px_rgba(255,255,255,0.05),inset_-4px_-4px_12px_rgba(0,0,0,0.4)] border-l-4 border-l-yellow-400 relative">
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="space-y-1">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Check-in</p>
                <p className="text-xl font-black text-white tracking-tight leading-none">12 Out, 2024</p>
                <p className="text-zinc-400 text-[11px] font-bold">A partir das 14:00</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Check-out</p>
                <p className="text-xl font-black text-white tracking-tight leading-none">19 Out, 2024</p>
                <p className="text-zinc-400 text-[11px] font-bold">Até as 11:00</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[16px] bg-zinc-950 flex items-center justify-center shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] border border-white/5">
                  <span className="material-symbols-outlined text-yellow-400 text-xl font-black">group</span>
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase">2 Adultos</p>
                  <p className="text-zinc-500 text-[9px] font-black uppercase mt-0.5 tracking-widest">Suíte Master com Vista</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-sm uppercase">7 Noites</p>
                <p className="text-zinc-500 text-[9px] font-black uppercase mt-0.5 tracking-widest">Duração Total</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Guest Information: Informações do Hóspede */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <h3 className="text-xl font-black tracking-tighter uppercase text-zinc-100">O Hóspede</h3>
          </div>
          <div className="bg-zinc-900 flex flex-col gap-5 rounded-[32px] p-6 shadow-[12px_12px_30px_rgba(0,0,0,0.6),inset_4px_4px_12px_rgba(255,255,255,0.05),inset_-4px_-4px_12px_rgba(0,0,0,0.4)] border border-white/5">
            <div className="space-y-2">
              <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="w-full bg-zinc-950 rounded-[20px] p-4 flex items-center gap-3 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.03)] border border-black group">
                <span className="material-symbols-outlined text-zinc-600 transition-colors group-focus-within:text-yellow-400">badge</span>
                <input 
                  className="bg-transparent border-none focus:ring-0 text-white font-medium text-sm w-full p-0" 
                  type="text" 
                  value={guestName} 
                  onChange={e => setGuestName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">E-mail</label>
                <div className="w-full bg-zinc-950 rounded-[20px] p-4 flex items-center gap-3 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.03)] border border-black group">
                  <span className="material-symbols-outlined text-zinc-600 transition-colors group-focus-within:text-yellow-400">mail</span>
                  <input 
                    className="bg-transparent border-none focus:ring-0 text-white font-medium text-sm w-full p-0" 
                    type="email" 
                    value={guestEmail} 
                    onChange={e => setGuestEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Telefone</label>
                <div className="w-full bg-zinc-950 rounded-[20px] p-4 flex items-center gap-3 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-2px_-2px_4px_rgba(255,255,255,0.03)] border border-black group">
                  <span className="material-symbols-outlined text-zinc-600 transition-colors group-focus-within:text-yellow-400">call</span>
                  <input 
                    className="bg-transparent border-none focus:ring-0 text-white font-medium text-sm w-full p-0" 
                    type="tel" 
                    value={guestPhone} 
                    onChange={e => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Price Summary: Resumo de Valores */}
        <section className="bg-yellow-400 rounded-[32px] p-8 shadow-[12px_12px_40px_rgba(251,191,36,0.2),inset_4px_4px_12px_rgba(255,255,255,0.4),inset_-4px_-4px_12px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-black font-black text-2xl tracking-tighter uppercase leading-none">Resumo</h3>
              <p className="text-zinc-800 text-[9px] font-black uppercase tracking-widest mt-2">Incluindo taxas e impostos</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-yellow-300 rounded-[20px] shadow-[inset_2px_2px_6px_rgba(255,255,255,0.5),inset_-2px_-2px_6px_rgba(0,0,0,0.1)] border border-yellow-200">
              <span className="material-symbols-outlined text-black text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-zinc-900 font-extrabold text-sm items-center">
              <span>Diárias <span className="text-[10px] text-zinc-700 ml-1">(7x R$ 850)</span></span>
              <span>R$ 5.950,00</span>
            </div>
            <div className="flex justify-between text-zinc-900 font-extrabold text-sm items-center">
              <span>Taxa de Serviço</span>
              <span>R$ 420,00</span>
            </div>
            <div className="flex justify-between text-zinc-900 font-extrabold text-sm items-center pb-5 border-b border-black/10">
              <span>Taxas Municipais</span>
              <span>R$ 85,00</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-black font-black text-sm uppercase tracking-widest">Total</span>
              <span className="text-black font-black text-3xl tracking-tighter drop-shadow-sm leading-none">R$ 6.455,00</span>
            </div>
          </div>
        </section>
      </main>
      
      {/* Bottom Action Area */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-zinc-950/90 backdrop-blur-2xl p-6 pt-5 border-t border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.8)]">
        <div className="max-w-2xl mx-auto">
          <button 
             onClick={onProceedToPayment}
             className="w-full h-[72px] bg-yellow-400 text-black rounded-[28px] font-black tracking-widest text-[12px] uppercase flex items-center justify-center gap-3 shadow-[8px_8px_20px_rgba(251,191,36,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all hover:bg-yellow-300"
          >
            Prosseguir para pagamento
            <span className="material-symbols-outlined font-black text-[20px]">arrow_forward</span>
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-5">
             <span className="material-symbols-outlined text-[10px] text-emerald-400 font-black leading-none drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">lock</span>
             <p className="text-zinc-500 text-[8px] uppercase tracking-[0.25em] font-black leading-none pt-px">Ambiente Seguro &amp; Criptografado</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
