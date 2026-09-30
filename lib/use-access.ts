"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setReady(true);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
      if (active) {
        setIsAdmin(data?.role === "admin");
        setReady(true);
      }
    }
    loadRole();
    return () => { active = false; };
  }, []);

  return { isAdmin, ready };
}

export type UserRole = "admin" | "technician" | "viewer";

export function useUserRole() {
  const [role, setRole] = useState<UserRole>("viewer");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { if (active) setReady(true); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
      if (active) { setRole((data?.role as UserRole) ?? "viewer"); setReady(true); }
    }
    loadRole();
    return () => { active = false; };
  }, []);

  return { role, ready, isAdmin: role === "admin", canEdit: role !== "viewer" };
}

export function useRealtimeRefresh(onChange: () => void) {
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const channel = supabase.channel(`plantpulse-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "machines" }, () => callback.current())
      .on("postgres_changes", { event: "*", schema: "public", table: "alarms" }, () => callback.current())
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_records" }, () => callback.current())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
}
