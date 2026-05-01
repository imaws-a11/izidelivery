import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAddress } from "../../../hooks/useAddress";
import { useApp } from "../../../hooks/useApp";
import { AddressSearchInput } from "./AddressSearchInput";
import { Icon } from "../../common/Icon";

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
    <div className="absolute inset-0 z-[150] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header Premium White/Yellow */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 pt-12 pb-6 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBack} 
            className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm"
          >
            <Icon name="arrow_back" />
          </motion.button>
          <div>
            <h1 className="font-black text-xl text-zinc-900 tracking-tight leading-none uppercase">
              {isAddingAddress ? (editingAddress ? 'Editar' : 'Novo') : 'Endereços'}
            </h1>
            <p className="text-[10px] font-black text-zinc-400 mt-1 uppercase tracking-widest leading-none">
              {isAddingAddress ? 'Preencha os dados' : 'Meus locais salvos'}
            </p>
          </div>
        </div>
        {!isAddingAddress && (
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => { resetAddressForm(); setIsAddingAddress(true); }} 
            className="size-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-400/20 active:bg-yellow-500 transition-colors"
          >
            <Icon name="add" />
          </motion.button>
        )}
      </header>

      <main className="px-6 py-6 flex flex-col flex-1">
        <AnimatePresence mode="wait">
          {isAddingAddress ? (
            <motion.div 
              key="address-form" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-8"
            >
              {/* Seleção rápida de rótulo */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Tipo de endereço</p>
                <div className="flex gap-3">
                  {[
                    { label: 'Casa', icon: 'home' },
                    { label: 'Trabalho', icon: 'work' },
                    { label: 'Outro', icon: 'location_on' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.label}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewAddrLabel(opt.label === 'Outro' ? '' : opt.label)}
                      className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-[28px] border transition-all ${
                        newAddrLabel === opt.label
                          ? 'bg-zinc-950 border-zinc-900 text-white shadow-xl shadow-zinc-200'
                          : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                      }`}
                    >
                      <Icon name={opt.icon} className={newAddrLabel === opt.label ? 'text-yellow-400' : ''} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Formulário com design atual */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Rótulo Personalizado</label>
                  <input
                    type="text"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    placeholder="Ex: Apartamento, Consultório..."
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-yellow-400 transition-colors shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Endereço Completo</label>
                  <AddressSearchInput
                    placeholder="Rua, número, bairro..."
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
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-yellow-400 transition-colors shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Complemento</label>
                      <input
                        type="text"
                        value={newAddrDetails}
                        onChange={(e) => setNewAddrDetails(e.target.value)}
                        placeholder="Apto/Bloco"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-yellow-400 transition-colors shadow-sm"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Cidade</label>
                      <input
                        type="text"
                        value={newAddrCity}
                        onChange={(e) => setNewAddrCity(e.target.value)}
                        placeholder="Cidade"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl px-6 py-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-yellow-400 transition-colors shadow-sm"
                      />
                   </div>
                </div>
              </div>

              {/* Botão Salvar Premium */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  const success = await handleSaveAddress();
                  if (success) setIsAddingAddress(false);
                }}
                disabled={isSavingAddress || !newAddrLabel.trim() || !newAddrStreet.trim()}
                className="w-full bg-yellow-400 text-black font-black text-[11px] uppercase tracking-[0.2em] py-6 rounded-3xl shadow-xl shadow-yellow-400/20 active:bg-yellow-500 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 mt-6"
              >
                {isSavingAddress ? (
                  <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="save" />
                    {editingAddress ? 'Atualizar Endereço' : 'Salvar Endereço'}
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="address-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {savedAddresses.length === 0 ? (
                <div className="flex flex-col items-center py-24 gap-6 text-center">
                  <div className="size-24 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                    <Icon name="location_off" className="text-4xl text-zinc-200" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">Nenhum endereço salvo</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">Adicione um local para agilizar seu pedido</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                    className="bg-zinc-900 text-white font-black text-[10px] uppercase tracking-[0.2em] px-8 py-4 rounded-2xl active:scale-95 transition-all shadow-xl shadow-zinc-200"
                  >
                    Adicionar agora
                  </motion.button>
                </div>
              ) : savedAddresses.map((addr: any, i: number) => (
                <motion.div 
                  key={addr.id || i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className={`p-5 rounded-[32px] border transition-all flex items-center gap-4 ${
                    addr.active 
                    ? 'bg-zinc-950 border-zinc-900 text-white shadow-2xl shadow-zinc-200' 
                    : 'bg-zinc-50 border-zinc-100 text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <button
                    onClick={() => handleSetActiveAddress(addr.id)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left active:opacity-60 transition-all"
                  >
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      addr.active ? 'bg-yellow-400 text-black' : 'bg-white text-zinc-400'
                    }`}>
                      <Icon name={addr.label?.toLowerCase().includes("casa") ? "home" : addr.label?.toLowerCase().includes("trabalho") ? "work" : "location_on"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm uppercase tracking-tight">{addr.label || "Endereço"}</p>
                        {addr.active && <span className="text-[8px] font-black text-black bg-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Padrão</span>}
                      </div>
                      <p className={`text-[11px] font-medium mt-0.5 truncate ${addr.active ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {addr.street}{addr.details ? `, ${addr.details}` : ""}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        openEditAddress(addr);
                        setIsAddingAddress(true);
                      }}
                      className={`size-10 rounded-xl flex items-center justify-center border transition-all ${
                        addr.active ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-100 text-zinc-400'
                      }`}
                    >
                      <Icon name="edit" className="!text-lg" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if(window.confirm("Remover este endereço?")) handleDeleteAddress(addr.id);
                      }}
                      className={`size-10 rounded-xl flex items-center justify-center border transition-all ${
                        addr.active ? 'bg-zinc-900 border-zinc-800 text-red-400/50' : 'bg-white border-zinc-100 text-red-500/30'
                      }`}
                    >
                      <Icon name="delete" className="!text-lg" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {savedAddresses.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                  className="w-full flex items-center justify-center gap-3 py-6 rounded-[32px] border-2 border-dashed border-zinc-100 text-zinc-400 hover:text-yellow-600 hover:border-yellow-400/30 transition-all mt-4"
                >
                  <Icon name="add_location" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Novo endereço</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
