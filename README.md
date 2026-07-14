# 💰 Finance Manager

Webapp per gestire le finanze personali: entrate, uscite, budget mensili,
conti multipli e statistiche. Design moderno e minimal.

**Stack:** React + TypeScript + Vite · Tailwind CSS v4 · Supabase (auth + DB) ·
Recharts · React Router.

---

## Funzionalità

- 🔐 **Login email/password** con Row Level Security (ogni utente vede solo i propri dati)
- 💸 **Transazioni** entrate/uscite con categorie, metodo di pagamento (contanti/conto/carta), filtri, ricerca e raggruppamento per data
- 🔁 **Ricorrenti** (entrate e uscite): stipendio, affitto, abbonamenti… con costo mensile, prossimi rinnovi e "Registra pagamento/incasso"
- 🏆 **Obiettivi di risparmio** con barra di avanzamento, scadenza e accantonamenti
- 📅 **Filtri per periodo** (Da/A) sulle transazioni e **selettore mese** in dashboard
- ⚙️ **Impostazioni**: cambio password, valuta configurabile, conto predefinito
- 📱 **PWA installabile** con apertura offline dell'app
- ⚡ **Aggiornamenti ottimistici** e **sync realtime** multi-dispositivo; lista transazioni paginata
- 📊 **Dashboard** con KPI (patrimonio, entrate, uscite, risparmio), andamento a 6 mesi, spese per categoria
- 🎯 **Budget** mensili per categoria con barre di avanzamento
- 🏦 **Conti multipli** (banca, contanti, carta, risparmio) con saldi calcolati
- 🏷️ **Categorie** personalizzabili con icone e colori

---

## Setup

### 1. Configura Supabase

1. Vai su [supabase.com](https://supabase.com) e apri il tuo progetto.
2. Apri **SQL Editor → New query**, incolla tutto il contenuto di
   [`supabase/schema.sql`](supabase/schema.sql) e premi **Run**.
   Questo crea le tabelle, le policy RLS e il seed automatico delle categorie
   di default a ogni nuova registrazione.
3. (Opzionale) In **Authentication → Providers → Email**, se vuoi accedere
   subito senza confermare la mail, disattiva *"Confirm email"* durante lo sviluppo.

### 2. Variabili d'ambiente

Copia `.env.example` in `.env` e inserisci le tue credenziali
(**Project Settings → API**):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> Il file `.env` incluso contiene solo valori segnaposto: **sostituiscili**
> con quelli reali, altrimenti login e dati non funzioneranno.

### 3. Avvia

```bash
npm install
npm run dev
```

App su [http://localhost:5173](http://localhost:5173).
Registra un account dalla schermata di login: le categorie e il conto di
default vengono creati automaticamente.

---

## Comandi

| Comando           | Descrizione                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Server di sviluppo                   |
| `npm run build`   | Type-check + build di produzione     |
| `npm run preview` | Anteprima della build                |

---

## Struttura

```
src/
├─ components/      UI riutilizzabile (ui.tsx, Layout, form transazione…)
├─ context/         AuthContext + DataContext (dati e operazioni CRUD)
├─ lib/             supabase client, formattazione, statistiche, icone
├─ pages/           Dashboard, Transazioni, Budget, Conti, Categorie, Login
└─ types.ts         Tipi dominio + tipizzazione DB per supabase-js
supabase/
└─ schema.sql       Schema tabelle + RLS + trigger di seed
```

---

## Sicurezza

Tutte le tabelle hanno **Row Level Security** attiva con policy
`auth.uid() = user_id`: un utente può leggere e scrivere esclusivamente i
propri record. La chiave usata dal frontend è la `anon key` pubblica, sicura da
esporre proprio grazie a RLS.
