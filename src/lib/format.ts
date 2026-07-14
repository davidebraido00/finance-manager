import { getCurrency } from './settings'

// Formatter valuta cache-ati per codice (la valuta è configurabile).
const currencyCache = new Map<string, Intl.NumberFormat>()
function currencyFmt(): Intl.NumberFormat {
  const code = getCurrency()
  let f = currencyCache.get(code)
  if (!f) {
    f = new Intl.NumberFormat('it-IT', { style: 'currency', currency: code })
    currencyCache.set(code, f)
  }
  return f
}

const currencyNoSign = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return currencyFmt().format(value)
}

/** Importo senza simbolo, con segno + / − davanti. */
export function formatSigned(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${currencyFmt().format(Math.abs(value))}`
}

export function formatNumber(value: number): string {
  return currencyNoSign.format(value)
}

const dateFmt = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const monthFmt = new Intl.DateTimeFormat('it-IT', {
  month: 'long',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso + 'T00:00:00'))
}

export function formatMonth(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const s = monthFmt.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Restituisce 'YYYY-MM-01' per il mese di una data. */
export function monthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** 'YYYY-MM-DD' in locale (non UTC). */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
