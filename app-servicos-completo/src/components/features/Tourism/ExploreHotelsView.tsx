import React from "react";

interface ExploreHotelsViewProps {
  onBack: () => void;
  onReserve: () => void;
}

export const ExploreHotelsView: React.FC<ExploreHotelsViewProps> = ({ onBack, onReserve }) => {
  return (
    <div className="fixed inset-0 z-[150] bg-black text-white font-['Plus_Jakarta_Sans'] selection:bg-yellow-400 selection:text-black h-[100dvh] overflow-y-auto w-full pb-12">
      {/* Native Inline Header */}
      <header className="w-full flex items-center px-6 pt-12 pb-6 relative">
        <button onClick={onBack} className="absolute left-6 w-12 h-12 flex items-center justify-center rounded-[20px] bg-zinc-900 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:bg-zinc-800 transition-colors active:scale-95 duration-200 z-[50]">
          <span className="material-symbols-outlined text-yellow-400 text-xl font-black">arrow_back</span>
        </button>
        <h1 className="w-full text-center text-4xl font-black italic tracking-tighter uppercase drop-shadow-lg text-white">Hospedagens</h1>
      </header>

      <main className="pb-20 max-w-full overflow-x-hidden">
        {/* Featured Section (Bento Inspired) */}
        <section className="mb-12 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large Featured Card */}
            <div className="md:col-span-8 relative rounded-[40px] overflow-hidden h-[450px] shadow-[15px_15px_40px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.05),inset_-4px_-4px_10px_rgba(0,0,0,0.5)] group cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="luxury boutique hotel interior" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy16_cGsRNDUO-PNBxgZybpmUWZ8yKdZXpWW1wMmPoqK7qXXeGmScnSxrjL0A7mFlQ98Fylg6K26miCcF16GVgF_kyE6NGmLeHh8oeODtUnH-Ctj_ksz5Z-12RrskCOJhJ2YMgof5Q_x9JaBW0P5bko7lCzQwHEQFd9HNHn-u0HuV8-1E-QlpMzuFpD_tEx98OFEq2EyXTODd7MnLcx2_8dgMYG_z5g4c1P6KwvPDYX9I8ql6EwpYHaIc35As8iF4o_eA2FIsN_50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col items-start">
                <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-[12px] text-[10px] font-black uppercase tracking-widest mb-4 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4)]">Destaque da Semana</span>
                <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter mb-2 leading-none drop-shadow-xl">Resort Celestial</h2>
                <p className="text-zinc-300 mb-6 max-w-md font-medium text-sm drop-shadow-md leading-relaxed">Uma experiência imersiva na natureza com todo o luxo e conforto que você merece.</p>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-yellow-400 text-2xl font-black italic drop-shadow-md">R$ 1.250</span>
                    <span className="text-zinc-400 text-xs font-black uppercase tracking-widest"> /noite</span>
                  </div>
                  <button onClick={onReserve} className="bg-yellow-400 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] text-black px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 active:scale-95 transition-transform hover:bg-yellow-300">
                    Reservar <span className="material-symbols-outlined text-[16px] font-black">calendar_month</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Small Info Cards Stack (Claymorphism) */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-zinc-800 rounded-[40px] p-8 flex flex-col justify-center flex-1 shadow-[12px_12px_30px_rgba(0,0,0,0.6),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] group/info cursor-default hover:scale-[1.02] transition-transform">
                <div className="relative w-14 h-14 flex items-center justify-center rounded-[20px] bg-yellow-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] mb-5">
                  <span className="material-symbols-outlined text-black text-2xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-md leading-none">Check-in Seguro</h3>
                <p className="text-zinc-400 font-medium text-xs leading-relaxed">Garantimos sua estadia com os protocolos mais rigorosos de segurança e higiene.</p>
              </div>
              <div className="bg-yellow-400 rounded-[40px] p-8 flex flex-col justify-center flex-1 shadow-[12px_12px_30px_rgba(0,0,0,0.6),inset_4px_4px_8px_rgba(255,255,255,0.5),inset_-4px_-4px_8px_rgba(0,0,0,0.3)] group/info cursor-default hover:scale-[1.02] transition-transform text-black">
                <div className="relative w-14 h-14 flex items-center justify-center rounded-[20px] bg-zinc-900 shadow-[4px_4px_10px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] mb-5">
                  <span className="material-symbols-outlined text-yellow-400 text-2xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-black drop-shadow-sm leading-none">Melhores Preços</h3>
                <p className="text-zinc-800 font-bold text-xs leading-relaxed">Tarifas exclusivas para membros Izi Premium com até 30% de desconto imediato.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <div className="px-6 max-w-5xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
            <button className="bg-yellow-400 text-black px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap">Todas</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap hover:bg-zinc-800 transition-colors">Chalés Modernos</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap hover:bg-zinc-800 transition-colors">Casas de Praia</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap hover:bg-zinc-800 transition-colors">Lofts Urbanos</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap hover:bg-zinc-800 transition-colors">Fazendas</button>
          </div>
        </div>

        {/* Accommodation Carousel */}
        <section>
          <div className="flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory no-scrollbar">
            {/* Card 1 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="modern beachfront villa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsu0lUnkOHGRYR3TimY_wXjVsV0uSSIvfHNqyBB-kEszGX5hP3gA3OnFBOOfLWAiJ7XCWwFu4jl1D2TFx_dEpMoQL-pAbyzRTm_Qq0RT_ZfDDq6dGk13F_ktO0cprhOFX_HvDLhM_BiW1cQ4LyFkvhXYDThpdKes88Amyd6RU1GY_5IKGzeMkYvcs42D45JDFv-gBwWwuHjkqLGLGOL02kqjB9htt2IhRhvl7_zm_fLxBBP6J-z5u5-vIOTE548YL7WVXijuxxRO8" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Villa Maré Alta</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">4.9</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Ilhabela, São Paulo
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 890</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="cozy a-frame cabin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMbQu_JM6OMEgg8OQjl02tYvn9DtiHV6Acsf1yuGieb962nE-ip52OBHc41H6Z1PjGGDzPwOtyeWO_MRvw8AFkCKldjusQqGo4OheNXyJgOSCjUHX1lEjkBd0xd9PKzulw60s1-5tXOvVSqJ-N90eT_YZiAsoghTwRjEA7z-oYH6Q36MnzfCS_fH33x8Va-F_eagFUtWHowbSfTRlfshoBr4Kl9gOVzbMIA5fQgOYqXUlmdFy9_JqAWEu8v5NkKrvCAQ2ZtjhNljQ" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Chalé Nevasca</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">4.8</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Gramado, RS
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 650</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="contemporary urban house" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC07Sk3CfZtUZen1LIiAVHyMjJF_zpFLE9HeTMJAlhr-fkFZkxX_dMFot6E1e30eVShC3h-XUpyeAKrmsb6gDMwZ2lb8ptTDl1_JCMSqo9Eky7pmpSF1NsNyTW04q8a6ZoiplkhXENnHTeLPSFEtOHTbcc0JNjpKSem6AT8E7eMqxEB5lBXa1HCBxHh3mvIbEwfKP42TJA_UgYnJoLZJUqG_GQz9DkPdWFgVpj_dFLtoh_Wn45_cfRGaQQH9PeAiReWjYRY08qaSIA" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Skyline Loft</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">5.0</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  São Paulo, SP
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 420</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="rustic wooden cottage" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH4XsNKFdpMRPvVlQVGYAAEH-wRIE4UydLKj5NDiSlbDyW6LT6CTC0phDn3352xZv1VZ9enel6Cn_UmokR2pPtZCi2Eg3sUZYX4xPD9XlDwE22Swg6I5QTg9dNSWa4gh8TZIQDoV2cT1g2wut4QAtjZ3vRt-sk74u_pPod82jj090ZIEtPFfS-bACkRZgTcYGpxahpg9D7IIg9he7q74WAyULp7Z-rGHI_rE4mhAcqvTILUhRSaxrzhSukI0zNtDx8swpELUY58AU" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Refúgio do Lago</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">4.7</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Campos do Jordão, SP
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 580</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="white luxury villa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXqjl6q67laOS64cPIVKWoIlQB0fIqCmDyOZpNRaxTum2gs6APsHmbfrtNaLeHziplGVdH6a3m_FyBIkDMyxooURRl7XVOmNxm2J0o32bhPi_NBdDI7TSiMcZWzbTKvLna4IwJ928hYw_Bi5jbEmFo_n91IsqZpXkml-bt1OWwadpIldaWW6duMbfwCemN2J3FBWNiNsd_KEbOrjM0g-RLQje91buz6eZH12m31xTCXWtOz9Og9sNUCLfbR7pien6yNukiojNHNAc" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Vila Esmeralda</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">4.9</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Fernando de Noronha, PE
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 1.100</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6 */}
            <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-zinc-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_10px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] group cursor-pointer relative">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="glass walls house" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5MZq2-UdWVVNCwaaLCCW4C4fj7s3SMM_ylsE5R4vsxYK337XsCMz60UyYsdeZYaxqM_BGnwUzCpgaktUgyAGNFq3sRiNXiD84xXxWYJr6-hv0fJyWBjDlEuKxfeV1zTu1nI75bB1wnzAhmEdJc7gJJsJ7eOVVyRjDnod16iDEylQ5VDpVUUuc7EOYkv3TCPgHlHBLGSXEUPA0rpLhnIFDKNIjheweW6wrOCoxWAGkE-4ISnOtH3FFSB63PDkTyfr4Td_6NFP0tdk" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/60 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Casa da Selva</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-bold">4.8</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Paraty, RJ
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-white font-bold text-lg">R$ 750</span>
                    <span className="text-zinc-500 text-xs"> /dia</span>
                  </div>
                  <button onClick={onReserve} className="bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3)] text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform">
                    Reservar
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Contextual Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.3),_0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-black active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
        </button>
      </div>
    </div>
  );
};
