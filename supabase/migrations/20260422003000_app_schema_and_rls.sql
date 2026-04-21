create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('patient', 'doctor', 'guardian');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'User'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.doctor_patient_assignments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value int not null check (value between 1 and 5),
  emoji text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.dopamine_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  type text not null check (type in ('mastery', 'pleasure')),
  done boolean not null default false,
  day date not null default current_date
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  free_text text,
  prompt_win text,
  prompt_feeling text,
  prompt_intention text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null,
  score int not null default 0,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  dependent_id uuid not null references auth.users(id) on delete cascade,
  relationship text,
  created_at timestamptz not null default now(),
  unique (guardian_id, dependent_id)
);

create table if not exists public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  triggered_at timestamptz not null default now(),
  resolved boolean not null default false,
  notes text
);

create table if not exists public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  source text,
  created_at timestamptz not null default now()
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.doctor_patient_assignments enable row level security;
alter table public.moods enable row level security;
alter table public.dopamine_tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.game_sessions enable row level security;
alter table public.guardian_links enable row level security;
alter table public.sos_events enable row level security;
alter table public.clinical_records enable row level security;

drop policy if exists "profiles select own or linked" on public.profiles;
create policy "profiles select own or linked" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = profiles.id
  )
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = profiles.id
    )
  )
);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "user roles self read" on public.user_roles;
create policy "user roles self read" on public.user_roles
for select to authenticated using (user_id = auth.uid());

drop policy if exists "user roles self insert" on public.user_roles;
create policy "user roles self insert" on public.user_roles
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "dpa doctor read own assignments" on public.doctor_patient_assignments;
create policy "dpa doctor read own assignments" on public.doctor_patient_assignments
for select to authenticated using (doctor_id = auth.uid());

drop policy if exists "dpa doctor insert own assignments" on public.doctor_patient_assignments;
create policy "dpa doctor insert own assignments" on public.doctor_patient_assignments
for insert to authenticated with check (doctor_id = auth.uid() and public.has_role(auth.uid(), 'doctor'));

drop policy if exists "moods insert own" on public.moods;
create policy "moods insert own" on public.moods
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "moods read own doctor guardian" on public.moods;
create policy "moods read own doctor guardian" on public.moods
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = moods.user_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = moods.user_id
  )
);

drop policy if exists "dopamine tasks own doctor guardian" on public.dopamine_tasks;
create policy "dopamine tasks own doctor guardian" on public.dopamine_tasks
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = dopamine_tasks.user_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = dopamine_tasks.user_id
  )
);

drop policy if exists "dopamine tasks own write" on public.dopamine_tasks;
create policy "dopamine tasks own write" on public.dopamine_tasks
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "journal own doctor guardian read" on public.journal_entries;
create policy "journal own doctor guardian read" on public.journal_entries
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = journal_entries.user_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = journal_entries.user_id
  )
);

drop policy if exists "journal own write" on public.journal_entries;
create policy "journal own write" on public.journal_entries
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "game sessions own doctor guardian read" on public.game_sessions;
create policy "game sessions own doctor guardian read" on public.game_sessions
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = game_sessions.user_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = game_sessions.user_id
  )
);

drop policy if exists "game sessions own insert" on public.game_sessions;
create policy "game sessions own insert" on public.game_sessions
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "guardian links guardian read own" on public.guardian_links;
create policy "guardian links guardian read own" on public.guardian_links
for select to authenticated
using (guardian_id = auth.uid() or dependent_id = auth.uid());

drop policy if exists "guardian links guardian write own" on public.guardian_links;
create policy "guardian links guardian write own" on public.guardian_links
for insert to authenticated with check (guardian_id = auth.uid());

drop policy if exists "sos own doctor guardian read" on public.sos_events;
create policy "sos own doctor guardian read" on public.sos_events
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = sos_events.user_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = sos_events.user_id
  )
);

drop policy if exists "sos own insert" on public.sos_events;
create policy "sos own insert" on public.sos_events
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "clinical records read own doctor guardian" on public.clinical_records;
create policy "clinical records read own doctor guardian" on public.clinical_records
for select to authenticated
using (
  patient_id = auth.uid()
  or doctor_id = auth.uid()
  or (
    public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = clinical_records.patient_id
    )
  )
  or exists (
    select 1 from public.guardian_links gl
    where gl.guardian_id = auth.uid()
      and gl.dependent_id = clinical_records.patient_id
  )
);

drop policy if exists "clinical records doctor insert assigned" on public.clinical_records;
create policy "clinical records doctor insert assigned" on public.clinical_records
for insert to authenticated
with check (
  doctor_id = auth.uid()
  and public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1 from public.doctor_patient_assignments dpa
    where dpa.doctor_id = auth.uid()
      and dpa.patient_id = clinical_records.patient_id
  )
);
