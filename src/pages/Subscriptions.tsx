import { useMemo, useState, type FormEvent } from 'react'
import {
  Plus,
  Repeat,
  Pencil,
  Trash2,
  Check,
  Play,
  Pause,
  CalendarClock,
} from 'lucide-react'
import { useData, type NewSubscription } from '../context/DataContext'
import type { BillingFrequency, PaymentMethod, Subscription } from '../types'
import { formatCurrency, formatDate, todayISO } from '../lib/format'
import {
  FREQUENCIES,
  frequencyShort,
  monthlyCost,
  totalMonthly,
  daysUntil,
  renewalLabel,
} from '../lib/subscription'
import { PAYMENT_METHODS, paymentLabel } from '../lib/payment'
import {
  Button,
  Card,
  Field,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
  EmptyState,
  cn,
} from '../components/ui'
import { PageHeader } from '../components/common'
import { ColorPicker } from './Accounts'

export default function Subscriptions() {
  const {
    subscriptions,
    categories,
    accounts,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    paySubscription,
    loading,
  } = useData()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly')
  const [nextPayment, setNextPayment] = useState(todayISO())
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [color, setColor] = useState('#6366f1')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formCategories = categories.filter((c) => c.type === type)

  const sorted = useMemo(
    () =>
      [...subscriptions].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        return a.next_payment.localeCompare(b.next_payment)
      }),
    [subscriptions],
  )

  const monthlyExpense = totalMonthly(subscriptions, 'expense')
  const monthlyIncome = totalMonthly(subscriptions, 'income')
  const activeCount = subscriptions.filter((s) => s.active).length

  function openNew() {
    setEditing(null)
    setName('')
    setType('expense')
    setAmount('')
    setFrequency('monthly')
    setNextPayment(todayISO())
    setCategoryId('')
    setAccountId(accounts[0]?.id ?? '')
    setMethod('')
    setColor('#6366f1')
    setActive(true)
    setError(null)
    setOpen(true)
  }
  function openEdit(s: Subscription) {
    setEditing(s)
    setName(s.name)
    setType(s.type)
    setAmount(String(s.amount))
    setFrequency(s.frequency)
    setNextPayment(s.next_payment)
    setCategoryId(s.category_id ?? '')
    setAccountId(s.account_id ?? '')
    setMethod(s.method ?? '')
    setColor(s.color)
    setActive(s.active)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Inserisci un nome.')
      return
    }
    const value = parseFloat(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Inserisci un importo valido.')
      return
    }
    const payload: NewSubscription = {
      name: name.trim(),
      type,
      amount: value,
      frequency,
      next_payment: nextPayment,
      category_id: categoryId || null,
      account_id: accountId || null,
      method: method || null,
      color,
      active,
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateSubscription(editing.id, payload)
      else await addSubscription(payload)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  async function handlePay(s: Subscription) {
    setBusyId(s.id)
    try {
      await paySubscription(s)
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(s: Subscription) {
    setBusyId(s.id)
    try {
      await updateSubscription(s.id, {
        name: s.name,
        type: s.type,
        amount: s.amount,
        frequency: s.frequency,
        next_payment: s.next_payment,
        category_id: s.category_id,
        account_id: s.account_id,
        method: s.method,
        color: s.color,
        active: !s.active,
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(s: Subscription) {
    if (!confirm(`Eliminare l'abbonamento "${s.name}"?`)) return
    setBusyId(s.id)
    try {
      await deleteSubscription(s.id)
    } finally {
      setBusyId(null)
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
        title="Ricorrenti"
        subtitle="Entrate e uscite ricorrenti, prossimi rinnovi"
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Nuova ricorrente
          </Button>
        }
      />

      {subscriptions.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs font-medium text-slate-500">Uscite fisse /mese</div>
            <div className="mt-1 text-xl font-bold text-red-500">
              {formatCurrency(monthlyExpense)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-slate-500">
              Entrate fisse /mese
            </div>
            <div className="mt-1 text-xl font-bold text-brand-600">
              {formatCurrency(monthlyIncome)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-slate-500">Attive</div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {activeCount}
            </div>
          </Card>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<Repeat size={26} />}
          title="Nessuna ricorrente"
          description="Aggiungi entrate o uscite ricorrenti (stipendio, affitto, streaming, palestra…) per tenere sotto controllo entrate e spese fisse."
          action={
            <Button onClick={openNew}>
              <Plus size={18} /> Aggiungi ricorrente
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((s) => {
            const cat = categories.find((c) => c.id === s.category_id)
            const days = daysUntil(s.next_payment)
            const due = s.active && days <= 0
            const soon = s.active && days > 0 && days <= 7
            const busy = busyId === s.id
            return (
              <Card
                key={s.id}
                className={cn('p-4', !s.active && 'opacity-60')}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    <Repeat size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-800">
                        {s.name}
                      </span>
                      {!s.active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          In pausa
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      <span
                        className={cn(
                          'font-medium',
                          s.type === 'income' ? 'text-brand-600' : 'text-slate-700',
                        )}
                      >
                        {s.type === 'income' ? '+' : ''}
                        {formatCurrency(s.amount)}
                      </span>
                      <span className="text-slate-400">
                        {' '}
                        {frequencyShort(s.frequency)}
                      </span>
                      {s.frequency !== 'monthly' && (
                        <span className="text-slate-400">
                          {' · '}
                          {formatCurrency(monthlyCost(s))}/mese
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                      {cat && (
                        <span className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      )}
                      {s.method && <span>· {paymentLabel(s.method)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={busy}
                      title={s.active ? 'Metti in pausa' : 'Riattiva'}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      {s.active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={busy}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium',
                      due
                        ? 'text-red-500'
                        : soon
                          ? 'text-amber-600'
                          : 'text-slate-500',
                    )}
                  >
                    <CalendarClock size={15} />
                    {s.active ? (
                      <>
                        {renewalLabel(s.next_payment)}
                        <span className="font-normal text-slate-400">
                          · {formatDate(s.next_payment)}
                        </span>
                      </>
                    ) : (
                      <span className="font-normal text-slate-400">In pausa</span>
                    )}
                  </span>
                  {s.active && (
                    <Button
                      size="sm"
                      variant={due || soon ? 'primary' : 'secondary'}
                      onClick={() => handlePay(s)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <>
                          <Check size={15} />{' '}
                          {s.type === 'income' ? 'Registra incasso' : 'Registra pagamento'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Modifica ricorrente' : 'Nuova ricorrente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense')
                setCategoryId('')
              }}
              className={
                type === 'expense'
                  ? 'rounded-lg bg-red-500 py-2 text-sm font-medium text-white shadow-sm'
                  : 'rounded-lg py-2 text-sm font-medium text-slate-500'
              }
            >
              Uscita
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income')
                setCategoryId('')
              }}
              className={
                type === 'income'
                  ? 'rounded-lg bg-brand-600 py-2 text-sm font-medium text-white shadow-sm'
                  : 'rounded-lg py-2 text-sm font-medium text-slate-500'
              }
            >
              Entrata
            </button>
          </div>

          <Field label="Nome">
            <Input
              autoFocus
              placeholder="Es. Netflix, Stipendio, Affitto…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Importo (€)">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Frequenza">
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Prossimo rinnovo">
            <Input
              type="date"
              value={nextPayment}
              onChange={(e) => setNextPayment(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— Nessuna —</option>
                {formCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Conto">
              <Select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">— Nessuno —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <Label>Metodo di pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const on = method === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(on ? '' : m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors',
                      on
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    <m.icon size={18} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Colore">
            <ColorPicker value={color} onChange={setColor} />
          </Field>

          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Abbonamento attivo
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
