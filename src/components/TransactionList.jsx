import React from "react";
import { formatCurrency } from "../utils/formatCurrency";

export default function TransactionList({ transactions, onDelete }) {
  if (!transactions.length) {
    return (
      <div className="text-center text-slate-500 py-8">Belum ada transaksi</div>
    );
  }

  return (
    <ul className="space-y-2">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
        >
          <div>
            <div className="font-medium">{t.title || t.category}</div>
            <div className="text-sm text-slate-500">
              {new Date(t.date).toLocaleDateString()}
            </div>
            {t.note && (
              <div className="text-xs text-slate-400 mt-1">{t.note}</div>
            )}
          </div>
          <div className="text-right">
            <div
              className={`font-semibold ${
                t.type === "expense" ? "text-red-600" : "text-green-600"
              }`}
            >
              {t.type === "expense" ? "-" : "+"}
              {formatCurrency(t.amount)}
            </div>
            <button
              onClick={() => onDelete(t.id)}
              className="text-xs text-red-500 mt-2 hover:underline"
            >
              Hapus
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
