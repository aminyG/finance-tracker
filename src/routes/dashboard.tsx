// src/routes/dashboard.tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import {
  getRecentTransactions,
  getTransactions,
  groupByMonth,
  groupByCategory,
  balanceOverTime,
} from '../lib/transactions'
import type { Transaction } from '../lib/transactions'
import { getCategories } from '../lib/categories'
import ProtectedRoute from '../components/ProtectedRoute'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
})

const PIE_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  return `Rp ${value}`
}

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [allTxs, setAllTxs] = useState<Transaction[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Chart data
  const [monthlyData, setMonthlyData] = useState<
    ReturnType<typeof groupByMonth>
  >([])
  const [categoryData, setCategoryData] = useState<
    ReturnType<typeof groupByCategory>
  >([])
  const [balanceData, setBalanceData] = useState<
    ReturnType<typeof balanceOverTime>
  >([])

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      try {
        const [recent, all, cats] = await Promise.all([
          getRecentTransactions(user!.uid, 5),
          getTransactions(user!.uid),
          getCategories(user!.uid),
        ])

        const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))

        setRecentTxs(recent)
        setAllTxs(all)
        setCategoryMap(catMap)
        setMonthlyData(groupByMonth(all))
        setCategoryData(groupByCategory(all, catMap))
        setBalanceData(balanceOverTime(all))
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

  const totalIncome = allTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = allTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            to="/import"
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">📂</p>
            <p className="font-semibold text-gray-800 text-sm">
              Import Mutation
            </p>
          </Link>
        </div>

        {/* Summary cards */}
        {!loading && allTxs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Income</p>
              <p className="font-bold text-green-500 text-sm">
                + Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Expense</p>
              <p className="font-bold text-red-500 text-sm">
                - Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

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
                      {categoryMap[tx.categoryId] ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <p
                    className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {tx.type === 'income' ? '+' : '-'} Rp{' '}
                    {tx.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charts — only show if there's data */}
        {!loading && allTxs.length > 0 && (
          <>
            {/* Income vs Expense bar chart */}
            {monthlyData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="font-semibold text-gray-800 mb-4">
                  Income vs Expense
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barCategoryGap="30%">
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={formatRp}
                      tick={{ fontSize: 10 }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value) =>
                        `Rp ${Number(value).toLocaleString('id-ID')}`
                      }
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Spending by category pie chart */}
            {categoryData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="font-semibold text-gray-800 mb-4">
                  Spending by Category
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `Rp ${Number(value).toLocaleString('id-ID')}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Balance over time line chart */}
            {balanceData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="font-semibold text-gray-800 mb-4">
                  Balance Over Time
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      tickFormatter={formatRp}
                      tick={{ fontSize: 10 }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value) =>
                        `Rp ${Number(value).toLocaleString('id-ID')}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Balance"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
