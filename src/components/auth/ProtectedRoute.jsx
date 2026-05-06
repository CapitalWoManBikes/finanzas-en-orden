import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!userData?.isActive) return <Navigate to="/login" replace />
  if (adminOnly && userData?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}
