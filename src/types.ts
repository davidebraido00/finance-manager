export type TransactionType = 'income' | 'expense'
export type AccountType = 'bank' | 'cash' | 'card' | 'savings' | 'other'
export type PaymentMethod = 'cash' | 'bank' | 'card'
export type BillingFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

// NB: queste entità sono `type` (non `interface`) di proposito: un object
// `type` ha un index signature implicito e soddisfa `Record<string, unknown>`,
// requisito del client tipizzato di supabase-js. Un'`interface` no.
export type Account = {
  id: string
  user_id: string
  name: string
  type: AccountType
  initial_balance: number
  color: string
  created_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  description: string
  date: string
  method: PaymentMethod | null
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: string
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  name: string
  type: TransactionType
  amount: number
  frequency: BillingFrequency
  next_payment: string
  category_id: string | null
  account_id: string | null
  method: PaymentMethod | null
  color: string
  active: boolean
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  color: string
  icon: string
  deadline: string | null
  created_at: string
}

/** Transazione con relazioni espanse (per liste/statistiche). */
export type TransactionWithRelations = Transaction & {
  category: Category | null
  account: Account | null
}

// ---- Tipi helper per il client tipizzato di supabase-js ----
type Insert<T> = Omit<T, 'id' | 'user_id' | 'created_at'> & {
  id?: string
  user_id: string
  created_at?: string
}
type Update<T> = Partial<Insert<T>>

type Table<Row> = {
  Row: Row
  Insert: Insert<Row>
  Update: Update<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      accounts: Table<Account>
      categories: Table<Category>
      transactions: Table<Transaction>
      budgets: Table<Budget>
      subscriptions: Table<Subscription>
      goals: Table<Goal>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      transaction_type: TransactionType
      account_type: AccountType
    }
  }
}
