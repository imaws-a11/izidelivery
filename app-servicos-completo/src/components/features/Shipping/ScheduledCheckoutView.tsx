import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useApp } from "../../../hooks/useApp";

interface ScheduledCheckoutViewProps {
  onBack: () => void;
  transitData: any;
  setTransitData: (data: any) => void;
  userId: string | null;
  showToast?: (msg: string, type: "success" | "error" | "warning") => void;
}

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: "pix" },
  { id: "credit", label: "Crédito", icon: "credit_card" },
  { id: "debit", label: "Débito", icon: "payment" },
  { id: "cash", label: "Dinheiro", icon: "payments" },
  { id: "wallet", label: "Izi Pay", icon: "account_balance_wallet" },
];

const ITEM_TYPES = [
  { id: "document", label: "Documento", icon: "description" },
  { id: "gift", label: "Presente", icon: "card_giftcard" },
  { id: "clothes", label: "Roupas", icon: "checkroom" },
  { id: "electronics", label: "Eletrônicos", icon: "devices" },
  { id: "food", label: "Alimentos", icon: "lunch_dining" },
  { id: "medicine", label: "Remédios", icon: "medication" },
  { id: "parts", label: "Peças", icon: "build" },
  { id: "other", label: "Outros", icon: "inventory_2" },
];

type Step = "details" | "payment" | "confirm";

export const ScheduledCheckoutView: React.FC<ScheduledCheckoutViewProps> = ({
  onBack,
  transitData,
  setTransitData,
  userId,
  showToast,
}) => {
  const { setSubView } = useApp();
  const [step, setStep] = useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper para evitar erro "Objects are not valid as a React child"
  const renderText = (text: any) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    if (typeof text === 'object') {
      return text.address || text.formatted_address || "Endereço selecionado";
    }
    return String(text);
  };

  // Form state
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [blockFloor, setBlockFloor] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [itemType, setItemType] = useState("other");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isDetailsValid = schedDate && schedTime && description.trim().length > 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `receipts/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("banners").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("banners").getPublicUrl(path);
        setReceiptPhoto(data.publicUrl);
      }
    } catch {
      showToast?.("Erro ao enviar imagem", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isDetailsValid) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        user_id: userId,
        type: "shipping",
        subtype: "agendado",
        status: "pending",
        origin: transitData.origin || "A definir",
        destination: transitData.destination || "A definir",
        building_name: buildingName,
        block_floor: blockFloor,
        confirmation_number: confirmationNumber,
        scheduled_at: `${schedDate}T${schedTime}:00`,
        item_type: itemType,
        item_description: description,
        quantity,
        weight: weight || null,
        dimensions: dimensions || null,
        notes: notes || null,
        payment_method: paymentMethod,
        receipt_photo: receiptPhoto,
        price: transitData.price || 0,
        priority: transitData.priority || "scheduled",
      };

      const { error } = await supabase.from("orders_delivery").insert([orderData]);
      if (error) throw error;

      showToast?.("Agendamento confirmado!", "success");
      setSubView("home");
    } catch {
      showToast?.("Erro ao confirmar. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetailsStep = () => (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-8"
    >
      {/* Informações da Retirada (Cloning Uber Screenshot) */}
      <section className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-rounded text-black text-2xl mt-1">location_on</span>
          <div className="flex-1">
             <p className="text-base font-bold text-zinc-900 leading-tight">{renderText(transitData.origin) || "Ponto de coleta"}</p>
             <p className="text-xs text-zinc-400 font-medium mt-1">Endereço da retirada</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-800 ml-1">Nome do prédio ou loja *</label>
              <input
                type="text"
                placeholder="Por exemplo: Loja Doces Enc..."
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="w-full bg-[#F3F3F3] border-none rounded-xl px-4 py-4 text-sm text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-black outline-none transition-all"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-800 ml-1">Bloco/andar</label>
              <input
                type="text"
                placeholder="Por exemplo:..."
                value={blockFloor}
                onChange={(e) => setBlockFloor(e.target.value)}
                className="w-full bg-[#F3F3F3] border-none rounded-xl px-4 py-4 text-sm text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-black outline-none transition-all"
              />
           </div>
        </div>
      </section>

      <div className="h-[1px] bg-zinc-100" />

      {/* Comprovante de Compra */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Comprovante de compra *</h3>
          <p className="text-sm text-zinc-500 font-medium">Adicione o número de confirmação e/ou o recibo do pedido</p>
        </div>

        <div className="space-y-2">
           <label className="text-[15px] font-bold text-zinc-800 ml-1">Número de confirmação do pedido</label>
           <input
             type="text"
             placeholder="P. ex.: AB123"
             value={confirmationNumber}
             onChange={(e) => setConfirmationNumber(e.target.value)}
             className="w-full bg-[#F3F3F3] border-none rounded-xl px-5 py-4 text-base text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-black outline-none transition-all"
           />
           <p className="text-xs text-zinc-400 font-medium px-1">Isso ajuda os motoristas parceiros a verificarem sua compra nas lojas.</p>
        </div>

        <div className="space-y-4">
          <label className="text-[15px] font-bold text-zinc-800 ml-1">Recibo</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 h-12 bg-[#F3F3F3] px-6 rounded-full cursor-pointer hover:bg-zinc-200 transition-colors">
              <span className="material-symbols-rounded text-zinc-900 text-[20px]">upload</span>
              <span className="text-sm font-bold text-zinc-900">Enviar</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <label className="flex items-center gap-2 h-12 bg-[#F3F3F3] px-6 rounded-full cursor-pointer hover:bg-zinc-200 transition-colors">
              <span className="material-symbols-rounded text-zinc-900 text-[20px]">photo_camera</span>
              <span className="text-sm font-bold text-zinc-900">Tirar foto</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          {receiptPhoto && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-100 h-32">
              <img src={receiptPhoto} className="w-full h-full object-cover" alt="Recibo" />
              <button onClick={() => setReceiptPhoto(null)} className="absolute top-2 right-2 size-8 bg-black/70 rounded-full flex items-center justify-center text-white"><span className="material-symbols-rounded text-sm">close</span></button>
            </div>
          )}
          <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
            Adicione um recibo para ajudar os motoristas parceiros a concluir a entrega.
            <br/><br/>
            Ao enviar esta foto, eu confirmo que ela não apresenta conteúdo inapropriado que viole o <span className="underline">Código da Comunidade</span> nem dados pessoais sigilosos.
          </p>
        </div>
      </section>

      <div className="h-[1px] bg-zinc-100" />

      {/* Date & Time */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-rounded text-black">calendar_month</span>
          Agendamento
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data *</label>
            <input
              type="date"
              min={today}
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-4 py-4 font-bold text-sm text-zinc-800 focus:border-black focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Horário *</label>
            <input
              type="time"
              value={schedTime}
              onChange={(e) => setSchedTime(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-4 py-4 font-bold text-sm text-zinc-800 focus:border-black focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Item Type */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-rounded text-black">inventory_2</span>
          Detalhes do Item
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {ITEM_TYPES.map((t) => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setItemType(t.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                itemType === t.id ? "border-black bg-black text-white" : "border-zinc-100 bg-zinc-50 text-zinc-500"
              }`}
            >
              <span className="material-symbols-rounded text-2xl">{t.icon}</span>
              <span className="text-[9px] font-black uppercase leading-tight text-center">{t.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">O que será enviado? *</label>
        <input
          type="text"
          placeholder="Ex: Caixa com roupas, envelope A4..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 font-medium text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-black focus:bg-white outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Qtde</label>
          <div className="flex items-center bg-zinc-50 border-2 border-zinc-100 rounded-2xl overflow-hidden">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-4 font-black text-lg text-zinc-500 hover:bg-zinc-100 transition-colors">−</button>
            <span className="flex-1 text-center font-black text-zinc-800">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-4 font-black text-lg text-zinc-500 hover:bg-zinc-100 transition-colors">+</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Peso (kg)</label>
          <input
            type="number"
            placeholder="Ex: 2.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-4 py-4 font-medium text-sm text-zinc-800 focus:border-black focus:bg-white outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Medidas (cm)</label>
          <input
            type="text"
            placeholder="CxLxA"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-4 py-4 font-medium text-sm text-zinc-800 focus:border-black focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações Adicionais</label>
        <textarea
          placeholder="Instruções para o entregador, referências do endereço..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 font-medium text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-black focus:bg-white outline-none transition-all resize-none"
        />
      </div>
    </motion.div>
  );

  const renderPaymentStep = () => (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        {PAYMENT_METHODS.map((m) => (
          <motion.button
            key={m.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPaymentMethod(m.id)}
            className={`w-full flex items-center gap-5 p-5 rounded-3xl border-2 transition-all text-left ${
              paymentMethod === m.id ? "border-black bg-black text-white" : "border-zinc-100 bg-white text-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className={`size-12 rounded-2xl flex items-center justify-center ${paymentMethod === m.id ? "bg-white/10" : "bg-zinc-50"}`}>
              <span className="material-symbols-rounded text-xl">{m.icon}</span>
            </div>
            <span className="font-black text-base">{m.label}</span>
            {paymentMethod === m.id && (
              <span className="material-symbols-rounded text-xl ml-auto">check_circle</span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <div className="bg-zinc-900 text-white rounded-[40px] p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-[20px] bg-blue-500 flex items-center justify-center">
            <span className="material-symbols-rounded text-white text-3xl">calendar_month</span>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter">Izi Agendado</h3>
            <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
              {schedDate ? new Date(schedDate + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : ""} às {schedTime}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-6">
          {[
            { label: "Origem", value: renderText(transitData.origin) || "A definir" },
            { label: "Destino", value: renderText(transitData.destination) || "A definir" },
            { label: "Item", value: description },
            { label: "Quantidade", value: `${quantity} unidade(s)` },
            { label: "Pagamento", value: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || "" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">{row.label}</span>
              <span className="text-xs font-bold text-zinc-200 text-right truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip info card (similar to Uber's) */}
      <div className="bg-white border border-zinc-100 rounded-[32px] p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="size-3 rounded-full border-2 border-zinc-400" />
            <div className="flex-1 w-[2px] bg-zinc-200 min-h-[36px]" />
            <div className="size-3 rounded-sm bg-black" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-black text-zinc-800">{renderText(transitData.origin) || "Ponto de coleta"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-zinc-800">{renderText(transitData.destination) || "Destino"}</p>
              <button onClick={() => setStep("details")} className="size-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <span className="material-symbols-rounded text-zinc-500 text-sm">edit</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-zinc-400">person</span>
            <div>
              <p className="text-sm font-black text-zinc-800">R$ {(transitData.price || 0).toFixed(2).replace(".", ",")}</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">via {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
            </div>
          </div>
          <button onClick={() => setStep("payment")} className="px-4 h-9 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-black text-zinc-600 uppercase tracking-wider">
            Trocar
          </button>
        </div>
      </div>

      {notes && (
        <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Observações</p>
          <p className="text-sm font-medium text-zinc-700">{notes}</p>
        </div>
      )}
    </motion.div>
  );

  const stepTitle: Record<Step, string> = {
    details: "Informações da Entrega",
    payment: "Forma de Pagamento",
    confirm: "Confirmar Agendamento",
  };

  const stepIndicators: Step[] = ["details", "payment", "confirm"];

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 bg-white border-b border-zinc-100 flex-shrink-0">
        <div className="flex items-center gap-4 mb-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={step === "details" ? onBack : () => setStep(step === "payment" ? "details" : "payment")}
            className="size-11 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center"
          >
            <span className="material-symbols-rounded text-zinc-900 font-bold">arrow_back</span>
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-zinc-900 leading-tight">{stepTitle[step]}</h1>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">* Campos obrigatórios</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2">
          {stepIndicators.map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                stepIndicators.indexOf(step) >= idx ? "bg-black" : "bg-zinc-100"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-8">
        <AnimatePresence mode="wait">
          {step === "details" && renderDetailsStep()}
          {step === "payment" && renderPaymentStep()}
          {step === "confirm" && renderConfirmStep()}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-10 pt-4 bg-white border-t border-zinc-50 flex-shrink-0 space-y-3">
        {step === "confirm" && (
          <button
            onClick={() => setStep("payment")}
            className="w-full h-14 rounded-[22px] border-2 border-zinc-100 bg-zinc-50 font-black text-zinc-600 text-sm uppercase tracking-widest"
          >
            Cancelar Agendamento
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (step === "details") {
              if (!isDetailsValid) {
                showToast?.("Preencha data, horário e descrição do item", "warning");
                return;
              }
              setStep("payment");
            } else if (step === "payment") {
              setStep("confirm");
            } else {
              handleConfirm();
            }
          }}
          disabled={isSubmitting}
          className="w-full h-[60px] rounded-[22px] bg-zinc-900 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-zinc-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {step === "confirm" ? (
                <>
                  <span className="material-symbols-rounded font-black">check_circle</span>
                  Confirmar Agendamento
                </>
              ) : (
                "Salvar e Continuar"
              )}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
