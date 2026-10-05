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
  CheckCircle2,
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

// Emoji icon by animal ID prefix
const getAnimalEmoji = (animalId, species = "") => {
  const src = (animalId || species || "").toString().toLowerCase();
  if (src.includes("hor") || src.includes("equine") || src.includes("horse")) return "🐴";
  if (src.includes("cat") || src.includes("feline")) return "🐈";
  if (src.includes("dog") || src.includes("canine")) return "🐕";
  if (src.includes("cow") || src.includes("bovine") || src.includes("cattle")) return "🐄";
  if (src.includes("goa") || src.includes("caprine") || src.includes("goat")) return "🐐";
  if (src.includes("she") || src.includes("ovine") || src.includes("sheep")) return "🐑";
  if (src.includes("pig") || src.includes("swine") || src.includes("porcine")) return "🐖";
  if (src.includes("pou") || src.includes("poultry") || src.includes("chicken")) return "🐔";
  if (src.includes("cam") || src.includes("camel")) return "🐪";
  if (src.includes("don") || src.includes("donkey") || src.includes("mule")) return "🫏";
  if (src.includes("rab") || src.includes("rabbit")) return "🐇";
  return "🐾";
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
      fetchActivityData();
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchActivityData = async () => {
    try {
      const active = await casesApi.list();
      setActiveCases(active || []);
    } catch (err) {
      console.error("Failed to fetch active cases:", err);
    }

    try {
      const pharmacy = await pharmacyApi.list();
      setPharmacyRecords(pharmacy || []);
    } catch (err) {
      console.error("Failed to fetch pharmacy records:", err);
    }

    try {
      const { data, error } = await supabase
        .from("completed_cases")
        .select("id, case_no, date, owner_name, species, veterinarian_name")
        .order("created_at", { ascending: false });

      if (!error) setCompletedCases(data || []);
    } catch (err) {
      console.error("Failed to fetch completed cases:", err);
    }

    try {
      const users = await userApi.list();
      setUserCount(users?.length || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }

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

        {/* ===== KPI Cards ===== */}
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

        {/* ===== Pharmacy Summary (compact, full width) ===== */}
        <div className="bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Pharmacy Summary
              </h2>
            </div>
            <Link
              href="/dashboard/pharmacy"
              className="text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Open Pharmacy</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 border border-slate-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-600" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                  Pending
                </span>
              </div>
              <span className="text-2xl font-mono font-bold text-amber-700">
                {pharmacyPending.length}
              </span>
            </div>
           
          </div>
        </div>

        {/* ===== Recently Active Cases (full width) ===== */}
        <div className="bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Recently Active Cases
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
              <table className="w-full text-left text-[11px] font-mono min-w-[900px]">
                <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5">Case #</th>
                    <th className="p-2.5">Patient</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5">Species</th>
                    <th className="p-2.5">Lab</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeCases.slice(0, 10).map((c) => {
                    const animalId = c.patient?.animalId || "";
                    const species = c.patient?.species || "";
                    const emoji = getAnimalEmoji(animalId, species);
                    return (
                      <tr key={c._id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900">
                          {c.caseInfo?.caseNumber || "-"}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none shrink-0">
                              {emoji}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {animalId || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {c.owner?.fullName || "-"}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {species || "-"}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-[9px] uppercase font-bold">
                            {c.lab || "-"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {mounted && c.caseInfo?.date
                            ? new Date(c.caseInfo.date).toLocaleDateString()
                            : "-"}
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

          {activeCases.length > 10 && (
            <div className="mt-3 text-[10px] font-mono text-slate-500 text-right">
              Showing 10 of {activeCases.length}
            </div>
          )}
        </div>

        {/* ===== Recently Completed Cases (full width, same style) ===== */}
        <div className="bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Recently Completed Cases
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Archive
            </span>
          </div>

          {completedCases.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 bg-slate-50">
              <p className="text-[10px] font-mono uppercase text-slate-500">
                No completed cases
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono min-w-[900px]">
                <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5">Case #</th>
                    <th className="p-2.5">Patient</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5">Species</th>
                    <th className="p-2.5">Veterinarian</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {completedCases.slice(0, 10).map((c) => {
                    const emoji = getAnimalEmoji("", c.species);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900">
                          {c.case_no || "-"}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none shrink-0">
                              {emoji}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {c.species || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {c.owner_name || "-"}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {c.species || "-"}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {c.veterinarian_name || "-"}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {mounted && c.date
                            ? new Date(c.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] uppercase font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Discharged
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {completedCases.length > 10 && (
            <div className="mt-3 text-[10px] font-mono text-slate-500 text-right">
              Showing 10 of {completedCases.length}
            </div>
          )}
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