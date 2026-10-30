import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-ivory text-brand-mocha flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto max-h-screen">
        {children}
      </div>
    </div>
  );
}
