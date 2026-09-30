"use client";

import { useEffect, useState } from "react";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import PageShell from "../components/page-shell";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [role, setRole] = useState("viewer");
  useEffect(() => { supabase.auth.getUser().then(async ({ data }) => { if (!data.user) return; setEmail(data.user.email ?? ""); setName(data.user.user_metadata?.full_name ?? ""); const profile = await supabase.from("profiles").select("role, full_name").eq("id", data.user.id).single(); if (profile.data) { setRole(profile.data.role); setName(profile.data.full_name); } }); }, []);
  const roleLabel = role === "admin" ? "ผู้ดูแลระบบ" : role === "technician" ? "ช่างเทคนิค" : "Viewer";
  return <PageShell active="/settings"><div className="mx-auto max-w-3xl px-5 py-8 sm:px-9 lg:px-12"><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6e8870]">บัญชีผู้ใช้งาน</div><h1 className="text-3xl font-semibold tracking-[-.04em]">ตั้งค่าระบบ</h1><p className="mt-2 text-sm text-[#7d887f]">ข้อมูลบัญชีและสิทธิ์การเข้าถึงของคุณ</p><div className="mt-8 border border-[#dfe6df] bg-white p-6"><div className="flex items-center gap-4 border-b border-[#edf1ed] pb-6"><div className="grid h-14 w-14 place-items-center bg-[#d4e5c5] text-[#39633a]"><UserRound size={25} /></div><div><h2 className="font-semibold">{name || "ผู้ใช้งาน"}</h2><p className="mt-1 text-xs text-[#89958c]">{roleLabel}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="border border-[#e2e8e1] p-4"><div className="flex items-center gap-2 text-xs text-[#7d887f]"><Mail size={14} />อีเมล</div><div className="mt-3 text-sm">{email || "กำลังโหลด..."}</div></div><div className="border border-[#e2e8e1] p-4"><div className="flex items-center gap-2 text-xs text-[#7d887f]"><ShieldCheck size={14} />สิทธิ์การใช้งาน</div><div className="mt-3 text-sm">{roleLabel}</div></div></div></div></div></PageShell>;
}