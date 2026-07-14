-- ============================================================
--  Finance Manager — Schema Supabase
--  Esegui questo file in: Supabase Dashboard > SQL Editor > New query
--  (incolla tutto e premi "Run")
-- ============================================================

-- ---------- Tipi enum ----------
do $$ begin
  create type transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum ('bank', 'cash', 'card', 'savings', 'other');
exception when duplicate_object then null; end $$;

-- Metodo di pagamento di una transazione: contanti / conto bancario / carta di credito
do $$ begin
  create type payment_method as enum ('cash', 'bank', 'card');
exception when duplicate_object then null; end $$;

-- Frequenza di rinnovo di un abbonamento
do $$ begin
  create type billing_frequency as enum ('weekly', 'monthly', 'quarterly', 'yearly');
exception when duplicate_object then null; end $$;

-- ============================================================
--  CONTI
-- ============================================================
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  type            account_type not null default 'bank',
  initial_balance numeric(14, 2) not null default 0,
  color           text not null default '#10b981',
  created_at      timestamptz not null default now()
);

-- ============================================================
--  CATEGORIE
-- ============================================================
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  type       transaction_type not null,
  color      text not null default '#64748b',
  icon       text not null default 'tag',
  created_at timestamptz not null default now()
);

-- ============================================================
--  TRANSAZIONI
-- ============================================================
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  account_id  uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  type        transaction_type not null,
  amount      numeric(14, 2) not null check (amount >= 0),
  description text not null default '',
  date        date not null default current_date,
  method      payment_method,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_category_idx
  on public.transactions (category_id);
create index if not exists transactions_account_idx
  on public.transactions (account_id);

-- Auto-migrazione: aggiunge la colonna se la tabella esisteva già
alter table public.transactions
  add column if not exists method payment_method;

-- ============================================================
--  BUDGET (per categoria, per mese)
--  month è il primo giorno del mese, es. 2026-07-01
-- ============================================================
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount      numeric(14, 2) not null check (amount >= 0),
  month       date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- ============================================================
--  ABBONAMENTI (spese ricorrenti)
-- ============================================================
create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  type         transaction_type not null default 'expense',
  amount       numeric(14, 2) not null check (amount >= 0),
  frequency    billing_frequency not null default 'monthly',
  next_payment date not null default current_date,
  category_id  uuid references public.categories (id) on delete set null,
  account_id   uuid references public.accounts (id) on delete set null,
  method       payment_method,
  color        text not null default '#6366f1',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists subscriptions_user_next_idx
  on public.subscriptions (user_id, next_payment);

-- Auto-migrazione: aggiunge la colonna se la tabella esisteva già
alter table public.subscriptions
  add column if not exists type transaction_type not null default 'expense';

-- ============================================================
--  OBIETTIVI DI RISPARMIO
-- ============================================================
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  target_amount  numeric(14, 2) not null check (target_amount >= 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  color          text not null default '#10b981',
  icon           text not null default 'piggy-bank',
  deadline       date,
  created_at     timestamptz not null default now()
);

-- ============================================================
--  ROW LEVEL SECURITY
--  Ogni utente vede e modifica solo i propri dati.
-- ============================================================
alter table public.accounts      enable row level security;
alter table public.categories    enable row level security;
alter table public.transactions  enable row level security;
alter table public.budgets       enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'budgets', 'subscriptions', 'goals']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    execute format(
      'create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================
--  SEED AUTOMATICO DELLE CATEGORIE DI DEFAULT
--  Quando un nuovo utente si registra, gli vengono create
--  alcune categorie di partenza (entrate e uscite comuni).
-- ============================================================
create or replace function public.seed_default_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Conto di default
  insert into public.accounts (user_id, name, type, initial_balance, color)
  values (new.id, 'Conto principale', 'bank', 0, '#10b981');

  -- Categorie di uscita
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Spesa e alimentari', 'expense', '#ef4444', 'shopping-cart'),
    (new.id, 'Casa e bollette',    'expense', '#f97316', 'home'),
    (new.id, 'Trasporti',          'expense', '#eab308', 'car'),
    (new.id, 'Svago e ristoranti', 'expense', '#8b5cf6', 'utensils'),
    (new.id, 'Salute',             'expense', '#ec4899', 'heart-pulse'),
    (new.id, 'Shopping',           'expense', '#06b6d4', 'shopping-bag'),
    (new.id, 'Altro',              'expense', '#64748b', 'ellipsis');

  -- Categorie di entrata
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Stipendio',   'income', '#10b981', 'wallet'),
    (new.id, 'Freelance',   'income', '#14b8a6', 'briefcase'),
    (new.id, 'Investimenti','income', '#22c55e', 'trending-up'),
    (new.id, 'Regali',      'income', '#84cc16', 'gift'),
    (new.id, 'Altro',       'income', '#64748b', 'ellipsis');

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_data();

-- ============================================================
--  REALTIME
--  Abilita la sincronizzazione in tempo reale (multi-dispositivo)
--  aggiungendo le tabelle alla publication di Supabase.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'budgets', 'subscriptions', 'goals']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception
      when duplicate_object then null; -- già presente
      when undefined_object then null; -- publication assente (ambiente non-Supabase)
    end;
  end loop;
end $$;

-- ============================================================
--  NOTA: questo schema è IDEMPOTENTE e AUTO-MIGRANTE.
--  Puoi ri-eseguirlo in sicurezza su un database già inizializzato:
--  gli enum usano gestori "duplicate_object", le tabelle sono
--  "create ... if not exists" e le colonne aggiunte in seguito
--  ("transactions.method", "subscriptions.type") sono applicate con
--  "alter table ... add column if not exists". Nessun dato viene perso.
-- ============================================================
