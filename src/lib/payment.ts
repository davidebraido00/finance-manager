import { Banknote, Landmark, CreditCard, type LucideIcon } from 'lucide-react'
import type { PaymentMethod } from '../types'

export const PAYMENT_METHODS: {
  value: PaymentMethod
  label: string
  icon: LucideIcon
  color: string
}[] = [
  { value: 'cash', label: 'Contanti', icon: Banknote, color: '#22c55e' },
  { value: 'bank', label: 'Conto bancario', icon: Landmark, color: '#3b82f6' },
  { value: 'card', label: 'Carta di credito', icon: CreditCard, color: '#8b5cf6' },
]

const byValue = new Map(PAYMENT_METHODS.map((m) => [m.value, m]))

export function paymentMethod(value: PaymentMethod | null | undefined) {
  return value ? byValue.get(value) : undefined
}

export function paymentLabel(value: PaymentMethod | null | undefined): string {
  return paymentMethod(value)?.label ?? ''
}
