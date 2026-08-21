"use client";

import { useState, useEffect } from "react";
import {
  Database,
  HardDrive,
  Activity,
  AlertCircle,
  RefreshCw,
  Shield,
  Settings,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const StatusIndicator = ({ status }) => {
  const config = {
    healthy: {
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      icon: CheckCircle2,
      label: "Healthy",
    },
    warning: {
      color: "text-amber-600 bg-amber-50 border-amber-200",
      icon: AlertTriangle,
      label: "Warning",
    },
    error: {
      color: "text-rose-600 bg-rose-50 border-rose-200",
      icon: XCircle,
      label: "Error",
    },
  };

  const current = config[status] || config.error;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded text-xs font-mono font-medium ${current.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{current.label}</span>
    </div>
  );
};

export default function AdminSettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await adminApi.health();
      setHealth(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const collections = [
    "bacteriology_reports",
    "bacteriology_requests",
    "veterinary_cases",
    "diagnoses",
    "lab_requests",
    "parasitology_reports",
    "parasitology_requests",
    "pathology_reports",
    "pathology_requests",
    "pharmacy_records",
  ];

  const handleClearAll = async () => {
    if (
      !confirm(
        `⚠️ ARE YOU SURE?\n\nThis will permanently delete ALL data from the following collections:\n\n${collections.join("\n")}\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setActionStatus(null);

    try {
      const results = await Promise.all(
        collections.map(async (target) => {
          try {
            const res = await adminApi.clear(target);
            return { target, success: true, message: res.message };
          } catch (err) {
            return { target, success: false, message: err.message };
          }
        })
      );

      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      if (failures.length === 0) {
        setActionStatus({
          type: "success",
          message: `✅ All ${successes.length} collections cleared successfully.`,
        });
      } else {
        setActionStatus({
          type: "error",
          message: `⚠️ Cleared ${successes.length} collections, but ${failures.length} failed. Check console for details.`,
        });
        console.error("Clear failures:", failures);
      }

      await fetchHealth();
    } catch (err) {
      setActionStatus({ type: "error", message: `❌ ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        <p className="text-xs font-mono tracking-wider text-slate-500 uppercase">
          Retrieving System Health...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-rose-200 bg-rose-50 rounded-lg flex items-center justify-between text-xs font-mono text-rose-900">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>System Error: {error}</span>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3 py-1.5 bg-rose-600 text-white text-[11px] font-medium rounded hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700 shrink-0" />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              System Operations & Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor infrastructure performance, memory allocation, and handle collection management.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                  MongoDB
                </span>
              </div>
              <StatusIndicator status={health?.mongodb?.status || "error"} />
            </div>
            <div className="space-y-2 text-xs font-mono border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Used Space</span>
                <span className="font-semibold text-slate-800">{health?.mongodb?.usedSpace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Space</span>
                <span className="font-semibold text-slate-800">{health?.mongodb?.totalSpace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collections</span>
                <span className="text-slate-800">{health?.mongodb?.collections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Documents</span>
                <span className="text-slate-800">{health?.mongodb?.documents}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                  Supabase
                </span>
              </div>
              <StatusIndicator status={health?.supabase?.status || "error"} />
            </div>
            <div className="space-y-2 text-xs font-mono border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Used Space</span>
                <span className="font-semibold text-slate-800">{health?.supabase?.usedSpace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Space</span>
                <span className="font-semibold text-slate-800">{health?.supabase?.totalSpace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tables</span>
                <span className="text-slate-800">{health?.supabase?.tables}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rows</span>
                <span className="text-slate-800">{health?.supabase?.rows}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                  API Service
                </span>
              </div>
              <StatusIndicator status={health?.api?.status || "error"} />
            </div>
            <div className="space-y-2 text-xs font-mono border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Uptime</span>
                <span className="font-semibold text-slate-800">
                  {health?.api?.uptime
                    ? `${Math.floor(health.api.uptime / 3600)}h ${Math.floor(
                        (health.api.uptime % 3600) / 60
                      )}m`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Ping</span>
                <span className="text-slate-800">
                  {health?.api?.lastPing
                    ? new Date(health.api.lastPing).toLocaleTimeString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Response Time</span>
                <span className="font-semibold text-emerald-600">~120ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
          Storage Allocation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-500">MongoDB Capacity</span>
              <span className="text-slate-700 font-medium">
                {health?.mongodb?.usedSpace} / {health?.mongodb?.totalSpace}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full"
                style={{
                  width: `${(
                    parseFloat(health?.mongodb?.usedSpace || "0") /
                    parseFloat(health?.mongodb?.totalSpace || "1")
                  ) * 100}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-500">Supabase Capacity</span>
              <span className="text-slate-700 font-medium">
                {health?.supabase?.usedSpace} / {health?.supabase?.totalSpace}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full"
                style={{
                  width: `${(
                    parseFloat(health?.supabase?.usedSpace || "0") /
                    parseFloat(health?.supabase?.totalSpace || "1")
                  ) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            Collection Management
          </h2>
          <button
            onClick={handleClearAll}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 text-white text-xs font-medium rounded hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{actionLoading ? "Clearing..." : "Clear All Collections"}</span>
          </button>
        </div>

        {actionStatus && (
          <div
            className={`p-3 border rounded-md mb-4 text-xs font-mono flex items-center gap-2 ${
              actionStatus.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {actionStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionStatus.message}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Collection Target</th>
                <th className="p-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {collections.map((collection) => (
                <tr key={collection} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-slate-800">{collection}</td>
                  <td className="p-3 text-right text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Permanent modification zone. Direct administrative authorizations required.</span>
          </div>
          <span className="font-mono text-[11px]">
            System Sync: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}