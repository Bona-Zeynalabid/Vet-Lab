"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: "A", exact: true },
  { href: "/admin/credentials", label: "Credentials", icon: "C", exact: false },
  { href: "/admin/rooms", label: "All Rooms", icon: "R", exact: false },
  { href: "/admin/users", label: "All Users", icon: "U", exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: "AN", exact: false },
  { href: "/admin/settings", label: "Settings", icon: "S", exact: false },
  { href: "/admin/logs", label: "System Logs", icon: "L", exact: false },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <div className="flex">
        {/* Admin Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Vet Clinic Admin
            </h2>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              System Management
            </p>
          </div>
          <nav className="p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border-l-2 border-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent"
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-700 text-[10px] font-bold">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <header className="bg-white border-b border-slate-300 px-4 py-3 flex items-center justify-between lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 border border-slate-300 text-slate-700 text-xs font-mono uppercase"
            >
              Menu
            </button>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Admin Control Panel
            </div>
          </header>
          <main className="p-3 sm:p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}