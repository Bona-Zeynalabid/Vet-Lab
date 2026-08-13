"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { parasitologyApi } from "@/lib/api";

export default function ParasitologyDetailPage() {
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
      const data = await parasitologyApi.getById(id);
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
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Parasitology Report</span>
          <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">Case: {record.caseId || "-"}</h1>
        </div>
        <button onClick={() => router.back()} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">General Info</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Doc:</span> <span className="font-semibold">{record.doc || "-"}</span></div>
            <div><span className="text-slate-500">Date Received:</span> <span className="font-semibold">{record.dateReceived ? new Date(record.dateReceived).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Completed:</span> <span className="font-semibold">{record.dateCompleted ? new Date(record.dateCompleted).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Parasitologist:</span> <span className="font-semibold">{record.parasitologist || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Sample Details</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Type:</span> <span className="font-semibold">{record.sample?.type || "-"}</span></div>
            <div><span className="text-slate-500">Collection:</span> <span className="font-semibold">{record.sample?.collectionMethod || "-"}</span></div>
            <div><span className="text-slate-500">Condition:</span> <span className="font-semibold">{record.sample?.condition || "-"}</span></div>
          </div>
        </div>

        {record.fecalExamination && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Fecal Examination</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="col-span-2"><span className="text-slate-500">Methods:</span> <span className="font-semibold">{record.fecalExamination.methodsPerformed?.join(", ") || "-"}</span></div>
              <div><span className="text-slate-500">Consistency:</span> <span className="font-semibold">{record.fecalExamination.consistency || "-"}</span></div>
            </div>
            {record.fecalExamination.parasitesFound?.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Parasites Found:</span>
                <table className="w-full text-[10px] font-mono mt-1">
                  <thead className="bg-slate-100"><tr><th className="p-1 text-left">Parasite</th><th className="p-1 text-left">Stage</th><th className="p-1 text-left">Count</th><th className="p-1 text-left">Severity</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.fecalExamination.parasitesFound.map((p, i) => (
                      <tr key={i}><td className="p-1">{p.parasiteName}</td><td className="p-1">{p.stageFound}</td><td className="p-1">{p.quantity}</td><td className="p-1">{p.severity}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {record.bloodParasiteExamination && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Blood Parasites</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">Staining:</span> <span className="font-semibold">{record.bloodParasiteExamination.stainingMethod || "-"}</span></div>
              <div><span className="text-slate-500">Smear Type:</span> <span className="font-semibold">{record.bloodParasiteExamination.smearType || "-"}</span></div>
            </div>
            {record.bloodParasiteExamination.parasitesFound?.length > 0 && (
              <div className="mt-2">
                <table className="w-full text-[10px] font-mono">
                  <thead className="bg-slate-100"><tr><th className="p-1 text-left">Parasite</th><th className="p-1 text-left">Detected</th><th className="p-1 text-left">Level</th><th className="p-1 text-left">Stage</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.bloodParasiteExamination.parasitesFound.map((p, i) => (
                      <tr key={i}><td className="p-1">{p.parasiteName}</td><td className="p-1">{p.detected}</td><td className="p-1">{p.parasitemiaLevel}</td><td className="p-1">{p.stage}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {record.ectoparasiteExamination && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Ectoparasites</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">Method:</span> <span className="font-semibold">{record.ectoparasiteExamination.examinationMethod || "-"}</span></div>
              <div><span className="text-slate-500">Site:</span> <span className="font-semibold">{record.ectoparasiteExamination.siteExamined || "-"}</span></div>
            </div>
            {record.ectoparasiteExamination.parasitesFound?.length > 0 && (
              <div className="mt-2">
                <table className="w-full text-[10px] font-mono">
                  <thead className="bg-slate-100"><tr><th className="p-1 text-left">Parasite</th><th className="p-1 text-left">Detected</th><th className="p-1 text-left">Stage</th><th className="p-1 text-left">Quantity</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.ectoparasiteExamination.parasitesFound.map((p, i) => (
                      <tr key={i}><td className="p-1">{p.parasiteName}</td><td className="p-1">{p.detected}</td><td className="p-1">{p.lifeStage}</td><td className="p-1">{p.quantity}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Interpretation</h3>
          <p className="text-[10px] font-mono">{record.interpretation || "-"}</p>
        </div>
      </div>
    </div>
  );
}