import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatPromotionBenefit,
  isFreeShippingPromotion,
} from "../../../lib/promotionUtils";

interface ExploreRestaurantsViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  foodCategories?: any[];
  availableCoupons?: any[];
  establishments?: any[];
  onShopClick: (shop: any) => void;
  copiedCoupon?: string | null;
  setCopiedCoupon?: (c: string | null) => void;
  initialCategory?: string;
  isLunchMode?: boolean;
}

const normalizeText = (value?: string | null) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

export const ExploreRestaurantsView = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  foodCategories = [],
  availableCoupons = [],
  establishments = [],
  onShopClick,
  copiedCoupon = null,
  setCopiedCoupon = () => {},
  initialCategory = "Todos",
  isLunchMode = false,
}: ExploreRestaurantsViewProps) => {
  const shouldResetToAll =
    isLunchMode && normalizeText(initialCategory).includes("almoco");
  const resolvedInitialCategory = shouldResetToAll
    ? "Todos"
    : initialCategory || "Todos";

  const [selectedCategory, setSelectedCategory] = useState(
    resolvedInitialCategory,
  );

  useEffect(() => {
    setSelectedCategory(resolvedInitialCategory);
  }, [resolvedInitialCategory]);

  const categories = useMemo(() => {
    const list = (Array.isArray(foodCategories) ? foodCategories : []).map(
      (category) => ({
        ...category,
        name: category.name,
      }),
    );

    if (!list.find((category) => category.name === "Todos")) {
      list.unshift({ id: "all", name: "Todos", icon: "restaurant" } as any);
    }

    return list.filter((category) => category.id !== "daily");
  }, [foodCategories]);

  const filteredRestaurants = useMemo(() => {
    return establishments.filter((shop) => {
      const normalizedBag = [
        shop.restaurantInitialCategory,
        shop.foodCategory,
        shop.type,
        shop.tag,
        shop.description,
        shop.name,
      ]
        .map((value) => normalizeText(String(value || "")))
        .join(" ");

      const matchesSearch = String(shop.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (isLunchMode) {
        const lunchTerms = [
          "almoco",
          "prato",
          "pratos",
          "pf",
          "marmita",
          "quentinha",
          "executivo",
          "monte",
          "monte_o_seu",
        ];

        const isLunchRelated =
          normalizeText(shop.restaurantInitialCategory) === "almoco" ||
          includesAny(normalizedBag, lunchTerms);

        if (!isLunchRelated) {
          return false;
        }

        if (selectedCategory === "Todos") {
          return true;
        }

        const normalizedCategory = normalizeText(selectedCategory);
        if (normalizedCategory === "promocao_do_dia") {
          return includesAny(normalizedBag, [
            "promocao",
            "promo",
            "oferta",
            "desconto",
            "dia",
          ]);
        }
        if (normalizedCategory === "monte_o_seu") {
          return includesAny(normalizedBag, [
            "monte",
            "personalizado",
            "self_service",
            "monte_o_seu",
          ]);
        }
        if (normalizedCategory === "pratos_feitos") {
          return includesAny(normalizedBag, [
            "prato",
            "prato_feito",
            "pf",
            "executivo",
          ]);
        }
        if (normalizedCategory === "marmitas") {
          return includesAny(normalizedBag, ["marmita", "quentinha"]);
        }

        return includesAny(normalizedBag, [normalizedCategory]);
      }

      const normalizedType = normalizeText(shop.type);
      const whitelist = [
        "restaurante",
        "food",
        "hamburguer",
        "pizzaria",
        "acai",
        "japones",
        "lanche",
        "gastronomia",
        "doce",
        "sorvete",
        "confeitaria",
      ];
      const blacklist = [
        "mercado",
        "market",
        "farmacia",
        "pharmacy",
        "saude",
        "gas",
        "agua",
        "servico",
        "van",
        "taxi",
        "frete",
        "entrega",
        "utility",
      ];

      const isFoodRelated =
        whitelist.some((term) => normalizedType.includes(term)) ||
        (!blacklist.some((term) => normalizedType.includes(term)) &&
          normalizedType !== "");

      if (!isFoodRelated) {
        return false;
      }

      if (selectedCategory === "Todos") {
        return true;
      }

      const normalizedCategory = normalizeText(selectedCategory);
      const shopFoodCategory = normalizeText(shop.foodCategory);
      const shopType = normalizeText(shop.type);
      const shopTag = normalizeText(shop.tag);
      const shopDescription = normalizeText(shop.description);
      const shopName = normalizeText(shop.name);

      let matchesCategory =
        shopFoodCategory.includes(normalizedCategory) ||
        shopType.includes(normalizedCategory) ||
        shopTag.includes(normalizedCategory) ||
        shopDescription.includes(normalizedCategory) ||
        shopName.includes(normalizedCategory);

      if (matchesCategory) {
        return true;
      }

      const categoryTerms: Record<string, string[]> = {
        burgers: ["burguer", "hamburguer", "burger", "burgers"],
        pizza: ["pizza", "pizzaria", "pizzas"],
        japones: ["japones", "sushi", "temaki", "oriental"],
        doces_e_bolos: [
          "doce",
          "bolo",
          "confeitaria",
          "sobremesa",
          "doces_e_bolos",
          "doces",
        ],
        salgados: ["salgado", "salgados", "pastel", "coxinha", "salgadinhos"],
        porcoes: ["porcao", "porcoes", "petisco", "fritas"],
        massas: ["massa", "massas", "macarrao", "italiana", "pasta"],
        carnes: ["carne", "carnes", "churrasco", "steak", "grelhados"],
        fit: ["fit", "fitness", "saudavel", "salada", "low_carb"],
        acai: ["acai", "acai_", "acai_e_bowls"],
        sorvetes: ["sorvete", "sorvetes", "gelato", "picole", "acai"],
        padaria: ["padaria", "pao", "panificadora", "cafe", "breakfast"],
        promocoes: ["promocao", "promocoes", "oferta", "desconto", "imperdivel"],
      };

      const terms = categoryTerms[normalizedCategory];
      if (!terms) {
        return false;
      }

      matchesCategory = terms.some(
        (term) =>
          shopFoodCategory.includes(term) ||
          shopTag.includes(term) ||
          shopName.includes(term) ||
          shopType.includes(term) ||
          shopDescription.includes(term) ||
          (normalizedCategory === "promocoes" && Boolean(shop.freeDelivery)),
      );

      return matchesCategory;
    });
  }, [establishments, isLunchMode, searchQuery, selectedCategory]);

  const vipCoupons = availableCoupons.filter((coupon) => coupon.is_vip);

  return (
    <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      <header className="fixed top-4 inset-x-4 z-[110] flex flex-col bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubView("none")}
              className="size-9 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-zinc-100 text-[20px]">
                arrow_back
              </span>
            </button>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none">
                {isLunchMode ? "Almoco Izi" : "Restaurantes"}
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5 opacity-80">
                {isLunchMode ? "O que comer?" : "Sabores"}
              </p>
            </div>
          </div>
          <button
            onClick={() => cart.length > 0 && navigateSubView("cart")}
            className="relative size-9 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-100 text-[20px]">
              shopping_bag
            </span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-sm">
                search
              </span>
            </div>
            <input
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/20 text-xs font-medium transition-all"
              placeholder={isLunchMode ? "Buscar almoco..." : "Buscar..."}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="px-5 flex flex-col gap-8 pt-40">
        <section>
          <div className="relative h-44 rounded-[2rem] overflow-hidden group cursor-pointer border border-zinc-800">
            <img
              className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800"
              alt={isLunchMode ? "Almoco" : "Restaurantes"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent flex flex-col justify-center p-6">
              <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">
                {isLunchMode ? "Almoco do dia" : "Ofertas VIP"}
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                {isLunchMode
                  ? "Pratos rapidos e\nmarmitas por perto"
                  : "Os melhores sabores\nna sua porta"}
              </h2>
            </div>
          </div>
        </section>

        <section>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
            {categories.map((category, index) => {
              const isActive = selectedCategory === category.name;

              return (
                <motion.button
                  key={category.id || index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all active:scale-95 group ${
                    isActive
                      ? "bg-yellow-400 border-yellow-400 text-black"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-yellow-400/40 hover:text-yellow-400"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isActive ? "text-black" : "group-hover:text-yellow-400"
                    }`}
                  >
                    {category.icon}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                    {category.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {vipCoupons.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                Cupons VIP
              </h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">
                Exclusivo
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {vipCoupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id || index}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex-shrink-0 w-72 h-36 rounded-2xl relative overflow-hidden group border border-zinc-800 cursor-pointer active:scale-95 transition-all"
                >
                  <img
                    src={
                      coupon.image_url ||
                      "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800"
                    }
                    className="absolute inset-0 size-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent p-5 flex flex-col justify-between">
                    <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">
                      {coupon.title || "Oferta Especial"}
                    </span>
                    <div>
                      <p className="text-3xl font-black text-white leading-none">
                        {formatPromotionBenefit(coupon, {
                          includeOffSuffix: false,
                        })}
                        {!isFreeShippingPromotion(coupon) && (
                          <span className="text-base text-zinc-400 ml-1">
                            OFF
                          </span>
                        )}
                      </p>
                      {coupon.coupon_code && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.coupon_code);
                            setCopiedCoupon(coupon.coupon_code);
                            setTimeout(() => setCopiedCoupon(null), 2000);
                          }}
                          className="mt-2 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full active:scale-95 transition-all"
                        >
                          <span className="text-yellow-400 text-[10px] font-black tracking-widest">
                            {coupon.coupon_code}
                          </span>
                          <span className="material-symbols-outlined text-yellow-400 text-xs">
                            {copiedCoupon === coupon.coupon_code
                              ? "check_circle"
                              : "content_copy"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white uppercase">
                {selectedCategory === "Todos"
                  ? isLunchMode
                    ? "Almocos por perto"
                    : "Mais Proximos"
                  : `${selectedCategory} Proximos`}
              </h3>
              <div className="w-8 h-1 bg-yellow-400 rounded-full mt-1" />
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              Resultados: {filteredRestaurants.length}
            </button>
          </div>

          <div className="flex flex-col gap-4 pb-10">
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.map((shop, index) => (
                <motion.div
                  key={shop.id || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onShopClick({ ...shop, type: "restaurant" })}
                  className="group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-3">
                    <img
                      src={shop.img}
                      alt={shop.name}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                      <span
                        className="material-symbols-outlined text-[14px] text-yellow-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-xs font-black text-white">
                        {shop.rating || "5.0"}
                      </span>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-black/10">
                          <span className="material-symbols-outlined text-[12px]">
                            local_shipping
                          </span>
                          FRETE GRATIS
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">
                        {shop.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">
                            local_shipping
                          </span>
                          {shop.freeDelivery
                            ? "Gratis"
                            : `R$ ${Number(shop.service_fee || 5.9)
                                .toFixed(2)
                                .replace(".", ",")}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">
                            schedule
                          </span>
                          {shop.time}
                        </span>
                      </div>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                      <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredRestaurants.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-700">
                  search_off
                </span>
                <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">
                  {isLunchMode
                    ? "Nenhum almoco encontrado"
                    : "Nenhum restaurante encontrado"}
                </p>
                <p className="text-zinc-500 text-[10px]">
                  Tente mudar a categoria ou sua busca.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
