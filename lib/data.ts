import { supabase } from "./supabase";

export type MachineStatus = "Running" | "Stop" | "Alarm" | "Maintenance";
export type AlarmStatus = "Open" | "In Progress" | "Closed";
export type MaintenanceStatus = "Waiting" | "In Progress" | "Completed" | "Cancelled";

export type Machine = { id: string; machine_id: string; machine_name: string; machine_type: string; location: string; status: MachineStatus; last_service_at: string | null; uptime?: string };
export type Alarm = { id: string; machine_id: string; machine: { machine_name: string } | null; alarm_code: string; description: string; occurred_at: string; cause: string | null; status: AlarmStatus };
export type Maintenance = { id: string; machine_id: string; machine: { machine_name: string } | null; title: string; technician_id: string | null; technician: { full_name: string } | null; status: MaintenanceStatus; priority: string; scheduled_at: string | null };
export type MaintenanceInput = { machine_id: string; title: string; description?: string; status: MaintenanceStatus; priority: string; scheduled_at?: string | null };
export type MachineHistory = { id: string; machine_id: string; status: MachineStatus; note: string; created_at: string; machine?: { machine_name: string } | null };
export type AuditLog = { id: string; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string; actor?: { full_name: string } | null };

export async function getMachines() {
  return supabase.from("machines").select("*").order("machine_id");
}

export async function getAlarms() {
  return supabase.from("alarms").select("*, machine:machines(machine_name)").order("occurred_at", { ascending: false });
}

export async function getMaintenance() {
  return supabase.from("maintenance_records").select("*, machine:machines(machine_name), technician:profiles!maintenance_records_technician_id_fkey(full_name)").order("created_at", { ascending: false });
}

export async function getMachineHistory() {
  return supabase.from("machine_history").select("*, machine:machines(machine_name)").order("created_at", { ascending: false });
}

export async function getAuditLogs() {
  return supabase.from("audit_logs").select("*, actor:profiles(full_name)").order("created_at", { ascending: false }).limit(100);
}

export async function createMachine(input: Pick<Machine, "machine_id" | "machine_name" | "machine_type" | "location">) {
  return supabase.from("machines").insert(input).select().single();
}

export async function updateAlarmStatus(id: string, status: AlarmStatus) {
  return supabase.from("alarms").update({ status, ...(status === "Closed" ? { resolved_at: new Date().toISOString() } : {}) }).eq("id", id).select().single();
}

export async function completeMaintenance(id: string) {
  return supabase.from("maintenance_records").update({ status: "Completed", completed_at: new Date().toISOString() }).eq("id", id).select().single();
}

export async function createMaintenance(input: MaintenanceInput) {
  return supabase.from("maintenance_records").insert(input).select().single();
}

export async function updateMaintenance(id: string, input: MaintenanceInput) {
  return supabase.from("maintenance_records").update(input).eq("id", id).select().single();
}

export async function deleteMaintenance(id: string) {
  return supabase.from("maintenance_records").delete().eq("id", id);
}
