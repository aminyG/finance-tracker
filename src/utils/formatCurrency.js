const currencyLocaleMap = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  JPY: "ja-JP",
  GBP: "en-GB",
};

export function formatCurrency(amount = 0, currency = "IDR") {
  const locale = currencyLocaleMap[currency] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}
