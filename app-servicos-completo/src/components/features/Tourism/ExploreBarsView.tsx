import React from "react";
import { ExploreBanners } from "../../common/ExploreBanners";

interface ExploreBarsViewProps {
  onBack: () => void;
  exploreBanners?: any[];
}

export const ExploreBarsView: React.FC<ExploreBarsViewProps> = ({ onBack, exploreBanners = [] }) => {
  return (
    <div className="fixed inset-0 z-[150] h-[100dvh] overflow-y-auto w-full bg-zinc-50 text-zinc-900 pb-12 font-['Plus_Jakarta_Sans']">
      <main className="px-6 pt-12 space-y-8">
        {/* Bold Title */}
        <header className="flex items-center justify-center relative">
          <button onClick={onBack} className="absolute left-0 size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm active:scale-90 transition-all">
            <span className="material-symbols-rounded text-zinc-900 text-2xl">arrow_back</span>
          </button>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 text-center w-full uppercase italic">Bares</h1>
        </header>

        <ExploreBanners banners={exploreBanners} serviceType="Bares" />

        {/* Search & Updated Quick Filters */}
        <section className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-rounded text-zinc-400 group-focus-within:text-yellow-600 transition-colors">search</span>
            </div>
            <input 
              className="w-full h-16 bg-white text-zinc-900 pl-14 pr-6 rounded-[24px] border border-zinc-100 shadow-sm focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all placeholder-zinc-400 font-bold text-sm" 
              placeholder="Qual bar você procura?" 
              type="text" 
            />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button className="bg-yellow-400 text-black px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap active:scale-95 transition-transform shadow-md shadow-yellow-200">Brasileira</button>
            <button className="bg-white text-zinc-500 border border-zinc-100 px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap active:scale-95 transition-transform shadow-sm">Japonesa</button>
            <button className="bg-white text-zinc-500 border border-zinc-100 px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap active:scale-95 transition-transform shadow-sm">Pizza</button>
            <button className="bg-white text-zinc-500 border border-zinc-100 px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap active:scale-95 transition-transform shadow-sm">Churrascaria</button>
          </div>
        </section>

        {/* Featured Section */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-yellow-600 font-black tracking-[0.2em] uppercase text-[9px]">Brasilidade</span>
              <h2 className="text-2xl font-black tracking-tighter text-zinc-900 leading-none">Sabores Locais</h2>
            </div>
            <button className="text-zinc-900 font-black text-xs uppercase tracking-widest">Ver todos</button>
          </div>

          {/* Bento-style Grid */}
          <div className="grid grid-cols-2 gap-5">
            {/* Large Card */}
            <div className="col-span-2 relative overflow-hidden rounded-[40px] h-64 shadow-xl border border-zinc-100 group cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Vibrant cocktail" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgi2hUQuSplXHHzWAgUVqCw_1QqiMbBF39Uft78cR_kx1xU6UA7AgaI8Bgz5NHjKBplelpMF3J7y1ZfAQDA1oJKqvnfoeJ-nVDDv3pu36nJjmVzWpiJZi_i672MMFFLYP4413WBaApSKxUqaFnWBJ7kE65pJFojaQpYTzOQ0aZnr2Dh3rNCG42Vmp6c-R-9C3eWEHVOqyT6yx1sH-qAf6NxQ9NjCyVi72GA2c_O4CcLvd3bl2vxQR7HbJXVS8vlJ77lfyfXDRv0b8" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">CONCEITUADO</span>
                </div>
                <h3 className="text-2xl font-black tracking-tighter text-white">Cachaçaria Real</h3>
                <p className="text-white/80 text-xs font-medium">As melhores misturas artesanais do Brasil.</p>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="bg-white rounded-[32px] p-5 shadow-lg border border-zinc-50 relative cursor-pointer group">
              <div className="absolute -top-3 -right-2 w-14 h-14 transform rotate-12 transition-transform group-hover:rotate-0 duration-300">
                <div className="w-full h-full bg-yellow-400 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white">
                  <span className="material-symbols-rounded text-2xl text-black">local_bar</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-black text-base text-zinc-900 leading-tight uppercase tracking-tighter">Bar do Porto</h4>
                <p className="text-zinc-400 text-[10px] font-bold uppercase mt-1">Drinques clássicos</p>
                <div className="flex items-center justify-between mt-5">
                  <span className="text-yellow-600 font-black text-sm">4.9 ★</span>
                  <span className="text-zinc-300 text-[9px] font-black tracking-widest">$$$</span>
                </div>
              </div>
            </div>

            {/* Small Card 2 */}
            <div className="bg-white rounded-[32px] p-5 shadow-lg border border-zinc-50 relative cursor-pointer group">
              <div className="absolute -top-3 -right-2 w-14 h-14 transform -rotate-12 transition-transform group-hover:rotate-0 duration-300">
                <div className="w-full h-full bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white">
                  <span className="material-symbols-rounded text-2xl text-yellow-400">sports_bar</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-black text-base text-zinc-900 leading-tight uppercase tracking-tighter">Chopp &amp; Cia</h4>
                <p className="text-zinc-400 text-[10px] font-bold uppercase mt-1">Cervejas premiadas</p>
                <div className="flex items-center justify-between mt-5">
                  <span className="text-yellow-600 font-black text-sm">4.7 ★</span>
                  <span className="text-zinc-300 text-[9px] font-black tracking-widest">$$</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nearby Recommendations */}
        <section className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tighter text-zinc-900">Próximos a você</h2>
            <div className="flex gap-2">
              <div className="w-6 h-1.5 rounded-full bg-yellow-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Row Card 1 */}
            <div className="bg-white p-4 rounded-[32px] shadow-md border border-zinc-50 flex gap-5 items-center cursor-pointer hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-zinc-100">
                <img className="w-full h-full object-cover" alt="Neon bar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkSI7gjgzZNxIroGz7SE8QNTmBADfjlXpJDu1XRtoEwC34YE5Kqt2d6gL7VJSFCIvIxT_gwWbzeirEuVoD4PGeJ92bioWAa0txhk6V0RzUWwomlLa2gVeANZafTPpmkFuKKWFwWa6lnq5QX0QXTB5Rt2EXaXC4UdkJ4wHF3le6gMmAGRdFVrLVZ2t1Fmy9WYHJcast7OwwU0DMF1E69S49BAAK3Tgeng3wZFYUaYDhLBWgMTHMvUQ2fyFKCNCojgLQ0rHpho-oP3A" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-base text-zinc-900 tracking-tighter uppercase">Jazz &amp; Drinks</h3>
                  <span className="material-symbols-rounded text-rose-500 text-xl">favorite</span>
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">200m • Aberto agora</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-rounded text-yellow-600 text-sm">stars</span>
                    <span className="text-[11px] font-black text-zinc-600">4.8</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-rounded text-zinc-400 text-sm">schedule</span>
                    <span className="text-[11px] font-bold text-zinc-400">10 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row Card 2 */}
            <div className="bg-white p-4 rounded-[32px] shadow-md border border-zinc-50 flex gap-5 items-center cursor-pointer hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-zinc-100">
                <img className="w-full h-full object-cover" alt="Wooden bar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgi2hUQuSplXHHzWAgUVqCw_1QqiMbBF39Uft78cR_kx1xU6UA7AgaI8Bgz5NHjKBplelpMF3J7y1ZfAQDA1oJKqvnfoeJ-nVDDv3pu36nJjmVzWpiJZi_i672MMFFLYP4413WBaApSKxUqaFnWBJ7kE65pJFojaQpYTzOQ0aZnr2Dh3rNCG42Vmp6c-R-9C3eWEHVOqyT6yx1sH-qAf6NxQ9NjCyVi72GA2c_O4CcLvd3bl2vxQR7HbJXVS8vlJ77lfyfXDRv0b8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-base text-zinc-900 tracking-tighter uppercase">Bar do Samba</h3>
                  <span className="material-symbols-rounded text-zinc-200 text-xl">favorite</span>
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">800m • Música ao vivo</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-rounded text-yellow-600 text-sm">stars</span>
                    <span className="text-[11px] font-black text-zinc-600">4.6</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-rounded text-zinc-400 text-sm">directions_car</span>
                    <span className="text-[11px] font-bold text-zinc-400">5 min</span>
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
