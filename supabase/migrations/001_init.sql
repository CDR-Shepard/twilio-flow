-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Helper function to keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Admin allowlist
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Agents (ad users)
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_agents_updated_at
before update on public.agents
for each row execute function set_updated_at();

-- Tracked Twilio numbers
create table public.tracked_numbers (
  id uuid primary key default gen_random_uuid(),
  friendly_name text not null,
  twilio_phone_number text not null,
  twilio_sid text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_tracked_twilio_number unique (twilio_phone_number)
);
create trigger trg_tracked_numbers_updated_at
before update on public.tracked_numbers
for each row execute function set_updated_at();

-- Routing config: ordered agents per tracked number
create table public.tracked_number_routes (
  id uuid primary key default gen_random_uuid(),
  tracked_number_id uuid not null references public.tracked_numbers(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint unique_tracked_number_agent unique (tracked_number_id, agent_id)
);
create index idx_routes_tracked_number_sort on public.tracked_number_routes(tracked_number_id, sort_order);

-- Calls
create type call_status as enum ('initiated', 'ringing', 'connected', 'completed', 'failed');
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  tracked_number_id uuid references public.tracked_numbers(id) on delete set null,
  twilio_call_sid text unique not null,
  from_number text,
  to_number text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status call_status not null default 'initiated',
  connected_agent_id uuid references public.agents(id),
  created_at timestamptz not null default now()
);

-- Call attempts (per agent leg)
create type call_attempt_status as enum ('initiated', 'ringing', 'answered', 'no-answer', 'busy', 'failed', 'canceled', 'completed');
create table public.call_attempts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  agent_id uuid not null references public.agents(id),
  attempt_call_sid text unique,
  status call_attempt_status not null default 'initiated',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_call_attempts_call on public.call_attempts(call_id);

-- Admin check helper for RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = coalesce(auth.jwt() ->> 'email', '')
  );
$$;

-- Enable RLS
alter table public.admins enable row level security;
alter table public.agents enable row level security;
alter table public.tracked_numbers enable row level security;
alter table public.tracked_number_routes enable row level security;
alter table public.calls enable row level security;
alter table public.call_attempts enable row level security;

-- Policies: admin-only for all operations
create policy "admins can manage admins" on public.admins
  for all using (is_admin()) with check (is_admin());

create policy "admins manage agents" on public.agents
  for all using (is_admin()) with check (is_admin());

create policy "admins manage tracked numbers" on public.tracked_numbers
  for all using (is_admin()) with check (is_admin());

create policy "admins manage routes" on public.tracked_number_routes
  for all using (is_admin()) with check (is_admin());

create policy "admins read calls" on public.calls
  for select using (is_admin());
create policy "admins insert calls" on public.calls
  for insert with check (is_admin());
create policy "admins update calls" on public.calls
  for update using (is_admin()) with check (is_admin());

create policy "admins manage call attempts" on public.call_attempts
  for all using (is_admin()) with check (is_admin());

-- Helpful indexes
create index idx_calls_tracked_started on public.calls(tracked_number_id, started_at desc);
create index idx_routes_agent on public.tracked_number_routes(agent_id);
