import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useData, type NewTransaction } from '../context/DataContext'
import type { PaymentMethod, Transaction } from '../types'
import { todayISO } from '../lib/format'
import { getDefaultAccount } from '../lib/settings'
import { PAYMENT_METHODS } from '../lib/payment'
import { Button, Field, Input, Label, Modal, Select, cn } from './ui'

export function TransactionForm({
  open,
  onClose,
  editing,
  defaultType = 'expense',
}: {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
  defaultType?: 'income' | 'expense'
}) {
  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData()

  const [type, setType] = useState<'income' | 'expense'>(defaultType)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setDescription(editing.description)
      setDate(editing.date)
      setCategoryId(editing.category_id ?? '')
      setAccountId(editing.account_id ?? '')
      setMethod(editing.method ?? '')
    } else {
      setType(defaultType)
      setAmount('')
      setDescription('')
      setDate(todayISO())
      setCategoryId('')
      const preferred = getDefaultAccount()
      const exists = accounts.some((a) => a.id === preferred)
      setAccountId(exists ? preferred : (accounts[0]?.id ?? ''))
      setMethod('')
    }
  }, [open, editing, defaultType, accounts])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseFloat(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Inserisci un importo valido.')
      return
    }
    setSaving(true)
    setError(null)
    const payload: NewTransaction = {
      type,
      amount: value,
      description: description.trim(),
      date,
      category_id: categoryId || null,
      account_id: accountId || null,
      method: method || null,
    }
    try {
      if (editing) await updateTransaction(editing.id, payload)
      else await addTransaction(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di salvataggio')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('Eliminare questa transazione?')) return
    setSaving(true)
    try {
      await deleteTransaction(editing.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifica transazione' : 'Nuova transazione'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle tipo */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setType('expense')
              setCategoryId('')
            }}
            className={typeTab(type === 'expense', 'expense')}
          >
            Uscita
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income')
              setCategoryId('')
            }}
            className={typeTab(type === 'income', 'income')}
          >
            Entrata
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Importo (€)">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Descrizione">
          <Input
            type="text"
            placeholder="Es. Spesa al supermercato"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— Nessuna —</option>
              {filteredCategories.map((c) => (
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
              const active = method === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(active ? '' : m.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors',
                    active
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

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {editing && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function typeTab(active: boolean, type: 'income' | 'expense') {
  if (!active) return 'rounded-lg py-2 text-sm font-medium text-slate-500'
  return `rounded-lg py-2 text-sm font-medium text-white shadow-sm ${
    type === 'income' ? 'bg-brand-600' : 'bg-red-500'
  }`
}
