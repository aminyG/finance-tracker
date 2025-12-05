import React, { createContext, useEffect, useState } from "react";

export const CurrencyContext = createContext();

const SUPPORTED_CURRENCIES = ["IDR", "USD", "EUR", "JPY", "GBP"];

export function CurrencyProvider({ children }) {
  const [baseCurrency] = useState("IDR");
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem("selectedCurrency") || "IDR";
  });

  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchRates() {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}`
      );
      const data = await res.json();

      const filtered = Object.fromEntries(
        Object.entries(data.rates).filter(([key]) =>
          SUPPORTED_CURRENCIES.includes(key)
        )
      );

      setRates({ [baseCurrency]: 1, ...filtered });
      setLastUpdated(new Date());
      localStorage.setItem("rates", JSON.stringify(filtered));
    } catch (err) {
      console.error("Failed to fetch currency rates", err);
    }
    setLoading(false);
  }

  function loadSavedRates() {
    const stored = localStorage.getItem("rates");
    if (!stored) return false;

    setRates({ [baseCurrency]: 1, ...JSON.parse(stored) });
    return true;
  }

  useEffect(() => {
    const loaded = loadSavedRates();
    if (!loaded) fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  function convert(amount) {
    if (!rates[selectedCurrency]) return amount;
    return amount * rates[selectedCurrency];
  }

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        selectedCurrency,
        setSelectedCurrency,
        SUPPORTED_CURRENCIES,
        rates,
        convert,
        lastUpdated,
        fetchRates,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
