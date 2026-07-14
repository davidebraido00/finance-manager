import type { BillingFrequency, Subscription, TransactionType } from '../types'

export const FREQUENCIES: { value: BillingFrequency; label: string; short: string }[] =
  [
    { value: 'weekly', label: 'Settimanale', short: '/sett.' },
    { value: 'monthly', label: 'Mensile', short: '/mese' },
    { value: 'quarterly', label: 'Trimestrale', short: '/trim.' },
    { value: 'yearly', label: 'Annuale', short: '/anno' },
  ]

const freqMap = new Map(FREQUENCIES.map((f) => [f.value, f]))

export function frequencyLabel(f: BillingFrequency): string {
  return freqMap.get(f)?.label ?? f
}
export function frequencyShort(f: BillingFrequency): string {
  return freqMap.get(f)?.short ?? ''
}

/** Costo di un abbonamento normalizzato su base mensile. */
export function monthlyCost(sub: Pick<Subscription, 'amount' | 'frequency'>): number {
  switch (sub.frequency) {
    case 'weekly':
      return (sub.amount * 52) / 12
    case 'monthly':
      return sub.amount
    case 'quarterly':
      return sub.amount / 3
    case 'yearly':
      return sub.amount / 12
  }
}

/** Somma del costo mensile delle ricorrenti attive (opz. filtrate per tipo). */
export function totalMonthly(
  subs: Subscription[],
  type?: TransactionType,
): number {
  return subs
    .filter((s) => s.active && (!type || s.type === type))
    .reduce((sum, s) => sum + monthlyCost(s), 0)
}

/** Data del prossimo rinnovo a partire da una data e una frequenza. */
export function advanceDate(iso: string, frequency: BillingFrequency): string {
  const d = new Date(iso + 'T00:00:00')
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Giorni mancanti al rinnovo (negativo = scaduto). */
export function daysUntil(iso: string, today = new Date()): number {
  const target = new Date(iso + 'T00:00:00')
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - base.getTime()) / 86_400_000)
}

/** Etichetta relativa: "Oggi", "Domani", "tra 3 giorni", "5 giorni fa". */
export function renewalLabel(iso: string, today = new Date()): string {
  const d = daysUntil(iso, today)
  if (d === 0) return 'Oggi'
  if (d === 1) return 'Domani'
  if (d === -1) return 'Ieri'
  if (d > 1) return `Tra ${d} giorni`
  return `${Math.abs(d)} giorni fa`
}
