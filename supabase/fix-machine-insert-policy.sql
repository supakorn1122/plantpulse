-- Run this once in Supabase SQL Editor for an existing database.
-- It fixes the old machine insert policy while preserving admin-only CRUD.

drop policy if exists machines_admin_insert on public.machines;
drop policy if exists machines_authenticated_insert on public.machines;
drop policy if exists machines_admin_insert on public.machines;

alter table public.machines
	alter column created_by set default auth.uid();

create policy machines_admin_insert on public.machines
for insert to authenticated
with check (public.is_admin());
