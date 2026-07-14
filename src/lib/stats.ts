import type { Account, Category, Transaction } from '../types'
import { monthKey } from './format'

/** Saldo corrente di un conto = saldo iniziale + entrate − uscite. */
export function accountBalance(
  account: Account,
  transactions: Transaction[],
): number {
  let balance = account.initial_balance
  for (const t of transactions) {
    if (t.account_id !== account.id) continue
    balance += t.type === 'income' ? t.amount : -t.amount
  }
  return balance
}

/** Patrimonio totale su tutti i conti. */
export function totalBalance(
  accounts: Account[],
  transactions: Transaction[],
): number {
  return accounts.reduce((sum, a) => sum + accountBalance(a, transactions), 0)
}

export interface Totals {
  income: number
  expense: number
  net: number
}

export function totalsForMonth(
  transactions: Transaction[],
  month: string,
): Totals {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export interface CategorySlice {
  category: Category
  total: number
}

/** Spese (o entrate) del mese raggruppate per categoria, decrescente. */
export function breakdownByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  type: 'income' | 'expense',
): CategorySlice[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== type) continue
    if (monthKey(t.date) !== month) continue
    if (!t.category_id) continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
  }
  const slices: CategorySlice[] = []
  for (const [catId, total] of map) {
    const category = categories.find((c) => c.id === catId)
    if (category) slices.push({ category, total })
  }
  return slices.sort((a, b) => b.total - a.total)
}

export interface MonthPoint {
  month: string // 'YYYY-MM-01'
  label: string
  income: number
  expense: number
  net: number
}

/** Andamento degli ultimi N mesi (incluso quello corrente). */
export function monthlyTrend(
  transactions: Transaction[],
  months: number,
  reference = new Date(),
): MonthPoint[] {
  const points: MonthPoint[] = []
  const labelFmt = new Intl.DateTimeFormat('it-IT', { month: 'short' })

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1)
    const key = monthKey(d)
    const t = totalsForMonth(transactions, key)
    points.push({
      month: key,
      label: labelFmt.format(d),
      income: t.income,
      expense: t.expense,
      net: t.net,
    })
  }
  return points
}

/** Tasso di risparmio del mese (net / income), 0..1. */
export function savingsRate(totals: Totals): number {
  if (totals.income <= 0) return 0
  return Math.max(0, totals.net / totals.income)
}
