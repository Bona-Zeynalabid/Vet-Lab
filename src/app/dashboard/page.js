"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { casesApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [openRooms, setOpenRooms] = useState([]);

  const rooms = [
    { label: "Case Registration", role: "case_registration" },
    { label: "Pathology Lab", role: "pathology" },
    { label: "Bacteriology Lab", role: "bacteriology" },
    { label: "Parasitology Lab", role: "parasitology" },
    { label: "Diagnosis - Pet Doctor", role: "diagnosis_petdoc" },
    { label: "Diagnosis - Large Animal Doctor", role: "diagnosis_largedoc" },
    { label: "Diagnosis - Equine Specialist", role: "diagnosis_equinedoc" },
    { label: "Pharmacy", role: "pharmacy" },
  ];

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("vet_user="));
    if (!cookie) {
      router.push("/login");
      return;
    }
    try {
      const userData = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
      setUser(userData);
      fetchActivityData(userData);
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchActivityData = async (userData) => {
    // Fetch active cases created by this user
    try {
      const active = await casesApi.list({ by: userData.firstName + " " + userData.lastName });
      setActiveCases(active);
    } catch (err) {
      console.error("Failed to fetch active cases:", err);
    }

    // Fetch completed cases from Supabase where veterinarian_name matches user
    try {
      const { data, error } = await supabase
        .from("completed_cases")
        .select("id, case_no, date, owner_name, veterinarian_name")
        .eq("veterinarian_name", userData.firstName + " " + userData.lastName)
        .order("created_at", { ascending: false });

      if (!error) {
        setCompletedCases(data || []);
      } else {
        console.error("Supabase error:", error.message);
      }
    } catch (err) {
      console.error("Failed to fetch completed cases:", err);
    }

    // Determine open rooms (unlocked via sessionStorage)
    const unlocked = rooms.filter((room) => {
      const expiry = sessionStorage.getItem(`vet_unlocked_${room.role}`);
      return expiry && Date.now() < parseInt(expiry, 10);
    });
    setOpenRooms(unlocked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800 font-mono">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">
          Loading activity...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Veterinary Control Center
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 font-mono">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="px-3 py-1.5 bg-white border border-slate-300 shadow-xs uppercase text-slate-700">
              Role: <span className="text-slate-900 font-bold">{user?.role || "Practitioner"}</span>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-300 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Active Cases
              </h3>
              <span className="text-2xl font-bold text-slate-900">{activeCases.length}</span>
            </div>
            <Link
              href="/dashboard/rooms?filter=active"
              className="mt-3 inline-block text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-800"
            >
              View All →
            </Link>
          </div>

          <div className="bg-white border border-slate-300 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Completed Cases
              </h3>
              <span className="text-2xl font-bold text-slate-900">{completedCases.length}</span>
            </div>
            <button
              onClick={() => router.push("/dashboard/case-registration?tab=completed")}
              className="mt-3 inline-block text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-800"
            >
              View Archive →
            </button>
          </div>

          <div className="bg-white border border-slate-300 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Open Rooms
              </h3>
              <span className="text-2xl font-bold text-slate-900">{openRooms.length}</span>
            </div>
            <Link
              href="/dashboard/rooms"
              className="mt-3 inline-block text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-800"
            >
              Manage Rooms →
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Cases List */}
          <div className="bg-white border border-slate-300 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-3">
              Recent Active Cases
            </h3>
            {activeCases.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                No active cases assigned to you.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {activeCases.slice(0, 5).map((c) => (
                  <li key={c._id} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold text-slate-800">{c.caseInfo?.caseNumber}</span>
                    <span className="text-slate-500">
                      {c.caseInfo?.date ? new Date(c.caseInfo.date).toLocaleDateString() : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completed Cases List */}
          <div className="bg-white border border-slate-300 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-3">
              Recent Completed Cases
            </h3>
            {completedCases.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                No completed cases found.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {completedCases.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold text-slate-800">{c.case_no}</span>
                    <span className="text-slate-500">
                      {c.date ? new Date(c.date).toLocaleDateString() : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Open Rooms */}
        <div className="bg-white border border-slate-300 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-3">
            Open Rooms
          </h3>
          {openRooms.length === 0 ? (
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              No rooms currently unlocked.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {openRooms.map((room) => (
                <Link
                  key={room.role}
                  href={`/dashboard/${room.role === "case_registration" ? "case-registration" : room.role}`}
                  className="border border-slate-300 p-3 hover:border-slate-800 transition-colors"
                >
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {room.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}