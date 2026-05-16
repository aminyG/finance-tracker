import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { Account } from '../../lib/accounts'
import { getAccounts } from '../../lib/accounts'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/accounts/')({
  component: () => (
    <ProtectedRoute>
      <AccountsPage />
    </ProtectedRoute>
  ),
})

// Icon per account type
const typeIcon: Record<string, string> = {
  bank: '🏦',
  ewallet: '📱',
  cash: '💵',
}

const typeLabel: Record<string, string> = {
  bank: 'Bank',
  ewallet: 'E-Wallet',
  cash: 'Cash',
}

function AccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    async function fetchAccounts() {
      try {
        const data = await getAccounts(user!.uid)
        setAccounts(data)
      } catch (err) {
        setError('Failed to load accounts. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [user])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Accounts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Total balance:{' '}
              <span className="font-semibold text-gray-700">
                Rp {totalBalance.toLocaleString('id-ID')}
              </span>
            </p>
          </div>
          <Link
            to="/accounts/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            + Add Account
          </Link>
        </div>

        {/* States */}
        {loading && (
          <p className="text-center text-gray-400 mt-12">Loading accounts...</p>
        )}

        {error && <p className="text-center text-red-500 mt-12">{error}</p>}

        {!loading && !error && accounts.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-500 text-sm">No accounts yet.</p>
            <Link
              to="/accounts/new"
              className="inline-block mt-3 text-blue-500 text-sm hover:underline"
            >
              Add your first account →
            </Link>
          </div>
        )}

        {/* Account Cards */}
        {!loading && !error && accounts.length > 0 && (
          <div className="flex flex-col gap-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{typeIcon[account.type]}</div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {account.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {typeLabel[account.type]}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-800">
                  Rp {account.balance.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
