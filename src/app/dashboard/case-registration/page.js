"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { casesApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export default function CaseRegistrationPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ lab: "", search: "" });
  const [activeView, setActiveView] = useState("active");

  useEffect(() => {
    fetchCases();
  }, [filter.lab]);

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filter.lab) params.lab = filter.lab;
      if (filter.search) params.caseNumber = filter.search;
      const data = await casesApi.list(params);
      setCases(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedCases = async () => {
    setLoadingCompleted(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("completed_cases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCompletedCases(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCompleted(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCases();
  };

  const handleViewCase = (id) => {
    router.push(`/dashboard/case-registration/${id}`);
  };

  const handleEditCase = (id) => {
    router.push(`/forms/case?edit=${id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this case?")) return;
    try {
      await casesApi.delete(id);
      fetchCases();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors";

  const labelStyle =
    "block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            System Ledger / Case Management
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            Case Registration
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/rooms")}
            className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/forms/case")}
            className="px-4 py-1.5 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-wider font-bold hover:bg-slate-700 transition-colors"
          >
            + New Case
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-300 pb-2">
        <button
          onClick={() => setActiveView("active")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
            activeView === "active"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
          }`}
        >
          Active Cases
        </button>
        <button
          onClick={() => {
            setActiveView("completed");
            if (completedCases.length === 0) fetchCompletedCases();
          }}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
            activeView === "completed"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
          }`}
        >
          Completed Cases
        </button>
      </div>

      {/* ============ ACTIVE CASES ============ */}
      {activeView === "active" ? (
        <div className="bg-white border border-slate-300 p-4 space-y-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelStyle}>Lab Filter</label>
              <select
                value={filter.lab}
                onChange={(e) => setFilter((prev) => ({ ...prev, lab: e.target.value }))}
                className={inputStyle}
              >
                <option value="">All Labs</option>
                <option value="pathology">Pathology</option>
                <option value="bacteriology">Bacteriology</option>
                <option value="parasitology">Parasitology</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Case Number</label>
              <input
                type="text"
                placeholder="Search case number..."
                value={filter.search}
                onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                className={inputStyle}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-wider font-bold hover:bg-slate-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
              [ERROR]: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Loading records...
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-300">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                No active cases found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono min-w-[800px]">
                <thead className="bg-slate-800 text-white uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Case Number</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5">Species</th>
                    <th className="p-2.5">Lab</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {cases.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold">{c.caseInfo?.caseNumber}</td>
                      <td className="p-2.5">
                        {c.caseInfo?.date ? new Date(c.caseInfo.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2.5">{c.owner?.fullName || "-"}</td>
                      <td className="p-2.5">{c.patient?.species || "-"}</td>
                      <td className="p-2.5">{c.lab || "-"}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-300 uppercase">
                          Pending
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewCase(c._id)}
                            className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase hover:bg-slate-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditCase(c._id)}
                            className="px-2 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="px-2 py-1 border border-red-300 text-red-700 text-[9px] uppercase hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ============ COMPLETED CASES ============ */
        <div className="bg-white border border-slate-300 p-4 space-y-4">
          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
              [ERROR]: {error}
            </div>
          )}

          {loadingCompleted ? (
            <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Loading completed cases...
            </div>
          ) : completedCases.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-300">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                No completed cases found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono min-w-[800px]">
                <thead className="bg-slate-800 text-white uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Case No</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5">Species</th>
                    <th className="p-2.5">Veterinarian</th>
                    <th className="p-2.5">Definitive Diagnosis</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {completedCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold">{c.case_no || "-"}</td>
                      <td className="p-2.5">
                        {c.date ? new Date(c.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2.5">{c.owner_name || "-"}</td>
                      <td className="p-2.5">{c.species || "-"}</td>
                      <td className="p-2.5">{c.veterinarian_name || "-"}</td>
                      <td className="p-2.5">{c.definitive_diagnosis || "-"}</td>
                      <td className="p-2.5">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/case-registration/completed/${c.id}`
                            )
                          }
                          className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase hover:bg-slate-700"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}