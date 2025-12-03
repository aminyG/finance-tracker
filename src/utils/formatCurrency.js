export function formatCurrency(amount = 0) {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount).toLocaleString("id-ID");
  return `${sign}Rp ${value}`;
}
