import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toastError } from '../lib/useToast';
import { BespokeIcons } from '../lib/BespokeIcons';

declare const MercadoPago: any;
const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string || "APP_USR-7bc418a1-54bc-4e61-8f55-7ca54394019a";

interface MercadoPagoCardFormProps {
  onConfirm: (token: string, issuer: string, installments: number, brand: string, last4: string) => void;
  total?: number;
  userId?: string | null;
}

export const MercadoPagoCardForm = ({ onConfirm }: MercadoPagoCardFormProps) => {
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    cardholderName: '',
    identificationType: 'CPF',
    identificationNumber: '',
  });

  // Função para formatar o número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'securityCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'identificationNumber') {
      formattedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // Determine card brand for UI
  const getCardBrand = () => {
    const firstDigit = formData.cardNumber.charAt(0);
    if (firstDigit === '4') return "Visa";
    if (firstDigit === '5') return "Mastercard";
    if (firstDigit === '3') return "Amex";
    return "Cartão";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (typeof MercadoPago === 'undefined') {
        toastError("SDK do Mercado Pago não carregado. Recarregue a página.");
        setLoading(false);
        return;
      }

      if (!mpPublicKey || mpPublicKey.includes("INSIRA_SUA_CHAVE")) {
        toastError("Chave Pública do Mercado Pago não configurada.");
        setLoading(false);
        return;
      }

      // Validação básica manual antes de enviar
      if (formData.cardNumber.replace(/\s/g, '').length < 15) {
        toastError("Número do cartão incompleto.");
        setLoading(false);
        return;
      }

      if (!formData.cardholderName || formData.cardholderName.length < 5) {
        toastError("Nome do titular inválido.");
        setLoading(false);
        return;
      }

      const mp = new MercadoPago(mpPublicKey.trim());
      
      console.log("[MP] Criando token de cartão...");
      const cardToken = await mp.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardExpirationMonth: formData.cardExpirationMonth.padStart(2, '0'),
        cardExpirationYear: formData.cardExpirationYear.length === 2 ? `20${formData.cardExpirationYear}` : formData.cardExpirationYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
      });

      console.log("[MP] Resposta da Tokenização:", cardToken);

      if (cardToken && cardToken.id) {
        const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
        onConfirm(cardToken.id, "1", 1, getCardBrand(), last4);
      } else {
        const firstError = cardToken?.cause?.[0]?.description || "Verifique os dados do cartão.";
        toastError(`Erro MP: ${firstError}`);
      }
    } catch (err: any) {
      console.error("MP Token Error Full Object:", err);
      // Extrair mensagem de erro amigável se houver 'cause'
      const cause = err?.cause?.[0]?.description || err?.message || "Erro desconhecido";
      toastError(`Falha na validação: ${cause}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Animated Credit Card UI */}
      <motion.div 
        className="w-full relative h-[200px] rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between"
        style={{
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', // premium dark zinc
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
        }}
        animate={{ rotateY: focusedField === 'securityCode' ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
      >
        {/* Background decorations */}
        <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-yellow-400/20 blur-[60px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[150px] h-[150px] bg-yellow-400/10 blur-[50px] rounded-full mix-blend-screen pointer-events-none" />
        
        {/* Front of card */}
        <div 
          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-8 bg-zinc-300/30 rounded-md backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-2 left-0 w-full h-[1px] bg-zinc-400/40" />
                <div className="absolute top-4 left-0 w-full h-[1px] bg-zinc-400/40" />
                <div className="absolute top-6 left-0 w-full h-[1px] bg-zinc-400/40" />
            </div>
            <div className="text-yellow-400 font-extrabold italic text-xl tracking-tighter">
              {getCardBrand()}
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="text-white font-mono text-xl tracking-[0.2em] font-medium min-h-[28px] opacity-90 drop-shadow-md">
              {formData.cardNumber || "•••• •••• •••• ••••"}
            </div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest mb-1">Titular</span>
                <span className="text-white font-medium text-sm tracking-widest uppercase truncate max-w-[180px] min-h-[20px] drop-shadow-md">
                  {formData.cardholderName || "NOME DO TITULAR"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest mb-1">Valida</span>
                <span className="text-white font-mono text-sm tracking-widest min-h-[20px] drop-shadow-md">
                  {formData.cardExpirationMonth ? formData.cardExpirationMonth.padStart(2, '0') : "MM"}/{formData.cardExpirationYear ? formData.cardExpirationYear : "AA"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-zinc-800 flex flex-col pt-8"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-10 bg-black/80" />
          <div className="flex flex-col p-6 w-full items-end mt-2">
            <span className="text-[10px] text-zinc-400 font-bold mb-1 mr-2">CVC</span>
            <div className="w-full bg-white h-10 rounded-lg flex items-center justify-end px-4">
              <span className="text-black font-mono tracking-widest font-bold">
                {formData.securityCode || "•••"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Número do Cartão</label>
          <div className="relative">
            <input 
              name="cardNumber" 
              value={formData.cardNumber} 
              onChange={handleInputChange}
              onFocus={() => setFocusedField('cardNumber')}
              onBlur={() => setFocusedField(null)}
              placeholder="0000 0000 0000 0000" 
              maxLength={19}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-yellow-400 transition-colors font-mono"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              {BespokeIcons.CreditCard({ size: 20 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Validade</label>
            <div className="flex gap-2">
              <input 
                name="cardExpirationMonth" 
                maxLength={2} 
                value={formData.cardExpirationMonth} 
                onChange={handleInputChange} 
                onFocus={() => setFocusedField('cardExpirationMonth')}
                onBlur={() => setFocusedField(null)}
                placeholder="MM" 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-4 text-center text-zinc-900 dark:text-white font-mono focus:border-yellow-400 outline-none transition-colors" 
              />
              <input 
                name="cardExpirationYear" 
                maxLength={2} 
                value={formData.cardExpirationYear} 
                onChange={handleInputChange} 
                onFocus={() => setFocusedField('cardExpirationYear')}
                onBlur={() => setFocusedField(null)}
                placeholder="AA" 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-4 text-center text-zinc-900 dark:text-white font-mono focus:border-yellow-400 outline-none transition-colors" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">CVC</label>
            <input 
              name="securityCode" 
              maxLength={4} 
              type="password"
              value={formData.securityCode} 
              onChange={handleInputChange} 
              onFocus={() => setFocusedField('securityCode')}
              onBlur={() => setFocusedField(null)}
              placeholder="•••" 
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 text-center text-zinc-900 dark:text-white font-mono focus:border-yellow-400 outline-none transition-colors" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Nome no Cartão</label>
          <input 
            name="cardholderName" 
            value={formData.cardholderName} 
            onChange={handleInputChange} 
            onFocus={() => setFocusedField('cardholderName')}
            onBlur={() => setFocusedField(null)}
            placeholder="COMO ESTÁ IMPRESSO" 
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white uppercase focus:border-yellow-400 outline-none transition-colors" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">CPF do Titular</label>
          <input 
            name="identificationNumber" 
            value={formData.identificationNumber} 
            onChange={handleInputChange} 
            onFocus={() => setFocusedField('identificationNumber')}
            onBlur={() => setFocusedField(null)}
            placeholder="Apenas números" 
            maxLength={11}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white font-mono focus:border-yellow-400 outline-none transition-colors" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || formData.cardNumber.length < 15 || !formData.securityCode}
          className="w-full py-5 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all mt-6 disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
            />
          ) : (
            <>
              {BespokeIcons.Check({ size: 20 })}
              <span>Validar Cartão Seguro</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest mt-4">
          Transação assegurada pelo Mercado Pago
        </p>
      </form>
    </div>
  );
};
