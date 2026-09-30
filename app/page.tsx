"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Boxes, Check, ClipboardCheck, LoaderCircle, Plus, Wrench, X, type LucideIcon } from "lucide-react";
import PageShell from "./components/page-shell";
import { createMachine, getAlarms, getMachines, getMaintenance, type Alarm, type Machine, type Maintenance } from "../lib/data";
import { useIsAdmin, useRealtimeRefresh } from "../lib/use-access";

const machineLabels = { Running: "กำลังทำงาน", Stop: "หยุดทำงาน", Alarm: "Alarm", Maintenance: "กำลังซ่อมบำรุง" } as const;
const machineStyles: Record<string, string> = { Running: "bg-[#e5f6ca] text-[#35631e]", Stop: "bg-[#eef0ef] text-[#5e6962]", Alarm: "bg-[#ffe2d8] text-[#b74327]", Maintenance: "bg-[#e4edf5] text-[#315f7e]" };
const alarmLabels = { Open: "เปิดอยู่", "In Progress": "กำลังดำเนินการ", Closed: "ปิดแล้ว" } as const;

type Draft = { machine_id: string; machine_name: string; machine_type: string; location: string };

export default function Home() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>({ machine_id: "", machine_name: "", machine_type: "", location: "" });
  const { isAdmin, ready } = useIsAdmin();

  const load = () => {
    Promise.all([getMachines(), getAlarms(), getMaintenance()]).then(([machineResult, alarmResult, maintenanceResult]) => {
      setMachines(machineResult.data ?? []);
      setAlarms((alarmResult.data as Alarm[]) ?? []);
      setMaintenanceTasks((maintenanceResult.data as Maintenance[]) ?? []);
      if (machineResult.error || alarmResult.error || maintenanceResult.error) setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Supabase");
      setLoading(false);
    });
  };
  useEffect(load, []);
  useRealtimeRefresh(load);

  const counts = useMemo(() => ({ running: machines.filter((machine) => machine.status === "Running").length, maintenance: maintenanceTasks.filter((task) => task.status === "In Progress").length, activeAlarms: alarms.filter((alarm) => alarm.status !== "Closed").length }), [machines, alarms, maintenanceTasks]);
  const summaryCards: Array<[string, number, LucideIcon]> = [["เครื่องจักรทั้งหมด", machines.length, Boxes], ["กำลังทำงาน", counts.running, Check], ["Alarm ที่เปิดอยู่", counts.activeAlarms, AlertTriangle], ["งานซ่อมกำลังดำเนินการ", counts.maintenance, ClipboardCheck]];

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (Object.values(draft).some((value) => !value.trim())) return setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    setSaving(true);
    const result = await createMachine(draft);
    setSaving(false);
    if (result.error) return setError(result.error.code === "23505" ? "รหัสเครื่องจักรต้องไม่ซ้ำกัน" : "บันทึกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Admin");
    setDraft({ machine_id: "", machine_name: "", machine_type: "", location: "" });
    setOpen(false);
    setError("");
    load();
  }

  return <PageShell active="/">
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">ภาพรวมโรงงาน / สด</div><h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">ภาพรวมการผลิต</h1><p className="mt-2 text-sm text-[#7d887f]">ข้อมูลปัจจุบันจาก Supabase</p></div>{ready && isAdmin && <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-[#183a32] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />เพิ่มเครื่องจักร</button>}</div>
      {error && <div className="mt-5 border border-[#f0c8bc] bg-[#fff0eb] px-4 py-3 text-xs text-[#b74327]">{error}</div>}
      {loading ? <div className="flex items-center justify-center gap-2 p-20 text-sm text-[#7d887f]"><LoaderCircle size={18} className="animate-spin" />กำลังโหลดข้อมูลจาก Supabase</div> : <>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summaryCards.map(([label, value, Icon]) => <div key={label} className="border border-[#dfe6df] bg-white p-5"><div className="flex items-center justify-between text-xs text-[#7e8b81]"><span>{label}</span><Icon size={17} className="text-[#416751]" /></div><div className="mt-5 text-3xl font-semibold">{value}</div></div>)}</div>
        <div className="mt-8 grid gap-7 xl:grid-cols-[1.35fr_1fr]"><section className="border border-[#dfe6df] bg-white"><div className="flex items-center justify-between border-b border-[#e7ece7] px-5 py-4"><div><h2 className="font-semibold">สถานะเครื่องจักร</h2><p className="mt-1 text-xs text-[#929b94]">รายการล่าสุดจากฐานข้อมูล</p></div><Link href="/machines" className="flex items-center gap-1 text-xs font-semibold text-[#4d7258]">ดูทั้งหมด <ArrowUpRight size={14} /></Link></div><div className="divide-y divide-[#edf1ed]">{machines.slice(0, 6).map((machine) => <div key={machine.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{machine.machine_name}</div><div className="mono mt-1 text-[10px] text-[#9ca69e]">{machine.machine_id} · {machine.location}</div></div><span className={`shrink-0 px-2 py-1 text-[10px] font-semibold ${machineStyles[machine.status]}`}>{machineLabels[machine.status]}</span></div>)}{machines.length === 0 && <div className="p-10 text-center text-xs text-[#89958c]">ยังไม่มีข้อมูลเครื่องจักร</div>}</div></section><section className="border border-[#dfe6df] bg-white"><div className="flex items-center justify-between border-b border-[#e7ece7] px-5 py-4"><div><h2 className="font-semibold">Alarm ล่าสุด</h2><p className="mt-1 text-xs text-[#929b94]">เหตุการณ์ที่ต้องติดตาม</p></div><Link href="/alarms" className="text-xs font-semibold text-[#4d7258]">ดูทั้งหมด</Link></div><div className="divide-y divide-[#edf1ed]">{alarms.slice(0, 5).map((alarm) => <div key={alarm.id} className="flex items-start gap-3 px-5 py-4"><div className="grid h-7 w-7 shrink-0 place-items-center bg-[#fff0e9] text-[#c45a3c]"><AlertTriangle size={14} /></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{alarm.description}</div><div className="mono mt-1 text-[10px] text-[#9ca69e]">{alarm.machine?.machine_name ?? "ไม่ระบุเครื่อง"} · {alarm.alarm_code}</div></div><span className="shrink-0 text-[10px] text-[#9b6c2d]">{alarmLabels[alarm.status]}</span></div>)}{alarms.length === 0 && <div className="p-10 text-center text-xs text-[#89958c]">ยังไม่มี Alarm</div>}</div></section></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2"><Link href="/maintenance" className="flex items-center justify-between border border-[#dfe6df] bg-[#183a32] p-6 text-white"><span><Wrench size={19} className="mb-5 text-[#c9f45d]" /><span className="block font-semibold">งานซ่อมบำรุง</span><span className="mt-1 block text-xs text-[#abc0ae]">ดูคิวงานและอัปเดตความคืบหน้า</span></span><ArrowUpRight size={18} className="text-[#c9f45d]" /></Link><Link href="/settings" className="flex items-center justify-between border border-[#dfe6df] bg-white p-6"><span><ClipboardCheck size={19} className="mb-5 text-[#54833c]" /><span className="block font-semibold">บัญชีและสิทธิ์</span><span className="mt-1 block text-xs text-[#89958c]">ตรวจสอบข้อมูลผู้ใช้งาน</span></span><ArrowUpRight size={18} /></Link></div>
      </>}
    </div>
    {open && <div className="fixed inset-0 z-20 grid place-items-center bg-[#15271f]/40 p-5"><form onSubmit={save} className="w-full max-w-md bg-[#f8faf6] p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">เพิ่มเครื่องจักร</h2><p className="mt-1 text-xs text-[#7c887f]">บันทึกลง Supabase โดยตรง</p></div><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["รหัสเครื่องจักร", "machine_id"], ["ชื่อเครื่องจักร", "machine_name"], ["ประเภทเครื่องจักร", "machine_type"], ["พื้นที่ติดตั้ง", "location"]].map(([label, key]) => <label key={key} className="text-xs font-medium">{label}<input required value={draft[key as keyof Draft]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none" /></label>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs">ยกเลิก</button><button disabled={saving} className="bg-[#183a32] px-4 py-2 text-xs font-semibold text-white">{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div></form></div>}
  </PageShell>;
}
