-- Run this once in Supabase SQL Editor on an existing project.
-- Result: only profiles with role = 'admin' can insert/update/delete system data.

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

drop policy if exists maintenance_insert_authenticated on public.maintenance_records;
drop policy if exists maintenance_admin_insert on public.maintenance_records;
drop policy if exists maintenance_authenticated_insert on public.maintenance_records;
create policy maintenance_authenticated_insert on public.maintenance_records
for insert to authenticated with check (true);

drop policy if exists maintenance_update_authenticated on public.maintenance_records;
drop policy if exists maintenance_admin_update on public.maintenance_records;
drop policy if exists maintenance_authenticated_update on public.maintenance_records;
create policy maintenance_authenticated_update on public.maintenance_records
for update to authenticated using (true) with check (true);

drop policy if exists maintenance_delete_admin on public.maintenance_records;
drop policy if exists maintenance_authenticated_delete on public.maintenance_records;
create policy maintenance_authenticated_delete on public.maintenance_records
for delete to authenticated using (true);

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