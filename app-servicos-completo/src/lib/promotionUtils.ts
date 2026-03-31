export interface PromotionLike {
  discount_type?: string | null;
  discount_value?: number | string | null;
  is_free_shipping?: boolean | null;
}

interface CartTotalsInput {
  subtotal: number;
  deliveryFee?: number;
  promotion?: PromotionLike | null;
  coinDiscount?: number;
}

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrencyBRL = (value: number) =>
  `R$ ${toNumber(value).toFixed(2).replace(".", ",")}`;

export const isFreeShippingPromotion = (promotion?: PromotionLike | null) =>
  Boolean(
    promotion &&
      (promotion.is_free_shipping || promotion.discount_type === "free_shipping"),
  );

export const getPromotionDiscountAmount = (
  promotion: PromotionLike | null | undefined,
  subtotal: number,
) => {
  if (!promotion || isFreeShippingPromotion(promotion)) return 0;

  const safeSubtotal = toNumber(subtotal);
  const discountValue = toNumber(promotion.discount_value);

  if (promotion.discount_type === "fixed") {
    return Math.min(discountValue, safeSubtotal);
  }

  return Math.min((safeSubtotal * discountValue) / 100, safeSubtotal);
};

export const getCartTotals = ({
  subtotal,
  deliveryFee = 0,
  promotion,
  coinDiscount = 0,
}: CartTotalsInput) => {
  const safeSubtotal = toNumber(subtotal);
  const originalDeliveryFee = toNumber(deliveryFee);
  const effectiveDeliveryFee = isFreeShippingPromotion(promotion)
    ? 0
    : originalDeliveryFee;
  const couponDiscount = getPromotionDiscountAmount(promotion, safeSubtotal);
  const safeCoinDiscount = Math.max(0, toNumber(coinDiscount));
  const total = Math.max(
    0,
    safeSubtotal + effectiveDeliveryFee - couponDiscount - safeCoinDiscount,
  );

  return {
    subtotal: safeSubtotal,
    originalDeliveryFee,
    effectiveDeliveryFee,
    couponDiscount,
    coinDiscount: safeCoinDiscount,
    total,
    hasFreeShipping:
      isFreeShippingPromotion(promotion) && originalDeliveryFee > effectiveDeliveryFee,
  };
};

export const formatPromotionBenefit = (
  promotion?: PromotionLike | null,
  options?: { includeOffSuffix?: boolean },
) => {
  if (!promotion) return "";
  if (isFreeShippingPromotion(promotion)) return "Frete gratis";

  const includeOffSuffix = options?.includeOffSuffix ?? true;
  const suffix = includeOffSuffix ? " OFF" : "";
  const discountValue = toNumber(promotion.discount_value);

  if (promotion.discount_type === "fixed") {
    return `${formatCurrencyBRL(discountValue)}${suffix}`;
  }

  const displayValue = Number.isInteger(discountValue)
    ? `${discountValue}`
    : discountValue.toFixed(2).replace(".", ",");

  return `${displayValue}%${suffix}`;
};
