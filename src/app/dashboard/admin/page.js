"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { casesApi, userApi } from "@/lib/api";
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
  KeyIcon,
  FolderOpenIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function AdminHomePage() {
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, completedRes, userRes] = await Promise.all([
          casesApi.list({ limit: 1000 }),
          supabase.from("completed_cases").select("*").order("created_at", { ascending: false }),
          userApi.list({ limit: 1000 }),
        ]);

        setActiveCases(activeRes || []);
        if (completedRes.error) {
          setError(completedRes.error.message);
        } else {
          setCompletedCases(completedRes.data || []);
        }
        setUsers(userRes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Weekly completed cases calculations
  const getWeeklyCompleted = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = new Array(7).fill(0);

    completedCases.forEach((c) => {
      const d = new Date(c.date || c.created_at);
      if (!isNaN(d)) {
        const dayIndex = (d.getDay() + 6) % 7;
        counts[dayIndex]++;
      }
    });

    const max = Math.max(...counts, 1);
    return { days, counts, max };
  };

  const weekly = getWeeklyCompleted();

  const totalCases = activeCases.length + completedCases.length;
  const totalUsers = users.length;
  const totalCompleted = completedCases.length;
  const totalActive = activeCases.length;

  const openRooms = [
    { label: "Case Registration", icon: ClipboardDocumentCheckIcon, route: "/dashboard/case-registration" },
    { label: "Pathology Lab", icon: BeakerIcon, route: "/dashboard/pathology" },
    { label: "Bacteriology Lab", icon: Square3Stack3DIcon, route: "/dashboard/bacteriology" },
    { label: "Parasitology Lab", icon: BugAntIcon, route: "/dashboard/parasitology" },
    { label: "Diagnosis - Pet Doctor", icon: UserIcon, route: "/dashboard/diagnosis?doc=petdoc" },
    { label: "Diagnosis - Large Animal", icon: AcademicCapIcon, route: "/dashboard/diagnosis?doc=large%20doc" },
    { label: "Diagnosis - Equine", icon: ShieldCheckIcon, route: "/dashboard/diagnosis?doc=equine%20doc" },
    { label: "Pharmacy", icon: BuildingStorefrontIcon, route: "/dashboard/pharmacy" },
  ];

  // Generate SVG Line Chart Path coordinates dynamically
  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 20;

  const points = weekly.counts.map((count, i) => {
    const x = padding + (i * (svgWidth - padding * 2)) / (weekly.days.length - 1);
    const y = svgHeight - padding - (count / weekly.max) * (svgHeight - padding * 2);
    return { x, y, count, day: weekly.days[i] };
  });

  const linePathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, "");

  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

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

  if (error) {
    return (
      <div className="p-4 border-2 border-red-600 bg-red-50 text-red-900 text-xs font-mono font-bold flex items-center gap-2">
        <span>[SYSTEM ERROR]:</span>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Page Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold uppercase font-mono text-slate-900 tracking-tight">
            Admin Overview
          </h1>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Metrics Updated Real-Time
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Cases
            </span>
            <FolderIcon className="w-5 h-5 text-slate-700" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalCases}</span>
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
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalActive}</span>
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
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalCompleted}</span>
            <Link
              href="/dashboard/case-registration?tab=completed"
              className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-black flex items-center gap-1 hover:underline"
            >
              <span>Archive</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
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
            <span className="text-3xl font-extrabold font-mono text-slate-900">{totalUsers}</span>
            <Link
              href="/dashboard/admin/users"
              className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-black flex items-center gap-1 hover:underline"
            >
              <span>Manage</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* Analytics Vector Line Chart */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Weekly Case Completion Velocity
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Daily diagnostic and treatment discharge volume
            </p>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-300 w-fit">
            Avg: {(totalCompleted / 7).toFixed(1)} cases / day
          </div>
        </div>

        {/* SVG Custom Responsive Line Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Area Under Line */}
              <path d={areaPathD} fill="url(#chartGradient)" />

              {/* Trend Line */}
              <path d={linePathD} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Points */}
              {points.map((pt, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={pt.x} cy={pt.y} r="4" className="fill-white stroke-slate-900 stroke-2 group-hover:r-6 transition-all" />
                  
                  {/* Tooltip Value */}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="fill-slate-900 font-mono text-[10px] font-bold"
                  >
                    {pt.count}
                  </text>

                  {/* Day Label */}
                  <text
                    x={pt.x}
                    y={svgHeight}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[9px] font-bold uppercase"
                  >
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Open Rooms - Direct Access */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="border-b pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Departmental Stations
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Direct clinical room consoles (Administrative Bypass Active)
            </p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase border border-emerald-300">
            Open Access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {openRooms.map((room) => {
            const IconComponent = room.icon;
            return (
              <Link
                key={room.label}
                href={room.route}
                className="flex items-center justify-between p-3 border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 border border-slate-300 bg-white group-hover:border-slate-800">
                    <IconComponent className="w-4 h-4 text-slate-800" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate">
                    {room.label}
                  </span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Practitioners & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Active Users */}
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b pb-3 mb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Registered Practitioners
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Top {users.slice(0, 5).length} shown
              </span>
            </div>

            {users.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-500 py-4 text-center">
                No active user accounts found.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {users.slice(0, 5).map((u) => (
                  <div key={u._id || u.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                        {u.firstName?.[0] || "U"}
                      </div>
                      <span className="font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-[9px] uppercase font-bold">
                      {u.role || "Practitioner"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-200">
            <Link
              href="/dashboard/admin/users"
              className="inline-flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              <span>Manage User Access</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Administrative Actions */}
        <div className="bg-white border-2 border-slate-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b pb-3 mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Administrative Quick Actions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/admin/credentials"
                className="flex items-center gap-2.5 p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors font-mono text-xs font-bold text-slate-900"
              >
                <KeyIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="truncate">Manage Credentials</span>
              </Link>

              <Link
                href="/dashboard/case-registration?tab=completed"
                className="flex items-center gap-2.5 p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors font-mono text-xs font-bold text-slate-900"
              >
                <FolderOpenIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="truncate">View Case Archive</span>
              </Link>

              <Link
                href="/dashboard/rooms"
                className="flex items-center gap-2.5 p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors font-mono text-xs font-bold text-slate-900"
              >
                <BuildingOfficeIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="truncate">Room Directory</span>
              </Link>

              <Link
                href="/dashboard/admin/settings"
                className="flex items-center gap-2.5 p-3 border border-slate-300 bg-slate-50 hover:border-slate-800 hover:bg-slate-100 transition-colors font-mono text-xs font-bold text-slate-900"
              >
                <Cog6ToothIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="truncate">System Settings</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Audit Trail Enforcement</span>
            <span className="font-bold text-emerald-700">System Ready</span>
          </div>
        </div>

      </div>

    </div>
  );
}