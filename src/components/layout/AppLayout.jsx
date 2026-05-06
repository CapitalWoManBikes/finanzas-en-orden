import { useState } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const sidebarW = collapsed ? 64 : 256 // px exactos

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-14 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-gray-100 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5 ml-3">
          <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs leading-none">$</span>
          </div>
          <span className="font-bold text-slate-800 text-sm">Finanzas en Orden</span>
        </div>
      </div>

      {/* Main content — inline style garantiza sincronía exacta con sidebar */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{ paddingLeft: `${sidebarW}px` }}
      >
        {/* en móvil ignoramos el paddingLeft del sidebar */}
        <style>{`@media (max-width: 1023px) { main { padding-left: 0 !important; } }`}</style>
        <div className="pt-14 lg:pt-0 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
