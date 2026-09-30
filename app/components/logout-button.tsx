"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <button onClick={logout} className="mt-5 flex items-center gap-3 px-2 py-2 text-xs text-[#7b867d] hover:text-[#b74327]"><LogOut size={15} />ออกจากระบบ</button>;
}