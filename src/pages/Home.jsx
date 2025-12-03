import React from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import TransactionList from "../components/TransactionList";
import AddTransactionModal from "../components/AddTransactionModal";
import { formatCurrency } from "../utils/formatCurrency";

export default function Home() {
  const [transactions, setTransactions] = useLocalStorage(
    "ft_transactions",
    []
  );

  function handleAdd(tx) {
    setTransactions((prev) => [tx, ...prev]);
  }

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const balance = transactions.reduce(
    (acc, t) => acc + (t.type === "expense" ? -t.amount : t.amount),
    0
  );
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="bg-white p-6 rounded shadow">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Personal Finance Tracker</h1>
        <p className="text-sm text-slate-500">
          v1.0 — MVP (React + localStorage)
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-slate-50 p-4 rounded">
          <div className="text-sm text-slate-500">Balance</div>
          <div className="text-2xl font-semibold mt-1">
            {formatCurrency(balance)}
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded">
          <div className="text-sm text-slate-500">Income</div>
          <div className="text-lg font-semibold text-green-600 mt-1">
            {formatCurrency(income)}
          </div>
          <div className="text-sm text-slate-500 mt-2">Expense</div>
          <div className="text-lg font-semibold text-red-600 mt-1">
            {formatCurrency(expense)}
          </div>
        </div>
      </div>

      <AddTransactionModal onAdd={handleAdd} />

      <TransactionList transactions={transactions} onDelete={handleDelete} />
    </div>
  );
}
