// src/components/ProtectedRoute.tsx
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user === null) {
      navigate({ to: '/login' })
    }
  }, [user, navigate])

  // Still checking auth state
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Redirecting
  if (user === null) {
    return null
  }

  return <>{children}</>
}
