"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { casesApi, userApi, pharmacyApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import {
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  BugAntIcon,
  Square3Stack3DIcon,
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const LAB_ROLES = ["pathology", "bacteriology", "parasitology"];

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
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800 font-mono">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-slate-800 mb-3" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
          Loading Clinical Insights...
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

  const patientFlow = [
    { label: "Registration", value: activeCases.length, icon: ClipboardDocumentCheckIcon },
    { label: "Lab", value: labPendingCases.length, icon: BeakerIcon },
    { label: "Diagnosis", value: diagnosisPendingCases.length, icon: UserIcon },
    { label: "Pharmacy", value: pharmacyPending.length, icon: BuildingStorefrontIcon },
    { label: "Discharged", value: completedCases.length, icon: CheckCircleIcon },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Page Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              Practitioner Portal // {user?.role || "Practitioner"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold uppercase font-mono text-slate-900 tracking-tight">
            Good day, {user?.firstName} {user?.lastName}
          </h1>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {mounted ? today || "Metrics Updated Real-Time" : "Metrics Updated Real-Time"}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Patients
            </span>
            <FolderIcon className="w-5 h-5 text-slate-700" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalPatients}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Active + Archive</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Active Cases
            </span>
            <ClockIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{activeCases.length}</span>
            <Link
              href="/dashboard/case-registration"
              className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-black flex items-center gap-1 hover:underline"
            >
              <span>View</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Completed Cases
            </span>
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{completedCases.length}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Archive</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <UserGroupIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{userCount}</span>
            <Link
              href="/dashboard"
              className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-black flex items-center gap-1 hover:underline"
            >
              <span>System</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Flow Pipeline */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Patient Flow Pipeline
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Active diagnostic and treatment distribution
            </p>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-300 w-fit">
            Active Workflow
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {patientFlow.map((stage) => {
            const IconComponent = stage.icon;
            return (
              <div
                key={stage.label}
                className="p-3 border border-slate-300 bg-slate-50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    {stage.label}
                  </span>
                  <IconComponent className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {stage.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently Active Cases – full width table */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="border-b pb-3 mb-3 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Recently Active Cases
          </h3>
          <Link
            href="/dashboard/case-registration"
            className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-black flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {activeCases.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-300 bg-slate-50">
            <p className="text-[10px] font-mono uppercase text-slate-500">
              No active cases found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono min-w-[800px]">
              <thead className="bg-slate-800 text-white uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Case #</th>
                  <th className="p-2.5">Patient</th>
                  <th className="p-2.5">Owner</th>
                  <th className="p-2.5">Species</th>
                  <th className="p-2.5">Lab</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {activeCases.slice(0, 10).map((c) => {
                  const animalId = c.patient?.animalId || "";
                  const species = c.patient?.species || "";
                  const emoji = getAnimalEmoji(animalId, species);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-900">
                        #{c.caseInfo?.caseNumber || "-"}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm shrink-0">{emoji}</span>
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
                          <EyeIcon className="w-3 h-3" />
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

      {/* Recently Completed Cases – full width table */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="border-b pb-3 mb-3 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Recently Completed Cases
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Archive</span>
        </div>

        {completedCases.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-300 bg-slate-50">
            <p className="text-[10px] font-mono uppercase text-slate-500">
              No completed cases found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono min-w-[800px]">
              <thead className="bg-slate-800 text-white uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-200 bg-white">
                {completedCases.slice(0, 10).map((c) => {
                  const emoji = getAnimalEmoji("", c.species);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-900">
                        #{c.case_no || "-"}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm shrink-0">{emoji}</span>
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
                        <Link
                          href={`/dashboard/case-registration/completed/${c.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] uppercase font-bold hover:bg-emerald-200 transition-colors"
                        >
                          <CheckCircleIcon className="w-3 h-3" />
                          Discharged
                        </Link>
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
    </div>
  );
}