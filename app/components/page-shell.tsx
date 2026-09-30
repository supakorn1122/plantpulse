"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BarChart3, Bell, Boxes, ClipboardCheck, Download, FileClock, History, LayoutDashboard, Settings2, ShieldCheck, Wrench } from "lucide-react";
import LogoutButton from "./logout-button";
import AuthGuard from "./auth-guard";
import { supabase } from "../../lib/supabase";
import type { UserRole } from "../../lib/use-access";

const items = [[LayoutDashboard, "ภาพรวม", "/"], [Boxes, "เครื่องจักร", "/machines"], [Bell, "Alarm", "/alarms"], [BarChart3, "วิเคราะห์ Alarm", "/analytics"], [Wrench, "งานซ่อมบำรุง", "/maintenance"], [History, "ประวัติเครื่องจักร", "/history"], [Download, "ส่งออกข้อมูล", "/exports"], [FileClock, "Audit Log", "/audit-log"]] as const;

export default function PageShell({ active, children }: { active: string; children: React.ReactNode }) {
  const [identity, setIdentity] = useState({ name: "ผู้ใช้งาน", role: "viewer" as UserRole });
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const profile = await supabase.from("profiles").select("full_name, role").eq("id", data.user.id).single();
      setIdentity({ name: profile.data?.full_name || data.user.email || "ผู้ใช้งาน", role: (profile.data?.role as UserRole) ?? "viewer" });
    });
  }, []);

  return <AuthGuard><main className="min-h-screen lg:flex">
    <aside className="hidden w-[248px] shrink-0 border-r border-[#dfe6df] bg-[#edf2eb] lg:flex lg:flex-col">
      <Link href="/" className="flex h-20 items-center gap-3 px-7"><div className="grid h-9 w-9 place-items-center bg-[#183a32] text-[#c9f45d]"><Activity size={20} /></div><div><div className="text-[17px] font-bold tracking-tight">plant<span className="text-[#568d42]">pulse</span></div><div className="mono text-[9px] uppercase tracking-[.18em] text-[#7a877e]">ศูนย์ควบคุม / v1.0</div></div></Link>
      <nav className="mt-8 space-y-1 px-3">{items.map(([Icon, label, href]) => <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${active === href ? "bg-[#dcebcf] text-[#225d48]" : "text-[#66736a] hover:bg-[#e3ebe0]"}`}><Icon size={17} />{label}</Link>)}</nav>
      <div className="mt-auto p-5"><div className="grain border border-[#d6e0d5] bg-[#e7eee3] p-4"><ShieldCheck size={18} className="mb-6 text-[#47805a]" /><div className="text-xs font-semibold">ระบบทำงานปกติ</div><div className="mt-1 text-[11px] leading-4 text-[#79867c]">ซิงค์ล่าสุด 2 นาทีที่แล้ว<br />บริการทั้งหมดพร้อมใช้งาน</div></div><Link href="/settings" className="mt-5 flex items-center gap-3 px-2 py-2 text-xs text-[#7b867d]"><Settings2 size={15} />ตั้งค่าระบบ</Link><LogoutButton /></div>
    </aside>
    <section className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between border-b border-[#dfe6df] bg-[#f6f8f3] px-5 sm:px-9"><Link href="/" className="font-bold lg:hidden">plant<span className="text-[#568d42]">pulse</span></Link><div className="hidden text-sm text-[#738078] lg:block">วันอังคารที่ 22 กันยายน 2569 <span className="mx-2 text-[#c0c9c0]">/</span> กะ A · 06:00—14:00</div><Link href="/settings" className="flex items-center gap-3 text-xs text-[#66736a]"><ClipboardCheck size={16} />{identity.name} · {identity.role === "admin" ? "ผู้ดูแลระบบ" : identity.role === "technician" ? "ช่างเทคนิค" : "Viewer"}</Link></header>{children}</section>
  </main></AuthGuard>;
}