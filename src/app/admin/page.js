"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3">
        <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
          Admin Dashboard
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/credentials"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            Manage Credentials
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            Add, edit or remove PINs for departments
          </p>
        </Link>
        <Link
          href="/admin/rooms"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            Open Rooms
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            Access any laboratory or doctor dashboard without PIN
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            All Users
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            View and manage system users
          </p>
        </Link>
        <Link
          href="/admin/analytics"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            Analytics
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            System usage and case statistics
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            Settings
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            Global configuration and preferences
          </p>
        </Link>
        <Link
          href="/admin/logs"
          className="bg-white border border-slate-300 p-4 hover:border-slate-800 transition-colors"
        >
          <h3 className="text-sm font-bold uppercase text-slate-800">
            System Logs
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            View recent activity and errors
          </p>
        </Link>
      </div>
    </div>
  );
}