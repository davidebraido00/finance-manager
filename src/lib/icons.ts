import {
  Tag,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  ShoppingBag,
  Ellipsis,
  Wallet,
  Briefcase,
  TrendingUp,
  Gift,
  Plane,
  GraduationCap,
  Dumbbell,
  Coffee,
  Fuel,
  Phone,
  Film,
  PiggyBank,
  Landmark,
  CreditCard,
  Banknote,
  type LucideIcon,
} from 'lucide-react'

/** Mappa nome icona (stringa in DB) -> componente lucide. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  'shopping-cart': ShoppingCart,
  home: Home,
  car: Car,
  utensils: Utensils,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  ellipsis: Ellipsis,
  wallet: Wallet,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  gift: Gift,
  plane: Plane,
  'graduation-cap': GraduationCap,
  dumbbell: Dumbbell,
  coffee: Coffee,
  fuel: Fuel,
  phone: Phone,
  film: Film,
  'piggy-bank': PiggyBank,
}

/** Nomi disponibili nel selettore icone. */
export const ICON_NAMES = Object.keys(CATEGORY_ICONS)

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Tag
}

/** Icona per tipo di conto. */
export const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  bank: Landmark,
  cash: Banknote,
  card: CreditCard,
  savings: PiggyBank,
  other: Wallet,
}

export const PALETTE = [
  '#10b981',
  '#059669',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#64748b',
  '#0f172a',
]
