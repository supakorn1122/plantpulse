"use client";

import { useEffect, useState } from "react";
import { History, LoaderCircle } from "lucide-react";
import PageShell from "../components/page-shell";
import { getMachineHistory, type MachineHistory } from "../../lib/data";

const labels = { Running: "กำลังทำงาน", Stop: "หยุดทำงาน", Alarm: "Alarm", Maintenance: "กำลังซ่อมบำรุง" } as const;

export default function HistoryPage() {
  const [items, setItems] = useState<MachineHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getMachineHistory().then(({ data, error: loadError }) => { setItems((data as MachineHistory[]) ?? []); if (loadError) setError("ยังไม่ได้ติดตั้งตารางประวัติเครื่องจักร กรุณารัน supabase/bonus-features.sql"); setLoading(false); }); }, []);
  return <PageShell active="/history"><div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-9 lg:px-12"><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">Machine History</div><h1 className="text-3xl font-semibold tracking-[-.04em]">ประวัติเครื่องจักร</h1><p className="mt-2 text-sm text-[#7d887f]">บันทึกการเปลี่ยนสถานะจากฐานข้อมูล</p>{error && <div className="mt-6 border border-[#f0c8bc] bg-[#fff0eb] px-4 py-3 text-xs text-[#b74327]">{error}</div>}<div className="mt-8 border border-[#dfe6df] bg-white">{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <div className="divide-y divide-[#edf1ed]">{items.map((item) => <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="grid h-9 w-9 place-items-center bg-[#e7f3dc] text-[#54833c]"><History size={17} /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{item.machine?.machine_name ?? item.machine_id}</div><div className="mt-1 text-xs text-[#89958c]">{item.note}</div></div><span className="text-xs font-semibold text-[#4d7258]">{labels[item.status]}</span><time className="text-xs text-[#89958c]">{new Date(item.created_at).toLocaleString("th-TH")}</time></div>)}{!items.length && !error && <div className="p-10 text-center text-xs text-[#89958c]">ยังไม่มีประวัติเครื่องจักร</div>}</div>}</div></div></PageShell>;
}