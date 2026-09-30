export function priceAfterPercent(listPrice: number, percent: number) {
  const safePercent = Math.min(100, Math.max(0, percent));
  const cents = Math.round(listPrice * 100);
  return Math.round((cents * (100 - safePercent)) / 100) / 100;
}
