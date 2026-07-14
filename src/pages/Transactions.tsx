import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { Transaction } from '../types'
import { formatCurrency, formatDate } from '../lib/format'
import { getCategoryIcon } from '../lib/icons'
import { PAYMENT_METHODS, paymentLabel } from '../lib/payment'
import { Button, Card, Input, Select, Spinner, EmptyState } from '../components/ui'
import { PageHeader } from '../components/common'
import { TransactionForm } from '../components/TransactionForm'

export default function Transactions() {
  const { transactions, categories, accounts, loading } = useData()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const PAGE = 60
  const [visibleCount, setVisibleCount] = useState(PAGE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false
      if (categoryFilter && t.category_id !== categoryFilter) return false
      if (accountFilter && t.account_id !== accountFilter) return false
      if (methodFilter && t.method !== methodFilter) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (q) {
        const cat = categories.find((c) => c.id === t.category_id)
        const hay = `${t.description} ${cat?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    transactions,
    categories,
    query,
    typeFilter,
    categoryFilter,
    accountFilter,
    methodFilter,
    dateFrom,
    dateTo,
  ])

  // Reset della paginazione quando cambiano i filtri
  useEffect(() => {
    setVisibleCount(PAGE)
  }, [query, typeFilter, categoryFilter, accountFilter, methodFilter, dateFrom, dateTo])

  const visible = filtered.slice(0, visibleCount)

  // Raggruppa per data
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of visible) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [visible])

  const filteredTotal = filtered.reduce(
    (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
    0,
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(t: Transaction) {
    setEditing(t)
    setFormOpen(true)
  }

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
        title="Transazioni"
        subtitle={`${filtered.length} movimenti · saldo netto ${formatCurrency(filteredTotal)}`}
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Nuova
          </Button>
        }
      />

      {/* Filtri */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              className="pl-9"
              placeholder="Cerca…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tutti i tipi</option>
            <option value="income">Entrate</option>
            <option value="expense">Uscite</option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="">Tutti i conti</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">Tutti i pagamenti</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Dal
            </label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Al
            </label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Azzera date
              </Button>
            </div>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Filter size={26} />}
          title="Nessuna transazione"
          description={
            transactions.length === 0
              ? 'Aggiungi la tua prima transazione.'
              : 'Nessun risultato con questi filtri.'
          }
          action={
            <Button onClick={openNew}>
              <Plus size={18} /> Nuova transazione
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map(([date, items]) => (
            <div key={date}>
              <div className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {formatDate(date)}
              </div>
              <Card className="divide-y divide-slate-100 p-0">
                {items.map((t) => {
                  const cat = categories.find((c) => c.id === t.category_id)
                  const acc = accounts.find((a) => a.id === t.account_id)
                  const Icon = getCategoryIcon(cat?.icon ?? 'tag')
                  return (
                    <button
                      key={t.id}
                      onClick={() => openEdit(t)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${cat?.color ?? '#94a3b8'}1a`,
                          color: cat?.color ?? '#94a3b8',
                        }}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">
                          {t.description || cat?.name || 'Transazione'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {cat?.name ?? 'Senza categoria'}
                          {acc && ` · ${acc.name}`}
                          {t.method && ` · ${paymentLabel(t.method)}`}
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
                    </button>
                  )
                })}
              </Card>
            </div>
          ))}
          {filtered.length > visible.length && (
            <div className="flex justify-center pt-1">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((c) => c + PAGE)}
              >
                Carica altre ({filtered.length - visible.length})
              </Button>
            </div>
          )}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
    </div>
  )
}
