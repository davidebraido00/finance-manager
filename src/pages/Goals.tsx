import { useState, type FormEvent } from 'react'
import { Plus, Target, Pencil, Trash2, PiggyBank, Check, Flag } from 'lucide-react'
import { useData, type NewGoal } from '../context/DataContext'
import type { Goal } from '../types'
import { formatCurrency, formatDate } from '../lib/format'
import { CATEGORY_ICONS, ICON_NAMES, getCategoryIcon, PALETTE } from '../lib/icons'
import { daysUntil } from '../lib/subscription'
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  Spinner,
  EmptyState,
  cn,
} from '../components/ui'
import { PageHeader } from '../components/common'
import { ColorPicker } from './Accounts'

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, addToGoal, loading } = useData()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [funding, setFunding] = useState<Goal | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Form
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [icon, setIcon] = useState('piggy-bank')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fund modal
  const [fundAmount, setFundAmount] = useState('')
  const [fundBusy, setFundBusy] = useState(false)

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)

  function openNew() {
    setEditing(null)
    setName('')
    setTarget('')
    setCurrent('')
    setDeadline('')
    setColor(PALETTE[0])
    setIcon('piggy-bank')
    setError(null)
    setOpen(true)
  }
  function openEdit(g: Goal) {
    setEditing(g)
    setName(g.name)
    setTarget(String(g.target_amount))
    setCurrent(String(g.current_amount))
    setDeadline(g.deadline ?? '')
    setColor(g.color)
    setIcon(g.icon)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Inserisci un nome.')
      return
    }
    const targetVal = parseFloat(target.replace(',', '.'))
    if (!Number.isFinite(targetVal) || targetVal <= 0) {
      setError('Inserisci un obiettivo valido.')
      return
    }
    const currentVal = parseFloat(current.replace(',', '.')) || 0
    const payload: NewGoal = {
      name: name.trim(),
      target_amount: targetVal,
      current_amount: Math.max(0, currentVal),
      color,
      icon,
      deadline: deadline || null,
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateGoal(editing.id, payload)
      else await addGoal(payload)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(g: Goal) {
    if (!confirm(`Eliminare l'obiettivo "${g.name}"?`)) return
    setBusyId(g.id)
    try {
      await deleteGoal(g.id)
    } finally {
      setBusyId(null)
    }
  }

  function openFund(g: Goal) {
    setFunding(g)
    setFundAmount('')
  }
  async function applyFund(sign: 1 | -1) {
    if (!funding) return
    const value = parseFloat(fundAmount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    setFundBusy(true)
    try {
      await addToGoal(funding, sign * value)
      setFunding(null)
    } finally {
      setFundBusy(false)
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
        title="Obiettivi"
        subtitle="Metti da parte per i tuoi traguardi"
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Nuovo obiettivo
          </Button>
        }
      />

      {goals.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Totale accantonato</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(totalSaved)}
                <span className="text-base font-medium text-slate-400">
                  {' '}
                  / {formatCurrency(totalTarget)}
                </span>
              </div>
            </div>
            <PiggyBank size={32} className="text-brand-500" />
          </div>
          <ProgressBar value={totalSaved} max={totalTarget} className="mt-4" />
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={26} />}
          title="Nessun obiettivo"
          description="Crea un obiettivo di risparmio (vacanza, fondo emergenza, acquisto…) e monitora quanto manca."
          action={
            <Button onClick={openNew}>
              <Plus size={18} /> Crea obiettivo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const Icon = getCategoryIcon(g.icon)
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
            const done = g.current_amount >= g.target_amount && g.target_amount > 0
            const days = g.deadline ? daysUntil(g.deadline) : null
            const busy = busyId === g.id
            return (
              <Card key={g.id} className={cn(busy && 'opacity-60')}>
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: g.color }}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(g)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 font-semibold text-slate-800">{g.name}</div>
                <div className="text-sm text-slate-500">
                  {formatCurrency(g.current_amount)}
                  <span className="text-slate-400">
                    {' '}
                    / {formatCurrency(g.target_amount)}
                  </span>
                </div>

                <ProgressBar value={g.current_amount} max={g.target_amount} className="mt-3" />

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  {done ? (
                    <span className="flex items-center gap-1 font-medium text-brand-600">
                      <Check size={14} /> Obiettivo raggiunto!
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {Math.round(pct)}% · mancano{' '}
                      {formatCurrency(Math.max(0, g.target_amount - g.current_amount))}
                    </span>
                  )}
                </div>

                {g.deadline && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Flag size={13} />
                    {formatDate(g.deadline)}
                    {days !== null && days >= 0 && ` · tra ${days} giorni`}
                    {days !== null && days < 0 && ' · scaduto'}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => openFund(g)}
                >
                  <Plus size={15} /> Aggiungi accantonamento
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal crea/modifica */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Modifica obiettivo' : 'Nuovo obiettivo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome">
            <Input
              autoFocus
              placeholder="Es. Vacanza, Fondo emergenza…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Obiettivo (€)">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Field label="Già accantonato (€)">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Scadenza (facoltativa)">
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>

          <Field label="Icona">
            <div className="grid grid-cols-8 gap-2">
              {ICON_NAMES.map((n) => {
                const Ic = CATEGORY_ICONS[n]
                const active = icon === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIcon(n)}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-xl border transition-colors',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    <Ic size={18} />
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Colore">
            <ColorPicker value={color} onChange={setColor} />
          </Field>

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

      {/* Modal accantonamento */}
      <Modal
        open={!!funding}
        onClose={() => setFunding(null)}
        title={`Accantonamento · ${funding?.name ?? ''}`}
      >
        <div className="space-y-4">
          <Field label="Importo (€)">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => applyFund(-1)}
              disabled={fundBusy}
            >
              Preleva
            </Button>
            <Button
              className="flex-1"
              onClick={() => applyFund(1)}
              disabled={fundBusy}
            >
              {fundBusy ? '…' : 'Aggiungi'}
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
  const done = value >= max && max > 0
  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-slate-100',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all', done ? 'bg-brand-600' : 'bg-brand-500')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
