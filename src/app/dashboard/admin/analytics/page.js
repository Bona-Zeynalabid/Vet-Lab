"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { casesApi, userApi, medicineApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import {
  Activity,
  Users,
  Pill,
  ShieldAlert,
  Download,
  Filter,
  Stethoscope,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CHART_COLORS = [
  "#0f172a",
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
];

export default function AdminAnalyticsPage() {
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [activeRes, completedRes, userRes, medRes] = await Promise.all([
          casesApi.list({ limit: 1000 }),
          supabase.from("completed_cases").select("*").order("created_at", { ascending: false }),
          userApi.list({ limit: 1000 }),
          medicineApi.list({ limit: 1000 }),
        ]);

        setActiveCases(activeRes || []);
        if (completedRes.error) {
          setError(completedRes.error.message);
          setCompletedCases([]);
        } else {
          setCompletedCases(completedRes.data || []);
        }
        setUsers(userRes || []);
        setMedicines(medRes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredCompletedCases = useMemo(() => {
    if (timeRange === "all") return completedCases;
    const now = new Date();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const cutoff = new Date(now.setDate(now.getDate() - daysMap[timeRange]));
    return completedCases.filter((c) => new Date(c.created_at || c.date) >= cutoff);
  }, [completedCases, timeRange]);

  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = new Array(7).fill(0);

    filteredCompletedCases.forEach((c) => {
      const d = new Date(c.date || c.created_at);
      if (!isNaN(d)) {
        const dayIndex = (d.getDay() + 6) % 7;
        counts[dayIndex]++;
      }
    });

    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
      day,
      count: counts[i],
      max,
    }));
  }, [filteredCompletedCases]);

  const averageWeekly = useMemo(() => {
    const total = weeklyData.reduce((sum, d) => sum + d.count, 0);
    return (total / 7).toFixed(1);
  }, [weeklyData]);

  const speciesData = useMemo(() => {
    const speciesMap = {};
    const countSpecies = (species) => {
      if (!species) return;
      const key = species.toLowerCase().trim();
      speciesMap[key] = (speciesMap[key] || 0) + 1;
    };
    activeCases.forEach((c) => countSpecies(c.patient?.species));
    filteredCompletedCases.forEach((c) => countSpecies(c.species));

    return Object.entries(speciesMap)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeCases, filteredCompletedCases]);

  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const activeCounts = new Array(12).fill(0);
    const completedCounts = new Array(12).fill(0);

    activeCases.forEach((c) => {
      const d = new Date(c.caseInfo?.date || c.created_at);
      if (!isNaN(d)) activeCounts[d.getMonth()]++;
    });

    filteredCompletedCases.forEach((c) => {
      const d = new Date(c.created_at || c.date);
      if (!isNaN(d)) completedCounts[d.getMonth()]++;
    });

    return months.map((month, i) => ({
      month,
      Active: activeCounts[i],
      Completed: completedCounts[i],
    }));
  }, [activeCases, filteredCompletedCases]);

  const medicineInventory = useMemo(() => {
    return medicines
      .map((m) => ({
        name: m.name,
        quantity: m.stockQuantity || 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [medicines]);

  const medicineUsage = useMemo(() => {
    const usageMap = {};
    filteredCompletedCases.forEach((c) => {
      const medName = c.medicine_name || c.treatment_given || "Unspecified";
      usageMap[medName] = (usageMap[medName] || 0) + 1;
    });
    return Object.entries(usageMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredCompletedCases]);

  const topUsers = useMemo(() => {
    const userMap = {};
    filteredCompletedCases.forEach((c) => {
      const vetName = c.veterinarian_name || "Unassigned";
      userMap[vetName] = (userMap[vetName] || 0) + 1;
    });
    return Object.entries(userMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredCompletedCases]);

  const totalAnimalsTreated = useMemo(() => {
    const activeCount = activeCases.reduce((sum, c) => sum + (Number(c.patient?.numberOfAnimals) || 1), 0);
    const completedCount = filteredCompletedCases.reduce((sum, c) => sum + (Number(c.no_of_animals) || 1), 0);
    return activeCount + completedCount;
  }, [activeCases, filteredCompletedCases]);

  const totalCases = activeCases.length + filteredCompletedCases.length;
  const blockedUsers = users.filter((u) => u.blocked).length;
  const activeUsers = users.length - blockedUsers;

  const exportToCSV = () => {
    if (filteredCompletedCases.length === 0) {
      setError("No completed cases to export for the selected time range.");
      return;
    }

    const headers = [
      "Case No", "Date", "Owner Name", "Address", "Tel No", "Species",
      "No. of Animals", "Breed", "Animal ID", "Sex", "Age", "Body Weight",
      "Case History", "Owner's Complaint", "History/Anamnesis", "Clinical Findings",
      "Demeanor", "Mucous Membrane", "CRT", "Heart Sound", "Lung Sound", "BCS",
      "Respiratory Rate", "Pulse Rate", "GI Motility", "Temperature",
      "Other Clinical Findings", "Differential Diagnosis", "Tentative Diagnosis",
      "Sample Taken", "Lab Methods", "Lab Result", "Definitive Diagnosis",
      "Treatment Given", "Prognosis", "Advice to Owner", "Veterinarian Name",
      "Veterinarian Signature", "Created At",
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === "") return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredCompletedCases.map((c) => [
      escapeCSV(c.case_no || ""), escapeCSV(c.date || ""), escapeCSV(c.owner_name || ""),
      escapeCSV(c.address || ""), escapeCSV(c.tel_no || ""), escapeCSV(c.species || ""),
      escapeCSV(c.no_of_animals || ""), escapeCSV(c.breed || ""), escapeCSV(c.animal_id || ""),
      escapeCSV(c.sex || ""), escapeCSV(c.age || ""), escapeCSV(c.body_weight || ""),
      escapeCSV(c.case_history || ""), escapeCSV(c.owners_complaint || ""),
      escapeCSV(c.history_anamnesis || ""), escapeCSV(c.clinical_findings || ""),
      escapeCSV(c.demeanor || ""), escapeCSV(c.mucous_membrane || ""), escapeCSV(c.crt || ""),
      escapeCSV(c.heart_sound || ""), escapeCSV(c.lung_sound || ""), escapeCSV(c.bcs || ""),
      escapeCSV(c.respiratory_rate || ""), escapeCSV(c.pulse_rate || ""), escapeCSV(c.gi_motility || ""),
      escapeCSV(c.temperature || ""), escapeCSV(c.other_clinical_findings || ""),
      escapeCSV(c.differential_diagnosis || ""), escapeCSV(c.tentative_diagnosis || ""),
      escapeCSV(c.sample_taken || ""), escapeCSV(c.lab_methods || ""), escapeCSV(c.lab_result || ""),
      escapeCSV(c.definitive_diagnosis || ""), escapeCSV(c.treatment_given || ""),
      escapeCSV(c.prognosis || ""), escapeCSV(c.advice_to_owner || ""),
      escapeCSV(c.veterinarian_name || ""), escapeCSV(c.veterinarian_signature || ""),
      escapeCSV(c.created_at || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `completed_cases_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 text-center">
          Generating Analytics Engine...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-black bg-slate-50 flex items-start sm:items-center gap-3 text-xs font-mono text-black">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" />
        <span className="break-all">[SYSTEM ERROR]: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-sans text-slate-900 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-black shrink-0" />
            <h1 className="text-base sm:text-lg font-mono font-bold uppercase tracking-wider text-black">
              System Analytics
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs font-mono text-slate-500 mt-0.5">
            Real-time clinical metrics & performance logs
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-1 bg-white border border-slate-300 px-2.5 py-1.5 sm:py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full text-xs font-mono bg-transparent border-none focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors active:bg-slate-900"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-300 p-3 sm:p-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider sm:tracking-widest text-slate-500 truncate">
              Total Cases
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-black mt-1">{totalCases}</p>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 truncate">
              {activeCases.length} Active / {filteredCompletedCases.length} Done
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-slate-100 border border-slate-300 shrink-0 ml-1">
            <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 sm:p-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider sm:tracking-widest text-slate-500 truncate">
              Animals Treated
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-black mt-1">{totalAnimalsTreated}</p>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 truncate">Aggregate count</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-slate-100 border border-slate-300 shrink-0 ml-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 sm:p-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider sm:tracking-widest text-slate-500 truncate">
              Active Users
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-black mt-1">{activeUsers}</p>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 truncate">
              {blockedUsers} accounts restricted
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-slate-100 border border-slate-300 shrink-0 ml-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 sm:p-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider sm:tracking-widest text-slate-500 truncate">
              Pharmacy Stock
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-black mt-1">{medicines.length}</p>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 truncate">Formulations logged</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-slate-100 border border-slate-300 shrink-0 ml-1">
            <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Case Throughput Trends
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Monthly</span>
          </div>
          <div className="w-full h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={9} stroke="#64748b" tickLine={false} interval={0} />
                <YAxis fontSize={9} stroke="#64748b" tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#000",
                    borderRadius: "0px",
                    color: "#fff",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Area type="monotone" dataKey="Completed" stroke="#000" fill="#000" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Active" stroke="#64748b" fill="#64748b" fillOpacity={0.05} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Species Demographics
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Ratio</span>
          </div>
          <div className="w-full h-[180px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speciesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#000",
                    color: "#fff",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pt-2 border-t border-slate-100">
            {speciesData.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="text-[10px] font-mono truncate text-slate-700">
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Weekly Case Completion Velocity
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Daily diagnostic & treatment discharge volume
            </p>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-300 w-fit">
            Avg: {averageWeekly} cases / day
          </div>
        </div>

        <div className="w-full h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                fontSize={9}
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={9}
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  borderColor: "#000",
                  borderRadius: "0px",
                  color: "#fff",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
                formatter={(value) => [`${value} cases`, 'Completed']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#weeklyGradient)"
                dot={{
                  r: 4,
                  fill: "#fff",
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6, fill: "#0f172a" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Stock Levels (Top In-Store)
            </h3>
            <Package className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="w-full h-[200px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicineInventory} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" fontSize={9} stroke="#64748b" tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} fontSize={9} stroke="#64748b" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="quantity" fill="#0f172a" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Treatment Utilization
            </h3>
            <Pill className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="w-full h-[200px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicineUsage} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={9} stroke="#64748b" tickLine={false} interval={0} />
                <YAxis fontSize={9} stroke="#64748b" tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="count" fill="#475569" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Top Clinicians by Completed Cases
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Performance</span>
          </div>

          {topUsers.length === 0 ? (
            <p className="text-xs font-mono text-slate-400 py-6 text-center">
              No historical case logs recorded for this timeframe.
            </p>
          ) : (
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <div
                  key={u.name}
                  className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 border border-slate-200 hover:border-black transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 bg-black text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      0{i + 1}
                    </span>
                    <span className="text-xs font-mono font-semibold text-black truncate">{u.name}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 shrink-0">
                    {u.count} cases
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-300 p-3.5 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              User Access Matrix
            </h3>
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 truncate">Active</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0 ml-1" />
              </div>
              <p className="text-lg sm:text-xl font-mono font-bold text-black mt-2">{activeUsers}</p>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 truncate">Blocked</span>
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </div>
              <p className="text-lg sm:text-xl font-mono font-bold text-black mt-2">{blockedUsers}</p>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 truncate">Admins</span>
                <Users className="w-3.5 h-3.5 text-black shrink-0 ml-1" />
              </div>
              <p className="text-lg sm:text-xl font-mono font-bold text-black mt-2">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}