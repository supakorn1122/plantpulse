"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Download, Edit3, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import PageShell from "../components/page-shell";
import { createMaintenance, deleteMaintenance, getMaintenance, getMachines, updateMaintenance, type Maintenance, type MaintenanceInput, type Machine } from "../../lib/data";
import { useRealtimeRefresh, useUserRole } from "../../lib/use-access";
import { downloadCsv } from "../../lib/export";

const labels = { Waiting: "รอดำเนินการ", "In Progress": "กำลังซ่อม", Completed: "เสร็จแล้ว", Cancelled: "ยกเลิก" } as const;
const styles: Record<string, string> = { Waiting: "bg-[#fff0c7] text-[#856118]", "In Progress": "bg-[#e4edf5] text-[#315f7e]", Completed: "bg-[#e5f6ca] text-[#35631e]", Cancelled: "bg-[#eef0ef] text-[#5e6962]" };
type Draft = MaintenanceInput;
const emptyDraft: Draft = { machine_id: "", title: "", description: "", status: "Waiting", priority: "Medium", scheduled_at: null };

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<Maintenance[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [priorityFilter, setPriorityFilter] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const { role, ready, canEdit } = useUserRole();
  const isAdmin = role === "admin";

  const load = () => {
    Promise.all([getMaintenance(), getMachines()]).then(([taskResult, machineResult]) => {
      setTasks((taskResult.data as Maintenance[]) ?? []);
      setMachines(machineResult.data ?? []);
      if (taskResult.error || machineResult.error) setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Supabase");
      setLoading(false);
    });
  };
  useEffect(load, []);
  useRealtimeRefresh(load);

  const filtered = useMemo(() => tasks.filter((task) => {
    const text = `${task.machine?.machine_name ?? ""} ${task.title} ${task.technician?.full_name ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "ทั้งหมด" || labels[task.status] === filter) && (priorityFilter === "ทั้งหมด" || task.priority === priorityFilter);
  }), [tasks, query, filter, priorityFilter]);
  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  function openCreate() { setEditingId(null); setDraft(emptyDraft); setError(""); setOpen(true); }
  function openEdit(task: Maintenance) { setEditingId(task.id); setDraft({ machine_id: task.machine_id, title: task.title, description: "", status: task.status, priority: task.priority, scheduled_at: task.scheduled_at ? task.scheduled_at.slice(0, 16) : null }); setError(""); setOpen(true); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.machine_id || !draft.title.trim()) return setError("กรุณาเลือกเครื่องจักรและกรอกชื่องาน");
    setSaving(true);
    const result = editingId ? await updateMaintenance(editingId, draft) : await createMaintenance(draft);
    setSaving(false);
    if (result.error) { setError("บันทึกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และข้อมูล"); return; }
    setOpen(false); setDraft(emptyDraft); setEditingId(null); setError(""); load();
  }
  async function remove(id: string) {
    if (!window.confirm("ยืนยันการลบงานซ่อมบำรุงนี้หรือไม่?")) return;
    setDeleting(id);
    const result = await deleteMaintenance(id);
    setDeleting("");
    if (result.error) setError("ลบงานไม่สำเร็จ"); else load();
  }
  function exportTasks() {
    downloadCsv("plantpulse-maintenance.csv", ["งาน", "เครื่องจักร", "ช่างเทคนิค", "สถานะ", "ความสำคัญ", "กำหนด"], filtered.map((task) => [task.title, task.machine?.machine_name ?? "", task.technician?.full_name ?? "", labels[task.status], task.priority, task.scheduled_at ? new Date(task.scheduled_at).toLocaleDateString("th-TH") : ""]));
  }

  return <PageShell active="/maintenance"><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">แผนงานบำรุงรักษา</div><h1 className="text-3xl font-semibold tracking-[-.04em]">งานซ่อมบำรุง</h1><p className="mt-2 text-sm text-[#7d887f]">{role === "viewer" ? "ดูข้อมูลใบงานซ่อมบำรุงแบบอ่านอย่างเดียว" : "Admin และช่างสามารถเพิ่ม แก้ไข และลบงานได้"}</p></div>{ready && canEdit && <button onClick={openCreate} className="flex items-center gap-2 bg-[#183a32] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />สร้างใบงาน</button>}</div>
    <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="border border-[#dfe6df] bg-white p-5"><div className="text-xs text-[#7e8b81]">งานทั้งหมด</div><div className="mt-4 text-3xl font-semibold">{tasks.length}</div></div><div className="border border-[#dfe6df] bg-white p-5"><div className="text-xs text-[#7e8b81]">กำลังดำเนินการ</div><div className="mt-4 text-3xl font-semibold">{tasks.filter((task) => task.status === "In Progress").length}</div></div><div className="border border-[#dfe6df] bg-white p-5"><div className="text-xs text-[#7e8b81]">เสร็จแล้ว</div><div className="mt-4 text-3xl font-semibold">{completedCount}</div></div></div>
    <div className="mt-5 border border-[#dfe6df] bg-[#183a32] p-5 text-white"><div className="flex items-center justify-between text-sm"><span>ความคืบหน้างานทั้งหมด {isAdmin ? "· มุมมองผู้ดูแลระบบ" : ""}</span><strong>{progress}%</strong></div><div className="mt-3 h-3 overflow-hidden bg-[#41675a]"><div className="h-full bg-[#c9f45d] transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-2 text-[11px] text-[#b6cbbb]">เสร็จแล้ว {completedCount} จาก {tasks.length} งาน</div></div>
    <div className="mt-8 border border-[#dfe6df] bg-white"><div className="flex flex-wrap gap-3 border-b border-[#e7ece7] p-5"><div className="flex min-w-[220px] flex-1 items-center gap-2 border border-[#e2e8e1] px-3 py-2"><Search size={15} className="text-[#9da69e]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหางานหรือช่างเทคนิค..." className="w-full bg-transparent text-xs outline-none" /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-[#e2e8e1] bg-white px-3 text-xs outline-none"><option>ทั้งหมด</option><option>รอดำเนินการ</option><option>กำลังซ่อม</option><option>เสร็จแล้ว</option><option>ยกเลิก</option></select></div>{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <div className="divide-y divide-[#edf1ed]">{filtered.map((task) => <div key={task.id} className="flex flex-wrap items-center gap-4 px-5 py-5"><div className="grid h-9 w-9 place-items-center bg-[#e7f3dc] text-[#54833c]"><ClipboardCheck size={17} /></div><div className="min-w-[220px] flex-1"><div className="text-sm font-semibold">{task.title}</div><div className="mono mt-1 text-[10px] text-[#9ca69e]">{task.id} · {task.machine?.machine_name ?? "ไม่ระบุเครื่อง"}</div></div><div className="text-xs text-[#8a968d]">ช่าง: {task.technician?.full_name ?? "ยังไม่มอบหมาย"}<br />กำหนด: {task.scheduled_at ? new Date(task.scheduled_at).toLocaleDateString("th-TH") : "ยังไม่กำหนด"}</div><span className={`px-2 py-1 text-[10px] font-semibold ${styles[task.status]}`}>{labels[task.status]}</span><div className="flex items-center gap-1"><button onClick={() => openEdit(task)} title="แก้ไขงาน" className="p-2 text-[#4d7258] hover:bg-[#eff5eb]"><Edit3 size={15} /></button><button disabled={deleting === task.id} onClick={() => remove(task.id)} title="ลบงาน" className="p-2 text-[#b74327] hover:bg-[#fff0eb]"><Trash2 size={15} /></button></div></div>)}{!filtered.length && <div className="p-10 text-center text-xs text-[#89958c]">ยังไม่มีงานซ่อมบำรุงตามเงื่อนไข</div>}</div>}{error && <p className="border-t border-[#f0c8bc] bg-[#fff0eb] px-5 py-3 text-xs text-[#b74327]">{error}</p>}</div>
  </div>{open && <div className="fixed inset-0 z-20 grid place-items-center bg-[#15271f]/40 p-5"><form onSubmit={save} className="w-full max-w-lg bg-[#f8faf6] p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editingId ? "แก้ไขงานซ่อมบำรุง" : "สร้างใบงานซ่อมบำรุง"}</h2><p className="mt-1 text-xs text-[#7c887f]">บันทึกข้อมูลให้ผู้ใช้งานทุกคนเห็นร่วมกัน</p></div><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">เครื่องจักร<select required value={draft.machine_id} onChange={(event) => setDraft({ ...draft, machine_id: event.target.value })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none"><option value="">เลือกเครื่องจักร</option>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.machine_id} · {machine.machine_name}</option>)}</select></label><label className="text-xs font-medium">ชื่องาน<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none" /></label><label className="text-xs font-medium">สถานะ<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft["status"] })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none"><option value="Waiting">รอดำเนินการ</option><option value="In Progress">กำลังซ่อม</option><option value="Completed">เสร็จแล้ว</option><option value="Cancelled">ยกเลิก</option></select></label><label className="text-xs font-medium">ระดับความสำคัญ<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label className="text-xs font-medium sm:col-span-2">กำหนดเวลา<input type="datetime-local" value={draft.scheduled_at ?? ""} onChange={(event) => setDraft({ ...draft, scheduled_at: event.target.value || null })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs">ยกเลิก</button><button disabled={saving} className="bg-[#183a32] px-4 py-2 text-xs font-semibold text-white">{saving ? "กำลังบันทึก..." : "บันทึกงาน"}</button></div></form></div>}
  </PageShell>;
}
