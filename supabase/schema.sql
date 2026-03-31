-- HelixForge Wellness — Supabase Schema
-- Run this in Supabase SQL Editor to set up your database

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type plan_type as enum ('protocol', 'coaching');
create type protocol_status as enum ('pending', 'active', 'paused', 'completed');
create type subscription_status as enum ('active', 'canceled', 'past_due');

-- ============================================================
-- PROFILES (extends Clerk users)
-- NOTE: Clerk owns authentication — profiles.id references Clerk user IDs.
-- We use a plain uuid primary key (no FK to auth.users) and manage access via
-- Clerk's session JWT in application code. RLS policies reference the id column.
-- ============================================================
create table public.profiles (
  id uuid primary key,
  email text not null,
  first_name text,
  last_name text,
  avatar_url text,
  plan plan_type,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status subscription_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only read/write their own profile
-- NOTE: In application code, Clerk user ID is verified server-side via auth()
-- and used directly. The anon key path bypasses RLS for authenticated routes.
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- PROTOCOLS
-- ============================================================
create table public.protocols (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My 90-Day Protocol',
  status protocol_status default 'pending',
  phase integer default 1 check (phase between 1 and 3),
  genetic_data jsonb, -- encrypted at rest via Supabase (enable in settings)
  signal_kit_report jsonb,
  protocol_blueprint jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.protocols enable row level security;
create policy "Users can manage own protocols" on public.protocols
  for all using (auth.uid() = user_id);

-- ============================================================
-- PROTOCOL PHASES
-- ============================================================
create table public.protocol_phases (
  id uuid primary key default uuid_generate_v4(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  phase_number integer not null check (phase_number between 1 and 3),
  name text not null,
  description text,
  week_start integer not null,
  week_end integer not null,
  training_plan jsonb,
  nutrition_plan jsonb,
  status protocol_status default 'pending',
  created_at timestamptz default now(),
  unique(protocol_id, phase_number)
);

alter table public.protocol_phases enable row level security;
create policy "Users can manage own phases" on public.protocol_phases
  for all using (
    auth.uid() = (select user_id from public.protocols where id = protocol_id)
  );

-- ============================================================
-- COACHING SESSIONS
-- ============================================================
create table public.coaching_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  ai_response jsonb,
  tokens_used integer,
  created_at timestamptz default now()
);

alter table public.coaching_sessions enable row level security;
create policy "Users can manage own sessions" on public.coaching_sessions
  for all using (auth.uid() = user_id);

-- ============================================================
-- USER TASKS / CHECKLIST
-- ============================================================
create table public.user_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  completed boolean default false,
  due_date date,
  created_at timestamptz default now()
);

alter table public.user_tasks enable row level security;
create policy "Users can manage own tasks" on public.user_tasks
  for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- NOTE: Clerk handles authentication. Profile creation is triggered by the
-- Stripe webhook (checkout.session.completed) when a user first pays.
-- For keeping profiles in sync with Clerk user metadata (name, avatar),
-- set up a Clerk webhook pointing to POST /api/auth/sync.
--
-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.protocols
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_protocols_user_id on public.protocols(user_id);
create index idx_protocol_phases_protocol_id on public.protocol_phases(protocol_id);
create index idx_coaching_sessions_user_id on public.coaching_sessions(user_id);
create index idx_user_tasks_user_id on public.user_tasks(user_id);
