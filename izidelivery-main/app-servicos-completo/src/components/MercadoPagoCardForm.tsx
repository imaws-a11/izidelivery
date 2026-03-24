import React, { useState } from 'react';
import { toastError } from '../lib/useToast';

declare const MercadoPago: any;
const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string || "APP_USR-7bc418a1-54bc-4e61-8f55-7ca54394019a";

interface MercadoPagoCardFormProps {
  onConfirm: (token: string, issuer: string, installments: number, brand: string, last4: string) => void;
  total?: number;
  userId?: string | null;
}

export const MercadoPagoCardForm = ({ onConfirm }: MercadoPagoCardFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    cardholderName: '',
    identificationType: 'CPF',
    identificationNumber: '',
    installments: '1',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const mp = new MercadoPago(mpPublicKey);
      const cardToken = await mp.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardExpirationMonth: formData.cardExpirationMonth,
        cardExpirationYear: formData.cardExpirationYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber.replace(/\D/g, ''),
      });

      if (cardToken && cardToken.id) {
        const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
        const firstDigit = formData.cardNumber.charAt(0);
        let brand = "Cartão";
        if (firstDigit === '4') brand = "Visa";
        else if (firstDigit === '5') brand = "Mastercard";
        else if (firstDigit === '3') brand = "Amex";

        onConfirm(cardToken.id, "1", Number(formData.installments), brand, last4);
      } else {
        toastError("Dados do cartão inválidos. Verifique e tente novamente.");
      }
    } catch (err: any) {
      console.error("MP Token Error:", err);
      toastError("Sinal instável com a operadora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Número do Cartão</label>
        <input 
          name="cardNumber" value={formData.cardNumber} onChange={handleInputChange}
          placeholder="0000 0000 0000 0000" 
          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 outline-none focus:border-yellow-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Validade (MM/AA)</label>
          <div className="flex gap-2">
            <input name="cardExpirationMonth" maxLength={2} value={formData.cardExpirationMonth} onChange={handleInputChange} placeholder="MM" className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-4 text-center dark:text-white" />
            <input name="cardExpirationYear" maxLength={2} value={formData.cardExpirationYear} onChange={handleInputChange} placeholder="AA" className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-4 text-center dark:text-white" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">CVC</label>
          <input name="securityCode" maxLength={4} value={formData.securityCode} onChange={handleInputChange} placeholder="000" className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 text-center dark:text-white" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Nome no Cartão</label>
        <input name="cardholderName" value={formData.cardholderName} onChange={handleInputChange} placeholder="COMO ESTÁ NO CARTÃO" className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 dark:text-white uppercase" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">CPF do Titular</label>
        <input name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} placeholder="000.000.000-00" className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-5 dark:text-white" />
      </div>
      <button 
        type="submit" disabled={loading}
        className="w-full py-5 rounded-[24px] bg-yellow-400 text-black font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
      >
        {loading ? "Processando..." : `Verificar Cartão`}
      </button>
    </form>
  );
};
