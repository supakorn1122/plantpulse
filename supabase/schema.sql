-- PlantPulse database schema
-- Run this file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'technician', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.machine_status as enum ('Running', 'Stop', 'Alarm', 'Maintenance');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.alarm_status as enum ('Open', 'In Progress', 'Closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.maintenance_status as enum ('Waiting', 'In Progress', 'Completed', 'Cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'technician',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null unique,
  machine_name text not null,
  machine_type text not null,
  location text not null,
  status public.machine_status not null default 'Running',
  last_service_at date,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint machine_id_not_blank check (length(trim(machine_id)) > 0),
  constraint machine_name_not_blank check (length(trim(machine_name)) > 0)
);

create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  alarm_code text not null,
  description text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  cause text,
  status public.alarm_status not null default 'Open',
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint alarm_code_not_blank check (length(trim(alarm_code)) > 0),
  constraint alarm_description_not_blank check (length(trim(description)) > 0)
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  alarm_id uuid references public.alarms(id) on delete set null,
  title text not null,
  description text,
  technician_id uuid references public.profiles(id) on delete set null,
  status public.maintenance_status not null default 'Waiting',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  work_log text,
  parts_used text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists machines_status_idx on public.machines(status);
create index if not exists machines_location_idx on public.machines(location);
create index if not exists alarms_machine_id_idx on public.alarms(machine_id);
create index if not exists alarms_status_idx on public.alarms(status);
create index if not exists alarms_occurred_at_idx on public.alarms(occurred_at desc);
create index if not exists maintenance_machine_id_idx on public.maintenance_records(machine_id);
create index if not exists maintenance_status_idx on public.maintenance_records(status);
create index if not exists maintenance_technician_id_idx on public.maintenance_records(technician_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists machines_set_updated_at on public.machines;
create trigger machines_set_updated_at before update on public.machines
for each row execute function public.set_updated_at();

drop trigger if exists alarms_set_updated_at on public.alarms;
create trigger alarms_set_updated_at before update on public.alarms
for each row execute function public.set_updated_at();

drop trigger if exists maintenance_set_updated_at on public.maintenance_records;
create trigger maintenance_set_updated_at before update on public.maintenance_records
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'technician')
  );
$$;

grant execute on function public.can_edit() to authenticated;

alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.alarms enable row level security;
alter table public.maintenance_records enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists machines_select_authenticated on public.machines;
create policy machines_select_authenticated on public.machines
for select to authenticated using (true);

drop policy if exists machines_admin_insert on public.machines;
drop policy if exists machines_authenticated_insert on public.machines;
create policy machines_admin_insert on public.machines
for insert to authenticated with check (public.is_admin());

drop policy if exists machines_admin_update on public.machines;
create policy machines_admin_update on public.machines
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists machines_admin_delete on public.machines;
create policy machines_admin_delete on public.machines
for delete to authenticated using (public.is_admin());

drop policy if exists alarms_select_authenticated on public.alarms;
create policy alarms_select_authenticated on public.alarms
for select to authenticated using (true);

drop policy if exists alarms_insert_authenticated on public.alarms;
drop policy if exists alarms_admin_insert on public.alarms;
create policy alarms_admin_insert on public.alarms
for insert to authenticated with check (public.is_admin());

drop policy if exists alarms_update_authenticated on public.alarms;
drop policy if exists alarms_admin_update on public.alarms;
create policy alarms_admin_update on public.alarms
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists alarms_delete_admin on public.alarms;
create policy alarms_delete_admin on public.alarms
for delete to authenticated using (public.is_admin());

drop policy if exists maintenance_select_authenticated on public.maintenance_records;
create policy maintenance_select_authenticated on public.maintenance_records
for select to authenticated using (true);

drop policy if exists maintenance_insert_authenticated on public.maintenance_records;
drop policy if exists maintenance_admin_insert on public.maintenance_records;
create policy maintenance_authenticated_insert on public.maintenance_records
for insert to authenticated with check (public.can_edit());

drop policy if exists maintenance_update_authenticated on public.maintenance_records;
drop policy if exists maintenance_admin_update on public.maintenance_records;
create policy maintenance_authenticated_update on public.maintenance_records
for update to authenticated using (public.can_edit()) with check (public.can_edit());

drop policy if exists maintenance_delete_admin on public.maintenance_records;
create policy maintenance_authenticated_delete on public.maintenance_records
for delete to authenticated using (public.can_edit());

-- Share admin changes with every logged-in client through Supabase Realtime.
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.machines;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.alarms;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.maintenance_records;
exception when duplicate_object then null;
end $$;

-- Optional first administrator setup. Replace the email after creating the account.
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'admin@example.com');
