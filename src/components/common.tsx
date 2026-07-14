import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMonth, monthKey } from '../lib/format'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function MonthSelector({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  function shift(delta: number) {
    const d = new Date(month + 'T00:00:00')
    d.setMonth(d.getMonth() + delta)
    onChange(monthKey(d))
  }

  const isCurrent = month === monthKey(new Date())

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <button
        onClick={() => shift(-1)}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        aria-label="Mese precedente"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-[9rem] text-center text-sm font-medium text-slate-700">
        {formatMonth(month)}
      </span>
      <button
        onClick={() => shift(1)}
        disabled={isCurrent}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        aria-label="Mese successivo"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
