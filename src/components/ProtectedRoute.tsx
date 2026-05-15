// src/components/ProtectedRoute.tsx
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
