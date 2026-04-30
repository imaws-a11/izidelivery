import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAddress } from "../../../hooks/useAddress";
import { useApp } from "../../../hooks/useApp";
import { AddressSearchInput } from "./AddressSearchInput";

export const AddressListView = () => {
  const { 
    savedAddresses, 
    handleSaveAddress, 
    handleDeleteAddress, 
    handleSetActiveAddress,
    isSavingAddress,
    resetAddressForm,
    newAddrLabel,
    setNewAddrLabel,
    newAddrStreet,
    setNewAddrStreet,
    newAddrDetails,
    setNewAddrDetails,
    newAddrCity,
    setNewAddrCity,
    editingAddress,
    openEditAddress
  } = useAddress();

  const { setSubView, userLocation } = useApp();
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const handleBack = () => {
    if (isAddingAddress) {
      resetAddressForm();
      setIsAddingAddress(false);
    } else {
      setSubView("none");
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack} 
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base text-white uppercase tracking-tight">
            {isAddingAddress ? (editingAddress ? 'Editar Endereço' : 'Novo Endereço') : 'Endereços'}
          </h1>
        </div>
        {!isAddingAddress && (
          <button 
            onClick={() => { resetAddressForm(); setIsAddingAddress(true); }} 
            className="text-yellow-400 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        )}
      </header>

      <main className="px-5 pt-2 flex flex-col flex-1">
        <AnimatePresence mode="wait">
          {isAddingAddress ? (
            <motion.div 
              key="address-form" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              className="space-y-5 py-4"
            >
              {/* Seleção rápida de rótulo */}
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Tipo de endereço</p>
                <div className="flex gap-3">
                  {[
                    { label: 'Casa', icon: 'home' },
                    { label: 'Trabalho', icon: 'work' },
                    { label: 'Outro', icon: 'location_on' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setNewAddrLabel(opt.label === 'Outro' ? '' : opt.label)}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
                        newAddrLabel === opt.label
                          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Rótulo (personalizado) */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Rótulo</label>
                <input
                  type="text"
                  value={newAddrLabel}
                  onChange={(e) => setNewAddrLabel(e.target.value)}
                  placeholder="Ex: Casa, Trabalho, Mãe..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>

              {/* Campo Rua/Endereço com Autocomplete */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Endereço Completo</label>
                <AddressSearchInput
                  placeholder="Busque rua, número, bairro..."
                  initialValue={newAddrStreet}
                  userCoords={userLocation?.lat && userLocation?.lng ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                  onSelect={(place: any) => {
                    setNewAddrStreet(place.formatted_address || "");
                    if (place.address_components) {
                      const cityComp = place.address_components.find((c: any) => c.types.includes("administrative_area_level_2"));
                      if (cityComp) setNewAddrCity(cityComp.long_name);
                    }
                  }}
                  onClear={() => setNewAddrStreet("")}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>

              {/* Campo Complemento */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Complemento (opcional)</label>
                <input
                  type="text"
                  value={newAddrDetails}
                  onChange={(e) => setNewAddrDetails(e.target.value)}
                  placeholder="Apto 201, Bloco B..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>

              {/* Campo Cidade */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cidade (opcional)</label>
                <input
                  type="text"
                  value={newAddrCity}
                  onChange={(e) => setNewAddrCity(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>

              {/* Botão Salvar */}
              <button
                onClick={async () => {
                  const success = await handleSaveAddress();
                  if (success) setIsAddingAddress(false);
                }}
                disabled={isSavingAddress || !newAddrLabel.trim() || !newAddrStreet.trim()}
                className="w-full bg-yellow-400 text-black font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-yellow-400/20 active:scale-[0.97] transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 mt-2"
              >
                {isSavingAddress ? (
                  <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    {editingAddress ? 'Atualizar Endereço' : 'Salvar Endereço'}
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div key="address-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {savedAddresses.length === 0 ? (
                <div className="flex flex-col items-center py-24 gap-5">
                  <div className="size-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-zinc-700">location_off</span>
                  </div>
                  <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Nenhum endereço salvo</p>
                  <button
                    onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                    className="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
                  >
                    Adicionar primeiro endereço
                  </button>
                </div>
              ) : savedAddresses.map((addr: any, i: number) => (
                <motion.div 
                  key={addr.id || i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 w-full group"
                >
                  <button
                    onClick={() => handleSetActiveAddress(addr.id)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left active:opacity-60 transition-all"
                  >
                    <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${addr.active ? 'bg-yellow-400/15 text-yellow-400' : 'bg-zinc-900 text-zinc-600'}`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {addr.label?.toLowerCase().includes("casa") ? "home" : addr.label?.toLowerCase().includes("trabalho") ? "work" : "location_on"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-white">{addr.label || "Endereço"}</p>
                        {addr.active && <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Padrão</span>}
                      </div>
                      <p className="text-zinc-600 text-xs mt-0.5 truncate">{addr.street}{addr.details ? `, ${addr.details}` : ""}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        openEditAddress(addr);
                        setIsAddingAddress(true);
                      }}
                      className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-400 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
              {savedAddresses.length > 0 && (
                <button
                  onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                  className="flex items-center gap-3 py-5 text-zinc-700 hover:text-yellow-400 transition-all active:scale-[0.98] mt-2"
                >
                  <span className="material-symbols-outlined text-xl">add_location</span>
                  <span className="text-sm font-black uppercase tracking-wider">Adicionar novo endereço</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
