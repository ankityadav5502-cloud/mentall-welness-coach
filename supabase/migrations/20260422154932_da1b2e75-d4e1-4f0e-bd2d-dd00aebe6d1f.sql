-- App role enum
create type public.app_role as enum ('patient', 'doctor', 'guardian');

-- Gender enum
create type public.gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');

-- ===== profiles =====
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  date_of_birth date,
  gender public.gender_type,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- ===== user_roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);
create policy "Users can insert their own roles"
  on public.user_roles for insert
  with check (auth.uid() = user_id);

-- ===== doctor_profiles =====
create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  license_number text,
  specialization text,
  hospital_name text,
  years_of_experience integer check (years_of_experience is null or years_of_experience >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.doctor_profiles enable row level security;

create policy "Doctors can view their own profile"
  on public.doctor_profiles for select
  using (auth.uid() = user_id);
create policy "Doctors can insert their own profile"
  on public.doctor_profiles for insert
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'doctor'));
create policy "Doctors can update their own profile"
  on public.doctor_profiles for update
  using (auth.uid() = user_id);

-- ===== guardian_profiles =====
create table public.guardian_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  dependent_name text,
  dependent_age integer check (dependent_age is null or (dependent_age >= 0 and dependent_age <= 120)),
  dependent_relationship text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.guardian_profiles enable row level security;

create policy "Guardians can view their own profile"
  on public.guardian_profiles for select
  using (auth.uid() = user_id);
create policy "Guardians can insert their own profile"
  on public.guardian_profiles for insert
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'guardian'));
create policy "Guardians can update their own profile"
  on public.guardian_profiles for update
  using (auth.uid() = user_id);

-- ===== patient_profiles =====
create table public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  conditions text,
  current_medications text,
  therapy_history text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.patient_profiles enable row level security;

create policy "Patients can view their own profile"
  on public.patient_profiles for select
  using (auth.uid() = user_id);
create policy "Patients can insert their own profile"
  on public.patient_profiles for insert
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'patient'));
create policy "Patients can update their own profile"
  on public.patient_profiles for update
  using (auth.uid() = user_id);

-- ===== updated_at trigger =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger doctor_profiles_updated_at before update on public.doctor_profiles
  for each row execute function public.set_updated_at();
create trigger guardian_profiles_updated_at before update on public.guardian_profiles
  for each row execute function public.set_updated_at();
create trigger patient_profiles_updated_at before update on public.patient_profiles
  for each row execute function public.set_updated_at();

-- ===== auto-create profile row on signup =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();