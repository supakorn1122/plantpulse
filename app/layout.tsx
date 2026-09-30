import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlantPulse | ระบบซ่อมบำรุง",
  description: "ระบบจัดการเครื่องจักร Alarm และงานซ่อมบำรุงในโรงงาน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}