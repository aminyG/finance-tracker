import React, { useState, useContext } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import TransactionList from "../components/TransactionList";
import AddTransactionModal from "../components/AddTransactionModal";
import { CurrencyContext } from "../context/CurrencyContext";
import { formatCurrency } from "../utils/formatCurrency";

export default function Home() {
  const {
    convert,
    selectedCurrency,
    setSelectedCurrency,
    SUPPORTED_CURRENCIES,
    loading,
  } = useContext(CurrencyContext);

  const [transactions, setTransactions] = useLocalStorage(
    "ft_transactions",
    []
  );

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const [filter, setFilter] = useState("all");

  const filteredTransactions = sortedTransactions.filter(
    (t) => filter === "all" || t.type === filter
  );

  function handleAdd(tx) {
    setTransactions((prev) => [tx, ...prev]);
  }

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const balance = transactions.reduce((acc, t) => {
    return (
      acc + (t.type === "expense" ? -convert(t.amount) : convert(t.amount))
    );
  }, 0);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + convert(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + convert(t.amount), 0);

  return (
    <div className="bg-white p-6 rounded shadow">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Personal Finance Tracker</h1>
          <p className="text-sm text-slate-500">v1.2 — Currency Support</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="border p-2 rounded"
          >
            {SUPPORTED_CURRENCIES.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-slate-50 p-4 rounded">
          <div className="text-sm text-slate-500">Balance</div>
          <div className="text-2xl font-semibold mt-1">
            {loading
              ? "Updating..."
              : formatCurrency(balance, selectedCurrency)}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded">
          <div className="text-sm text-slate-500">Income</div>
          <div className="text-lg font-semibold text-green-600 mt-1">
            {formatCurrency(income, selectedCurrency)}
          </div>

          <div className="text-sm text-slate-500 mt-2">Expense</div>
          <div className="text-lg font-semibold text-red-600 mt-1">
            {formatCurrency(expense, selectedCurrency)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "income", "expense"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded border ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <AddTransactionModal onAdd={handleAdd} />

      <TransactionList
        transactions={filteredTransactions}
        onDelete={handleDelete}
      />
    </div>
  );
}
