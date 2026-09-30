"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import PageShell from "../components/page-shell";
import { getAlarms, getMachines, getMaintenance } from "../../lib/data";
import { downloadCsv } from "../../lib/export";

export default function ExportsPage() {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  async function exportData(type: "machines" | "alarms" | "maintenance") {
    setLoading(type); setMessage("");
    if (type === "machines") { const { data } = await getMachines(); downloadCsv("plantpulse-machines.csv", ["รหัส", "ชื่อ", "ประเภท", "พื้นที่", "สถานะ"], (data ?? []).map((item) => [item.machine_id, item.machine_name, item.machine_type, item.location, item.status])); }
    if (type === "alarms") { const { data } = await getAlarms(); downloadCsv("plantpulse-alarms.csv", ["เครื่องจักร", "รหัส Alarm", "รายละเอียด", "สถานะ", "เวลา"], (data ?? []).map((item) => [item.machine?.machine_name ?? "", item.alarm_code, item.description, item.status, new Date(item.occurred_at).toLocaleString("th-TH")])); }
    if (type === "maintenance") { const { data } = await getMaintenance(); downloadCsv("plantpulse-maintenance.csv", ["งาน", "เครื่องจักร", "สถานะ", "ความสำคัญ", "กำหนด"], (data ?? []).map((item) => [item.title, item.machine?.machine_name ?? "", item.status, item.priority, item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString("th-TH") : ""])); }
    setLoading(""); setMessage("ส่งออกไฟล์เรียบร้อยแล้ว");
  }
  const cards = [["machines", "เครื่องจักร", "ทะเบียนและสถานะเครื่องจักร"], ["alarms", "Alarm", "เหตุการณ์แจ้งเตือนทั้งหมด"], ["maintenance", "งานซ่อมบำรุง", "ใบงานและกำหนดการ"]] as const;
  return <PageShell active="/exports"><div className="mx-auto max-w-4xl px-5 py-8 sm:px-9 lg:px-12"><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">Data Export</div><h1 className="text-3xl font-semibold tracking-[-.04em]">ส่งออกข้อมูล</h1><p className="mt-2 text-sm text-[#7d887f]">ดาวน์โหลดข้อมูลปัจจุบันเป็นไฟล์ CSV เปิดได้ด้วย Excel</p>{message && <div className="mt-6 border border-[#c6dfc0] bg-[#eef9e8] px-4 py-3 text-xs text-[#39633a]">{message}</div>}<div className="mt-8 grid gap-4 sm:grid-cols-3">{cards.map(([type, title, description]) => <button key={type} type="button" onClick={() => exportData(type)} disabled={Boolean(loading)} className="border border-[#dfe6df] bg-white p-5 text-left transition hover:border-[#8eb497] disabled:opacity-60"><Download size={19} className="text-[#54833c]" /><div className="mt-8 text-sm font-semibold">{title}</div><div className="mt-2 text-xs text-[#89958c]">{description}</div><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#4d7258]">{loading === type && <LoaderCircle size={14} className="animate-spin" />}ดาวน์โหลด CSV</div></button>)}</div></div></PageShell>;
}
