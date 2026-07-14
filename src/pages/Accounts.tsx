import { useState, type FormEvent } from 'react'
import { Plus, Landmark, Pencil, Trash2 } from 'lucide-react'
import { useData, type NewAccount } from '../context/DataContext'
import type { Account, AccountType } from '../types'
import { accountBalance, totalBalance } from '../lib/stats'
import { formatCurrency } from '../lib/format'
import { ACCOUNT_ICONS, PALETTE } from '../lib/icons'
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
} from '../components/ui'
import { PageHeader } from '../components/common'

const TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Conto bancario',
  cash: 'Contanti',
  card: 'Carta',
  savings: 'Risparmio',
  other: 'Altro',
}

export default function Accounts() {
  const {
    accounts,
    transactions,
    addAccount,
    updateAccount,
    deleteAccount,
    loading,
  } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setName('')
    setType('bank')
    setBalance('')
    setColor(PALETTE[0])
    setError(null)
    setOpen(true)
  }
  function openEdit(a: Account) {
    setEditing(a)
    setName(a.name)
    setType(a.type)
    setBalance(String(a.initial_balance))
    setColor(a.color)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Inserisci un nome.')
      return
    }
    const payload: NewAccount = {
      name: name.trim(),
      type,
      initial_balance: parseFloat(balance.replace(',', '.')) || 0,
      color,
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateAccount(editing.id, payload)
      else await addAccount(payload)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(a: Account) {
    if (
      !confirm(
        `Eliminare il conto "${a.name}"? Le transazioni collegate resteranno ma senza conto.`,
      )
    )
      return
    await deleteAccount(a.id)
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
        title="Conti"
        subtitle={`Patrimonio totale: ${formatCurrency(totalBalance(accounts, transactions))}`}
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Nuovo conto
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const Icon = ACCOUNT_ICONS[a.type] ?? Landmark
          const bal = accountBalance(a, transactions)
          return (
            <Card key={a.id} className="group relative">
              <div className="flex items-start justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: a.color }}
                >
                  <Icon size={20} />
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">{a.name}</div>
              <div className="text-xs text-slate-400">{TYPE_LABELS[a.type]}</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  bal < 0 ? 'text-red-500' : 'text-slate-900'
                }`}
              >
                {formatCurrency(bal)}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Modifica conto' : 'Nuovo conto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome">
            <Input
              autoFocus
              placeholder="Es. Conto corrente"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Saldo iniziale (€)">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </Field>
          </div>
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
    </div>
  )
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-8 w-8 rounded-full transition-transform ${
            value === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
          }`}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}
