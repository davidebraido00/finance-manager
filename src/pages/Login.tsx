import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Field, Spinner } from '../components/ui'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setNotice(
          'Registrazione completata! Se richiesta, controlla la mail per confermare, poi accedi.',
        )
        setMode('signin')
      }
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Finance Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestisci entrate, uscite e budget in un unico posto.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('signin')}
              className={tab(mode === 'signin')}
            >
              Accedi
            </button>
            <button
              onClick={() => setMode('signup')}
              className={tab(mode === 'signup')}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@esempio.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                {notice}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Spinner className="border-white/40 border-t-white" />
              ) : mode === 'signin' ? (
                'Accedi'
              ) : (
                'Crea account'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          I tuoi dati sono protetti da Row Level Security su Supabase.
        </p>
      </div>
    </div>
  )
}

function tab(active: boolean) {
  return `rounded-lg py-2 text-sm font-medium transition-colors ${
    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`
}

function translateError(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return 'Email o password non validi.'
  if (/already registered/i.test(msg)) return 'Questa email è già registrata.'
  if (/Password should be/i.test(msg))
    return 'La password deve avere almeno 6 caratteri.'
  if (/Email not confirmed/i.test(msg))
    return 'Email non confermata. Controlla la tua casella di posta.'
  return msg
}
