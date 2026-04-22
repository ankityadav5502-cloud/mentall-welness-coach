-- Add onboarding fields to profiles table
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists phone text,
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  add column if not exists avatar_url text;

-- Doctor-specific profile fields
create table if not exists public.doctor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  license_number text,
  specialization text,
  hospital_name text,
  years_of_experience int,
  created_at timestamptz not null default now()
);

alter table public.doctor_profiles enable row level security;

drop policy if exists "doctor_profiles own read" on public.doctor_profiles;
create policy "doctor_profiles own read" on public.doctor_profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "doctor_profiles own insert" on public.doctor_profiles;
create policy "doctor_profiles own insert" on public.doctor_profiles
  for insert to authenticated with check (id = auth.uid() and public.has_role(auth.uid(), 'doctor'));

drop policy if exists "doctor_profiles own update" on public.doctor_profiles;
create policy "doctor_profiles own update" on public.doctor_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Guardian-specific profile fields
create table if not exists public.guardian_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  dependent_name text,
  dependent_age int,
  dependent_relationship text check (dependent_relationship in ('parent', 'spouse', 'sibling', 'child', 'other')),
  emergency_contact text,
  created_at timestamptz not null default now()
);

alter table public.guardian_profiles enable row level security;

drop policy if exists "guardian_profiles own read" on public.guardian_profiles;
create policy "guardian_profiles own read" on public.guardian_profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "guardian_profiles own insert" on public.guardian_profiles;
create policy "guardian_profiles own insert" on public.guardian_profiles
  for insert to authenticated with check (id = auth.uid() and public.has_role(auth.uid(), 'guardian'));

drop policy if exists "guardian_profiles own update" on public.guardian_profiles;
create policy "guardian_profiles own update" on public.guardian_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Patient-specific profile fields
create table if not exists public.patient_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  conditions text[],
  current_medications text,
  therapy_history text check (therapy_history in ('never', 'past', 'ongoing')),
  emergency_contact text,
  created_at timestamptz not null default now()
);

alter table public.patient_profiles enable row level security;

drop policy if exists "patient_profiles own read" on public.patient_profiles;
create policy "patient_profiles own read" on public.patient_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (
      public.has_role(auth.uid(), 'doctor')
      and exists (
        select 1 from public.doctor_patient_assignments dpa
        where dpa.doctor_id = auth.uid()
          and dpa.patient_id = patient_profiles.id
      )
    )
  );

drop policy if exists "patient_profiles own insert" on public.patient_profiles;
create policy "patient_profiles own insert" on public.patient_profiles
  for insert to authenticated with check (id = auth.uid() and public.has_role(auth.uid(), 'patient'));

drop policy if exists "patient_profiles own update" on public.patient_profiles;
create policy "patient_profiles own update" on public.patient_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
