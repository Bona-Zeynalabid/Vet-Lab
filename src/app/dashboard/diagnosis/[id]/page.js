"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { diagnosisApi } from "@/lib/api";

export default function DiagnosisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) fetchRecord(params.id);
  }, [params.id]);

  const fetchRecord = async (id) => {
    setLoading(true);
    try {
      const data = await diagnosisApi.getById(id);
      setRecord(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">Loading...</div>;
  if (error) return <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">[ERROR]: {error}</div>;
  if (!record) return <div className="text-center py-8 text-[10px] font-mono uppercase">Record not found</div>;

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Diagnosis Record</span>
          <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">Case: {record.caseId || "-"}</h1>
        </div>
        <button onClick={() => router.back()} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">General</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Veterinarian:</span> <span className="font-semibold">{record.veterinarian?.name || "-"}</span></div>
            <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="font-semibold uppercase">{record.status || "-"}</span></div>
            <div><span className="text-slate-500">Prognosis:</span> <span className="font-semibold">{record.prognosis || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Tentative Diagnosis</h3>
          <div className="text-[10px] font-mono space-y-1">
            <div><span className="text-slate-500">Primary:</span> <span className="font-semibold">{record.tentativeDiagnosis?.primary || "-"}</span></div>
            <div><span className="text-slate-500">Differentials:</span> <span className="font-semibold">{record.tentativeDiagnosis?.differentials?.join(", ") || "-"}</span></div>
            <div><span className="text-slate-500">Justification:</span> <span className="font-semibold">{record.tentativeDiagnosis?.clinicalJustification || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Definitive Diagnosis</h3>
          <div className="text-[10px] font-mono space-y-1">
            <div><span className="text-slate-500">Final:</span> <span className="font-semibold">{record.definitiveDiagnosis?.finalDiagnosis || "-"}</span></div>
            <div><span className="text-slate-500">Confirmed By:</span> <span className="font-semibold">{record.definitiveDiagnosis?.confirmedBy?.join(", ") || "-"}</span></div>
            <div><span className="text-slate-500">Notes:</span> <span className="font-semibold">{record.definitiveDiagnosis?.diagnosticNotes || "-"}</span></div>
          </div>
        </div>

        {record.followUp && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Follow-Up</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{record.followUp.date ? new Date(record.followUp.date).toLocaleDateString() : "-"}</span></div>
              <div><span className="text-slate-500">Instructions:</span> <span className="font-semibold">{record.followUp.instructions || "-"}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}