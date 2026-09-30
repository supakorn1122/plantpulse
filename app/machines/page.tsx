"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Search, X } from "lucide-react";
import PageShell from "../components/page-shell";
import { createMachine, getMachines, type Machine } from "../../lib/data";
import { useIsAdmin, useRealtimeRefresh } from "../../lib/use-access";

const labels = { Running: "กำลังทำงาน", Stop: "หยุดทำงาน", Alarm: "Alarm", Maintenance: "กำลังซ่อมบำรุง" } as const;
const styles: Record<string, string> = { Running: "bg-[#e5f6ca] text-[#35631e]", Stop: "bg-[#eef0ef] text-[#5e6962]", Alarm: "bg-[#ffe2d8] text-[#b74327]", Maintenance: "bg-[#e4edf5] text-[#315f7e]" };

type Draft = { machine_id: string; machine_name: string; machine_type: string; location: string };

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [draft, setDraft] = useState<Draft>({ machine_id: "", machine_name: "", machine_type: "", location: "" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { isAdmin, ready } = useIsAdmin();

  const load = () => {
    getMachines().then(({ data, error: loadError }) => {
      setMachines(data ?? []);
      if (loadError) setError(loadError.message);
      setLoading(false);
    });
  };
  useEffect(load, []);
  useRealtimeRefresh(load);

  const filtered = useMemo(() => machines.filter((machine) => {
    const text = `${machine.machine_id} ${machine.machine_name} ${machine.machine_type} ${machine.location}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "ทั้งหมด" || labels[machine.status] === filter);
  }), [machines, query, filter]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (Object.values(draft).some((value) => !value.trim())) return setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    setSaving(true);
    const result = await createMachine(draft);
    setSaving(false);
    if (result.error) {
      setError(result.error.code === "23505" ? "รหัสเครื่องจักรต้องไม่ซ้ำกัน" : "บันทึกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Admin");
      return;
    }
    setDraft({ machine_id: "", machine_name: "", machine_type: "", location: "" });
    setOpen(false);
    setError("");
    load();
  }

  return <PageShell active="/machines">
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">ทะเบียนเครื่องจักร</div><h1 className="text-3xl font-semibold tracking-[-.04em]">จัดการเครื่องจักร</h1><p className="mt-2 text-sm text-[#7d887f]">ข้อมูลจาก Supabase · เฉพาะ Admin เท่านั้นที่แก้ไขได้</p></div>
        {ready && isAdmin && <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-[#183a32] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />เพิ่มเครื่องจักร</button>}
      </div>
      <div className="mt-8 border border-[#dfe6df] bg-white">
        <div className="flex flex-wrap gap-3 border-b border-[#e7ece7] p-5"><div className="flex min-w-[220px] flex-1 items-center gap-2 border border-[#e2e8e1] px-3 py-2"><Search size={15} className="text-[#9da69f]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเครื่องจักร..." className="w-full bg-transparent text-xs outline-none" /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-[#e2e8e1] bg-white px-3 text-xs outline-none"><option>ทั้งหมด</option>{Object.values(labels).map((label) => <option key={label}>{label}</option>)}</select></div>
        {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-[#fafbf9] text-[10px] uppercase tracking-[.12em] text-[#9ca69e]"><tr><th className="px-5 py-3">เครื่องจักร</th><th className="px-3 py-3">ประเภท</th><th className="px-3 py-3">พื้นที่ติดตั้ง</th><th className="px-3 py-3">สถานะ</th></tr></thead><tbody>{filtered.map((machine) => <tr key={machine.id} className="border-t border-[#edf1ed]"><td className="px-5 py-4"><div className="font-semibold">{machine.machine_name}</div><div className="mono mt-1 text-[10px] text-[#9ca69e]">{machine.machine_id}</div></td><td className="px-3 py-4 text-[#768279]">{machine.machine_type}</td><td className="px-3 py-4 text-[#768279]">{machine.location}</td><td className="px-3 py-4"><span className={`px-2 py-1 text-[10px] font-semibold ${styles[machine.status]}`}>{labels[machine.status]}</span></td></tr>)}</tbody></table>{!filtered.length && <div className="p-10 text-center text-xs text-[#89958c]">ไม่พบข้อมูลเครื่องจักร</div>}</div>}
        {error && <p className="border-t border-[#f0c8bc] bg-[#fff0eb] px-5 py-3 text-xs text-[#b74327]">{error}</p>}
      </div>
    </div>
    {open && <div className="fixed inset-0 z-20 grid place-items-center bg-[#15271f]/40 p-5"><form onSubmit={save} className="w-full max-w-md bg-[#f8faf6] p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">เพิ่มเครื่องจักร</h2><p className="mt-1 text-xs text-[#7c887f]">บันทึกลง Supabase โดยตรง</p></div><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["รหัสเครื่องจักร", "machine_id"], ["ชื่อเครื่องจักร", "machine_name"], ["ประเภทเครื่องจักร", "machine_type"], ["พื้นที่ติดตั้ง", "location"]].map(([label, key]) => <label key={key} className="text-xs font-medium">{label}<input required value={draft[key as keyof Draft]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1.5 w-full border border-[#d7e1d7] bg-white px-3 py-2.5 text-xs outline-none" /></label>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs">ยกเลิก</button><button disabled={saving} className="bg-[#183a32] px-4 py-2 text-xs font-semibold text-white">{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div></form></div>}
  </PageShell>;
}
