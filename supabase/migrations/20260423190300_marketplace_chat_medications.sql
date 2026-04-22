-- ============================================================
-- 1. EXTEND doctor_profiles FOR MARKETPLACE
-- ============================================================
alter table public.doctor_profiles
  add column if not exists bio text,
  add column if not exists languages text[] default '{"English","Hindi"}',
  add column if not exists consultation_fee int not null default 0,
  add column if not exists available_from time not null default '09:00',
  add column if not exists available_until time not null default '18:00',
  add column if not exists is_listed boolean not null default false,
  add column if not exists avatar_url text,
  add column if not exists rating numeric(2,1) default 0.0;

drop policy if exists "doctor_profiles marketplace read" on public.doctor_profiles;
create policy "doctor_profiles marketplace read" on public.doctor_profiles
  for select to authenticated using (is_listed = true or id = auth.uid());

-- ============================================================
-- 2. CHAT ROOMS
-- ============================================================
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);

alter table public.chat_rooms enable row level security;

drop policy if exists "chat_rooms members read" on public.chat_rooms;
create policy "chat_rooms members read" on public.chat_rooms
  for select to authenticated
  using (patient_id = auth.uid() or doctor_id = auth.uid());

drop policy if exists "chat_rooms patient create" on public.chat_rooms;
create policy "chat_rooms patient create" on public.chat_rooms
  for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists "chat_rooms members update" on public.chat_rooms;
create policy "chat_rooms members update" on public.chat_rooms
  for update to authenticated
  using (patient_id = auth.uid() or doctor_id = auth.uid());

-- ============================================================
-- 3. CHAT MESSAGES
-- ============================================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages room members read" on public.chat_messages;
create policy "chat_messages room members read" on public.chat_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.chat_rooms cr
      where cr.id = chat_messages.room_id
        and (cr.patient_id = auth.uid() or cr.doctor_id = auth.uid())
    )
  );

drop policy if exists "chat_messages room members insert" on public.chat_messages;
create policy "chat_messages room members insert" on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_rooms cr
      where cr.id = chat_messages.room_id
        and cr.status = 'active'
        and (cr.patient_id = auth.uid() or cr.doctor_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.chat_messages;

-- ============================================================
-- 4. PATIENT PRIVACY SETTINGS
-- ============================================================
create table if not exists public.patient_privacy_settings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  share_moods boolean not null default true,
  share_journal boolean not null default false,
  share_medications boolean not null default true,
  share_tasks boolean not null default true,
  share_games boolean not null default false,
  created_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);

alter table public.patient_privacy_settings enable row level security;

drop policy if exists "privacy patient read own" on public.patient_privacy_settings;
create policy "privacy patient read own" on public.patient_privacy_settings
  for select to authenticated
  using (patient_id = auth.uid() or doctor_id = auth.uid());

drop policy if exists "privacy patient insert own" on public.patient_privacy_settings;
create policy "privacy patient insert own" on public.patient_privacy_settings
  for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists "privacy patient update own" on public.patient_privacy_settings;
create policy "privacy patient update own" on public.patient_privacy_settings
  for update to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- ============================================================
-- 5. MEDICATIONS TABLE
-- ============================================================
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  time_of_day text[] default '{"morning"}',
  prescribed_by uuid references auth.users(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.medications enable row level security;

drop policy if exists "medications own read" on public.medications;
create policy "medications own read" on public.medications
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      public.has_role(auth.uid(), 'doctor')
      and exists (
        select 1 from public.doctor_patient_assignments dpa
        where dpa.doctor_id = auth.uid()
          and dpa.patient_id = medications.user_id
      )
      and exists (
        select 1 from public.patient_privacy_settings pps
        where pps.doctor_id = auth.uid()
          and pps.patient_id = medications.user_id
          and pps.share_medications = true
      )
    )
  );

drop policy if exists "medications own insert" on public.medications;
create policy "medications own insert" on public.medications
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "medications doctor prescribe" on public.medications;
create policy "medications doctor prescribe" on public.medications
  for insert to authenticated
  with check (
    prescribed_by = auth.uid()
    and public.has_role(auth.uid(), 'doctor')
    and exists (
      select 1 from public.doctor_patient_assignments dpa
      where dpa.doctor_id = auth.uid()
        and dpa.patient_id = medications.user_id
    )
  );

drop policy if exists "medications own update" on public.medications;
create policy "medications own update" on public.medications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "medications own delete" on public.medications;
create policy "medications own delete" on public.medications
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 6. MEDICATION LOGS (daily adherence tracking)
-- ============================================================
create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz,
  skipped boolean not null default false,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  unique (medication_id, day)
);

alter table public.medication_logs enable row level security;

drop policy if exists "med_logs own read" on public.medication_logs;
create policy "med_logs own read" on public.medication_logs
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      public.has_role(auth.uid(), 'doctor')
      and exists (
        select 1 from public.doctor_patient_assignments dpa
        where dpa.doctor_id = auth.uid()
          and dpa.patient_id = medication_logs.user_id
      )
    )
  );

drop policy if exists "med_logs own insert" on public.medication_logs;
create policy "med_logs own insert" on public.medication_logs
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "med_logs own update" on public.medication_logs;
create policy "med_logs own update" on public.medication_logs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
