"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, Search } from "lucide-react";
import PageShell from "../components/page-shell";
import { getAlarms, updateAlarmStatus, type Alarm } from "../../lib/data";
import { useIsAdmin, useRealtimeRefresh } from "../../lib/use-access";

const labels = { Open: "เปิดอยู่", "In Progress": "กำลังดำเนินการ", Closed: "ปิดแล้ว" } as const;
const styles: Record<string, string> = { Open: "bg-[#ffe2d8] text-[#b74327]", "In Progress": "bg-[#fff0c7] text-[#856118]", Closed: "bg-[#e5f6ca] text-[#35631e]" };

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const { isAdmin, ready } = useIsAdmin();
  const notified = useRef(false);

  const load = () => {
    getAlarms().then(({ data, error: loadError }) => {
      setAlarms((data as Alarm[]) ?? []);
      if (loadError) setError(loadError.message);
      setLoading(false);
    });
  };
  useEffect(load, []);
  useRealtimeRefresh(load);
  useEffect(() => {
    if (!alarms.length || notified.current) return;
    notified.current = true;
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  }, [alarms]);

  const filtered = useMemo(() => alarms.filter((alarm) => {
    const text = `${alarm.machine?.machine_name ?? ""} ${alarm.alarm_code} ${alarm.description}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === "ทั้งหมด" || labels[alarm.status] === filter);
  }), [alarms, query, filter]);

  async function update(id: string, current: Alarm["status"]) {
    const next = current === "Open" ? "In Progress" : "Closed";
    setSaving(id);
    const result = await updateAlarmStatus(id, next);
    setSaving("");
    if (result.error) setError("อัปเดตไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Admin");
    else load();
  }

  return <PageShell active="/alarms"><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">ศูนย์แจ้งเตือน</div><h1 className="text-3xl font-semibold tracking-[-.04em]">จัดการ Alarm</h1><p className="mt-2 text-sm text-[#7d887f]">ข้อมูลจาก Supabase · การเปลี่ยนสถานะจำกัดเฉพาะ Admin</p></div><div className="mt-8 border border-[#dfe6df] bg-white"><div className="flex flex-wrap gap-3 border-b border-[#e7ece7] p-5"><div className="flex min-w-[220px] flex-1 items-center gap-2 border border-[#e2e8e1] px-3 py-2"><Search size={15} className="text-[#9da69e]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา Machine หรือ Alarm Code..." className="w-full bg-transparent text-xs outline-none" /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-[#e2e8e1] bg-white px-3 text-xs outline-none"><option>ทั้งหมด</option><option>เปิดอยู่</option><option>กำลังดำเนินการ</option><option>ปิดแล้ว</option></select></div>{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <div className="divide-y divide-[#edf1ed]">{filtered.map((alarm) => <div key={alarm.id} className="flex flex-wrap items-center gap-4 px-5 py-5"><div className="grid h-9 w-9 place-items-center bg-[#fff0e9] text-[#c45a3c]"><AlertTriangle size={17} /></div><div className="min-w-[220px] flex-1"><div className="text-sm font-semibold">{alarm.description}</div><div className="mono mt-1 text-[10px] text-[#9ca69e]">{alarm.machine?.machine_name ?? "ไม่ระบุเครื่อง"} · {alarm.alarm_code}</div></div><div className="text-xs text-[#8a968d]">{new Date(alarm.occurred_at).toLocaleString("th-TH")}</div><span className={`px-2 py-1 text-[10px] font-semibold ${styles[alarm.status]}`}>{labels[alarm.status]}</span>{ready && isAdmin && alarm.status !== "Closed" && <button disabled={saving === alarm.id} onClick={() => update(alarm.id, alarm.status)} className="border border-[#cddbcc] px-3 py-2 text-[10px] font-semibold text-[#4d7258]">{saving === alarm.id ? "กำลังบันทึก..." : "อัปเดตสถานะ"}</button>}</div>)}{!filtered.length && <div className="p-10 text-center text-xs text-[#89958c]">ไม่พบ Alarm ตามเงื่อนไข</div>}</div>}</div>{error && <p className="mt-4 border border-[#f0c8bc] bg-[#fff0eb] px-5 py-3 text-xs text-[#b74327]">{error}</p>}</div></PageShell>;
}
