const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const functionsToInject = `  const calculateDeliveryFee = () => {
    const shop = selectedShop || (cart.length > 0 ? { id: cart[0].merchant_id, service_fee: cart[0].service_fee } : null);
    if (!shop) return Number(globalSettings?.base_fee || 5.90);

    const isIziBlack = Boolean(user?.izi_black_active);
    const minOrderIziBlack = Number(globalSettings?.izi_black_min_order || 0);
    const subtotal = cart.reduce((a, b) => a + (b.price || 0), 0);

    if (isIziBlack) {
      if (subtotal >= minOrderIziBlack && minOrderIziBlack > 0) return 0;
    }
    
    if (shop.service_fee !== undefined && shop.service_fee !== null) {
      return Number(shop.service_fee);
    }
    
    return Number(globalSettings?.base_fee || 5.90);
  };

  const handlePlaceOrder = async (useCoins = false) => {
    if (!paymentMethod) { alert("Selecione uma forma de pagamento."); return; }
    if (!userId) { alert("Faça login para continuar."); return; }
    if (cart.length === 0) { alert("Seu carrinho está vazio."); return; }
    
    setIsUsingCoins(useCoins);

    const subtotal = cart.reduce((a, b) => a + (b.price || 0), 0);
    const couponDiscount = appliedCoupon
      ? appliedCoupon.discount_type === "fixed"
        ? appliedCoupon.discount_value
        : (subtotal * appliedCoupon.discount_value) / 100
      : 0;
    
    const coinValue = globalSettings?.izi_coin_value || 0.01;
    const coinDiscount = useCoins ? (user?.izi_coins || 0) * coinValue : 0;
    const deliveryFee = calculateDeliveryFee();
    const total = Math.max(0, subtotal + deliveryFee - couponDiscount - coinDiscount);

    const shopId = selectedShop?.id || cart[0]?.merchant_id || null;
    const shopName = selectedShop?.name || "Estabelecimento";

    const orderBase = {
      user_id: userId,
      merchant_id: shopId,
      status: "novo",
      total_price: Number(total.toFixed(2)),
      delivery_fee: deliveryFee,
      items: cart,
      pickup_address: shopName,
      delivery_address: \`\${userLocation?.address || "Endereço não informado"}\`,
      payment_method: paymentMethod,
      service_type: selectedShop?.type || "restaurant",
      notes: paymentMethod === "dinheiro" && (window as any).changeFor ? \`TROCO PARA: R$ \${(window as any).changeFor}\` : "",
    };

    console.log("[DIAG] handlePlaceOrder acionado:", { paymentMethod, total, shopId });

    try {
      setIsLoading(true);

      if (paymentMethod === "pix") {
        setPixConfirmed(false);
        setPixCpf("");
        setSelectedItem({ id: "temp", total_price: total, merchant_id: shopId, merchant_name: shopName });
        navigateSubView("pix_payment");
        return;
      }

      if (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") {
        if (!shopId) { alert("Erro: Loja não identificada."); return; }
        const payload = { ...orderBase, status: "waiting_merchant" };
        const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(payload).select().single();
        if (insertError || !order) {
          alert("Erro ao criar pedido. Tente novamente.");
          return;
        }
        setSelectedItem(order);
        if (cart.length > 0) await clearCart(order.id);
        navigateSubView("waiting_merchant");
        return;
      }

      if (paymentMethod === "saldo") {
        const { data: order } = await supabase.from("orders_delivery").insert({ ...orderBase, status: "waiting_merchant", payment_status: "paid" }).select().single();
        if (order) {
          await supabase.from("wallet_transactions").insert({ user_id: userId, type: "pagamento", amount: total });
          setSelectedItem(order);
          if (cart.length > 0) await clearCart(order.id);
          navigateSubView("waiting_merchant");
        }
        return;
      }

      if (paymentMethod === "cartao") {
        setSubView("card_payment");
        return;
      }

    } catch (e) {
      console.error(e);
      navigateSubView("payment_error");
    } finally {
      setIsLoading(false);
    }
  };

`;

const anchor = 'const navigateSubView =';
const injectPos = content.indexOf(anchor);

if (injectPos !== -1) {
    const newContent = content.substring(0, injectPos) + functionsToInject + content.substring(injectPos);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Funções de checkout injetadas com sucesso.');
} else {
    console.log('Âncora navigateSubView não encontrada.');
}
