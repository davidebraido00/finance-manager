import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  ChevronRight,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import {
  accountBalance,
  breakdownByCategory,
  monthlyTrend,
  savingsRate,
  totalBalance,
  totalsForMonth,
} from '../lib/stats'
import {
  totalMonthly,
  renewalLabel,
  daysUntil,
  frequencyShort,
} from '../lib/subscription'
import { formatCurrency, formatMonth, monthKey } from '../lib/format'
import { getCategoryIcon } from '../lib/icons'
import { Card, Button, Spinner, EmptyState, cn } from '../components/ui'
import { PageHeader, MonthSelector } from '../components/common'
import { TransactionForm } from '../components/TransactionForm'

export default function Dashboard() {
  const { accounts, categories, transactions, subscriptions, loading } = useData()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()))

  const upcomingSubs = useMemo(
    () =>
      subscriptions
        .filter((s) => s.active)
        .sort((a, b) => a.next_payment.localeCompare(b.next_payment))
        .slice(0, 4),
    [subscriptions],
  )
  const subsMonthly = totalMonthly(subscriptions, 'expense')

  const stats = useMemo(() => {
    const totals = totalsForMonth(transactions, selectedMonth)
    return {
      totals,
      patrimony: totalBalance(accounts, transactions),
      trend: monthlyTrend(transactions, 6, new Date(selectedMonth + 'T00:00:00')),
      expenseBreakdown: breakdownByCategory(
        transactions,
        categories,
        selectedMonth,
        'expense',
      ),
      rate: savingsRate(totals),
    }
  }, [accounts, categories, transactions, selectedMonth])

  const recent = transactions.slice(0, 6)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Panoramica · ${formatMonth(selectedMonth)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthSelector month={selectedMonth} onChange={setSelectedMonth} />
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={18} /> Nuova transazione
            </Button>
          </div>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Patrimonio totale"
          value={formatCurrency(stats.patrimony)}
          icon={<Wallet size={20} />}
          tone="brand"
        />
        <StatCard
          label="Entrate (mese)"
          value={formatCurrency(stats.totals.income)}
          icon={<TrendingUp size={20} />}
          tone="green"
        />
        <StatCard
          label="Uscite (mese)"
          value={formatCurrency(stats.totals.expense)}
          icon={<TrendingDown size={20} />}
          tone="red"
        />
        <StatCard
          label="Risparmio (mese)"
          value={formatCurrency(stats.totals.net)}
          hint={`Tasso ${Math.round(stats.rate * 100)}%`}
          icon={<PiggyBank size={20} />}
          tone={stats.totals.net >= 0 ? 'green' : 'red'}
        />
      </div>

      {upcomingSubs.length > 0 && (
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <Repeat size={18} className="text-slate-400" />
              Prossimi rinnovi
            </h3>
            <Link
              to="/ricorrenti"
              className="flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Vedi tutti <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingSubs.map((s) => {
              const days = daysUntil(s.next_payment)
              const due = days <= 0
              const soon = days > 0 && days <= 7
              const cat = categories.find((c) => c.id === s.category_id)
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    <Repeat size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {s.name}
                    </div>
                    <div
                      className={cn(
                        'text-xs',
                        due
                          ? 'text-red-500'
                          : soon
                            ? 'text-amber-600'
                            : 'text-slate-400',
                      )}
                    >
                      {renewalLabel(s.next_payment)}
                      {cat && (
                        <span className="text-slate-400"> · {cat.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-800">
                    {formatCurrency(s.amount)}
                    <div className="text-xs font-normal text-slate-400">
                      {frequencyShort(s.frequency)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
            Spese fisse:{' '}
            <span className="font-semibold text-slate-800">
              {formatCurrency(subsMonthly)}
            </span>
            /mese
          </div>
        </Card>
      )}

      {transactions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Wallet size={26} />}
            title="Nessuna transazione ancora"
            description="Aggiungi la tua prima entrata o uscita per iniziare a vedere le statistiche."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={18} /> Aggiungi transazione
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Grafici */}
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <h3 className="mb-4 font-semibold text-slate-800">
                Andamento ultimi 6 mesi
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trend} margin={{ left: -18, right: 8 }}>
                    <defs>
                      <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Entrate"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#inc)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Uscite"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fill="url(#exp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="mb-4 font-semibold text-slate-800">
                Spese per categoria
              </h3>
              {stats.expenseBreakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Nessuna spesa questo mese.
                </p>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.expenseBreakdown}
                          dataKey="total"
                          nameKey="category.name"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={2}
                        >
                          {stats.expenseBreakdown.map((s) => (
                            <Cell key={s.category.id} fill={s.category.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 w-full space-y-1.5">
                    {stats.expenseBreakdown.slice(0, 4).map((s) => (
                      <div
                        key={s.category.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-slate-600">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.category.color }}
                          />
                          {s.category.name}
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(s.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Conti + entrate/uscite bar + recenti */}
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <h3 className="mb-4 font-semibold text-slate-800">
                Entrate vs Uscite
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trend} margin={{ left: -18, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="income" name="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Uscite" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Transazioni recenti</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {recent.map((t) => {
                  const cat = categories.find((c) => c.id === t.category_id)
                  const Icon = getCategoryIcon(cat?.icon ?? 'tag')
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${cat?.color ?? '#94a3b8'}1a`,
                          color: cat?.color ?? '#94a3b8',
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">
                          {t.description || cat?.name || 'Transazione'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {cat?.name ?? 'Senza categoria'}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-0.5 text-sm font-semibold ${
                          t.type === 'income' ? 'text-brand-600' : 'text-red-500'
                        }`}
                      >
                        {t.type === 'income' ? (
                          <ArrowUpRight size={15} />
                        ) : (
                          <ArrowDownRight size={15} />
                        )}
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Conti */}
          {accounts.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-3 font-semibold text-slate-800">I tuoi conti</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {accounts.map((a) => (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="truncate text-sm text-slate-500">
                        {a.name}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-bold text-slate-900">
                      {formatCurrency(accountBalance(a, transactions))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'brand' | 'green' | 'red'
  hint?: string
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
  }
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`rounded-lg p-1.5 ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </Card>
  )
}

interface TooltipEntry {
  name: string
  value: number
  color?: string
}
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label && <div className="mb-1 text-xs font-medium text-slate-400">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-800">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
