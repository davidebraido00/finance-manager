import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { useData, type NewCategory } from '../context/DataContext'
import type { Category, TransactionType } from '../types'
import { CATEGORY_ICONS, ICON_NAMES, getCategoryIcon, PALETTE } from '../lib/icons'
import { Button, Card, Field, Input, Modal, Spinner, EmptyState } from '../components/ui'
import { PageHeader } from '../components/common'
import { ColorPicker } from './Accounts'

export default function Categories() {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    loading,
  } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(PALETTE[0])
  const [icon, setIcon] = useState('tag')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expense = categories.filter((c) => c.type === 'expense')
  const income = categories.filter((c) => c.type === 'income')

  function openNew(t: TransactionType) {
    setEditing(null)
    setName('')
    setType(t)
    setColor(PALETTE[0])
    setIcon('tag')
    setError(null)
    setOpen(true)
  }
  function openEdit(c: Category) {
    setEditing(c)
    setName(c.name)
    setType(c.type)
    setColor(c.color)
    setIcon(c.icon)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Inserisci un nome.')
      return
    }
    const payload: NewCategory = { name: name.trim(), type, color, icon }
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateCategory(editing.id, payload)
      else await addCategory(payload)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: Category) {
    const count = transactions.filter((t) => t.category_id === c.id).length
    const msg =
      count > 0
        ? `Eliminare "${c.name}"? ${count} transazioni resteranno senza categoria.`
        : `Eliminare la categoria "${c.name}"?`
    if (!confirm(msg)) return
    await deleteCategory(c.id)
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
        title="Categorie"
        subtitle="Organizza entrate e uscite per categoria"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryColumn
          title="Uscite"
          accent="text-red-500"
          items={expense}
          transactions={transactions}
          onAdd={() => openNew('expense')}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
        <CategoryColumn
          title="Entrate"
          accent="text-brand-600"
          items={income}
          transactions={transactions}
          onAdd={() => openNew('income')}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Modifica categoria' : 'Nuova categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome">
            <Input
              autoFocus
              placeholder="Es. Ristoranti"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Icona">
            <div className="grid grid-cols-8 gap-2">
              {ICON_NAMES.map((n) => {
                const Icon = CATEGORY_ICONS[n]
                const active = icon === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIcon(n)}
                    className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
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
    </div>
  )
}

function CategoryColumn({
  title,
  accent,
  items,
  transactions,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string
  accent: string
  items: Category[]
  transactions: { category_id: string | null }[]
  onAdd: () => void
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`font-semibold ${accent}`}>{title}</h2>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus size={16} /> Aggiungi
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Tags size={24} />}
          title="Nessuna categoria"
          description="Aggiungi la prima categoria."
        />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const Icon = getCategoryIcon(c.icon)
            const count = transactions.filter((t) => t.category_id === c.id).length
            return (
              <Card
                key={c.id}
                className="group flex items-center gap-3 p-3"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                >
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    {count} {count === 1 ? 'transazione' : 'transazioni'}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
