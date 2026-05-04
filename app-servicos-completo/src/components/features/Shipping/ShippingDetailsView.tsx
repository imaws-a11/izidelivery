import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";

export const ShippingDetailsView = () => {
  const { 
    transitData, 
    setTransitData, 
    navigateSubView, 
    userLocation, 
    updateLocation, 
    isCalculatingPrice, 
    routeDistance, 
    isLoading, 
    handleRequestTransit,
    setShowDatePicker,
    setShowTimePicker,
    setShowLojistasModal,
    calculateDistancePrices,
    setDistancePrices
  } = useApp();

  return (
    <div className="absolute inset-0 z-[120] bg-[#F8F9FA] text-zinc-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-6">
      <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-xl z-50">
        <button
          onClick={() => navigateSubView("explore_izi_envios")}
          className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zinc-900 active:scale-90 transition-all border border-zinc-200"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter leading-none mb-1">
            Detalhes
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600">Informações de Entrega</p>
        </div>
      </header>

      <main className="px-6 space-y-10 pb-40">
        {(transitData.subService === "express" || transitData.subService === "agendado") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="location_on" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Roteiro de Entrega</h3>
            </div>
            
            <div className="space-y-4">
              {/* ORIGEM (COLETA) */}
              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center mb-4 ml-1">
                   <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Origem (Onde Coletar?)</p>
                   <button 
                     onClick={() => updateLocation(true)}
                     disabled={userLocation.loading}
                     className="flex items-center gap-1.5 text-yellow-600 hover:text-yellow-700 transition-colors active:scale-95 px-2 py-1 rounded-full bg-yellow-50 disabled:opacity-50 border border-yellow-100"
                   >
                      {userLocation.loading
                        ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" /><path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                        : <span className="material-symbols-outlined text-xs">my_location</span>
                      }
                      <span className="text-[8px] font-black uppercase tracking-widest">{userLocation.loading ? 'Buscando...' : 'Localização Atual'}</span>
                   </button>
                </div>
                <AddressSearchInput 
                  initialValue={transitData.origin}
                  placeholder="Endereço de partida..."
                  className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                  userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                  onSelect={(place) => {
                    const ori = place.formatted_address || "";
                    setTransitData(prev => ({ ...prev, origin: ori }));
                    if (ori && transitData.destination) {
                      setDistancePrices({});
                      setRouteDistance("");
                      calculateDistancePrices(ori, transitData.destination);
                    }
                  }}
                />
              </div>

              {/* DESTINO */}
              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Para onde levar?</p>
                 <AddressSearchInput 
                   initialValue={transitData.destination}
                   placeholder="Digite o endereço de destino..."
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                   userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                   onSelect={(place) => {
                     const dest = place.formatted_address || "";
                     setTransitData(prev => ({ ...prev, destination: dest }));
                     if (dest && transitData.origin) {
                       setDistancePrices({});
                       setRouteDistance("");
                       calculateDistancePrices(transitData.origin, dest);
                     }
                   }}
                 />
              </div>
            </div>
          </section>
        )}

        {transitData.origin && transitData.destination && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-400 p-8 rounded-[45px] shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 size-32 bg-white/40 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-black text-sm">distance</span>
                  <p className="text-[10px] font-black text-black/70 uppercase tracking-widest">{routeDistance || 'Calculando rota...'}</p>
                </div>
                <div className="flex flex-col mb-1">
                  <p className="text-[9px] font-black text-black/60 uppercase tracking-[0.2em]">
                    {transitData.type === 'utilitario' ? (
                      transitData.priority === 'turbo' ? 'Izi Turbo Flash' :
                      transitData.priority === 'light' ? 'Izi Light Flash' :
                      transitData.priority === 'normal' ? 'Izi Express' :
                      transitData.priority === 'scheduled' ? 'Izi Agendado' : 'Izi Express'
                    ) : (
                      transitData.type === 'mototaxi' ? 'Moto Táxi' :
                      transitData.type === 'carro' ? 'Particular' :
                      transitData.type === 'van' ? 'Transporte de Carga' : 'Serviço de Entrega'
                    )}
                  </p>
                  <h4 className="text-3xl font-black text-black tracking-tighter">
                    {isCalculatingPrice ? (
                      <span className="animate-pulse opacity-50 text-xl uppercase">Calculando...</span>
                    ) : (
                      <>R$ {(transitData.estPrice || 0).toFixed(2).replace(".", ",")}</>
                    )}
                  </h4>
                </div>
              </div>
              <div className="size-14 rounded-2xl bg-white/30 flex items-center justify-center border border-white/40 backdrop-blur-sm">
                <span className="material-symbols-outlined text-black text-2xl">receipt_long</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-black/10 flex items-center gap-3 relative z-10">
               <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
               <p className="text-[8px] font-black text-black/70 uppercase tracking-[0.2em]">Preço Izi Garantido • Inclui Taxas</p>
            </div>
          </motion.div>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <Icon name="swap_horiz" />
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              {transitData.subService === 'coleta' ? 'selecionar ponto de retirada' : 'Enviar ou Receber?'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-3 mb-4">
              {(transitData.subService === "express" || transitData.subService === "agendado") ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setTransitData({...transitData, operationType: "enviar"})}
                    className={`py-8 rounded-[35px] border transition-all flex flex-col items-center justify-center gap-3 ${transitData.operationType === "enviar" ? "bg-yellow-400 border-yellow-400 text-black shadow-md" : "bg-white border-zinc-200 text-zinc-400 shadow-sm"}`}
                  >
                    <span className="material-symbols-outlined text-3xl">outbox</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Vou Enviar</span>
                  </button>
                  <button 
                    onClick={() => setTransitData({...transitData, operationType: "retirar"})}
                    className={`py-8 rounded-[35px] border transition-all flex flex-col items-center justify-center gap-3 ${transitData.operationType === "retirar" ? "bg-yellow-400 border-yellow-400 text-black shadow-md" : "bg-white border-zinc-200 text-zinc-400 shadow-sm"}`}
                  >
                    <span className="material-symbols-outlined text-3xl">store</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-2">Retirar em Loja / Casa</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLojistasModal(true)}
                  className="w-full py-10 rounded-[40px] border bg-yellow-400 border-yellow-400 text-black shadow-lg flex flex-col items-center gap-3 active:scale-[0.98] transition-all group"
                >
                  <div className="size-14 rounded-full bg-white/30 flex items-center justify-center mb-1 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">storefront</span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-center px-6">
                    {transitData.receiverName ? `Loja: ${transitData.receiverName}` : "Selecionar Loja Parceira"}
                  </span>
                </button>
              )}
            </div>

            {(transitData.subService === "express" || transitData.subService === "agendado") && (
              <>
                <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                   <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Nome de quem recebe</p>
                   <input 
                     type="text" 
                     value={transitData.receiverName || ""}
                     onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                     placeholder="Ex: João Silva"
                     className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                   />
                </div>

                <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                   <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
                   <input 
                     type="tel" 
                     value={transitData.receiverPhone || ""}
                     onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                     placeholder="(11) 99999-9999"
                     className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                   />
                </div>
              </>
            )}

            {transitData.subService === "coleta" && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                   <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Endereço de Coleta (Origem/Parceiro)</p>
                   <AddressSearchInput 
                     initialValue={transitData.origin || ""}
                     placeholder="Confirme o endereço do parceiro..."
                     onSelect={(data) => setTransitData(prev => ({ ...prev, origin: data.formatted_address || "" }))}
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                   />
                </div>
                <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Endereço de Entrega (Destino)</p>
                 <AddressSearchInput 
                   initialValue={transitData.destination || ""}
                   placeholder="Onde devemos entregar?"
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                   userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                   onSelect={(place) => {
                     const dest = place.formatted_address || "";
                     setTransitData(prev => ({ ...prev, destination: dest }));
                     if (dest && transitData.origin) {
                       calculateDistancePrices(transitData.origin, dest);
                     }
                   }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {transitData.subService === "coleta" && (
          <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="business" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Detalhes do Parceiro Izi</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Nome do Parceiro / Loja</p>
                 <input 
                   type="text" 
                   value={transitData.receiverName || ""}
                   onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                   placeholder="Ex: Hub Logístico Izi"
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                 />
              </div>

              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Telefone do Parceiro</p>
                 <input 
                   type="tel" 
                   value={transitData.receiverPhone || ""}
                   onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                   placeholder="(11) 99999-9999"
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                 />
              </div>

              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Cód. do Pedido / Retirada</p>
                 <input 
                   type="text" 
                   value={transitData.pickupCode || ""}
                   onChange={(e) => setTransitData({...transitData, pickupCode: e.target.value})}
                   placeholder="Ex: ABC123456"
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                 />
              </div>

              <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Setor / Guichê</p>
                 <input 
                   type="text" 
                   value={transitData.pickupSector || ""}
                   onChange={(e) => setTransitData({...transitData, pickupSector: e.target.value})}
                   placeholder="Piso / Corredor"
                   className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300"
                 />
              </div>
            </div>
          </motion.section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <Icon name="inventory_2" />
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Detalhes da Retirada</h3>
          </div>

          <div className="space-y-4">
             <div className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Descrição do Item</p>
                <textarea 
                  value={transitData.packageDesc || ""}
                  onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                  placeholder="Ex: 2 Camisetas, 1 Par de Tênis..."
                  rows={3}
                  className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-zinc-900 placeholder:text-zinc-300 resize-none"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                {['Pequeno (até 5kg)', 'Médio (até 15kg)', 'Grande (até 30kg)', 'Pesado (+30kg)'].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setTransitData({...transitData, weightClass: weight})}
                    className={`py-5 px-4 rounded-[30px] text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                      transitData.weightClass === weight 
                        ? 'bg-yellow-400 border-yellow-400 text-black shadow-md' 
                        : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {weight}
                  </button>
                ))}
             </div>
          </div>
        </section>

        {transitData.scheduled && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="event_upcoming" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Agendamento da Coleta</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setShowDatePicker(true)} className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Data</p>
                 <div className="flex items-center justify-between">
                   <span className="text-base font-bold text-zinc-900">{transitData.scheduledDate || "Selecionar data"}</span>
                   <span className="material-symbols-outlined text-yellow-600 text-sm">calendar_month</span>
                 </div>
              </div>
              <div onClick={() => setShowTimePicker(true)} className="bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 ml-1">Horário</p>
                 <div className="flex items-center justify-between">
                   <span className="text-base font-bold text-zinc-900">{transitData.scheduledTime || "Selecionar hora"}</span>
                   <span className="material-symbols-outlined text-yellow-600 text-sm">schedule</span>
                 </div>
              </div>
            </div>
          </motion.section>
        )}

        <div className="bg-yellow-50 p-7 rounded-[40px] border border-yellow-200/50 shadow-sm flex items-start gap-5">
           <div className="size-12 rounded-2xl bg-yellow-100 flex items-center justify-center shrink-0 border border-yellow-200">
             <span className="material-symbols-outlined text-yellow-700 text-xl font-bold">warning</span>
           </div>
           <p className="text-[10px] font-black text-yellow-800 leading-relaxed uppercase tracking-[0.1em]">
             Certifique-se de que o objeto esteja bem embalado. Não transportamos itens proibidos por lei ou inflamáveis.
           </p>
        </div>


      </main>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-8 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/90 to-transparent z-50">
        <button
          disabled={isLoading}
          onClick={handleRequestTransit}
          className="w-full bg-zinc-900 text-white font-black text-xl py-6 rounded-[30px] shadow-2xl shadow-black/20 active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
        >
          {isLoading ? (
            <div className="size-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="uppercase tracking-[0.1em]">Confirmar e Pagar</span>
              <Icon name="arrow_forward" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
