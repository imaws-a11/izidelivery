const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Use RegEx to match regardless of exact spacing or returns
const regex = /const handleApplyCoupon = async \(code: string\) => \{\s*if \(\!code\) return;\s*if \(couponError\) \{\s*setIsLoading\(false\);\s*\}\s*\};/g;

const fixedBlock = `const handleApplyCoupon = async (code: string) => {
    if (!code) return;
    const { data, error } = await supabase
      .from("promotions_delivery")
      .select("*")
      .eq("coupon_code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toastError("Cupom inválido ou expirado.");
      return;
    }

    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const couponErr = await validateCouponRules(data, subtotal);
    if (couponErr) {
      toastError(couponErr);
      return;
    }

    setAppliedCoupon(data);
    setCouponInput(data.coupon_code);
    toastSuccess("Cupom aplicado!");
  };

  const clearCart = async (orderId?: string) => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const couponDiscount = appliedCoupon
      ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100)
      : 0;
    
    const total = Math.max(0, subtotal - couponDiscount);
    const coinRate = globalSettings?.izi_coin_rate || 1;
    const earnedCoins = Math.floor(total * coinRate);
    const finalCoins = isUsingCoins ? earnedCoins : (iziCoins + earnedCoins);
    
    await registerPendingBenefitUsages(orderId);

    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setUserXP((prev: number) => prev + 50);
    setIziCoins(finalCoins);
    
    if (userId) {
      await supabase.from("users_delivery").update({ 
        izi_coins: finalCoins,
        user_xp: (userXP + 50) 
      }).eq("id", userId);
    }
  };`;

if (regex.test(content)) {
  content = content.replace(regex, fixedBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sucesso na substituição por regex!');
} else {
  console.log('Bloco Regex NÃO encontrado');
}
