"use client";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3">
        <h1 className="text-lg font-bold uppercase text-slate-900">Settings</h1>
      </div>
      <div className="bg-white border border-slate-300 p-8 text-center">
        <p className="text-[10px] font-mono uppercase text-slate-500">
          System settings will be available here.
        </p>
      </div>
    </div>
  );
}