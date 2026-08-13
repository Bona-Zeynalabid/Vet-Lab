"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { pathologyApi } from "@/lib/api";

export default function PathologyDetailPage() {
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
      const data = await pathologyApi.getById(id);
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
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Pathology Report</span>
          <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">Case: {record.caseId || "-"}</h1>
        </div>
        <button onClick={() => router.back()} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-300 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">General Info</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span className="text-slate-500">Doc:</span> <span className="font-semibold">{record.doc || "-"}</span></div>
            <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Completed:</span> <span className="font-semibold">{record.dateCompleted ? new Date(record.dateCompleted).toLocaleDateString() : "-"}</span></div>
            <div><span className="text-slate-500">Technician:</span> <span className="font-semibold">{record.technician || "-"}</span></div>
          </div>
        </div>

        {record.milkExamination && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Milk Examination</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">CMT RF:</span> <span className="font-semibold">{record.milkExamination.cmt?.rightFront || "-"}</span></div>
              <div><span className="text-slate-500">CMT RH:</span> <span className="font-semibold">{record.milkExamination.cmt?.rightHind || "-"}</span></div>
              <div><span className="text-slate-500">CMT LF:</span> <span className="font-semibold">{record.milkExamination.cmt?.leftFront || "-"}</span></div>
              <div><span className="text-slate-500">CMT LH:</span> <span className="font-semibold">{record.milkExamination.cmt?.leftHind || "-"}</span></div>
              <div><span className="text-slate-500">SCC:</span> <span className="font-semibold">{record.milkExamination.somaticCellCount || "-"}</span></div>
              <div><span className="text-slate-500">Conductivity:</span> <span className="font-semibold">{record.milkExamination.electricalConductivity || "-"}</span></div>
              <div><span className="text-slate-500">pH:</span> <span className="font-semibold">{record.milkExamination.milkPh || "-"}</span></div>
              <div><span className="text-slate-500">Culture:</span> <span className="font-semibold">{record.milkExamination.bacterialCulture || "-"}</span></div>
              <div><span className="text-slate-500">Antibiotic Residue:</span> <span className="font-semibold">{record.milkExamination.antibioticResidue || "-"}</span></div>
              <div><span className="text-slate-500">Appearance:</span> <span className="font-semibold">{record.milkExamination.appearance || "-"}</span></div>
            </div>
          </div>
        )}

        {record.semenAnalysis && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Semen Analysis</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">Volume:</span> <span className="font-semibold">{record.semenAnalysis.volume || "-"} mL</span></div>
              <div><span className="text-slate-500">Color:</span> <span className="font-semibold">{record.semenAnalysis.color || "-"}</span></div>
              <div><span className="text-slate-500">Consistency:</span> <span className="font-semibold">{record.semenAnalysis.consistency || "-"}</span></div>
              <div><span className="text-slate-500">pH:</span> <span className="font-semibold">{record.semenAnalysis.ph || "-"}</span></div>
              <div><span className="text-slate-500">Mass Motility:</span> <span className="font-semibold">{record.semenAnalysis.massMotility || "-"}</span></div>
              <div><span className="text-slate-500">Indiv Motility:</span> <span className="font-semibold">{record.semenAnalysis.individualMotility || "-"}%</span></div>
              <div><span className="text-slate-500">Motility Grade:</span> <span className="font-semibold">{record.semenAnalysis.individualMotilityGrade || "-"}</span></div>
              <div><span className="text-slate-500">Normal Sperm:</span> <span className="font-semibold">{record.semenAnalysis.morphology?.normalPercentage || "-"}%</span></div>
              <div className="col-span-2">
                <span className="text-slate-500">Abnormalities:</span>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {Object.entries(record.semenAnalysis.morphology?.abnormalities || {}).map(([k, v]) => v > 0 && <div key={k} className="text-[10px] font-mono">{k}: {v}%</div>)}
                  {Object.values(record.semenAnalysis.morphology?.abnormalities || {}).every(v => !v || v === 0) && <span className="text-slate-400 italic">None</span>}
                </div>
              </div>
              <div><span className="text-slate-500">Catalase:</span> <span className="font-semibold">{record.semenAnalysis.catalaseTest || "-"}</span></div>
              <div><span className="text-slate-500">Vesicular Neurosis:</span> <span className="font-semibold">{record.semenAnalysis.vesicularNeurosis || "-"}</span></div>
              <div><span className="text-slate-500">Live/Dead Ratio:</span> <span className="font-semibold">{record.semenAnalysis.liveDeadRatio || "-"}</span></div>
              <div><span className="text-slate-500">Concentration:</span> <span className="font-semibold">{record.semenAnalysis.spermConcentration || "-"} 10⁹/mL</span></div>
            </div>
          </div>
        )}

        {record.urinalysis && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Urinalysis</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div><span className="text-slate-500">Appearance:</span> <span className="font-semibold">{record.urinalysis.appearance || "-"}</span></div>
              <div><span className="text-slate-500">Color:</span> <span className="font-semibold">{record.urinalysis.color || "-"}</span></div>
              <div><span className="text-slate-500">Specific Gravity:</span> <span className="font-semibold">{record.urinalysis.specificGravity || "-"}</span></div>
              <div><span className="text-slate-500">pH:</span> <span className="font-semibold">{record.urinalysis.ph || "-"}</span></div>
              <div><span className="text-slate-500">Protein:</span> <span className="font-semibold">{record.urinalysis.protein || "-"}</span></div>
              <div><span className="text-slate-500">Glucose:</span> <span className="font-semibold">{record.urinalysis.glucose || "-"}</span></div>
              <div><span className="text-slate-500">Ketones:</span> <span className="font-semibold">{record.urinalysis.ketones || "-"}</span></div>
              <div><span className="text-slate-500">Blood:</span> <span className="font-semibold">{record.urinalysis.blood || "-"}</span></div>
              <div><span className="text-slate-500">Bilirubin:</span> <span className="font-semibold">{record.urinalysis.bilirubin || "-"}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Microscopic:</span> <span className="font-semibold">{record.urinalysis.microscopicFindings || "-"}</span></div>
            </div>
          </div>
        )}

        {record.hematology && (
          <div className="bg-white border border-slate-300 p-4 space-y-2 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Hematology</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Erythrocytes</span>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-1">
                  <div><span className="text-slate-500">RBC:</span> <span className="font-semibold">{record.hematology.erythrocytes?.rbcCount || "-"}</span></div>
                  <div><span className="text-slate-500">Hb:</span> <span className="font-semibold">{record.hematology.erythrocytes?.haemoglobin || "-"}</span></div>
                  <div><span className="text-slate-500">HCT:</span> <span className="font-semibold">{record.hematology.erythrocytes?.haematocrit || "-"}</span></div>
                  <div><span className="text-slate-500">MCV:</span> <span className="font-semibold">{record.hematology.erythrocytes?.mcv || "-"}</span></div>
                  <div><span className="text-slate-500">MCH:</span> <span className="font-semibold">{record.hematology.erythrocytes?.mch || "-"}</span></div>
                  <div><span className="text-slate-500">MCHC:</span> <span className="font-semibold">{record.hematology.erythrocytes?.mchc || "-"}</span></div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Leukocytes</span>
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono mt-1">
                  <div><span className="text-slate-500">Plt:</span> <span className="font-semibold">{record.hematology.leukocytes?.plateletCount || "-"}</span></div>
                  <div><span className="text-slate-500">WBC:</span> <span className="font-semibold">{record.hematology.leukocytes?.wbcCount || "-"}</span></div>
                  <div><span className="text-slate-500">Neut:</span> <span className="font-semibold">{record.hematology.leukocytes?.neutrophils || "-"}</span></div>
                  <div><span className="text-slate-500">Band:</span> <span className="font-semibold">{record.hematology.leukocytes?.bandNeutrophils || "-"}</span></div>
                  <div><span className="text-slate-500">Lymph:</span> <span className="font-semibold">{record.hematology.leukocytes?.lymphocytes || "-"}</span></div>
                  <div><span className="text-slate-500">Mono:</span> <span className="font-semibold">{record.hematology.leukocytes?.monocytes || "-"}</span></div>
                  <div><span className="text-slate-500">Eos:</span> <span className="font-semibold">{record.hematology.leukocytes?.eosinophils || "-"}</span></div>
                  <div><span className="text-slate-500">Baso:</span> <span className="font-semibold">{record.hematology.leukocytes?.basophils || "-"}</span></div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Plasma Proteins</span>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-1">
                  <div><span className="text-slate-500">Fibrinogen:</span> <span className="font-semibold">{record.hematology.plasmaProteins?.fibrinogen || "-"}</span></div>
                  <div><span className="text-slate-500">Plasma Protein:</span> <span className="font-semibold">{record.hematology.plasmaProteins?.plasmaProtein || "-"}</span></div>
                  <div><span className="text-slate-500">Ratio:</span> <span className="font-semibold">{record.hematology.plasmaProteins?.fibrinogenRatio || "-"}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}