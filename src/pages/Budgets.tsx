import { useMemo, useState } from 'react'
import { Target, Pencil } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatCurrency, monthKey } from '../lib/format'
import { getCategoryIcon } from '../lib/icons'
import { Button, Card, Field, Input, Modal, Spinner, EmptyState } from '../components/ui'
import { PageHeader, MonthSelector } from '../components/common'
import type { Category } from '../types'

export default function Budgets() {
  const { categories, transactions, budgets, setBudget, deleteBudget, loading } =
    useData()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [editing, setEditing] = useState<Category | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [saving, setSaving] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const rows = useMemo(() => {
    return expenseCategories.map((cat) => {
      const budget = budgets.find(
        (b) => b.category_id === cat.id && b.month === month,
      )
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category_id === cat.id &&
            monthKey(t.date) === month,
        )
        .reduce((s, t) => s + t.amount, 0)
      return { cat, budget, spent, limit: budget?.amount ?? 0 }
    })
  }, [expenseCategories, budgets, transactions, month])

  const withBudget = rows.filter((r) => r.budget)
  const totalLimit = withBudget.reduce((s, r) => s + r.limit, 0)
  const totalSpent = withBudget.reduce((s, r) => s + r.spent, 0)

  function openEdit(cat: Category, current: number) {
    setEditing(cat)
    setAmountInput(current ? String(current) : '')
  }

  async function save() {
    if (!editing) return
    const value = parseFloat(amountInput.replace(',', '.'))
    setSaving(true)
    try {
      if (!amountInput.trim() || value <= 0) {
        const existing = budgets.find(
          (b) => b.category_id === editing.id && b.month === month,
        )
        if (existing) await deleteBudget(existing.id)
      } else {
        await setBudget(editing.id, month, value)
      }
      setEditing(null)
    } finally {
      setSaving(false)
    }
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
        title="Budget"
        subtitle="Imposta un tetto di spesa mensile per categoria"
        action={<MonthSelector month={month} onChange={setMonth} />}
      />

      {withBudget.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Budget totale del mese</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(totalSpent)}{' '}
                <span className="text-base font-medium text-slate-400">
                  / {formatCurrency(totalLimit)}
                </span>
              </div>
            </div>
            <div
              className={`text-right ${
                totalSpent > totalLimit ? 'text-red-500' : 'text-brand-600'
              }`}
            >
              <div className="text-sm">Rimanente</div>
              <div className="text-xl font-bold">
                {formatCurrency(totalLimit - totalSpent)}
              </div>
            </div>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} className="mt-4" />
        </Card>
      )}

      {expenseCategories.length === 0 ? (
        <EmptyState
          icon={<Target size={26} />}
          title="Nessuna categoria di spesa"
          description="Crea prima qualche categoria di uscita nella sezione Categorie."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ cat, spent, limit, budget }) => {
            const Icon = getCategoryIcon(cat.icon)
            const pct = limit > 0 ? (spent / limit) * 100 : 0
            const over = spent > limit && limit > 0
            return (
              <Card key={cat.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{cat.name}</div>
                    <div className="text-xs text-slate-400">
                      {budget
                        ? `${formatCurrency(spent)} di ${formatCurrency(limit)}`
                        : 'Nessun budget impostato'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(cat, limit)}
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
                {budget && (
                  <>
                    <ProgressBar value={spent} max={limit} className="mt-3" />
                    <div className="mt-1.5 flex justify-between text-xs">
                      <span className={over ? 'text-red-500' : 'text-slate-400'}>
                        {Math.round(pct)}% utilizzato
                      </span>
                      <span
                        className={over ? 'font-medium text-red-500' : 'text-slate-500'}
                      >
                        {over
                          ? `Superato di ${formatCurrency(spent - limit)}`
                          : `${formatCurrency(limit - spent)} rimasti`}
                      </span>
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Budget · ${editing?.name ?? ''}`}
      >
        <div className="space-y-4">
          <Field label="Tetto di spesa mensile (€)">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="Es. 300 — lascia vuoto per rimuovere"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Annulla
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ProgressBar({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const over = value > max && max > 0
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className ?? ''}`}>
      <div
        className={`h-full rounded-full transition-all ${
          over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
