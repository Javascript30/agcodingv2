export const PRICE_MAP = {
  15: 102.5,
  30: 142.5,
  45: 187.5,
  60: 232.5,
};

export const DISCOUNT_CODES = {
  SMILE15: 0.15,
};

export function getBasePrice(duration) {
  return PRICE_MAP[Number(duration)] || 100;
}

export function getDiscountRate(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  return DISCOUNT_CODES[normalizedCode] || 0;
}

export function applyDiscount(subtotal, code) {
  const discountRate = getDiscountRate(code);

  if (!discountRate) {
    return {
      subtotal,
      discount: 0,
      total: subtotal,
    };
  }

  const discount = subtotal * discountRate;
  return {
    subtotal,
    discount,
    total: subtotal - discount,
  };
}

export function calculateCheckoutTotal(duration, addonPrices = [], code = '') {
  const base = getBasePrice(duration);
  const addonTotal = addonPrices.reduce((sum, price) => sum + Number(price || 0), 0);
  const subtotal = base + addonTotal;
  const { discount, total } = applyDiscount(subtotal, code);

  return {
    base,
    addonTotal,
    subtotal,
    discount,
    total,
  };
}
