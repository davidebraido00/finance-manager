import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  Target,
  Trophy,
  Landmark,
  Tags,
  Settings as SettingsIcon,
  Wallet,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { cn } from './ui'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transazioni', label: 'Transazioni', icon: ArrowLeftRight },
  { to: '/ricorrenti', label: 'Ricorrenti', icon: Repeat },
  { to: '/budget', label: 'Budget', icon: Target },
  { to: '/obiettivi', label: 'Obiettivi', icon: Trophy },
  { to: '/conti', label: 'Conti', icon: Landmark },
  { to: '/categorie', label: 'Categorie', icon: Tags },
  { to: '/impostazioni', label: 'Impostazioni', icon: SettingsIcon },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { error } = useData()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Wallet size={18} />
          </div>
          <span className="font-semibold">Finance</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="hidden items-center gap-2.5 px-6 py-6 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Wallet size={20} />
          </div>
          <div>
            <div className="font-semibold leading-tight text-slate-900">
              Finance
            </div>
            <div className="text-xs text-slate-400">Manager</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 pt-4 lg:pt-0">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 truncate px-3 text-xs text-slate-400">
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Esci
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Contenuto */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Errore di caricamento dati</div>
                <div className="mt-0.5 text-amber-700">
                  {error} — verifica di aver eseguito l'ultima versione di{' '}
                  <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code>{' '}
                  nel SQL Editor di Supabase.
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
