import React from "react";

interface ExploreBarsViewProps {
  onBack: () => void;
}

export const ExploreBarsView: React.FC<ExploreBarsViewProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-[150] h-[100dvh] overflow-y-auto w-full bg-zinc-950 text-white pb-12 font-['Plus_Jakarta_Sans']">
      <main className="px-6 pt-12 space-y-8">
        {/* Bold Title */}
        <header className="flex items-center justify-center relative">
          <button onClick={onBack} className="absolute left-0 p-2">
            <span className="material-symbols-outlined text-zinc-400 text-3xl">chevron_left</span>
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-yellow-400 text-center w-full">Bares</h1>
        </header>

        {/* Search & Updated Quick Filters */}
        <section className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500">search</span>
            </div>
            <input 
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-xl border-none ring-0 outline-none focus:ring-2 focus:ring-yellow-400/50 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] transition-all placeholder-zinc-500 font-medium" 
              placeholder="Qual bar você procura?" 
              type="text" 
            />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold whitespace-nowrap active:scale-95 transition-transform">Brasileira</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-bold whitespace-nowrap shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] active:scale-95 transition-transform">Japonesa</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-bold whitespace-nowrap shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] active:scale-95 transition-transform">Pizza</button>
            <button className="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full font-bold whitespace-nowrap shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] active:scale-95 transition-transform">Churrascaria</button>
          </div>
        </section>

        {/* Featured Section */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-yellow-400 font-extrabold tracking-widest uppercase text-xs">Brasilidade</span>
              <h2 className="text-3xl font-black tracking-tighter">Sabores Locais</h2>
            </div>
            <button className="text-yellow-400 font-bold text-sm">Ver todos</button>
          </div>

          {/* Bento-style Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Large Card */}
            <div className="col-span-2 relative overflow-hidden rounded-xl h-64 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] group cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Vibrant cocktail being served in a stylish bar, warm amber lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgi2hUQuSplXHHzWAgUVqCw_1QqiMbBF39Uft78cR_kx1xU6UA7AgaI8Bgz5NHjKBplelpMF3J7y1ZfAQDA1oJKqvnfoeJ-nVDDv3pu36nJjmVzWpiJZi_i672MMFFLYP4413WBaApSKxUqaFnWBJ7kE65pJFojaQpYTzOQ0aZnr2Dh3rNCG42Vmp6c-R-9C3eWEHVOqyT6yx1sH-qAf6NxQ9NjCyVi72GA2c_O4CcLvd3bl2vxQR7HbJXVS8vlJ77lfyfXDRv0b8" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded">CONCEITUADO</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Cachaçaria Real</h3>
                <p className="text-zinc-300 text-sm">As melhores misturas artesanais do Brasil.</p>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="bg-zinc-900 rounded-xl p-4 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] relative cursor-pointer">
              <div className="absolute -top-4 -right-2 w-14 h-14 transform rotate-12 transition-transform hover:rotate-0 duration-300">
                <div className="w-full h-full bg-yellow-400 rounded-2xl shadow-[inset_4px_4px_8px_rgba(255,255,255,0.3),0_8px_16px_rgba(0,0,0,0.2)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-black leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>local_bar</span>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="font-bold text-lg leading-tight">Bar do Porto</h4>
                <p className="text-zinc-500 text-xs mt-1">Drinques clássicos</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-yellow-400 font-bold">4.9 ★</span>
                  <span className="text-zinc-600 text-[10px] font-black">R$ R$ R$</span>
                </div>
              </div>
            </div>

            {/* Small Card 2 */}
            <div className="bg-zinc-900 rounded-xl p-4 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] relative cursor-pointer">
              <div className="absolute -top-4 -right-2 w-14 h-14 transform -rotate-12 transition-transform hover:rotate-0 duration-300">
                <div className="w-full h-full bg-zinc-800 rounded-2xl shadow-[inset_4px_4px_8px_rgba(255,255,255,0.3),0_8px_16px_rgba(0,0,0,0.2)] flex items-center justify-center border border-white/5">
                  <span className="material-symbols-outlined text-3xl text-yellow-400 leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>sports_bar</span>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="font-bold text-lg leading-tight">Chopp &amp; Cia</h4>
                <p className="text-zinc-500 text-xs mt-1">Cervejas premiadas</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-yellow-400 font-bold">4.7 ★</span>
                  <span className="text-zinc-600 text-[10px] font-black">R$ R$</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nearby Recommendations */}
        <section className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Próximos a você</h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Row Card 1 */}
            <div className="bg-zinc-900/50 p-4 rounded-xl shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] flex gap-4 items-center cursor-pointer">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <img className="w-full h-full object-cover" alt="Modern neon lit bar counter" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkSI7gjgzZNxIroGz7SE8QNTmBADfjlXpJDu1XRtoEwC34YE5Kqt2d6gL7VJSFCIvIxT_gwWbzeirEuVoD4PGeJ92bioWAa0txhk6V0RzUWwomlLa2gVeANZafTPpmkFuKKWFwWa6lnq5QX0QXTB5Rt2EXaXC4UdkJ4wHF3le6gMmAGRdFVrLVZ2t1Fmy9WYHJcast7OwwU0DMF1E69S49BAAK3Tgeng3wZFYUaYDhLBWgMTHMvUQ2fyFKCNCojgLQ0rHpho-oP3A" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">Jazz &amp; Drinks</h3>
                  <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <p className="text-zinc-500 text-sm">200m • Aberto agora</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">stars</span>
                    <span className="text-xs font-bold">4.8</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-zinc-600 text-sm">schedule</span>
                    <span className="text-xs text-zinc-500">10 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row Card 2 */}
            <div className="bg-zinc-900/50 p-4 rounded-xl shadow-[inset_8px_8px_16px_rgba(255,255,255,0.05),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] flex gap-4 items-center cursor-pointer">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <img className="w-full h-full object-cover" alt="Cozy neighborhood bar with wooden interior" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgi2hUQuSplXHHzWAgUVqCw_1QqiMbBF39Uft78cR_kx1xU6UA7AgaI8Bgz5NHjKBplelpMF3J7y1ZfAQDA1oJKqvnfoeJ-nVDDv3pu36nJjmVzWpiJZi_i672MMFFLYP4413WBaApSKxUqaFnWBJ7kE65pJFojaQpYTzOQ0aZnr2Dh3rNCG42Vmp6c-R-9C3eWEHVOqyT6yx1sH-qAf6NxQ9NjCyVi72GA2c_O4CcLvd3bl2vxQR7HbJXVS8vlJ77lfyfXDRv0b8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">Bar do Samba</h3>
                  <span className="material-symbols-outlined text-zinc-700 text-xl">favorite</span>
                </div>
                <p className="text-zinc-500 text-sm">800m • Música ao vivo</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">stars</span>
                    <span className="text-xs font-bold">4.6</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-zinc-600 text-sm">directions_car</span>
                    <span className="text-xs text-zinc-500">5 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
