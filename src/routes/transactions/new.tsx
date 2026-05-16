// src/routes/transactions/new.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addTransaction } from '../../lib/transactions'
import type { TransactionType } from '../../lib/transactions'
import { getAccounts } from '../../lib/accounts'
import type { Account } from '../../lib/accounts'
import { getCategories, seedDefaultCategories } from '../../lib/categories'
import type { Category } from '../../lib/categories'
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

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [type, setType] = useState<TransactionType>('expense')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // today

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load accounts and categories on mount
  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        await seedDefaultCategories(user!.uid) // seed if first time
        const [accs, cats] = await Promise.all([
          getAccounts(user!.uid),
          getCategories(user!.uid),
        ])
        setAccounts(accs)
        setCategories(cats)
        // Set defaults so dropdowns aren't empty
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

  // Can't add transaction without at least one account
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
              disabled={loading}
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
