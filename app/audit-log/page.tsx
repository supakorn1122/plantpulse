"use client";

import { useEffect, useState } from "react";
import { FileClock, LoaderCircle } from "lucide-react";
import PageShell from "../components/page-shell";
import { getAuditLogs, type AuditLog } from "../../lib/data";
import { useIsAdmin } from "../../lib/use-access";

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAdmin, ready } = useIsAdmin();
  useEffect(() => { if (!ready || !isAdmin) { if (ready) setLoading(false); return; } getAuditLogs().then(({ data, error: loadError }) => { setItems((data as AuditLog[]) ?? []); if (loadError) setError("ยังไม่ได้ติดตั้งตาราง Audit Log กรุณารัน supabase/bonus-features.sql"); setLoading(false); }); }, [ready, isAdmin]);
  return <PageShell active="/audit-log"><div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-9 lg:px-12"><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">Audit Log</div><h1 className="text-3xl font-semibold tracking-[-.04em]">ประวัติการใช้งานระบบ</h1><p className="mt-2 text-sm text-[#7d887f]">สำหรับผู้ดูแลระบบ ตรวจสอบการเปลี่ยนแปลงข้อมูล</p>{!isAdmin && ready ? <div className="mt-8 border border-[#f0c8bc] bg-[#fff0eb] px-4 py-3 text-xs text-[#b74327]">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</div> : <div className="mt-8 border border-[#dfe6df] bg-white">{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7d887f]"><LoaderCircle size={17} className="animate-spin" />กำลังโหลดข้อมูล</div> : <div className="divide-y divide-[#edf1ed]">{items.map((item) => <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="grid h-9 w-9 place-items-center bg-[#e7f3dc] text-[#54833c]"><FileClock size={17} /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{item.action} · {item.entity}</div><div className="mt-1 text-xs text-[#89958c]">{item.actor?.full_name ?? "ระบบ"}</div></div><time className="text-xs text-[#89958c]">{new Date(item.created_at).toLocaleString("th-TH")}</time></div>)}{!items.length && !error && <div className="p-10 text-center text-xs text-[#89958c]">ยังไม่มีรายการบันทึก</div>}{error && <div className="border-t border-[#f0c8bc] bg-[#fff0eb] px-5 py-3 text-xs text-[#b74327]">{error}</div>}</div>}</div>}</div></PageShell>;
}