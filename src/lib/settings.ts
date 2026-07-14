// Impostazioni utente persistite in localStorage (client-side).
// La valuta è letta da formatCurrency: al cambio si ricarica la pagina
// per rigenerare tutti i formatter in modo coerente.

export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'Dollaro USA ($)' },
  { code: 'GBP', label: 'Sterlina (£)' },
  { code: 'CHF', label: 'Franco svizzero (CHF)' },
  { code: 'JPY', label: 'Yen (¥)' },
]

const CURRENCY_KEY = 'fm.currency'
const DEFAULT_ACCOUNT_KEY = 'fm.defaultAccount'

function read(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function getCurrency(): string {
  return read(CURRENCY_KEY, 'EUR')
}

export function setCurrency(code: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, code)
  } catch {
    /* ignore */
  }
}

export function getDefaultAccount(): string {
  return read(DEFAULT_ACCOUNT_KEY, '')
}

export function setDefaultAccount(id: string): void {
  try {
    if (id) localStorage.setItem(DEFAULT_ACCOUNT_KEY, id)
    else localStorage.removeItem(DEFAULT_ACCOUNT_KEY)
  } catch {
    /* ignore */
  }
}
