// src/routes/transactions/index.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { Transaction } from '../../lib/transactions'
import { getTransactions } from '../../lib/transactions'
import { getCategories } from '../../lib/categories'
import { getAccounts } from '../../lib/accounts'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/transactions/')({
  component: () => (
    <ProtectedRoute>
      <TransactionsPage />
    </ProtectedRoute>
  ),
})

function TransactionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [accounts, setAccounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    async function fetchAll() {
      try {
        const [txs, cats, accs] = await Promise.all([
          getTransactions(user!.uid),
          getCategories(user!.uid),
          getAccounts(user!.uid),
        ])
        setTransactions(txs)
        // Convert arrays to id→name maps for easy lookup
        setCategories(Object.fromEntries(cats.map((c) => [c.id, c.name])))
        setAccounts(Object.fromEntries(accs.map((a) => [a.id, a.name])))
      } catch {
        setError('Failed to load transactions. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [user])

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <Link
            to="/transactions/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            + Add
          </Link>
        </div>

        {/* Summary */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Income</p>
              <p className="font-bold text-green-500">
                + Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Expense</p>
              <p className="font-bold text-red-500">
                - Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <p className="text-center text-gray-400 mt-12">
            Loading transactions...
          </p>
        )}
        {error && <p className="text-center text-red-500 mt-12">{error}</p>}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">No transactions yet.</p>
            <Link
              to="/transactions/new"
              className="inline-block mt-3 text-blue-500 text-sm hover:underline"
            >
              Add your first transaction →
            </Link>
          </div>
        )}

        {/* Transaction List */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {categories[tx.categoryId] ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {accounts[tx.accountId] ?? 'Unknown'} · {tx.date}
                  </p>
                  {tx.note && (
                    <p className="text-xs text-gray-400">{tx.note}</p>
                  )}
                </div>
                <p
                  className={`font-bold text-sm ${
                    tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'} Rp{' '}
                  {tx.amount.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
