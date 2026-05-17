import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Input, Logo, BrandLogo } from '../components/fo'
import Spinner from '../components/ui/Spinner'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch {
      setError('Error al iniciar sesión con Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fo-app" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel — desktop only */}
      <div style={{
        display: 'none',
        width: '45%', flexDirection: 'column', justifyContent: 'space-between',
        padding: 48,
        background: 'var(--fo-surface-1)',
        borderRight: '1px solid var(--fo-line)',
        position: 'relative', overflow: 'hidden',
      }} className="lg-flex-col">
        <style>{`@media(min-width:1024px){.lg-flex-col{display:flex!important}}`}</style>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.55 0.22 260 / 0.3), transparent 65%)',
          filter: 'blur(40px)',
        }}/>
        <div style={{ position: 'relative' }}>
          <BrandLogo height={40}/>
        </div>
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>Tu dinero, bajo control</p>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
            Toma el control de tus finanzas personales.
          </h2>
          <p style={{ color: 'var(--fo-fg-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Registra ingresos, distribuye tu presupuesto y visualiza tu evolución mes a mes.
          </p>
          {[
            'Dashboard con métricas en tiempo real',
            'Distribución inteligente del presupuesto',
            'Historial y comparación mensual',
          ].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fo-accent)', flexShrink: 0 }}/>
              <p style={{ color: 'var(--fo-fg-muted)', fontSize: 13 }}>{t}</p>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--fo-fg-faint)', fontSize: 11, position: 'relative' }}>© 2026 Finanzas en Orden</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.55 0.22 260 / 0.2), transparent 65%)', filter: 'blur(40px)' }}/>
        <Card style={{ position: 'relative', width: '100%', maxWidth: 420, padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Logo size={32}/>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Finanzas en Orden</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>Bienvenido de nuevo</p>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 14px', borderRadius: 'var(--fo-r-md)',
              background: 'var(--fo-neg-soft)', border: '1px solid var(--fo-neg)',
              color: 'var(--fo-neg)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <Button variant="soft" full icon={<GoogleIcon/>} onClick={handleGoogle} disabled={loading} style={{ marginBottom: 20 }}>
            Continuar con Google
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--fo-line)' }}/>
            <span style={{ fontSize: 11, color: 'var(--fo-fg-faint)', fontWeight: 600 }}>o con correo</span>
            <div style={{ flex: 1, height: 1, background: 'var(--fo-line)' }}/>
          </div>

          <form onSubmit={handleSubmit}>
            <Input label="Correo electrónico" type="email" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com" style={{ marginBottom: 14 }}/>
            <Input label="Contraseña" type="password" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" style={{ marginBottom: 22 }}/>
            <Button type="submit" full size="lg" disabled={loading}>
              {loading ? <Spinner size="sm"/> : 'Iniciar sesión'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fo-fg-dim)', marginTop: 22 }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--fo-accent-fg)', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate gratis
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
