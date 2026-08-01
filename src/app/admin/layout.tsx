import type { Metadata } from "next";
import { AdminChrome } from "@/components/admin/admin-chrome";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminChrome>{children}</AdminChrome>;
}
