"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { bacteriologyApi } from "@/lib/api";

export default function BacteriologyDetailPage() {
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
      const data = await bacteriologyApi.getById(id);
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
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Bacteriology Report</span>
          <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">Case: {record.caseId || "-"}</h1>
        </div>
        <button onClick={() => router.back()} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">General Information</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Doc:</span> <span className="font-semibold">{record.doc || "-"}</span></div>
            <div><span className="text-slate-500">Date Received:</span> <span className="font-semibold">{record.dateReceived ? new Date(record.dateReceived).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Date Completed:</span> <span className="font-semibold">{record.dateCompleted ? new Date(record.dateCompleted).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Bacteriologist:</span> <span className="font-semibold">{record.bacteriologist || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Sample Details</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Type:</span> <span className="font-semibold">{record.sample?.type || "-"}</span></div>
            <div><span className="text-slate-500">Collection Method:</span> <span className="font-semibold">{record.sample?.collectionMethod || "-"}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Site:</span> <span className="font-semibold">{record.sample?.site || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Culture Details</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Media Used:</span> <span className="font-semibold">{record.cultureDetails?.mediaUsed?.join(", ") || "-"}</span></div>
            <div><span className="text-slate-500">Temperature:</span> <span className="font-semibold">{record.cultureDetails?.incubation?.temperature || "-"}</span></div>
            <div><span className="text-slate-500">Atmosphere:</span> <span className="font-semibold">{record.cultureDetails?.incubation?.atmosphere || "-"}</span></div>
            <div><span className="text-slate-500">Duration:</span> <span className="font-semibold">{record.cultureDetails?.incubation?.duration || "-"}</span></div>
          </div>
          <div className="mt-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Growth Observations:</span>
            <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] font-mono">
              <div><span className="text-slate-500">24h:</span> <span className="font-semibold">{record.cultureDetails?.growthObservation?.hours24 || "-"}</span></div>
              <div><span className="text-slate-500">48h:</span> <span className="font-semibold">{record.cultureDetails?.growthObservation?.hours48 || "-"}</span></div>
              <div><span className="text-slate-500">72h:</span> <span className="font-semibold">{record.cultureDetails?.growthObservation?.hours72 || "-"}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Colony Morphology</h3>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Size:</span> <span className="font-semibold">{record.colonyMorphology?.size || "-"}</span></div>
            <div><span className="text-slate-500">Shape:</span> <span className="font-semibold">{record.colonyMorphology?.shape || "-"}</span></div>
            <div><span className="text-slate-500">Color:</span> <span className="font-semibold">{record.colonyMorphology?.color || "-"}</span></div>
            <div><span className="text-slate-500">Opacity:</span> <span className="font-semibold">{record.colonyMorphology?.opacity || "-"}</span></div>
            <div><span className="text-slate-500">Elevation:</span> <span className="font-semibold">{record.colonyMorphology?.elevation || "-"}</span></div>
            <div><span className="text-slate-500">Margin:</span> <span className="font-semibold">{record.colonyMorphology?.margin || "-"}</span></div>
            <div><span className="text-slate-500">Consistency:</span> <span className="font-semibold">{record.colonyMorphology?.consistency || "-"}</span></div>
            <div><span className="text-slate-500">Hemolysis:</span> <span className="font-semibold">{record.colonyMorphology?.hemolysis || "-"}</span></div>
            <div><span className="text-slate-500">Odor:</span> <span className="font-semibold">{record.colonyMorphology?.odor || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Gram Stain</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Reaction:</span> <span className="font-semibold">{record.gramStain?.gramReaction || "-"}</span></div>
            <div><span className="text-slate-500">Morphology:</span> <span className="font-semibold">{record.gramStain?.bacterialMorphology || "-"}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Microscopic Findings:</span> <span className="font-semibold">{record.gramStain?.microscopicFindings || "-"}</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Biochemical Tests</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {Object.entries(record.biochemicalTests || {}).map(([k, v]) => v ? <div key={k}><span className="text-slate-500">{k}:</span> <span className="font-semibold">{v}</span></div> : null)}
            {Object.values(record.biochemicalTests || {}).every(v => !v) && <span className="text-slate-400 italic">None performed</span>}
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Organism Identification & AST</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Organism:</span> <span className="font-semibold">{record.organismIdentification?.organismName || "-"}</span></div>
            <div><span className="text-slate-500">Confidence:</span> <span className="font-semibold">{record.organismIdentification?.confidenceLevel || "-"}</span></div>
            <div><span className="text-slate-500">AST Method:</span> <span className="font-semibold">{record.antibioticSensitivity?.method || "-"}</span></div>
          </div>
          {record.antibioticSensitivity?.results?.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Results:</span>
              <table className="w-full text-[10px] font-mono mt-1">
                <thead className="bg-slate-100"><tr><th className="p-1 text-left">Antibiotic</th><th className="p-1 text-left">Zone/MIC</th><th className="p-1 text-left">Interpretation</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {record.antibioticSensitivity.results.map((ab, i) => (
                    <tr key={i}><td className="p-1">{ab.antibiotic}</td><td className="p-1">{ab.zoneSize}</td><td className="p-1 uppercase">{ab.interpretation}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Interpretation</h3>
          <p className="text-[10px] font-mono">{record.interpretation || "-"}</p>
        </div>
      </div>
    </div>
  );
}