-- Call flow groups and per-agent delays
do $$
begin
  if not exists (select 1 from pg_type typ join pg_namespace nsp on nsp.oid = typ.typnamespace where typ.typname = 'call_flow_type') then
    create type call_flow_type as enum ('simultaneous', 'sequential', 'round_robin');
  end if;
end
$$;

create table if not exists public.call_flows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type call_flow_type not null default 'simultaneous',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_call_flows_updated_at
before update on public.call_flows
for each row execute function set_updated_at();

create table if not exists public.call_flow_members (
  id uuid primary key default gen_random_uuid(),
  call_flow_id uuid not null references public.call_flows(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  delay_seconds int not null default 0,
  sort_order int not null default 0,
  weight int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint unique_flow_agent unique (call_flow_id, agent_id)
);
create index if not exists idx_call_flow_members_flow_order on public.call_flow_members(call_flow_id, sort_order);

alter table public.tracked_numbers
  add column if not exists call_flow_id uuid references public.call_flows(id);

alter table public.call_attempts
  add column if not exists delay_seconds int not null default 0;

-- Analytics helper: percentage answered by agent per bucket
create or replace function public.agent_answer_share(_tracking_number_id uuid, _since timestamptz, _bucket text)
returns table(bucket_start timestamptz, agent_id uuid, answered_count int, total_count int, pct numeric)
language sql
security definer
set search_path = public
as $$
  with calls_window as (
    select c.id, c.tracked_number_id, c.connected_agent_id, c.started_at
    from public.calls c
    where (_tracking_number_id is null or c.tracked_number_id = _tracking_number_id)
      and c.started_at >= _since
  ),
  attempts as (
    select ca.call_id, ca.agent_id,
      (case when ca.status = 'answered' then 1 else 0 end) as answered,
      date_trunc(_bucket, coalesce(c.started_at, ca.started_at)) as bucket_start
    from public.call_attempts ca
    join calls_window c on c.id = ca.call_id
  ),
  totals as (
    select bucket_start, count(distinct call_id) as total_calls
    from attempts
    group by bucket_start
  )
  select a.bucket_start,
         a.agent_id,
         sum(a.answered) as answered_count,
         count(*) as total_count,
         case when t.total_calls = 0 then 0 else sum(a.answered)::numeric / t.total_calls end as pct
  from attempts a
  join totals t on t.bucket_start = a.bucket_start
  group by a.bucket_start, a.agent_id, t.total_calls
  order by a.bucket_start asc;
$$;

-- RLS
alter table public.call_flows enable row level security;
alter table public.call_flow_members enable row level security;

create policy "admins manage call flows" on public.call_flows
  for all using (is_admin()) with check (is_admin());

create policy "admins manage call flow members" on public.call_flow_members
  for all using (is_admin()) with check (is_admin());
