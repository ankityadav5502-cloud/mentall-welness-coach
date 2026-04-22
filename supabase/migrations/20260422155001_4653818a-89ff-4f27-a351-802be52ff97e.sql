-- Re-create policies scoped to authenticated role only
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','user_roles','doctor_profiles','guardian_profiles','patient_profiles')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end$$;

-- profiles
create policy "Users can view their own profile"
  on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = user_id);

-- user_roles
create policy "Users can view their own roles"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own roles"
  on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

-- doctor_profiles
create policy "Doctors can view their own profile"
  on public.doctor_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Doctors can insert their own profile"
  on public.doctor_profiles for insert to authenticated
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'doctor'));
create policy "Doctors can update their own profile"
  on public.doctor_profiles for update to authenticated using (auth.uid() = user_id);

-- guardian_profiles
create policy "Guardians can view their own profile"
  on public.guardian_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Guardians can insert their own profile"
  on public.guardian_profiles for insert to authenticated
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'guardian'));
create policy "Guardians can update their own profile"
  on public.guardian_profiles for update to authenticated using (auth.uid() = user_id);

-- patient_profiles
create policy "Patients can view their own profile"
  on public.patient_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Patients can insert their own profile"
  on public.patient_profiles for insert to authenticated
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'patient'));
create policy "Patients can update their own profile"
  on public.patient_profiles for update to authenticated using (auth.uid() = user_id);