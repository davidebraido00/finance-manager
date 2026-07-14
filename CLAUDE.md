# CLAUDE.md

Guida per lavorare su questo progetto con Claude Code. Contiene architettura,
convenzioni, comandi e le insidie da conoscere. La lingua del progetto (UI, testi,
commenti) è **italiano**; la valuta di default è **EUR**.

## Cos'è

**Finance Manager** — webapp per la gestione delle finanze personali: transazioni
(entrate/uscite), budget mensili, ricorrenti (entrate/uscite), obiettivi di
risparmio, conti multipli, statistiche. Single-user per account, dati isolati via
Row Level Security su Supabase.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, config nel CSS via `@theme` — niente `tailwind.config.js`)
- **Supabase** (`@supabase/supabase-js` v2): auth email/password, Postgres, RLS, Realtime
- **React Router v6** (BrowserRouter)
- **Recharts** (grafici, solo in Dashboard)
- **lucide-react** (icone), **date-fns** (installato; la formattazione usa però `Intl`)
- **vite-plugin-pwa** (PWA: manifest + service worker Workbox)

## Comandi

```bash
npm install        # dipendenze
npm run dev        # dev server -> http://localhost:5173
npm run build      # tsc -b && vite build (type-check + build prod)
npm run preview    # anteprima della build (necessaria per testare la PWA)
npm run lint       # eslint
```

Non esiste una suite di test. La verifica si fa con `npm run build` (che fa il
type-check completo) e provando l'app nel browser.

## Setup Supabase (obbligatorio per far girare l'app)

1. Copia `.env.example` in `.env` e inserisci `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` dal tuo progetto Supabase (Project Settings → API).
   Senza queste variabili l'app lancia un errore all'avvio (vedi `src/lib/supabase.ts`).
2. Esegui **tutto** `supabase/schema.sql` nel SQL Editor di Supabase.
   Lo schema è **idempotente e auto-migrante**: puoi rieseguirlo in sicurezza su un
   DB già inizializzato (enum con gestori `duplicate_object`, tabelle
   `create ... if not exists`, colonne aggiunte con `alter table ... add column
   if not exists`). Nessun dato viene perso.

`.env` è in `.gitignore` e non va mai committato. La `anon key` è pubblica e sicura
da esporre nel frontend: la protezione è data dalla RLS.

## Struttura

```
src/
├─ components/
│  ├─ ui.tsx              # primitive UI (Card, Button, Input, Select, Modal, Badge, cn, ...)
│  ├─ Layout.tsx          # sidebar + topbar mobile + banner errore globale (Outlet)
│  ├─ common.tsx          # PageHeader, MonthSelector
│  └─ TransactionForm.tsx # modale crea/modifica transazione (usata da più pagine)
├─ context/
│  ├─ AuthContext.tsx     # sessione Supabase, signIn/signUp/signOut
│  └─ DataContext.tsx     # TUTTI i dati + CRUD ottimistico + realtime (cuore dell'app)
├─ lib/
│  ├─ supabase.ts         # client tipizzato (createClient<Database>)
│  ├─ format.ts           # formatCurrency/formatDate/monthKey/... (valuta configurabile)
│  ├─ stats.ts            # calcoli: saldi conti, totali mese, trend, breakdown categorie
│  ├─ icons.ts            # mappa nome->icona lucide, PALETTE colori
│  ├─ payment.ts          # metodi di pagamento (contanti/bank/card): label + icone
│  ├─ subscription.ts     # ricorrenti: frequenze, costo mensile, advanceDate, daysUntil
│  └─ settings.ts         # preferenze in localStorage (valuta, conto di default)
├─ pages/
│  ├─ Login.tsx           # accedi/registrati (eager, non lazy)
│  ├─ Dashboard.tsx       # KPI, grafici Recharts, selettore mese, widget rinnovi
│  ├─ Transactions.tsx    # lista con filtri (tipo/cat/conto/metodo/date) + paginazione
│  ├─ Subscriptions.tsx   # "Ricorrenti" (entrate+uscite). NB: route /ricorrenti
│  ├─ Budgets.tsx         # budget mensili per categoria
│  ├─ Goals.tsx           # obiettivi di risparmio
│  ├─ Accounts.tsx        # conti (esporta anche ColorPicker, riusato altrove)
│  ├─ Categories.tsx      # categorie entrate/uscite
│  └─ Settings.tsx        # valuta, conto default, cambio password
├─ types.ts               # tipi dominio + tipizzazione DB per supabase-js
├─ App.tsx                # routing + lazy loading + provider
└─ main.tsx
supabase/schema.sql        # tabelle, RLS, trigger di seed, realtime (idempotente)
```

## Modello dati (tabelle Postgres)

Tutte con `user_id uuid` e RLS `auth.uid() = user_id` (select/insert/update/delete).

- **accounts** — conti: `name, type(bank|cash|card|savings|other), initial_balance, color`
- **categories** — categorie: `name, type(income|expense), color, icon`
- **transactions** — movimenti: `type(income|expense), amount, description, date, category_id, account_id, method(payment_method?)`
- **budgets** — tetti mensili: `category_id, amount, month(primo del mese)`, unico per `(user_id, category_id, month)`
- **subscriptions** — ricorrenti: `name, type(income|expense), amount, frequency(weekly|monthly|quarterly|yearly), next_payment, category_id, account_id, method, color, active`
- **goals** — obiettivi: `name, target_amount, current_amount, color, icon, deadline?`

Enum: `transaction_type`, `account_type`, `payment_method`, `billing_frequency`.

Alla registrazione, il trigger `seed_default_data` crea un conto "Conto principale" e
un set di categorie di default (entrate + uscite).

I saldi dei conti e le statistiche sono **calcolati client-side** da tutte le
transazioni (vedi `lib/stats.ts`); non ci sono colonne aggregate sul DB.

## Gestione stato — `DataContext` (importante)

È il cuore dell'app. Carica accounts/categories/transactions/budgets/subscriptions/goals
al login e li tiene in memoria. Espone i dati e tutte le operazioni CRUD via `useData()`.

- **Aggiornamenti ottimistici**: le mutazioni modificano lo stato locale
  *immediatamente*; niente refetch completo. In caso di errore fanno **rollback**
  allo stato precedente e rilanciano l'errore (le pagine mostrano il messaggio).
  Gli insert usano `.insert(...).select().single()` per avere id/created_at reali.
- **Realtime**: un canale Supabase `postgres_changes` (filtrato per `user_id`)
  applica le modifiche da altri dispositivi. L'apply è **idempotente** (upsert per id),
  quindi gli echo delle proprie mutazioni non creano duplicati.
- `paySubscription(sub)` crea la transazione del rinnovo (usando `sub.type`) e sposta
  `next_payment` avanti di una frequenza.
- `error` del context è mostrato come banner globale in `Layout.tsx` (utile a
  diagnosticare, es. schema non aggiornato).

## Convenzioni e insidie (leggere prima di modificare)

- **`type` vs `interface` per le entità DB** — le entità in `types.ts` sono dichiarate
  come `type` (non `interface`) **di proposito**: un object `type` ha un index
  signature implicito e soddisfa `Record<string, unknown>`, requisito del client
  tipizzato di supabase-js. Con `interface` gli insert si risolvono a `never` e la
  build fallisce. Non convertirle in interface.
- **`Database` type** (`types.ts`): `Views`/`Functions` usano `{ [_ in never]: never }`
  (non `Record<string, never>`, che romperebbe il vincolo `GenericSchema`). Ogni tabella
  ha `Relationships: []`.
- **Valuta configurabile**: `formatCurrency` legge la valuta da `lib/settings.ts`
  (localStorage). Al cambio valuta la pagina fa `window.location.reload()` per
  rigenerare i formatter `Intl` in modo coerente — è voluto.
- **Route ricorrenti**: la pagina si chiama "Ricorrenti" ma il file è
  `pages/Subscriptions.tsx` e la route è `/ricorrenti` (storicamente era "Abbonamenti").
- **Code-splitting**: le pagine in `App.tsx` sono `React.lazy`. Recharts finisce nel
  chunk di Dashboard. Mantenere le pagine lazy per non gonfiare il bundle iniziale.
- **Date**: usare gli helper di `lib/format.ts` (`monthKey`, `todayISO`) che lavorano
  in orario locale; evitare `new Date(iso)` grezzo per le date `YYYY-MM-DD` (usare
  `+ 'T00:00:00'`) per non incappare in slittamenti di fuso.
- **UI**: comporre con le primitive di `components/ui.tsx` e l'helper `cn(...)`;
  mantenere lo stile minimal esistente (card arrotondate, accento `brand`/emerald).
- **Importi**: input come stringa, parse con `parseFloat(v.replace(',', '.'))`
  (accetta la virgola decimale italiana).

## PWA

Configurata in `vite.config.ts` (`VitePWA`, `registerType: 'autoUpdate'`). Le chiamate
Supabase non sono intercettate dal service worker (servono dati freschi). Il SW è
attivo **solo in build di produzione**: per provarla usare `npm run build && npm run preview`.
Le icone sono SVG (`public/pwa-icon.svg`); per compatibilità iOS più ampia si possono
aggiungere PNG 192/512.

## Idee non ancora implementate (roadmap)

Giroconti tra conti; import CSV estratto conto + export CSV/PDF; obiettivi collegati a
un conto risparmio; dark mode; promemoria email + creazione automatica ricorrenti
(Edge Function + cron); ricevute allegate (Supabase Storage); error boundary globale.
