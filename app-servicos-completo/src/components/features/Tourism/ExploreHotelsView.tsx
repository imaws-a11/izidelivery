import React from "react";

interface ExploreHotelsViewProps {
  onBack: () => void;
  onReserve: () => void;
}

export const ExploreHotelsView: React.FC<ExploreHotelsViewProps> = ({ onBack, onReserve }) => {
  return (
    <div className="fixed inset-0 z-[150] bg-zinc-50 text-zinc-900 font-['Plus_Jakarta_Sans'] selection:bg-yellow-400 selection:text-black h-[100dvh] overflow-y-auto w-full pb-12">
      {/* Native Inline Header */}
      <header className="w-full flex items-center px-6 pt-12 pb-6 relative">
        <button onClick={onBack} className="absolute left-6 size-12 flex items-center justify-center rounded-[20px] bg-white border border-zinc-100 shadow-sm hover:bg-zinc-50 transition-colors active:scale-95 duration-200 z-[50]">
          <span className="material-symbols-rounded text-zinc-900 text-2xl font-black">arrow_back</span>
        </button>
        <h1 className="w-full text-center text-3xl font-black tracking-tighter uppercase drop-shadow-sm text-zinc-900">Hospedagens</h1>
      </header>

      <main className="pb-20 max-w-full overflow-x-hidden">
        {/* Featured Section (Bento Inspired) */}
        <section className="mb-12 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Large Featured Card */}
            <div className="md:col-span-8 relative rounded-[48px] overflow-hidden h-[450px] shadow-2xl border border-white group cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="luxury hotel" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy16_cGsRNDUO-PNBxgZybpmUWZ8yKdZXpWW1wMmPoqK7qXXeGmScnSxrjL0A7mFlQ98Fylg6K26miCcF16GVgF_kyE6NGmLeHh8oeODtUnH-Ctj_ksz5Z-12RrskCOJhJ2YMgof5Q_x9JaBW0P5bko7lCzQwHEQFd9HNHn-u0HuV8-1E-QlpMzuFpD_tEx98OFEq2EyXTODd7MnLcx2_8dgMYG_z5g4c1P6KwvPDYX9I8ql6EwpYHaIc35As8iF4o_eA2FIsN_50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-10 w-full flex flex-col items-start">
                <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl">Destaque da Semana</span>
                <h2 className="text-white text-4xl font-black uppercase tracking-tighter mb-2 leading-none drop-shadow-xl italic">Resort Celestial</h2>
                <p className="text-white/80 mb-6 max-w-md font-bold text-sm leading-relaxed">Uma experiência imersiva na natureza com todo o luxo e conforto que você merece.</p>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-yellow-400 text-3xl font-black drop-shadow-lg">R$ 1.250</span>
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest"> /noite</span>
                  </div>
                  <button onClick={onReserve} className="bg-yellow-400 text-black px-8 py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-yellow-300">
                    Reservar <span className="material-symbols-rounded text-base font-black">calendar_month</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Small Info Cards Stack (Claymorphism) */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[40px] p-8 flex flex-col justify-center flex-1 shadow-xl border border-zinc-50 group/info cursor-default hover:scale-[1.02] transition-transform">
                <div className="relative size-14 flex items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm mb-5">
                  <span className="material-symbols-rounded text-yellow-600 text-2xl font-black">verified_user</span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-2 text-zinc-900 leading-none">Check-in Seguro</h3>
                <p className="text-zinc-400 font-bold text-xs leading-relaxed">Garantimos sua estadia com os protocolos mais rigorosos de segurança.</p>
              </div>
              <div className="bg-yellow-400 rounded-[40px] p-8 flex flex-col justify-center flex-1 shadow-xl shadow-yellow-200/50 group/info cursor-default hover:scale-[1.02] transition-transform text-black border-4 border-white">
                <div className="relative size-14 flex items-center justify-center rounded-2xl bg-black/10 shadow-inner mb-5">
                  <span className="material-symbols-rounded text-black text-2xl font-black">savings</span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-2 text-black leading-none">Melhores Preços</h3>
                <p className="text-black/60 font-black text-xs leading-relaxed">Tarifas exclusivas para membros Izi Premium com até 30% de desconto.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <div className="px-6 max-w-5xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
            <button className="bg-zinc-900 text-white px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap shadow-xl">Todas</button>
            <button className="bg-white text-zinc-400 border border-zinc-100 px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap shadow-sm">Chalés Modernos</button>
            <button className="bg-white text-zinc-400 border border-zinc-100 px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap shadow-sm">Casas de Praia</button>
            <button className="bg-white text-zinc-400 border border-zinc-100 px-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap shadow-sm">Lofts Urbanos</button>
          </div>
        </div>

        {/* Accommodation Carousel */}
        <section>
          <div className="flex overflow-x-auto gap-8 px-6 pb-12 snap-x snap-mandatory no-scrollbar">
            {/* Card 1 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-white rounded-[40px] overflow-hidden shadow-xl border border-zinc-50 group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="beachfront villa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsu0lUnkOHGRYR3TimY_wXjVsV0uSSIvfHNqyBB-kEszGX5hP3gA3OnFBOOfLWAiJ7XCWwFu4jl1D2TFx_dEpMoQL-pAbyzRTm_Qq0RT_ZfDDq6dGk13F_ktO0cprhOFX_HvDLhM_BiW1cQ4LyFkvhXYDThpdKes88Amyd6RU1GY_5IKGzeMkYvcs42D45JDFv-gBwWwuHjkqLGLGOL02kqjB9htt2IhRhvl7_zm_fLxBBP6J-z5u5-vIOTE548YL7WVXijuxxRO8" />
                <button className="absolute top-6 right-6 size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white z-10 border border-white/30">
                  <span className="material-symbols-rounded">favorite</span>
                </button>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">Villa Maré Alta</h3>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <span className="material-symbols-rounded text-sm">stars</span>
                    <span className="text-xs font-black">4.9</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-rounded text-base">location_on</span>
                  Ilhabela, São Paulo
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-zinc-900 font-black text-xl tracking-tighter italic">R$ 890</span>
                    <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest ml-1"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-yellow-100">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-white rounded-[40px] overflow-hidden shadow-xl border border-zinc-50 group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="cabin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMbQu_JM6OMEgg8OQjl02tYvn9DtiHV6Acsf1yuGieb962nE-ip52OBHc41H6Z1PjGGDzPwOtyeWO_MRvw8AFkCKldjusQqGo4OheNXyJgOSCjUHX1lEjkBd0xd9PKzulw60s1-5tXOvVSqJ-N90eT_YZiAsoghTwRjEA7z-oYH6Q36MnzfCS_fH33x8Va-F_eagFUtWHowbSfTRlfshoBr4Kl9gOVzbMIA5fQgOYqXUlmdFy9_JqAWEu8v5NkKrvCAQ2ZtjhNljQ" />
                <button className="absolute top-6 right-6 size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white z-10 border border-white/30">
                  <span className="material-symbols-rounded">favorite</span>
                </button>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">Chalé Nevasca</h3>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <span className="material-symbols-rounded text-sm">stars</span>
                    <span className="text-xs font-black">4.8</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-rounded text-base">location_on</span>
                  Gramado, RS
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-zinc-900 font-black text-xl tracking-tighter italic">R$ 650</span>
                    <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest ml-1"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-yellow-100">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Contextual Floating Action Button */}
      <div className="fixed bottom-10 right-8 z-50">
        <button className="size-20 rounded-[28px] bg-zinc-900 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
          <span className="material-symbols-rounded text-4xl">search</span>
        </button>
      </div>
    </div>
  );
};
