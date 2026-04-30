import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useApp } from "../../../hooks/useApp";
import { useOrder } from "../../../hooks/useOrder";
import { Icon } from "../../common/Icon";
import { supabase } from "../../../lib/supabase";

export const ProductDetailView = () => {
  const { 
    selectedItem, 
    selectedShop, 
    activeService, 
    setSubView, 
    showToast 
  } = useApp();
  
  const { cart, setCart } = useOrder();

  const [productAddonGroups, setProductAddonGroups] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<any>({});
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(1);

  const getGroupSelections = (groupId: string) => selectedOptions[groupId] || [];
  const getOptionQuantity = (groupId: string, itemId: string) =>
    getGroupSelections(groupId).find((item: any) => item.id === itemId)?.quantity || 0;

  const getSelectedOptionEntries = (optionsState: any = selectedOptions) =>
    Object.entries(optionsState).flatMap(([groupId, items]: [string, any]) =>
      (Array.isArray(items) ? items : []).map((item: any) => ({
        ...item,
        group_id: groupId,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.price) || 0,
        total_price: (Number(item.price) || 0) * (Number(item.quantity) || 0),
      }))
    );

  const calculateAddonsPrice = (optionsState: any = selectedOptions) =>
    getSelectedOptionEntries(optionsState).reduce((acc: number, item: any) => acc + item.total_price, 0);

  const buildCartItemDetails = (product: any, optionsState: any) => {
    const detailedOptions = getSelectedOptionEntries(optionsState)
      .filter((item: any) => item.quantity > 0)
      .map((item: any) => {
        const group = productAddonGroups.find((addonGroup: any) => addonGroup.id === item.group_id);
        return {
          ...item,
          group_name: group?.name || item.group_name || "Complemento",
        };
      });

    return {
      addonDetails: detailedOptions,
      addonSummaryText: detailedOptions.length > 0
        ? detailedOptions.map((item: any) => `${item.group_name}: ${item.name} x${item.quantity} (R$ ${item.total_price.toFixed(2).replace(".", ",")})`).join("; ")
        : "",
    };
  };

  const updateOptionQuantity = (group: any, item: any, delta: number) => {
    let didHitLimit = false;

    setSelectedOptions((prev: any) => {
      const current = Array.isArray(prev[group.id]) ? prev[group.id] : [];
      const maxAllowed = Math.max(Number(group.max_select) || 1, 1);
      const currentCount = current.reduce((acc: number, currentItem: any) => acc + (Number(currentItem.quantity) || 0), 0);
      const existingIndex = current.findIndex((currentItem: any) => currentItem.id === item.id);
      const existingQuantity = existingIndex >= 0 ? Number(current[existingIndex].quantity) || 0 : 0;
      let nextGroup = [...current];

      if (delta > 0) {
        if (maxAllowed === 1) {
          nextGroup = [{ ...item, quantity: 1 }];
        } else {
          if (currentCount >= maxAllowed) {
            didHitLimit = true;
            return prev;
          }

          if (existingIndex >= 0) {
            nextGroup[existingIndex] = { ...nextGroup[existingIndex], quantity: existingQuantity + 1 };
          } else {
            nextGroup.push({ ...item, quantity: 1 });
          }
        }
      } else if (delta < 0) {
        if (existingIndex === -1) return prev;

        const nextQuantity = existingQuantity + delta;
        if (nextQuantity <= 0) {
          nextGroup.splice(existingIndex, 1);
        } else {
          nextGroup[existingIndex] = { ...nextGroup[existingIndex], quantity: nextQuantity };
        }
      } else {
        return prev;
      }

      const nextState = { ...prev };
      if (nextGroup.length > 0) {
        nextState[group.id] = nextGroup;
      } else {
        delete nextState[group.id];
      }

      return nextState;
    });

    if (didHitLimit) {
      showToast(`Limite de ${group.max_select} seleções em ${group.name}`, "error");
    }
  };

  const fetchProductAddons = async (productId: string) => {
    setAddonsLoading(true);
    try {
      const { data: groups, error: gErr } = await supabase
        .from('product_options_groups_delivery')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
        
      if (gErr) throw gErr;
      if (!groups || groups.length === 0) {
        setProductAddonGroups([]);
        return;
      }

      const gIds = groups.map(g => g.id);
      const { data: items, error: iErr } = await supabase
        .from('product_options_items_delivery')
        .select('*')
        .in('group_id', gIds)
        .order('sort_order', { ascending: true });
        
      if (iErr) throw iErr;
      
      const assembled = groups.map(g => ({
        ...g,
        items: items?.filter(i => i.group_id === g.id) || []
      }));
      setProductAddonGroups(assembled);
    } catch (err) {
      console.error('Error fetching addons:', err);
    } finally {
      setAddonsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem?.id || selectedItem?.uid) {
       fetchProductAddons(selectedItem.id || selectedItem.uid);
       setTempQuantity(1);
    }
  }, [selectedItem?.id, selectedItem?.uid]);

  if (!selectedItem) return null;

  const handleBack = () => {
    if (selectedShop) {
      setSubView("restaurant_menu");
    } else if (activeService) {
      if (activeService.type === "market") setSubView("market_list");
      else if (activeService.type === "pharmacy") setSubView("pharmacy_list");
      else setSubView("generic_list");
    } else {
      setSubView("none");
    }
  };

  const itemImage = selectedItem.img || "";
  const addonsPrice = calculateAddonsPrice();
  const totalProductPrice = selectedItem.price + addonsPrice;

  return (
    <div className="absolute inset-0 z-[70] bg-zinc-950 flex flex-col hide-scrollbar overflow-y-auto">
      <div className="relative w-full h-[40vh] bg-cover bg-center shrink-0" style={{ backgroundImage: "url('" + itemImage + "')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20"></div>
        <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl text-white border border-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.1)] active:scale-90 transition-all">
            <Icon name="arrow_back" />
          </button>
        </header>
      </div>

      <div className="relative z-10 -mt-12 bg-zinc-950 rounded-t-[48px] px-8 pt-12 pb-40 space-y-10 flex-1 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{selectedItem.name}</h2>
          </div>
          {selectedShop && (
             <div className="bg-zinc-900 p-3 rounded-[24px] border border-white/5 flex flex-col items-center min-w-[72px] shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Loja</span>
                <div className="size-10 rounded-xl bg-cover bg-center border border-white/10 shadow-lg" style={{ backgroundImage: "url('" + selectedShop.img + "')" }}></div>
             </div>
          )}
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Descricao</h3>
            <p className="text-zinc-400 text-base leading-relaxed">{selectedItem.desc || "Produto premium selecionado."}</p>
          </section>

          <div className="space-y-8">
            {addonsLoading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="size-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Carregando opcionais...</p>
              </div>
            ) : productAddonGroups.map((group, gIdx) => (
              <section key={group.id || `group-${gIdx}`} className="space-y-4">
                <h3 className="text-lg font-black text-white tracking-tight">{group.name}</h3>
                <div className="space-y-3">
                  {group.items.map((item: any, iIdx: number) => {
                    const qty = getOptionQuantity(group.id, item.id);
                    const isSelected = qty > 0;
                    return (
                      <motion.div 
                        key={item.id || `addon-${iIdx}`} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => qty === 0 && updateOptionQuantity(group, item, 1)}
                        className={"p-5 rounded-[32px] border transition-all flex items-center justify-between cursor-pointer relative overflow-hidden " + 
                          (isSelected 
                            ? 'bg-yellow-400 border-yellow-400 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.1)]' 
                            : 'bg-zinc-900 border-white/5 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]')
                        }
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={"size-6 rounded-lg flex items-center justify-center transition-all " + (isSelected ? 'bg-black text-yellow-400 shadow-inner' : 'bg-white/5')}>
                            {isSelected ? (
                              <span className="text-[12px] font-black">{qty}</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px] font-black">add</span>
                            )}
                          </div>
                          <span className={"font-black text-[13px] uppercase tracking-tight " + (isSelected ? 'text-black' : 'text-white')}>{item.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                          {isSelected ? (
                            <div className="flex items-center gap-2 bg-black/10 p-1 rounded-2xl border border-black/5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOptionQuantity(group, item, -1); }}
                                className="size-8 rounded-xl bg-black text-yellow-400 flex items-center justify-center active:scale-75 transition-all shadow-md"
                              >
                                <span className="material-symbols-outlined text-sm font-black">remove</span>
                              </button>
                              <span className="text-[13px] font-black w-4 text-center text-black">{qty}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOptionQuantity(group, item, 1); }}
                                className="size-8 rounded-xl bg-black text-yellow-400 flex items-center justify-center active:scale-75 transition-all shadow-md"
                              >
                                <span className="material-symbols-outlined text-sm font-black">add</span>
                              </button>
                            </div>
                          ) : (
                            <span className="font-black text-xs text-yellow-400">+ R$ {item.price.toFixed(2).replace('.', ',')}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 left-6 right-6 z-[80]">
        {selectedShop && !selectedShop.isOpen ? (
          <div className="w-full h-20 bg-zinc-800 text-zinc-500 rounded-[32px] flex items-center justify-center p-2 shadow-lg border border-white/5 opacity-80">
            <span className="material-symbols-outlined mr-2">block</span>
            <span className="font-black text-sm uppercase tracking-widest">Loja Fechada</span>
          </div>
        ) : (
          <div className="w-full h-20 bg-yellow-400 text-black rounded-[32px] flex items-center p-2 shadow-[8px_8px_24px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            
            <div className="flex items-center gap-4 bg-black/10 p-1.5 rounded-[22px] border border-black/5 z-10 ml-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setTempQuantity(Math.max(1, tempQuantity - 1)); }}
                className="size-11 rounded-2xl bg-black text-yellow-400 flex items-center justify-center active:scale-75 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined font-black">remove</span>
              </button>
              <span className="font-black text-lg w-6 text-center">{tempQuantity}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setTempQuantity(tempQuantity + 1); }}
                className="size-11 rounded-2xl bg-black text-yellow-400 flex items-center justify-center active:scale-75 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined font-black">add</span>
              </button>
            </div>

            <button 
              className="flex-1 flex flex-col items-center justify-center z-10 h-full"
              onClick={() => {
                const details = buildCartItemDetails(selectedItem, selectedOptions);
                const items = Array.from({ length: tempQuantity }, (_, i) => ({ 
                  ...selectedItem, 
                  ...details,
                  timestamp: Date.now(),
                  cartId: selectedItem.id + "-" + Date.now() + "-" + i 
                }));
                setCart([...cart, ...items]);
                handleBack();
                showToast("Item adicionado!", "success");
              }} 
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Adicionar</span>
              <span className="font-black text-lg tracking-tighter">R$ {(totalProductPrice * tempQuantity).toFixed(2).replace(".", ",")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
