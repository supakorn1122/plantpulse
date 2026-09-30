"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setAllowed(true);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (checking || !allowed) {
    return <main className="grid min-h-screen place-items-center bg-[#edf2eb] px-6"><div className="flex flex-col items-center text-center"><div className="grid h-12 w-12 place-items-center bg-[#183a32] text-[#c9f45d]"><LockKeyhole size={22} /></div><LoaderCircle size={20} className="mt-5 animate-spin text-[#568d42]" /><p className="mt-3 text-sm text-[#718077]">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน</p></div></main>;
  }

  return children;
}
