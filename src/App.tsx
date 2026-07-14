import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Spinner } from './components/ui'
import Layout from './components/Layout'
import Login from './pages/Login'

// Pagine caricate on-demand (code-splitting): Recharts e il grosso del codice
// finiscono in chunk separati, alleggerendo il bundle iniziale.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Goals = lazy(() => import('./pages/Goals'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Categories = lazy(() => import('./pages/Categories'))
const Settings = lazy(() => import('./pages/Settings'))

function PageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function Protected() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <DataProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/transazioni" element={<Transactions />} />
            <Route path="/ricorrenti" element={<Subscriptions />} />
            <Route path="/budget" element={<Budgets />} />
            <Route path="/obiettivi" element={<Goals />} />
            <Route path="/conti" element={<Accounts />} />
            <Route path="/categorie" element={<Categories />} />
            <Route path="/impostazioni" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Protected />
      </AuthProvider>
    </BrowserRouter>
  )
}
