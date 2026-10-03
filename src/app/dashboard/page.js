"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { casesApi, userApi, pharmacyApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  FolderIcon,
  Clock,
  CheckCircle2,
  Users as UsersIcon,
  FolderOpen,
  ClipboardCheck,
  FlaskConical,
  Bug,
  Layers,
  Stethoscope,
  GraduationCap,
  Shield,
  Pill,
  ArrowRight,
  Eye,
  Plus,
  Activity,
  TrendingUp,
  FileText,
  Unlock,
  Bell,
  Beaker,
  Package,
  Home,
  PlayCircle,
  PauseCircle,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Beef,
  PawPrint,
} from "lucide-react";

const allRooms = [
  { label: "Case Registration", role: "case_registration", href: "/dashboard/case-registration", icon: ClipboardCheck },
  { label: "Pathology Lab", role: "pathology", href: "/dashboard/pathology", icon: FlaskConical },
  { label: "Bacteriology Lab", role: "bacteriology", href: "/dashboard/bacteriology", icon: Layers },
  { label: "Parasitology Lab", role: "parasitology", href: "/dashboard/parasitology", icon: Bug },
  { label: "Diagnosis – Pet", role: "diagnosis_petdoc", href: "/dashboard/diagnosis/pet", icon: Stethoscope },
  { label: "Diagnosis – Large Animal", role: "diagnosis_largedoc", href: "/dashboard/diagnosis/large", icon: GraduationCap },
  { label: "Diagnosis – Equine", role: "diagnosis_equinedoc", href: "/dashboard/diagnosis/equine", icon: Shield },
  { label: "Pharmacy", role: "pharmacy", href: "/dashboard/pharmacy", icon: Pill },
];

const LAB_ROLES = ["pathology", "bacteriology", "parasitology"];

// Map animal ID prefix → icon
const getAnimalIcon = (animalId) => {
  if (!animalId) return PawPrint;
  const prefix = String(animalId).split("-")[0].toUpperCase();
  const map = {
    HOR: PawPrint,
    CAT: Cat,
    DOG: Dog,
    COW: Beef,
    GOA: PawPrint,
    SHE: PawPrint,
    PIG: PawPrint,
    POU: Bird,
    CAM: PawPrint,
    DON: PawPrint,
    RAB: Rabbit,
    OTH: PawPrint,
  };
  return map[prefix] || PawPrint;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [pharmacyRecords, setPharmacyRecords] = useState([]);
  const [openRooms, setOpenRooms] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [today, setToday] = useState("");

  // Mark mounted + compute date client-only
  useEffect(() => {
    setMounted(true);
    try {
      setToday(
        new Date().toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    } catch {
      setToday("");
    }
  }, []);

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

  const fetchActivityData = async () => {
    // ---- Fetch ALL cases (same for admin & user) ----
    try {
      const active = await casesApi.list();
      setActiveCases(active || []);
    } catch (err) {
      console.error("Failed to fetch active cases:", err);
    }

    // ---- Fetch ALL pharmacy records ----
    try {
      const pharmacy = await pharmacyApi.list();
      setPharmacyRecords(pharmacy || []);
    } catch (err) {
      console.error("Failed to fetch pharmacy records:", err);
    }

    // ---- Fetch ALL completed cases from Supabase ----
    try {
      const { data, error } = await supabase
        .from("completed_cases")
        .select("id, case_no, date, owner_name, species, veterinarian_name")
        .order("created_at", { ascending: false });

      if (!error) setCompletedCases(data || []);
    } catch (err) {
      console.error("Failed to fetch completed cases:", err);
    }

    // ---- Fetch all users count (visible to everyone) ----
    try {
      const users = await userApi.list();
      setUserCount(users?.length || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }

    // ---- Open rooms (client-only, safe) ----
    if (typeof window !== "undefined") {
      const unlocked = allRooms.filter((room) => {
        try {
          const expiry = sessionStorage.getItem(`vet_unlocked_${room.role}`);
          return expiry && Date.now() < parseInt(expiry, 10);
        } catch {
          return false;
        }
      });
      setOpenRooms(unlocked);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800 font-mono">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  const totalCases = activeCases.length + completedCases.length;
  const totalPatients = activeCases.length + completedCases.length;

  const labPendingCases = activeCases.filter((c) =>
    LAB_ROLES.includes((c.lab || "").toLowerCase())
  );
  const diagnosisPendingCases = activeCases.filter(
    (c) =>
      (c.lab || "").toLowerCase() === "diagnosis" ||
      (c.lab || "").toLowerCase() === "self_diagnosis"
  );
  const pharmacyPending = pharmacyRecords.filter((r) => r.status === "pending");
  const pharmacyDispensed = pharmacyRecords.filter(
    (r) => r.status === "dispensed"
  );

  const kpis = [
    {
      label: "Total Patients",
      value: totalPatients,
      icon: FolderIcon,
      accent: "text-slate-900",
      bg: "bg-slate-100",
      href: "/dashboard/case-registration",
    },
    {
      label: "Active Cases",
      value: activeCases.length,
      icon: Clock,
      accent: "text-amber-700",
      bg: "bg-amber-50",
      href: "/dashboard/case-registration",
    },
    {
      label: "Lab Pending",
      value: labPendingCases.length,
      icon: Beaker,
      accent: "text-blue-700",
      bg: "bg-blue-50",
      href: "/dashboard/rooms",
    },
    {
      label: "Pharmacy Pending",
      value: pharmacyPending.length,
      icon: Package,
      accent: "text-purple-700",
      bg: "bg-purple-50",
      href: "/dashboard/pharmacy",
    },
    {
      label: "In Treatment",
      value: diagnosisPendingCases.length,
      icon: Activity,
      accent: "text-rose-700",
      bg: "bg-rose-50",
      href: "/dashboard/rooms",
    },
    {
      label: "Total Users",
      value: userCount,
      icon: UsersIcon,
      accent: "text-indigo-700",
      bg: "bg-indigo-50",
      href: "/dashboard/admin/users",
    },
  ];

  const patientFlow = [
    { label: "Registration", value: activeCases.length, icon: ClipboardCheck, color: "bg-slate-800" },
    { label: "Lab", value: labPendingCases.length, icon: Beaker, color: "bg-blue-600" },
    { label: "Diagnosis", value: diagnosisPendingCases.length, icon: Stethoscope, color: "bg-purple-600" },
    { label: "Pharmacy", value: pharmacyPending.length, icon: Pill, color: "bg-rose-600" },
    { label: "Discharged", value: completedCases.length, icon: Home, color: "bg-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== Welcome Header ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-900 font-mono">
              Good day, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Full system overview — all cases across the hospital
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="px-3 py-1.5 bg-white border border-slate-300 shadow-xs uppercase text-slate-700">
              Role:{" "}
              <span className="text-slate-900 font-bold capitalize">
                {user?.role || "Practitioner"}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-300 shadow-xs uppercase text-slate-700 min-w-[110px] text-center">
              {mounted ? today || "—" : "—"}
            </div>
          </div>
        </div>

        {/* ===== KPI Cards (6) ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="bg-white border border-slate-300 p-4 shadow-xs hover:border-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-1.5 border border-slate-200 ${kpi.bg}`}>
                    <Icon className={`w-4 h-4 ${kpi.accent}`} />
                  </div>
                  <TrendingUp className="w-3 h-3 text-slate-300" />
                </div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  {kpi.label}
                </p>
                <p className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {kpi.value}
                </p>
              </Link>
            );
          })}
        </div>

        {/* ===== Patient Flow ===== */}
        <div className="bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Patient Flow
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Live clinical pipeline
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 overflow-x-auto">
            {patientFlow.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.label}
                  className="flex items-center gap-3 flex-1 min-w-[120px]"
                >
                  <div className="flex flex-col items-center text-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full ${stage.color} flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 mt-2">
                      {stage.label}
                    </p>
                    <p className="text-xl font-mono font-bold text-slate-900">
                      {stage.value}
                    </p>
                  </div>
                  {idx < patientFlow.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Two Column Area ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left – Recent Cases */}
          <div className="lg:col-span-2 bg-white border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Recent Cases
                </h2>
              </div>
              <Link
                href="/dashboard/case-registration"
                className="text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {activeCases.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-300 bg-slate-50">
                <p className="text-[10px] font-mono uppercase text-slate-500">
                  No active cases found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono min-w-[750px]">
                  <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5">Case #</th>
                      <th className="p-2.5">Patient</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5">Species</th>
                      <th className="p-2.5">Lab</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeCases.slice(0, 8).map((c) => {
                      const animalId = c.patient?.animalId || "";
                      const AnimalIcon = getAnimalIcon(animalId);
                      return (
                        <tr key={c._id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-900">
                            {c.caseInfo?.caseNumber || "-"}
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              <AnimalIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="font-semibold text-slate-800">
                                {animalId || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {c.owner?.fullName || "-"}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {c.patient?.species || "-"}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-[9px] uppercase font-bold">
                              {c.lab || "-"}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <Link
                              href={`/dashboard/case-registration/${c._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase font-bold hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeCases.length > 8 && (
              <div className="mt-3 text-[10px] font-mono text-slate-500 text-right">
                Showing 8 of {activeCases.length}
              </div>
            )}
          </div>

          {/* Right – Quick Actions + Pharmacy */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-300 p-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <Activity className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Quick Actions
                </h2>
              </div>
              <div className="space-y-2">
                <Link
                  href="/dashboard/case-registration"
                  className="flex items-center justify-between p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-slate-800" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      Register Case
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/dashboard/pharmacy"
                  className="flex items-center justify-between p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-4 h-4 text-slate-800" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      Pharmacy Queue
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5">
                    {pharmacyPending.length}
                  </span>
                </Link>
                <Link
                  href="/dashboard/rooms"
                  className="flex items-center justify-between p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="w-4 h-4 text-slate-800" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      Manage Rooms
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Pharmacy Summary */}
            <div className="bg-white border border-slate-300 p-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <Pill className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Pharmacy Summary
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700">
                      Pending
                    </span>
                  </div>
                  <span className="text-lg font-mono font-bold text-amber-700">
                    {pharmacyPending.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700">
                      Dispensed
                    </span>
                  </div>
                  <span className="text-lg font-mono font-bold text-emerald-700">
                    {pharmacyDispensed.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recently Completed */}
            <div className="bg-white border border-slate-300 p-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <Bell className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Recently Completed
                </h2>
              </div>
              {completedCases.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  No completed cases.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {completedCases.slice(0, 4).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between text-[10px] font-mono pb-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {c.case_no}
                          </p>
                          <p className="text-slate-500 truncate">
                            {c.owner_name || "-"}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-500 shrink-0">
                        {mounted && c.date
                          ? new Date(c.date).toLocaleDateString()
                          : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ===== Open Rooms ===== */}
        <div className="bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Rooms
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {openRooms.length} unlocked this session
            </span>
          </div>

          {openRooms.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-300 bg-slate-50">
              <p className="text-[10px] font-mono uppercase text-slate-500">
                No rooms currently unlocked. Visit the Rooms page to unlock one.
              </p>
              <Link
                href="/dashboard/rooms"
                className="inline-block mt-3 px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
              >
                Go to Rooms
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {openRooms.map((room) => {
                const Icon = room.icon;
                return (
                  <Link
                    key={room.role}
                    href={room.href}
                    className="flex items-center justify-between p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 border border-slate-300 bg-white group-hover:border-slate-800">
                        <Icon className="w-4 h-4 text-slate-800" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-900 truncate">
                        {room.label}
                      </span>
                    </div>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}