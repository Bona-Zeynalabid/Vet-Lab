"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { credentialApi } from "@/lib/api";

const roles = [
  { value: "case_registration", label: "Case Registration" },
  { value: "pathology", label: "Pathology Lab" },
  { value: "bacteriology", label: "Bacteriology Lab" },
  { value: "parasitology", label: "Parasitology Lab" },
  { value: "diagnosis_petdoc", label: "Diagnosis - Pet Doctor" },
  { value: "diagnosis_largedoc", label: "Diagnosis - Large Animal Doctor" },
  { value: "diagnosis_equinedoc", label: "Diagnosis - Equine Specialist" },
  { value: "pharmacy", label: "Pharmacy" },
];

function PinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "";
  const nextParam = searchParams.get("next") || "";

  const [role, setRole] = useState(roleParam);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role || !pin || pin.length !== 6) {
      setError("Please select a role and enter a 6‑digit PIN.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await credentialApi.verify(role, pin);
      if (result.success) {
        // Clear any previous session
        sessionStorage.removeItem("vet_auth_role");
        sessionStorage.removeItem("vet_auth_route");
        sessionStorage.removeItem("vet_auth_expiry");

        // Save new session with 30‑minute expiry
        const expiry = Date.now() + 30 * 60 * 1000;
        sessionStorage.setItem("vet_auth_role", result.role);
        sessionStorage.setItem("vet_auth_route", result.route);
        sessionStorage.setItem("vet_auth_expiry", expiry.toString());

        const redirectTo = nextParam ? decodeURIComponent(nextParam) : result.route;
        router.push(redirectTo);
      } else {
        setError("Invalid PIN.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono";

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center font-sans text-slate-900">
      <div className="bg-white border-2 border-slate-800 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-lg">
        <div className="border-b-2 border-slate-800 pb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Secure Access
          </span>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
            Enter PIN
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1">
              Select Department / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">— Choose Role —</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1">
              6‑Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={inputStyle}
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
              [ACCESS ERROR]: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-900 text-white text-xs uppercase tracking-widest font-bold hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PinPageContent />
    </Suspense>
  );
}