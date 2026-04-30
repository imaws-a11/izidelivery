import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

// Importação dos componentes modulares
import { PixPaymentView } from "../Payment/PixPaymentView";
import { CardPaymentView } from "../Payment/CardPaymentView";
import { LightningPaymentView } from "../Payment/LightningPaymentView";
import { PaymentProcessingView } from "../Payment/PaymentProcessingView";
import { PaymentErrorView } from "../Payment/PaymentErrorView";
import { PaymentSuccessView } from "../Payment/PaymentSuccessView";

export const PaymentFlowView = () => {
  const { subView } = useApp();

  return (
    <AnimatePresence mode="wait">
      {subView === "lightning_payment" && (
        <motion.div 
          key="ln" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[200]"
        >
          <LightningPaymentView />
        </motion.div>
      )}

      {subView === "pix_payment" && (
        <motion.div 
          key="pix" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[200]"
        >
          <PixPaymentView />
        </motion.div>
      )}

      {subView === "card_payment" && (
        <motion.div 
          key="card" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[200]"
        >
          <CardPaymentView />
        </motion.div>
      )}

      {subView === "payment_processing" && (
        <motion.div 
          key="proc" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[250]"
        >
          <PaymentProcessingView />
        </motion.div>
      )}

      {subView === "payment_error" && (
        <motion.div 
          key="err" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[250]"
        >
          <PaymentErrorView />
        </motion.div>
      )}

      {(subView === "payment_success" || subView === "mobility_payment_success") && (
        <motion.div 
          key="success" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-[250]"
        >
          <PaymentSuccessView />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
