import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { AccountType } from '../../lib/accounts'
import { addAccount } from '../../lib/accounts'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/accounts/new')({
  component: () => (
    <ProtectedRoute>
      <AddAccountPage />
    </ProtectedRoute>
  ),
})

function AddAccountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    // Validate balance is a valid number
    const parsedBalance = parseFloat(balance)
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Please enter a valid balance.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await addAccount(user.uid, name.trim(), type, parsedBalance)
      navigate({ to: '/accounts' }) // go back to accounts list on success
    } catch (err) {
      console.error(err)
      setError('Failed to save account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/accounts' })}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Add Account</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Account Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                placeholder="e.g. BCA, GoPay, Dompet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Account Type */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="bank">🏦 Bank</option>
                <option value="ewallet">📱 E-Wallet</option>
                <option value="cash">💵 Cash</option>
              </select>
            </div>

            {/* Initial Balance */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Initial Balance (Rp)
              </label>
              <input
                type="number"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                min="0"
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 mt-2"
            >
              {loading ? 'Saving...' : 'Save Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
