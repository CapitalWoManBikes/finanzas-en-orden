import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { updateUser } from '../lib/firestore'
import Spinner from '../components/ui/Spinner'
import { getNextPaymentDate, getDaysUntilPayment, formatNextPaymentDate } from '../utils/dailyBudget'

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

export default function ConfiguracionPage() {
  const { user, userData, refreshUserData } = useAuth()
  const saved = userData?.paymentConfig ?? {}

  const [mode, setMode] = useState(saved.mode ?? 'monthly')
  const [payDay, setPayDay] = useState(saved.payDay ?? 1)
  const [firstQuincena, setFirstQuincena] = useState(saved.firstQuincena ?? 1)
  const [secondQuincena, setSecondQuincena] = useState(saved.secondQuincena ?? 16)
  const [biweeklyPct, setBiweeklyPct] = useState(saved.biweeklyPct ?? 50)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const currentConfig = { mode, payDay, firstQuincena, secondQuincena, biweeklyPct }
  const daysLeft = getDaysUntilPayment(currentConfig)
  const nextDate = formatNextPaymentDate(currentConfig)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateUser(user.uid, { paymentConfig: currentConfig })
    await refreshUserData()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
    setSaving(false)
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5">

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Configuración</p>
          <h1 className="text-2xl font-bold text-slate-900">Modalidad de pago</h1>
          <p className="text-sm text-slate-500 mt-0.5">Define cuándo recibes tu ingreso para calcular el presupuesto diario.</p>
        </div>

        {/* Preview */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Próximo pago</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{nextDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-500 font-medium">Días restantes</p>
            <p className="text-2xl font-bold text-emerald-700">{daysLeft}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

          {/* Mode selector */}
          <div>
            <label className={labelCls}>Modalidad de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['monthly', 'biweekly'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition
                    ${mode === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'}`}
                >
                  {m === 'monthly' ? 'Mensual' : 'Quincenal'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'monthly' && (
            <div>
              <label className={labelCls}>Día de pago mensual</label>
              <select value={payDay} onChange={(e) => setPayDay(Number(e.target.value))} className={inputCls}>
                {DAYS.map((d) => <option key={d} value={d}>Día {d}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">Ej: si te pagan el 30 de cada mes, selecciona día 30.</p>
            </div>
          )}

          {mode === 'biweekly' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>1.ª quincena (día)</label>
                  <select value={firstQuincena} onChange={(e) => setFirstQuincena(Number(e.target.value))} className={inputCls}>
                    {DAYS.slice(0, 15).map((d) => <option key={d} value={d}>Día {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>2.ª quincena (día)</label>
                  <select value={secondQuincena} onChange={(e) => setSecondQuincena(Number(e.target.value))} className={inputCls}>
                    {DAYS.slice(14).map((d) => <option key={d} value={d}>Día {d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>% del ingreso en la 1.ª quincena — {biweeklyPct}%</label>
                <input
                  type="range" min="10" max="90" step="5"
                  value={biweeklyPct}
                  onChange={(e) => setBiweeklyPct(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>1.ª quincena: {biweeklyPct}%</span>
                  <span>2.ª quincena: {100 - biweeklyPct}%</span>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition
              ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'}
              disabled:opacity-50`}
          >
            {saving ? <Spinner size="sm" /> : success ? '✓ Guardado' : 'Guardar configuración'}
          </button>
        </form>

      </div>
    </AppLayout>
  )
}
