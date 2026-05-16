import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
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

  async function handleLogout() {
    await signOut(auth)
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
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
        <Link
          to="/accounts"
          className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-2xl mb-1">🏦</p>
          <p className="font-semibold text-gray-800">My Accounts</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your bank, e-wallet & cash
          </p>
        </Link>
      </div>
    </div>
  )
}
