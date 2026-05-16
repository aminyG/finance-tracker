// src/routes/transactions/new.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addTransaction } from '../../lib/transactions'
import type { TransactionType } from '../../lib/transactions'
import { getAccounts } from '../../lib/accounts'
import type { Account } from '../../lib/accounts'
import { getCategories, seedDefaultCategories } from '../../lib/categories'
import type { Category } from '../../lib/categories'
import { scanReceipt } from '../../lib/gemini'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/transactions/new')({
  component: () => (
    <ProtectedRoute>
      <AddTransactionPage />
    </ProtectedRoute>
  ),
})

function AddTransactionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [type, setType] = useState<TransactionType>('expense')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        await seedDefaultCategories(user!.uid)
        const [accs, cats] = await Promise.all([
          getAccounts(user!.uid),
          getCategories(user!.uid),
        ])
        setAccounts(accs)
        setCategories(cats)
        if (accs.length > 0) setAccountId(accs[0].id)
        if (cats.length > 0) setCategoryId(cats[0].id)
      } catch {
        setError('Failed to load data. Please refresh.')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [user])

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show image preview
    setPreviewUrl(URL.createObjectURL(file))
    setScanning(true)
    setScanSuccess(false)
    setError('')

    try {
      // Send available category names to AI
      const categoryNames = categories.map((c) => c.name)

      const result = await scanReceipt(file, categoryNames)

      // Auto-fill fields
      if (result.amount !== null) setAmount(String(result.amount))
      if (result.date !== null) setDate(result.date)
      if (result.note !== null) setNote(result.note)

      // Match category name -> category ID
      if (result.category !== null) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === result.category!.toLowerCase(),
        )

        if (matched) setCategoryId(matched.id)
      }

      setScanSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Scan failed. Try a clearer photo.')
    } finally {
      setScanning(false)

      // Reset file input so same file can be re-scanned
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (!accountId) {
      setError('Please select an account.')
      return
    }
    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await addTransaction(
        user.uid,
        accountId,
        categoryId,
        type,
        parsedAmount,
        note.trim(),
        date,
      )
      navigate({ to: '/transactions' })
    } catch {
      setError('Failed to save transaction. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <p className="text-4xl mb-3">🏦</p>
        <p className="text-gray-600 font-medium">No accounts yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Add an account first before logging a transaction.
        </p>
        <button
          onClick={() => navigate({ to: '/accounts/new' })}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          Add Account
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/transactions' })}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Add Transaction</h1>
        </div>

        {/* Receipt Scan Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Scan Receipt{' '}
            <span className="text-gray-400 font-normal">
              (optional — auto-fills the form)
            </span>
          </p>

          {/* Preview */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
          )}

          {/* Scan status */}
          {scanning && (
            <div className="flex items-center gap-2 text-blue-500 text-sm mb-3">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Scanning receipt with AI...
            </div>
          )}

          {scanSuccess && !scanning && (
            <p className="text-green-500 text-sm mb-3">
              ✓ Receipt scanned! Review the fields below.
            </p>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleScan}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : '📷 Upload or take a photo of receipt'}
          </button>
        </div>

        {/* Transaction Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Income / Expense toggle */}
            <div className="flex rounded-lg overflow-hidden border">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Amount (Rp)
              </label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Account */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Note{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with team"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || scanning}
              className="bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 mt-2"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
