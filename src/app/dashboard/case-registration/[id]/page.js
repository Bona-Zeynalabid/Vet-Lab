"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  casesApi,
  pathologyApi,
  bacteriologyApi,
  parasitologyApi,
  diagnosisApi,
  pharmacyApi,
  labRequestApi,
  bactreqApi,
  parareqApi,
  pathoreqApi,
} from "@/lib/api";

// Helper to show a field only when it has a non‑empty value
function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <span className="text-slate-500 uppercase">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// Render lab result (normal or request) with all values
function renderLabResult(labResult, labType) {
  if (!labResult) return null;
  return (
    <div className="space-y-2 text-[10px]">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Case ID" value={labResult.caseId} />
        <Field label="Doc" value={labResult.doc} />
        <Field
          label="Date Received"
          value={
            labResult.dateReceived
              ? new Date(labResult.dateReceived).toLocaleDateString()
              : null
          }
        />
        <Field
          label="Date Completed"
          value={
            labResult.dateCompleted
              ? new Date(labResult.dateCompleted).toLocaleDateString()
              : null
          }
        />
      </div>

      {labType === "bacteriology" && (
        <>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Sample
            </span>
            <Field label="Type" value={labResult.sample?.type} />
            <Field
              label="Collection Method"
              value={labResult.sample?.collectionMethod}
            />
            <Field label="Site" value={labResult.sample?.site} />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Culture Details
            </span>
            <Field
              label="Media Used"
              value={labResult.cultureDetails?.mediaUsed?.join(", ") || null}
            />
            <Field
              label="Temperature"
              value={labResult.cultureDetails?.incubation?.temperature}
            />
            <Field
              label="Atmosphere"
              value={labResult.cultureDetails?.incubation?.atmosphere}
            />
            <Field
              label="Duration"
              value={labResult.cultureDetails?.incubation?.duration}
            />
            <Field
              label="24h Growth"
              value={labResult.cultureDetails?.growthObservation?.hours24}
            />
            <Field
              label="48h Growth"
              value={labResult.cultureDetails?.growthObservation?.hours48}
            />
            <Field
              label="72h Growth"
              value={labResult.cultureDetails?.growthObservation?.hours72}
            />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Colony Morphology
            </span>
            <div className="grid grid-cols-2 gap-1">
              <Field label="Size" value={labResult.colonyMorphology?.size} />
              <Field label="Shape" value={labResult.colonyMorphology?.shape} />
              <Field label="Color" value={labResult.colonyMorphology?.color} />
              <Field
                label="Opacity"
                value={labResult.colonyMorphology?.opacity}
              />
              <Field
                label="Elevation"
                value={labResult.colonyMorphology?.elevation}
              />
              <Field
                label="Margin"
                value={labResult.colonyMorphology?.margin}
              />
              <Field
                label="Consistency"
                value={labResult.colonyMorphology?.consistency}
              />
              <Field
                label="Hemolysis"
                value={labResult.colonyMorphology?.hemolysis}
              />
              <Field label="Odor" value={labResult.colonyMorphology?.odor} />
            </div>
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Gram Stain
            </span>
            <Field label="Reaction" value={labResult.gramStain?.gramReaction} />
            <Field
              label="Morphology"
              value={labResult.gramStain?.bacterialMorphology}
            />
            <Field
              label="Microscopic Findings"
              value={labResult.gramStain?.microscopicFindings}
            />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Biochemical Tests
            </span>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(labResult.biochemicalTests || {}).map(
                ([key, val]) => (
                  <Field key={key} label={key} value={val} />
                )
              )}
            </div>
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Organism Identification
            </span>
            <Field
              label="Organism"
              value={labResult.organismIdentification?.organismName}
            />
            <Field
              label="Confidence"
              value={labResult.organismIdentification?.confidenceLevel}
            />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Antibiotic Sensitivity (AST)
            </span>
            <Field
              label="Method"
              value={labResult.antibioticSensitivity?.method}
            />
            {labResult.antibioticSensitivity?.results?.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {labResult.antibioticSensitivity.results.map((ab, i) => (
                  <div key={i} className="border border-slate-200 p-1">
                    {ab.antibiotic}: {ab.zoneSize} ({ab.interpretation?.toUpperCase()})
                  </div>
                ))}
              </div>
            )}
          </div>
          <Field label="Interpretation" value={labResult.interpretation} />
          <Field label="Bacteriologist" value={labResult.bacteriologist} />
        </>
      )}

      {labType === "parasitology" && (
        <>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Sample
            </span>
            <Field label="Type" value={labResult.sample?.type} />
            <Field
              label="Collection Method"
              value={labResult.sample?.collectionMethod}
            />
            <Field label="Condition" value={labResult.sample?.condition} />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Fecal Examination
            </span>
            <Field
              label="Methods"
              value={labResult.fecalExamination?.methodsPerformed?.join(", ") || null}
            />
            <Field
              label="Consistency"
              value={labResult.fecalExamination?.consistency}
            />
            {labResult.fecalExamination?.parasitesFound?.length > 0 && (
              <div className="mt-1">
                <span className="font-bold">Parasites Found:</span>
                {labResult.fecalExamination.parasitesFound.map((p, i) => (
                  <div key={i}>
                    - {p.parasiteName} | Stage: {p.stageFound} | Count: {p.quantity} | Severity: {p.severity}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Blood Parasite Examination
            </span>
            <Field
              label="Staining Method"
              value={labResult.bloodParasiteExamination?.stainingMethod}
            />
            <Field
              label="Smear Type"
              value={labResult.bloodParasiteExamination?.smearType}
            />
            {labResult.bloodParasiteExamination?.parasitesFound?.length > 0 && (
              <div className="mt-1">
                {labResult.bloodParasiteExamination.parasitesFound.map((p, i) => (
                  <div key={i}>
                    - {p.parasiteName} | Detected: {p.detected} | Parasitemia: {p.parasitemiaLevel} | Stage: {p.stage}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Ectoparasite Examination
            </span>
            <Field
              label="Method"
              value={labResult.ectoparasiteExamination?.examinationMethod}
            />
            <Field
              label="Site Examined"
              value={labResult.ectoparasiteExamination?.siteExamined}
            />
            {labResult.ectoparasiteExamination?.parasitesFound?.length > 0 && (
              <div className="mt-1">
                {labResult.ectoparasiteExamination.parasitesFound.map((p, i) => (
                  <div key={i}>
                    - {p.parasiteName} | Detected: {p.detected} | Stage: {p.lifeStage} | Load: {p.quantity}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Field label="Interpretation" value={labResult.interpretation} />
          <Field label="Parasitologist" value={labResult.parasitologist} />
        </>
      )}

      {labType === "pathology" && (
        <>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Milk Examination
            </span>
            <Field label="CMT RF" value={labResult.milkExamination?.cmt?.rightFront} />
            <Field label="CMT RH" value={labResult.milkExamination?.cmt?.rightHind} />
            <Field label="CMT LF" value={labResult.milkExamination?.cmt?.leftFront} />
            <Field label="CMT LH" value={labResult.milkExamination?.cmt?.leftHind} />
            <Field label="Somatic Cell Count" value={labResult.milkExamination?.somaticCellCount} />
            <Field label="Electrical Conductivity" value={labResult.milkExamination?.electricalConductivity} />
            <Field label="pH" value={labResult.milkExamination?.milkPh} />
            <Field label="Bacterial Culture" value={labResult.milkExamination?.bacterialCulture} />
            <Field label="Antibiotic Residue" value={labResult.milkExamination?.antibioticResidue} />
            <Field label="Appearance" value={labResult.milkExamination?.appearance} />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Semen Analysis
            </span>
            <Field label="Volume" value={labResult.semenAnalysis?.volume} />
            <Field label="Color" value={labResult.semenAnalysis?.color} />
            <Field label="Consistency" value={labResult.semenAnalysis?.consistency} />
            <Field label="pH" value={labResult.semenAnalysis?.ph} />
            <Field label="Mass Motility" value={labResult.semenAnalysis?.massMotility} />
            <Field label="Individual Motility %" value={labResult.semenAnalysis?.individualMotility} />
            <Field label="Motility Grade" value={labResult.semenAnalysis?.individualMotilityGrade} />
            <Field label="Normal Sperm %" value={labResult.semenAnalysis?.morphology?.normalPercentage} />
            {labResult.semenAnalysis?.morphology?.abnormalities && (
              <div className="mt-1">
                <span className="font-bold">Abnormalities:</span>
                {Object.entries(labResult.semenAnalysis.morphology.abnormalities)
                  .filter(([, v]) => v > 0)
                  .map(([key, val]) => (
                    <div key={key}>{key}: {val}%</div>
                  ))}
              </div>
            )}
            <Field label="Catalase Test" value={labResult.semenAnalysis?.catalaseTest} />
            <Field label="Vesicular Neurosis" value={labResult.semenAnalysis?.vesicularNeurosis} />
            <Field label="Live/Dead Ratio" value={labResult.semenAnalysis?.liveDeadRatio} />
            <Field label="Sperm Concentration" value={labResult.semenAnalysis?.spermConcentration} />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Urinalysis
            </span>
            <Field label="Appearance" value={labResult.urinalysis?.appearance} />
            <Field label="Color" value={labResult.urinalysis?.color} />
            <Field label="Specific Gravity" value={labResult.urinalysis?.specificGravity} />
            <Field label="pH" value={labResult.urinalysis?.ph} />
            <Field label="Protein" value={labResult.urinalysis?.protein} />
            <Field label="Glucose" value={labResult.urinalysis?.glucose} />
            <Field label="Ketones" value={labResult.urinalysis?.ketones} />
            <Field label="Blood" value={labResult.urinalysis?.blood} />
            <Field label="Bilirubin" value={labResult.urinalysis?.bilirubin} />
            <Field label="Microscopic Findings" value={labResult.urinalysis?.microscopicFindings} />
          </div>
          <div className="border border-slate-300 p-2">
            <span className="font-bold uppercase text-slate-800 block mb-1">
              Hematology
            </span>
            <div className="grid grid-cols-2 gap-1">
              <Field label="RBC" value={labResult.hematology?.erythrocytes?.rbcCount} />
              <Field label="Hb" value={labResult.hematology?.erythrocytes?.haemoglobin} />
              <Field label="HCT" value={labResult.hematology?.erythrocytes?.haematocrit} />
              <Field label="MCV" value={labResult.hematology?.erythrocytes?.mcv} />
              <Field label="MCH" value={labResult.hematology?.erythrocytes?.mch} />
              <Field label="MCHC" value={labResult.hematology?.erythrocytes?.mchc} />
              <Field label="Platelets" value={labResult.hematology?.leukocytes?.plateletCount} />
              <Field label="WBC" value={labResult.hematology?.leukocytes?.wbcCount} />
              <Field label="Neutrophils" value={labResult.hematology?.leukocytes?.neutrophils} />
              <Field label="Band Neutrophils" value={labResult.hematology?.leukocytes?.bandNeutrophils} />
              <Field label="Lymphocytes" value={labResult.hematology?.leukocytes?.lymphocytes} />
              <Field label="Monocytes" value={labResult.hematology?.leukocytes?.monocytes} />
              <Field label="Eosinophils" value={labResult.hematology?.leukocytes?.eosinophils} />
              <Field label="Basophils" value={labResult.hematology?.leukocytes?.basophils} />
              <Field label="Fibrinogen" value={labResult.hematology?.plasmaProteins?.fibrinogen} />
              <Field label="Plasma Protein" value={labResult.hematology?.plasmaProteins?.plasmaProtein} />
              <Field label="Fibrinogen Ratio" value={labResult.hematology?.plasmaProteins?.fibrinogenRatio} />
            </div>
          </div>
          <Field label="Technician" value={labResult.technician} />
        </>
      )}
    </div>
  );
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [caseData, setCaseData] = useState(null);
  const [labResults, setLabResults] = useState({
    pathology: null,
    bacteriology: null,
    parasitology: null,
  });
  const [labRequests, setLabRequests] = useState([]);
  const [requestLabRecords, setRequestLabRecords] = useState({
    pathology: [],
    bacteriology: [],
    parasitology: [],
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchAllData(params.id);
    }
  }, [params.id]);

  const fetchAllData = async (id) => {
    setLoading(true);
    setError("");
    try {
      const caseRes = await casesApi.getById(id);
      setCaseData(caseRes);
      const caseNumber = caseRes.caseInfo?.caseNumber;

      if (caseNumber) {
        const [
          pathRes,
          bactRes,
          paraRes,
          diagRes,
          pharmRes,
          labReqRes,
          pathReqRes,
          bactReqRes,
          paraReqRes,
        ] = await Promise.all([
          pathologyApi.list({ caseId: caseNumber }),
          bacteriologyApi.list({ caseId: caseNumber }),
          parasitologyApi.list({ caseId: caseNumber }),
          diagnosisApi.list({ caseId: caseNumber }),
          pharmacyApi.list({ caseId: caseNumber }),
          labRequestApi.list({ caseId: caseNumber }),
          pathoreqApi.list({ caseId: caseNumber }),
          bactreqApi.list({ caseId: caseNumber }),
          parareqApi.list({ caseId: caseNumber }),
        ]);

        setLabResults({
          pathology: pathRes[0] || null,
          bacteriology: bactRes[0] || null,
          parasitology: paraRes[0] || null,
        });
        setLabRequests(labReqRes || []);
        setRequestLabRecords({
          pathology: pathReqRes || [],
          bacteriology: bactReqRes || [],
          parasitology: paraReqRes || [],
        });
        setDiagnosis(diagRes[0] || null);
        setPharmacy(pharmRes[0] || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRequestLabResult = (req) => {
    if (req.lab === "pathology") {
      return (
        requestLabRecords.pathology.find((p) => p.caseId === req.caseId) ||
        null
      );
    }
    if (req.lab === "bacteriology") {
      return (
        requestLabRecords.bacteriology.find((b) => b.caseId === req.caseId) ||
        null
      );
    }
    if (req.lab === "parasitology") {
      return (
        requestLabRecords.parasitology.find((p) => p.caseId === req.caseId) ||
        null
      );
    }
    return null;
  };

  const getStatusBadge = () => {
    if (pharmacy?.status === "dispensed") {
      return { text: "Completed", color: "bg-green-50 text-green-800 border-green-300" };
    }
    if (diagnosis) {
      return { text: "Diagnosed", color: "bg-blue-50 text-blue-800 border-blue-300" };
    }
    if (
      labResults?.pathology ||
      labResults?.bacteriology ||
      labResults?.parasitology
    ) {
      return { text: "Lab Done", color: "bg-purple-50 text-purple-800 border-purple-300" };
    }
    return { text: "Pending", color: "bg-yellow-50 text-yellow-800 border-yellow-300" };
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
        Loading case details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/dashboard/case-registration")} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-wider hover:bg-slate-100 transition-colors">
          Back to List
        </button>
        <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
          [ERROR]: {error}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/dashboard/case-registration")} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-wider hover:bg-slate-100 transition-colors">
          Back to List
        </button>
        <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Case not found
        </div>
      </div>
    );
  }

  const status = getStatusBadge();

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Case Detail View
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            {caseData.caseInfo?.caseNumber}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${status.color}`}>
            {status.text}
          </span>
          <button onClick={() => router.push("/dashboard/case-registration")} className="px-4 py-1.5 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-wider hover:bg-slate-100 transition-colors">
            Back to List
          </button>
        </div>
      </div>

      {/* Case Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-300 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
            Case Information
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <Field label="Case Number" value={caseData.caseInfo?.caseNumber} />
            <Field label="Date" value={caseData.caseInfo?.date ? new Date(caseData.caseInfo.date).toLocaleDateString() : null} />
            <Field label="Lab" value={caseData.lab} />
            <Field label="Doc" value={caseData.doc} />
            <Field label="Created" value={caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : null} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
            Owner Information
          </h3>
          <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
            <Field label="Name" value={caseData.owner?.fullName} />
            <Field label="Address" value={caseData.owner?.address} />
            <Field label="Telephone" value={caseData.owner?.telephone} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
            Patient Information
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <Field label="Species" value={caseData.patient?.species} />
            <Field label="Breed" value={caseData.patient?.breed} />
            <Field label="Sex" value={caseData.patient?.sex} />
            <Field label="Age" value={caseData.patient?.age} />
            <Field label="Weight (KG)" value={caseData.patient?.weight} />
            <Field label="Animal ID" value={caseData.patient?.animalId} />
            <Field label="Number of Animals" value={caseData.patient?.numberOfAnimals} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
            Clinical & Vitals
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <Field label="Complaint" value={caseData.anamnesis?.primaryComplaint} />
            <Field label="History" value={caseData.anamnesis?.history} />
            <Field label="Temp" value={caseData.physicalExam?.temperature ? `${caseData.physicalExam.temperature}°C` : null} />
            <Field label="Demeanor" value={caseData.physicalExam?.demeanor} />
            <Field label="BCS" value={caseData.physicalExam?.bcs} />
            <Field label="Mucous Memb" value={caseData.physicalExam?.mucousMembrane} />
            <Field label="Resp Rate" value={caseData.physicalExam?.respiratoryRate} />
            <Field label="CRT" value={caseData.physicalExam?.crt} />
            <Field label="Pulse" value={caseData.physicalExam?.pulseRate} />
            <Field label="Heart" value={caseData.physicalExam?.heartSound} />
            <Field label="GI Motility" value={caseData.physicalExam?.giMotility} />
            <Field label="Lung" value={caseData.physicalExam?.lungSound} />
          </div>
          <Field label="Other Findings" value={caseData.physicalExam?.otherFindings} />
        </div>
      </div>

      {/* Lab Directives */}
      <div className="bg-white border border-slate-300 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
          Lab Directives
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[10px] font-mono">
          {['blood', 'urine', 'feces', 'nasal', 'rumen'].map((type) => (
            <div key={type}>
              <span className="text-slate-500 uppercase">{type}:</span>
              <p className="font-semibold">
                {caseData.labDirectives?.[type]?.tests?.length > 0
                  ? caseData.labDirectives[type].tests.join(", ")
                  : "None"}
              </p>
              {caseData.labDirectives?.[type]?.notes && (
                <p className="text-slate-400">Note: {caseData.labDirectives[type].notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Normal Lab Results */}
      {(labResults.pathology || labResults.bacteriology || labResults.parasitology) && (
        <div className="bg-white border-2 border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
            Lab Results (Direct Assignment)
          </h3>

          {labResults.pathology && (
            <div className="border border-slate-300 p-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                Pathology Report
              </h4>
              <Field label="Doc" value={labResults.pathology.doc} />
              <Field label="Technician" value={labResults.pathology.technician} />
              <Field label="Date Completed" value={labResults.pathology.dateCompleted ? new Date(labResults.pathology.dateCompleted).toLocaleDateString() : null} />
              <div className="mt-2">
                {renderLabResult(labResults.pathology, "pathology")}
              </div>
              <button onClick={() => router.push(`/dashboard/pathology/${labResults.pathology._id}`)} className="mt-2 px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700">
                View Full Report
              </button>
            </div>
          )}

          {labResults.bacteriology && (
            <div className="border border-slate-300 p-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                Bacteriology Report
              </h4>
              <Field label="Doc" value={labResults.bacteriology.doc} />
              <Field label="Bacteriologist" value={labResults.bacteriology.bacteriologist} />
              <Field label="Date Completed" value={labResults.bacteriology.dateCompleted ? new Date(labResults.bacteriology.dateCompleted).toLocaleDateString() : null} />
              <div className="mt-2">
                {renderLabResult(labResults.bacteriology, "bacteriology")}
              </div>
              <button onClick={() => router.push(`/dashboard/bacteriology/${labResults.bacteriology._id}`)} className="mt-2 px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700">
                View Full Report
              </button>
            </div>
          )}

          {labResults.parasitology && (
            <div className="border border-slate-300 p-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                Parasitology Report
              </h4>
              <Field label="Doc" value={labResults.parasitology.doc} />
              <Field label="Parasitologist" value={labResults.parasitology.parasitologist} />
              <Field label="Date Completed" value={labResults.parasitology.dateCompleted ? new Date(labResults.parasitology.dateCompleted).toLocaleDateString() : null} />
              <div className="mt-2">
                {renderLabResult(labResults.parasitology, "parasitology")}
              </div>
              <button onClick={() => router.push(`/dashboard/parasitology/${labResults.parasitology._id}`)} className="mt-2 px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700">
                View Full Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lab Requests */}
      <div className="bg-white border-2 border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
          Lab Requests
        </h3>
        {labRequests.length === 0 ? (
          <p className="text-[10px] font-mono text-slate-400 italic">No lab requests for this case.</p>
        ) : (
          labRequests.map((req) => {
            const requestResult = getRequestLabResult(req);
            return (
              <div key={req._id} className="border border-slate-300 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-800">
                    {req.lab} – Requested on {new Date(req.dateRequested).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${req.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                    {req.status}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase text-slate-700 text-[10px]">Requested Tests:</span>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {["blood", "urine", "feces", "nasal", "rumen"].map((type) => {
                      const tests = req.labDirectives?.[type]?.tests;
                      return tests?.length > 0 ? (
                        <div key={type} className="text-[10px]">
                          <span className="text-slate-500">{type}:</span> {tests.join(", ")}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                {req.status === "completed" && requestResult && (
                  <div>
                    <span className="font-bold uppercase text-slate-700 text-[10px] block mb-1">
                      Lab Result:
                    </span>
                    {renderLabResult(requestResult, req.lab)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Diagnosis */}
      {diagnosis && (
        <div className="bg-white border-2 border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
            Diagnosis
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <Field label="Veterinarian" value={diagnosis.veterinarian?.name} />
            <Field label="Date" value={diagnosis.date ? new Date(diagnosis.date).toLocaleDateString() : null} />
            <Field label="Tentative" value={diagnosis.tentativeDiagnosis?.primary} />
            <Field label="Differentials" value={diagnosis.tentativeDiagnosis?.differentials?.join(", ")} />
            <Field label="Justification" value={diagnosis.tentativeDiagnosis?.clinicalJustification} />
            <Field label="Definitive" value={diagnosis.definitiveDiagnosis?.finalDiagnosis} />
            <Field label="Confirmed By" value={diagnosis.definitiveDiagnosis?.confirmedBy?.join(", ")} />
            <Field label="Diagnostic Notes" value={diagnosis.definitiveDiagnosis?.diagnosticNotes} />
            <Field label="Prognosis" value={diagnosis.prognosis} />
            <Field label="Status" value={diagnosis.status} />
          </div>
          {diagnosis.followUp?.instructions && (
            <Field label="Follow-up Instructions" value={diagnosis.followUp.instructions} />
          )}
          <button onClick={() => router.push(`/dashboard/diagnosis/${diagnosis._id}`)} className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700 inline-block">
            View Full Diagnosis
          </button>
        </div>
      )}

      {/* Pharmacy */}
      {pharmacy && (
        <div className="bg-white border-2 border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
            Pharmacy / Dispensing
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <Field label="Medicine" value={pharmacy.medicine?.name} />
            <Field label="Concentration" value={pharmacy.medicine?.concentration} />
            <Field label="Dosage" value={pharmacy.medicine?.dosage} />
            <Field label="Route" value={pharmacy.medicine?.route} />
            <Field label="Frequency" value={pharmacy.medicine?.frequency} />
            <Field label="Duration" value={pharmacy.medicine?.duration} />
            <Field label="Amount" value={pharmacy.medicine?.amount} />
            <Field label="Instructions" value={pharmacy.medicine?.instructions} />
            <Field label="Veterinarian" value={pharmacy.veterinarian} />
            <Field label="Batch Number" value={pharmacy.batchNumber} />
            <Field label="Expiry Date" value={pharmacy.expiryDate ? new Date(pharmacy.expiryDate).toLocaleDateString() : null} />
            <Field label="Dispensed By" value={pharmacy.dispensedBy} />
            <Field label="Dispensed Date" value={pharmacy.dispensedDate ? new Date(pharmacy.dispensedDate).toLocaleDateString() : null} />
            <Field label="Status" value={pharmacy.status} />
          </div>
          <button onClick={() => router.push(`/dashboard/pharmacy/${pharmacy._id}`)} className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700 inline-block">
            View Pharmacy Record
          </button>
        </div>
      )}
    </div>
  );
}