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
  MoreHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react'
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

// Voci principali nella barra inferiore mobile (le altre stanno in "Altro")
const BOTTOM = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/transazioni', label: 'Movimenti', icon: ArrowLeftRight },
  { to: '/ricorrenti', label: 'Ricorrenti', icon: Repeat },
  { to: '/obiettivi', label: 'Obiettivi', icon: Trophy },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { error } = useData()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-[100dvh]">
      {/* Topbar mobile (con safe-area per il notch) */}
      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/80 px-4 pb-3 backdrop-blur lg:hidden"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Wallet size={18} />
        </div>
        <span className="font-semibold">Finance</span>
      </header>

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:z-40 lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
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

        <div
          className="border-t border-slate-200 p-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
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

      {/* Overlay del drawer (solo mobile) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Contenuto */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
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

      {/* Bottom tab bar (solo mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/90 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-slate-400',
              )
            }
          >
            <item.icon size={22} />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
            drawerOpen ? 'text-brand-600' : 'text-slate-400',
          )}
        >
          <MoreHorizontal size={22} />
          Altro
        </button>
      </nav>
    </div>
  )
}
