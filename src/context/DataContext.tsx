import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type {
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type {
  Account,
  Budget,
  Category,
  Goal,
  Subscription,
  Transaction,
} from '../types'
import { advanceDate } from '../lib/subscription'

interface DataState {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  subscriptions: Subscription[]
  goals: Goal[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>

  addTransaction: (t: NewTransaction) => Promise<void>
  updateTransaction: (id: string, t: NewTransaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  addAccount: (a: NewAccount) => Promise<void>
  updateAccount: (id: string, a: NewAccount) => Promise<void>
  deleteAccount: (id: string) => Promise<void>

  addCategory: (c: NewCategory) => Promise<void>
  updateCategory: (id: string, c: NewCategory) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  setBudget: (categoryId: string, month: string, amount: number) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  addSubscription: (s: NewSubscription) => Promise<void>
  updateSubscription: (id: string, s: NewSubscription) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  /** Crea la transazione del rinnovo e sposta avanti next_payment. */
  paySubscription: (sub: Subscription) => Promise<void>

  addGoal: (g: NewGoal) => Promise<void>
  updateGoal: (id: string, g: NewGoal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  /** Aggiunge (o sottrae) un accantonamento a un obiettivo. */
  addToGoal: (goal: Goal, delta: number) => Promise<void>
}

export type NewTransaction = Pick<
  Transaction,
  | 'account_id'
  | 'category_id'
  | 'type'
  | 'amount'
  | 'description'
  | 'date'
  | 'method'
>
export type NewAccount = Pick<
  Account,
  'name' | 'type' | 'initial_balance' | 'color'
>
export type NewCategory = Pick<Category, 'name' | 'type' | 'color' | 'icon'>
export type NewSubscription = Pick<
  Subscription,
  | 'name'
  | 'type'
  | 'amount'
  | 'frequency'
  | 'next_payment'
  | 'category_id'
  | 'account_id'
  | 'method'
  | 'color'
  | 'active'
>
export type NewGoal = Pick<
  Goal,
  'name' | 'target_amount' | 'current_amount' | 'color' | 'icon' | 'deadline'
>

const DataContext = createContext<DataState | undefined>(undefined)

// ---- ordinamenti ----
const byDateDesc = (a: Transaction, b: Transaction) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : b.created_at.localeCompare(a.created_at)
const byNextPayment = (a: Subscription, b: Subscription) =>
  a.next_payment.localeCompare(b.next_payment)
const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const [acc, cat, tx, bud, sub, goal] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('subscriptions').select('*').order('next_payment'),
        supabase.from('goals').select('*').order('created_at'),
      ])
      if (acc.error) throw acc.error
      if (cat.error) throw cat.error
      if (tx.error) throw tx.error
      if (bud.error) throw bud.error
      if (sub.error) throw sub.error
      if (goal.error) throw goal.error
      setAccounts(acc.data)
      setCategories(cat.data)
      setTransactions(tx.data)
      setBudgets(bud.data)
      setSubscriptions(sub.data)
      setGoals(goal.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di caricamento')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setLoading(true)
      refresh()
    } else {
      setAccounts([])
      setCategories([])
      setTransactions([])
      setBudgets([])
      setSubscriptions([])
      setGoals([])
      setLoading(false)
    }
  }, [user, refresh])

  // ---- Realtime: sincronizza le modifiche da altri dispositivi ----
  useEffect(() => {
    if (!user) return

    function apply<T extends { id: string }>(
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      payload: RealtimePostgresChangesPayload<T>,
      sort?: (a: T, b: T) => number,
    ) {
      if (payload.eventType === 'DELETE') {
        const oldId = (payload.old as Partial<T>).id
        if (oldId) setter((prev) => prev.filter((r) => r.id !== oldId))
        return
      }
      const row = payload.new as T
      setter((prev) => {
        const next = [...prev.filter((r) => r.id !== row.id), row]
        return sort ? next.sort(sort) : next
      })
    }

    const filter = `user_id=eq.${user.id}`
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter },
        (p) => apply(setTransactions, p as RealtimePostgresChangesPayload<Transaction>, byDateDesc),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter },
        (p) => apply(setAccounts, p as RealtimePostgresChangesPayload<Account>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter },
        (p) => apply(setCategories, p as RealtimePostgresChangesPayload<Category>, byName),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter },
        (p) => apply(setBudgets, p as RealtimePostgresChangesPayload<Budget>),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter },
        (p) => apply(setSubscriptions, p as RealtimePostgresChangesPayload<Subscription>, byNextPayment),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter },
        (p) => apply(setGoals, p as RealtimePostgresChangesPayload<Goal>),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  function requireUser() {
    if (!user) throw new Error('Non autenticato')
    return user.id
  }

  // ---------- Transactions ----------
  async function addTransaction(t: NewTransaction) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...t, user_id })
      .select()
      .single()
    if (error) throw error
    setTransactions((prev) => [data, ...prev].sort(byDateDesc))
  }
  async function updateTransaction(id: string, t: NewTransaction) {
    const prev = transactions
    setTransactions((cur) =>
      cur.map((x) => (x.id === id ? { ...x, ...t } : x)).sort(byDateDesc),
    )
    const { error } = await supabase.from('transactions').update(t).eq('id', id)
    if (error) {
      setTransactions(prev)
      throw error
    }
  }
  async function deleteTransaction(id: string) {
    const prev = transactions
    setTransactions((cur) => cur.filter((x) => x.id !== id))
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      setTransactions(prev)
      throw error
    }
  }

  // ---------- Accounts ----------
  async function addAccount(a: NewAccount) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...a, user_id })
      .select()
      .single()
    if (error) throw error
    setAccounts((prev) => [...prev, data])
  }
  async function updateAccount(id: string, a: NewAccount) {
    const prev = accounts
    setAccounts((cur) => cur.map((x) => (x.id === id ? { ...x, ...a } : x)))
    const { error } = await supabase.from('accounts').update(a).eq('id', id)
    if (error) {
      setAccounts(prev)
      throw error
    }
  }
  async function deleteAccount(id: string) {
    const prev = accounts
    setAccounts((cur) => cur.filter((x) => x.id !== id))
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) {
      setAccounts(prev)
      throw error
    }
  }

  // ---------- Categories ----------
  async function addCategory(c: NewCategory) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...c, user_id })
      .select()
      .single()
    if (error) throw error
    setCategories((prev) => [...prev, data].sort(byName))
  }
  async function updateCategory(id: string, c: NewCategory) {
    const prev = categories
    setCategories((cur) =>
      cur.map((x) => (x.id === id ? { ...x, ...c } : x)).sort(byName),
    )
    const { error } = await supabase.from('categories').update(c).eq('id', id)
    if (error) {
      setCategories(prev)
      throw error
    }
  }
  async function deleteCategory(id: string) {
    const prev = categories
    setCategories((cur) => cur.filter((x) => x.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      setCategories(prev)
      throw error
    }
  }

  // ---------- Budgets ----------
  async function setBudget(categoryId: string, month: string, amount: number) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { user_id, category_id: categoryId, month, amount },
        { onConflict: 'user_id,category_id,month' },
      )
      .select()
      .single()
    if (error) throw error
    setBudgets((prev) => [
      ...prev.filter((b) => !(b.category_id === categoryId && b.month === month)),
      data,
    ])
  }
  async function deleteBudget(id: string) {
    const prev = budgets
    setBudgets((cur) => cur.filter((b) => b.id !== id))
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) {
      setBudgets(prev)
      throw error
    }
  }

  // ---------- Subscriptions ----------
  async function addSubscription(s: NewSubscription) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ ...s, user_id })
      .select()
      .single()
    if (error) throw error
    setSubscriptions((prev) => [...prev, data].sort(byNextPayment))
  }
  async function updateSubscription(id: string, s: NewSubscription) {
    const prev = subscriptions
    setSubscriptions((cur) =>
      cur.map((x) => (x.id === id ? { ...x, ...s } : x)).sort(byNextPayment),
    )
    const { error } = await supabase.from('subscriptions').update(s).eq('id', id)
    if (error) {
      setSubscriptions(prev)
      throw error
    }
  }
  async function deleteSubscription(id: string) {
    const prev = subscriptions
    setSubscriptions((cur) => cur.filter((x) => x.id !== id))
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (error) {
      setSubscriptions(prev)
      throw error
    }
  }
  async function paySubscription(sub: Subscription) {
    const user_id = requireUser()
    const newDate = advanceDate(sub.next_payment, sub.frequency)
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: sub.type,
        amount: sub.amount,
        description: sub.name,
        date: sub.next_payment,
        category_id: sub.category_id,
        account_id: sub.account_id,
        method: sub.method,
      })
      .select()
      .single()
    if (txError) throw txError
    setTransactions((prev) => [tx, ...prev].sort(byDateDesc))
    setSubscriptions((prev) =>
      prev
        .map((s) => (s.id === sub.id ? { ...s, next_payment: newDate } : s))
        .sort(byNextPayment),
    )
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ next_payment: newDate })
      .eq('id', sub.id)
    if (subError) {
      await refresh()
      throw subError
    }
  }

  // ---------- Goals ----------
  async function addGoal(g: NewGoal) {
    const user_id = requireUser()
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...g, user_id })
      .select()
      .single()
    if (error) throw error
    setGoals((prev) => [...prev, data])
  }
  async function updateGoal(id: string, g: NewGoal) {
    const prev = goals
    setGoals((cur) => cur.map((x) => (x.id === id ? { ...x, ...g } : x)))
    const { error } = await supabase.from('goals').update(g).eq('id', id)
    if (error) {
      setGoals(prev)
      throw error
    }
  }
  async function deleteGoal(id: string) {
    const prev = goals
    setGoals((cur) => cur.filter((x) => x.id !== id))
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) {
      setGoals(prev)
      throw error
    }
  }
  async function addToGoal(goal: Goal, delta: number) {
    const next = Math.max(0, goal.current_amount + delta)
    const prev = goals
    setGoals((cur) =>
      cur.map((x) => (x.id === goal.id ? { ...x, current_amount: next } : x)),
    )
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: next })
      .eq('id', goal.id)
    if (error) {
      setGoals(prev)
      throw error
    }
  }

  return (
    <DataContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        budgets,
        subscriptions,
        goals,
        loading,
        error,
        refresh,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudget,
        deleteBudget,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        paySubscription,
        addGoal,
        updateGoal,
        deleteGoal,
        addToGoal,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve essere usato dentro DataProvider')
  return ctx
}
