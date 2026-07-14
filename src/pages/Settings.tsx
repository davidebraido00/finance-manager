import { useState, type FormEvent } from 'react'
import { KeyRound, Coins, Landmark, LogOut, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'
import {
  CURRENCIES,
  getCurrency,
  setCurrency,
  getDefaultAccount,
  setDefaultAccount,
} from '../lib/settings'
import { Button, Card, Field, Input, Select, Label } from '../components/ui'
import { PageHeader } from '../components/common'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { accounts } = useData()

  // Valuta
  const [currency, setCurrencyState] = useState(getCurrency())
  function changeCurrency(code: string) {
    setCurrencyState(code)
    setCurrency(code)
    // ricarico per rigenerare tutti i formatter valuta in modo coerente
    window.location.reload()
  }

  // Conto di default
  const [defaultAccount, setDefaultAccountState] = useState(getDefaultAccount())
  function changeDefaultAccount(id: string) {
    setDefaultAccountState(id)
    setDefaultAccount(id)
  }

  // Password
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwOk(false)
    if (password.length < 6) {
      setPwError('La password deve avere almeno 6 caratteri.')
      return
    }
    if (password !== password2) {
      setPwError('Le due password non coincidono.')
      return
    }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPwOk(true)
      setPassword('')
      setPassword2('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Impostazioni" subtitle="Preferenze e account" />

      <div className="space-y-4">
        {/* Account */}
        <Card>
          <h3 className="mb-1 font-semibold text-slate-800">Account</h3>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={signOut}>
              <LogOut size={17} /> Esci
            </Button>
          </div>
        </Card>

        {/* Valuta */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <Coins size={18} className="text-slate-400" /> Valuta
          </h3>
          <Field label="Valuta visualizzata">
            <Select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-2 text-xs text-slate-400">
            Cambia solo come vengono mostrati gli importi; i valori salvati non
            vengono convertiti. La pagina si ricarica per applicare la modifica.
          </p>
        </Card>

        {/* Conto di default */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <Landmark size={18} className="text-slate-400" /> Conto predefinito
          </h3>
          <Field label="Conto preselezionato nelle nuove transazioni">
            <Select
              value={defaultAccount}
              onChange={(e) => changeDefaultAccount(e.target.value)}
            >
              <option value="">— Primo conto disponibile —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        {/* Password */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <KeyRound size={18} className="text-slate-400" /> Cambia password
          </h3>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nuova password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label>Conferma password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            {pwError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {pwError}
              </p>
            )}
            {pwOk && (
              <p className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <Check size={16} /> Password aggiornata.
              </p>
            )}
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? 'Aggiornamento…' : 'Aggiorna password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
