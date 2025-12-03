import React, { useState } from "react";

const defaultCategories = [
  "Salary",
  "Food",
  "Transport",
  "Entertainment",
  "Other",
];

export default function AddTransactionModal({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(defaultCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  function reset() {
    setTitle("");
    setAmount("");
    setType("expense");
    setCategory(defaultCategories[0]);
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
  }

  function submit(e) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      alert("Masukkan nominal yang valid");
      return;
    }
    onAdd({
      id: Date.now().toString(),
      title,
      amount: parsed,
      type,
      category,
      date,
      note,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded shadow"
        >
          + Add Transaction
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded shadow w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-3">Add Transaction</h3>

            <label className="block text-sm">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />

            <label className="block text-sm">Amount (numeric)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />

            <div className="flex gap-2 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={type === "expense"}
                  onChange={() => setType("expense")}
                />
                Expense
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={type === "income"}
                  onChange={() => setType("income")}
                />
                Income
              </label>
            </div>

            <label className="block text-sm">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            >
              {defaultCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="block text-sm">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />

            <label className="block text-sm">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
