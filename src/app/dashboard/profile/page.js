"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  Mail,
  ShieldCheck,
  GraduationCap,
  UserCircle,
  FolderOpen,
  CheckCircle,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { casesApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [openRooms, setOpenRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('vet_user='));
    if (!cookie) {
      router.push("/login");
      return;
    }
    try {
      const userData = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      setUser(userData);
      if (userData?.firstName && userData?.lastName) {
        fetchUserActivity(userData);
      }
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchUserActivity = async (userData) => {
    setDataLoading(true);
    setError("");
    const fullName = `${userData.firstName} ${userData.lastName}`;

    try {
      // Active cases from MongoDB
      const active = await casesApi.list({ by: fullName });
      setActiveCases(Array.isArray(active) ? active : []);

      // Completed cases from Supabase
      const { data: completed, error: supabaseError } = await supabase
        .from("completed_cases")
        .select("id, case_no, date, definitive_diagnosis")
        .eq("veterinarian_name", fullName)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        setError(`Supabase error: ${supabaseError.message}`);
        setCompletedCases([]);
      } else {
        setCompletedCases(completed || []);
      }

      // Open rooms from sessionStorage
      const unlockedRooms = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith("vet_unlocked_")) {
          const expiry = sessionStorage.getItem(key);
          if (expiry && Date.now() < parseInt(expiry, 10)) {
            const role = key.replace("vet_unlocked_", "");
            unlockedRooms.push(role);
          }
        }
      }
      setOpenRooms(unlockedRooms);
    } catch (err) {
      setError(err.message || "Failed to fetch activity");
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "vet_user=; path=/; max-age=0";
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith("vet_unlocked_")) {
        sessionStorage.removeItem(key);
      }
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 border border-slate-300 text-slate-700 hover:bg-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">Profile</h1>
              <p className="text-[10px] font-mono text-slate-500">Personal & activity information</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-red-700 transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </header>

        {error && (
          <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-800 h-24" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
              </div>
              <div className="flex gap-2">
                {user.role === "admin" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                  </span>
                )}
                {user.student && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <GraduationCap className="w-3 h-3 mr-1" /> Student
                  </span>
                )}
              </div>
            </div>

            {/* Detailed info grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Full Name</span>
                <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Email</span>
                <span className="font-medium text-slate-900 break-all">{user.email}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Role</span>
                <span className="font-medium text-slate-900 capitalize">{user.role || "ordinary"}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Student Status</span>
                <span className="font-medium text-slate-900">{user.student ? "Yes" : "No"}</span>
              </div>
              {user.student && user.idNumber && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg col-span-1">
                  <span className="text-slate-500 block">Student ID</span>
                  <span className="font-mono font-medium text-slate-900">{user.idNumber}</span>
                </div>
              )}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Account Status</span>
                {user.blocked ? (
                  <span className="font-medium text-red-600">Blocked</span>
                ) : (
                  <span className="font-medium text-emerald-600">Active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-600">Active Cases</h3>
              <FolderOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{activeCases.length}</div>
            <p className="text-[10px] font-mono text-slate-500 mt-1">Cases recorded by you</p>
          </div>
          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-600">Completed Cases</h3>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{completedCases.length}</div>
            <p className="text-[10px] font-mono text-slate-500 mt-1">Archived in Supabase</p>
          </div>
          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-600">Open Rooms</h3>
              <Building className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{openRooms.length}</div>
            <p className="text-[10px] font-mono text-slate-500 mt-1">Currently unlocked</p>
          </div>
        </div>

        {/* Cases Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase text-slate-800 border-b pb-2 mb-3">
              Recent Active Cases
            </h3>
            {dataLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : activeCases.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-500 uppercase">No active cases</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeCases.slice(0, 10).map((c) => (
                  <li key={c._id} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-800">{c.caseInfo?.caseNumber}</span>
                    <span className="text-slate-500">
                      {c.caseInfo?.date ? new Date(c.caseInfo.date).toLocaleDateString() : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-slate-300 p-5 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase text-slate-800 border-b pb-2 mb-3">
              Recent Completed Cases
            </h3>
            {dataLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : completedCases.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-500 uppercase">No completed cases</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {completedCases.slice(0, 10).map((c) => (
                  <li key={c.id} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-100 pb-2">
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
      </div>
    </div>
  );
}