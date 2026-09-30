"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Activity, ArrowRight, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type AuthMode = "login" | "register";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const result = isRegister
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (result.error) {
      setError(result.error.message.includes("Invalid login credentials") ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : result.error.message);
      return;
    }

    if (isRegister && !result.data.session) {
      setMessage("สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return <main className="grain min-h-screen bg-[#edf2eb] px-5 py-8 sm:px-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[.9fr_1.1fr]"><section className="hidden px-8 lg:block"><div className="mb-10 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center bg-[#183a32] text-[#c9f45d]"><Activity size={21} /></div><div className="text-xl font-bold">plant<span className="text-[#568d42]">pulse</span></div></div><div className="mono text-[10px] uppercase tracking-[.22em] text-[#6e8870]">ระบบควบคุมโรงงาน</div><h1 className="mt-4 max-w-md text-5xl font-semibold leading-[1.05] tracking-[-.06em] text-[#1b2921]">จัดการโรงงาน<br />ให้ไหลลื่นขึ้น</h1><p className="mt-6 max-w-sm text-sm leading-6 text-[#718077]">ศูนย์กลางสำหรับติดตามเครื่องจักร Alarm และงานซ่อมบำรุงแบบเป็นระบบ</p></section><section className="mx-auto w-full max-w-md border border-[#d7e1d7] bg-[#f8faf6] p-6 shadow-[0_20px_60px_rgba(37,65,48,.08)] sm:p-9"><div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center bg-[#183a32] text-[#c9f45d]"><Activity size={19} /></div><div className="text-lg font-bold">plant<span className="text-[#568d42]">pulse</span></div></div></div><div className="mono text-[10px] uppercase tracking-[.2em] text-[#6e8870]">{isRegister ? "สร้างบัญชีผู้ใช้งาน" : "ยินดีต้อนรับกลับ"}</div><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">{isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</h2><p className="mt-2 text-sm text-[#7d887f]">{isRegister ? "เริ่มต้นใช้งานระบบจัดการโรงงาน" : "เข้าสู่ระบบเพื่อดูข้อมูลการปฏิบัติงาน"}</p><form onSubmit={submit} className="mt-7 space-y-4">{isRegister && <label className="block text-xs font-medium text-[#526158]">ชื่อผู้ใช้งาน<div className="mt-1.5 flex items-center gap-2 border border-[#d7e1d7] bg-white px-3"><UserRound size={15} className="text-[#95a198]" /><input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="เช่น Narin S." className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#adb5af]" /></div></label>}<label className="block text-xs font-medium text-[#526158]">อีเมล<div className="mt-1.5 flex items-center gap-2 border border-[#d7e1d7] bg-white px-3"><Mail size={15} className="text-[#95a198]" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#adb5af]" /></div></label><label className="block text-xs font-medium text-[#526158]">รหัสผ่าน<div className="mt-1.5 flex items-center gap-2 border border-[#d7e1d7] bg-white px-3"><LockKeyhole size={15} className="text-[#95a198]" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#adb5af]" /></div></label>{error && <div className="border border-[#f0c8bc] bg-[#fff0eb] px-3 py-2.5 text-xs leading-5 text-[#b74327]">{error}</div>}{message && <div className="border border-[#c8dfb5] bg-[#eff8e7] px-3 py-2.5 text-xs leading-5 text-[#35631e]">{message}</div>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 bg-[#183a32] py-3 text-sm font-semibold text-white transition hover:bg-[#265447] disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle size={16} className="animate-spin" />}{isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}{!loading && <ArrowRight size={16} />}</button></form><p className="mt-7 text-center text-xs text-[#7d887f]">{isRegister ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"} <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-[#3d7152] hover:underline">{isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Link></p></section></div></main>;
}
