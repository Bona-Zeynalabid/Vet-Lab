"use client";

import { useRouter } from "next/navigation";
import { credentialApi } from "@/lib/api";

const rooms = [
  {
    label: "Case Registration",
    route: "/dashboard/case-registration",
    role: "case_registration",
  },
  {
    label: "Pathology Lab",
    route: "/dashboard/pathology",
    role: "pathology",
  },
  {
    label: "Bacteriology Lab",
    route: "/dashboard/bacteriology",
    role: "bacteriology",
  },
  {
    label: "Parasitology Lab",
    route: "/dashboard/parasitology",
    role: "parasitology",
  },
  {
    label: "Diagnosis - Pet Doctor",
    route: "/dashboard/diagnosis?doc=petdoc",
    role: "diagnosis_petdoc",
  },
  {
    label: "Diagnosis - Large Animal Doctor",
    route: "/dashboard/diagnosis?doc=large%20doc",
    role: "diagnosis_largedoc",
  },
  {
    label: "Diagnosis - Equine Specialist",
    route: "/dashboard/diagnosis?doc=equine%20doc",
    role: "diagnosis_equinedoc",
  },
  {
    label: "Pharmacy",
    route: "/dashboard/pharmacy",
    role: "pharmacy",
  },
];

export default function AdminRoomsPage() {
  const router = useRouter();

  const openRoom = (room) => {
    // Set admin bypass flag in sessionStorage for the new tab
    // We'll use localStorage because sessionStorage is per-tab
    localStorage.setItem("vet_admin_bypass", "true");
    localStorage.setItem("vet_admin_role", room.role);
    localStorage.setItem("vet_admin_expiry", String(Date.now() + 60 * 1000)); // 1 minute

    // Open in a new tab
    window.open(room.route, "_blank");

    // Optionally clear the flag after a short delay (but the new tab will read it first)
  };

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3">
        <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
          All Rooms
        </h1>
      </div>
      <div className="bg-white border border-slate-300 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.role}
              className="border border-slate-300 p-4 flex items-center justify-between"
            >
              <span className="text-xs font-mono font-bold text-slate-800">
                {room.label}
              </span>
              <button
                onClick={() => openRoom(room)}
                className="px-3 py-1 bg-slate-800 text-white text-[10px] uppercase font-bold hover:bg-slate-700"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}