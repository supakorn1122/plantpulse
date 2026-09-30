-- Optional bonus-features migration. Run after schema.sql.

do $$ begin
  alter type public.user_role add value if not exists 'viewer';
exception when duplicate_object then null;
end $$;

create table if not exists public.machine_history (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  status public.machine_status not null,
  note text not null default '',
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.machine_history enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists machine_history_select_authenticated on public.machine_history;
create policy machine_history_select_authenticated on public.machine_history
for select to authenticated using (true);
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
for select to authenticated using (public.is_admin());

create or replace function public.record_machine_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.machine_history (machine_id, status, note, changed_by)
    values (new.id, new.status, case when tg_op = 'INSERT' then 'สร้างเครื่องจักร' else 'เปลี่ยนสถานะเครื่องจักร' end, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists machines_history on public.machines;
create trigger machines_history after insert or update of status on public.machines
for each row execute function public.record_machine_history();

create or replace function public.record_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id), jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old)));
  return coalesce(new, old);
end;
$$;

drop trigger if exists machines_audit_log on public.machines;
create trigger machines_audit_log after insert or update or delete on public.machines
for each row execute function public.record_audit_log();
drop trigger if exists alarms_audit_log on public.alarms;
create trigger alarms_audit_log after insert or update or delete on public.alarms
for each row execute function public.record_audit_log();
drop trigger if exists maintenance_audit_log on public.maintenance_records;
create trigger maintenance_audit_log after insert or update or delete on public.maintenance_records
for each row execute function public.record_audit_log();