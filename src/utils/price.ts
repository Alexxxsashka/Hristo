export const getDiscountedPrice = (price: number | string, discount?: number): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  if (!discount || discount <= 0) return numPrice;
  return numPrice * (1 - discount / 100);
};

export const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '€0.00';
  return `€${numPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
