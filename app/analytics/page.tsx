"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import PageShell from "../components/page-shell";
import { getAlarms, type Alarm } from "../../lib/data";

export default function AnalyticsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAlarms().then(({ data }) => { setAlarms((data as Alarm[]) ?? []); setLoading(false); }); }, []);
  const counts = useMemo(() => ({ open: alarms.filter((alarm) => alarm.status === "Open").length, progress: alarms.filter((alarm) => alarm.status === "In Progress").length, closed: alarms.filter((alarm) => alarm.status === "Closed").length }), [alarms]);
  const total = Math.max(alarms.length, 1);
  const bars = [["เปิดอยู่", counts.open, "bg-[#d96b4d]"], ["กำลังดำเนินการ", counts.progress, "bg-[#d5a93e]"], ["ปิดแล้ว", counts.closed, "bg-[#6ba05c]"]] as const;
  return <PageShell active="/analytics"><div className="mx-auto max-w-5xl px-5 py-8 sm:px-9 lg:px-12"><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">Alarm Analytics</div><h1 className="text-3xl font-semibold tracking-[-.04em]">วิเคราะห์ Alarm</h1><p className="mt-2 text-sm text-[#7d887f]">สรุปสถานะเหตุการณ์จากข้อมูลล่าสุด</p>{loading ? <div className="mt-8 flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <><div className="mt-8 grid gap-4 sm:grid-cols-3">{bars.map(([label, value, color]) => <div key={label} className="border border-[#dfe6df] bg-white p-5"><div className="flex items-center gap-2 text-xs text-[#7e8b81]"><AlertTriangle size={15} />{label}</div><div className="mt-4 text-3xl font-semibold">{value}</div><div className="mt-4 h-2 bg-[#edf1ed]"><div className={`h-full ${color}`} style={{ width: `${Math.round((value / total) * 100)}%` }} /></div></div>)}</div><section className="mt-8 border border-[#dfe6df] bg-white p-6"><h2 className="font-semibold">สัดส่วน Alarm</h2><div className="mt-6 flex h-8 overflow-hidden bg-[#edf1ed]">{bars.map(([label, value, color]) => <div key={label} className={color} style={{ width: `${(value / total) * 100}%` }} title={`${label}: ${value}`} />)}</div><div className="mt-5 flex flex-wrap gap-5 text-xs text-[#718078]">{bars.map(([label, value, color]) => <div key={label} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 ${color}`} />{label} {value}</div>)}</div></section></>}</div></PageShell>;
}
