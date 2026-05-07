import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Onboarding from './components/onboarding/Onboarding'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import IngresosPage from './pages/IngresosPage'
import GastosPage from './pages/GastosPage'
import GastosBasePage from './pages/GastosBasePage'
import HistorialPage from './pages/HistorialPage'
import AdminPage from './pages/AdminPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import Spinner from './components/ui/Spinner'

function AppRoutes() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (user && userData && !userData.hasCompletedOnboarding) {
    return <Onboarding />
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/ingresos" element={<ProtectedRoute><IngresosPage /></ProtectedRoute>} />
      <Route path="/gastos" element={<ProtectedRoute><GastosPage /></ProtectedRoute>} />
      <Route path="/gastos-base" element={<ProtectedRoute><GastosBasePage /></ProtectedRoute>} />
      <Route path="/historial" element={<ProtectedRoute><HistorialPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
