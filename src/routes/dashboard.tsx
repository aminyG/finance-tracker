// src/routes/dashboard.tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import type { Transaction } from '../lib/transactions'
import { getRecentTransactions } from '../lib/transactions'
import { getCategories } from '../lib/categories'
import ProtectedRoute from '../components/ProtectedRoute'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
})

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      try {
        const [txs, cats] = await Promise.all([
          getRecentTransactions(user!.uid, 5),
          getCategories(user!.uid),
        ])
        setRecentTxs(txs)
        setCategories(Object.fromEntries(cats.map((c) => [c.id, c.name])))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  async function handleLogout() {
    await signOut(auth)
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/accounts"
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">🏦</p>
            <p className="font-semibold text-gray-800 text-sm">Accounts</p>
          </Link>
          <Link
            to="/transactions/new"
            className="bg-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">➕</p>
            <p className="font-semibold text-white text-sm">Add Transaction</p>
          </Link>
          <Link
            to="/categories"
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">🏷️</p>
            <p className="font-semibold text-gray-800 text-sm">Categories</p>
          </Link>
          <Link
            to="/transactions"
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">📋</p>
            <p className="font-semibold text-gray-800 text-sm">Transactions</p>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800">Recent Transactions</p>
            <Link
              to="/transactions"
              className="text-xs text-blue-500 hover:underline"
            >
              See all →
            </Link>
          </div>

          {loading && (
            <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
          )}

          {!loading && recentTxs.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              No transactions yet.
            </p>
          )}

          {!loading && recentTxs.length > 0 && (
            <div className="flex flex-col gap-3">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {categories[tx.categoryId] ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <p
                    className={`text-sm font-bold ${
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
    </div>
  )
}
