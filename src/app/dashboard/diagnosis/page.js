"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  casesApi,
  diagnosisApi,
  pathologyApi,
  bacteriologyApi,
  parasitologyApi,
  labRequestApi,
  bactreqApi,
  parareqApi,
  pathoreqApi,
} from "@/lib/api";

export default function DiagnosisDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [labRecords, setLabRecords] = useState({
    pathology: [],
    bacteriology: [],
    parasitology: [],
  });
  const [requestLabRecords, setRequestLabRecords] = useState({
    pathology: [],
    bacteriology: [],
    parasitology: [],
  });
  const [diagnoses, setDiagnoses] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [requestTab, setRequestTab] = useState("pending");
  const [selectedDoc, setSelectedDoc] = useState("petdoc");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        casesData,
        pathData,
        bactData,
        paraData,
        diagData,
        reqData,
        pathReqData,
        bactReqData,
        paraReqData,
      ] = await Promise.all([
        casesApi.list(),
        pathologyApi.list(),
        bacteriologyApi.list(),
        parasitologyApi.list(),
        diagnosisApi.list(),
        labRequestApi.list(),
        pathoreqApi.list(),
        bactreqApi.list(),
        parareqApi.list(),
      ]);
      setCases(casesData || []);
      setLabRecords({
        pathology: pathData || [],
        bacteriology: bactData || [],
        parasitology: paraData || [],
      });
      setRequestLabRecords({
        pathology: pathReqData || [],
        bacteriology: bactReqData || [],
        parasitology: paraReqData || [],
      });
      setDiagnoses(diagData || []);
      setLabRequests(reqData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLabRecordForCase = (caseNumber) => {
    return (
      labRecords.pathology.find((p) => p.caseId === caseNumber) ||
      labRecords.bacteriology.find((b) => b.caseId === caseNumber) ||
      labRecords.parasitology.find((p) => p.caseId === caseNumber)
    );
  };

  const getLabType = (caseNumber) => {
    if (labRecords.pathology.find((p) => p.caseId === caseNumber)) return "pathology";
    if (labRecords.bacteriology.find((b) => b.caseId === caseNumber)) return "bacteriology";
    if (labRecords.parasitology.find((p) => p.caseId === caseNumber)) return "parasitology";
    return null;
  };

  const getLabResultForRequest = (req) => {
    if (req.lab === "pathology") {
      return (
        requestLabRecords.pathology.find((p) => p.caseId === req.caseId) ||
        labRecords.pathology.find((p) => p.caseId === req.caseId)
      );
    }
    if (req.lab === "bacteriology") {
      return (
        requestLabRecords.bacteriology.find((b) => b.caseId === req.caseId) ||
        labRecords.bacteriology.find((b) => b.caseId === req.caseId)
      );
    }
    if (req.lab === "parasitology") {
      return (
        requestLabRecords.parasitology.find((p) => p.caseId === req.caseId) ||
        labRecords.parasitology.find((p) => p.caseId === req.caseId)
      );
    }
    return null;
  };

  const casesWithLabResults = cases.filter((c) => {
    if (c.lab === "diagnosis") return c.doc === selectedDoc;
    const rec = getLabRecordForCase(c.caseInfo?.caseNumber);
    return rec && rec.doc === selectedDoc;
  });

  const pendingDiagnosis = casesWithLabResults.filter(
    (c) => !diagnoses.some((d) => d.caseId === c.caseInfo?.caseNumber)
  );
  const completedDiagnosis = casesWithLabResults.filter((c) =>
    diagnoses.some((d) => d.caseId === c.caseInfo?.caseNumber)
  );

  const doctorRequests = labRequests.filter((r) => r.doc === selectedDoc);
  const pendingRequests = doctorRequests.filter((r) => r.status === "pending");
  const completedRequests = doctorRequests.filter((r) => r.status === "completed");

  const handleViewCase = async (id) => {
    try {
      const data = await casesApi.getById(id);
      setSelectedCase(data);
      setSelectedRequest(null);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewRequest = async (req) => {
    try {
      const result = await casesApi.list({ caseNumber: req.caseId });
      if (result.length > 0) {
        setSelectedCase(result[0]);
      } else {
        setSelectedCase({ caseInfo: { caseNumber: req.caseId }, error: true });
      }
      setSelectedRequest(req);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const displayCases =
    activeTab === "pending"
      ? pendingDiagnosis
      : activeTab === "completed"
      ? completedDiagnosis
      : [];

  const displayRequests = requestTab === "pending" ? pendingRequests : completedRequests;

  // Helper to display a field only if it has a value
  const Field = ({ label, value }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div>
        <span className="text-slate-500">{label}:</span>{" "}
        <span className="font-semibold">{value}</span>
      </div>
    );
  };

  // Comprehensive lab result renderer
  const renderLabResult = (labResult, labType) => {
    if (!labResult) return null;

    return (
      <div className="space-y-2 text-[10px]">
        {/* Common fields */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Case ID" value={labResult.caseId} />
          <Field label="Doc" value={labResult.doc} />
          <Field label="Date Received" value={labResult.dateReceived ? new Date(labResult.dateReceived).toLocaleDateString() : null} />
          <Field label="Date Completed" value={labResult.dateCompleted ? new Date(labResult.dateCompleted).toLocaleDateString() : null} />
        </div>

        {labType === "bacteriology" && (
          <>
            {/* Sample */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Sample</span>
              <Field label="Type" value={labResult.sample?.type} />
              <Field label="Collection Method" value={labResult.sample?.collectionMethod} />
              <Field label="Site" value={labResult.sample?.site} />
            </div>
            {/* Culture Details */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Culture Details</span>
              <Field label="Media Used" value={labResult.cultureDetails?.mediaUsed?.join(", ") || null} />
              <Field label="Temperature" value={labResult.cultureDetails?.incubation?.temperature} />
              <Field label="Atmosphere" value={labResult.cultureDetails?.incubation?.atmosphere} />
              <Field label="Duration" value={labResult.cultureDetails?.incubation?.duration} />
              <Field label="24h Growth" value={labResult.cultureDetails?.growthObservation?.hours24} />
              <Field label="48h Growth" value={labResult.cultureDetails?.growthObservation?.hours48} />
              <Field label="72h Growth" value={labResult.cultureDetails?.growthObservation?.hours72} />
            </div>
            {/* Colony Morphology */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Colony Morphology</span>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Size" value={labResult.colonyMorphology?.size} />
                <Field label="Shape" value={labResult.colonyMorphology?.shape} />
                <Field label="Color" value={labResult.colonyMorphology?.color} />
                <Field label="Opacity" value={labResult.colonyMorphology?.opacity} />
                <Field label="Elevation" value={labResult.colonyMorphology?.elevation} />
                <Field label="Margin" value={labResult.colonyMorphology?.margin} />
                <Field label="Consistency" value={labResult.colonyMorphology?.consistency} />
                <Field label="Hemolysis" value={labResult.colonyMorphology?.hemolysis} />
                <Field label="Odor" value={labResult.colonyMorphology?.odor} />
              </div>
            </div>
            {/* Gram Stain */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Gram Stain</span>
              <Field label="Reaction" value={labResult.gramStain?.gramReaction} />
              <Field label="Morphology" value={labResult.gramStain?.bacterialMorphology} />
              <Field label="Microscopic Findings" value={labResult.gramStain?.microscopicFindings} />
            </div>
            {/* Biochemical Tests */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Biochemical Tests</span>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(labResult.biochemicalTests || {}).map(([key, val]) => (
                  <Field key={key} label={key} value={val} />
                ))}
              </div>
            </div>
            {/* Organism Identification */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Organism Identification</span>
              <Field label="Organism" value={labResult.organismIdentification?.organismName} />
              <Field label="Confidence" value={labResult.organismIdentification?.confidenceLevel} />
            </div>
            {/* Antibiotic Sensitivity */}
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Antibiotic Sensitivity (AST)</span>
              <Field label="Method" value={labResult.antibioticSensitivity?.method} />
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Sample</span>
              <Field label="Type" value={labResult.sample?.type} />
              <Field label="Collection Method" value={labResult.sample?.collectionMethod} />
              <Field label="Condition" value={labResult.sample?.condition} />
            </div>
            <div className="border border-slate-300 p-2">
              <span className="font-bold uppercase text-slate-800 block mb-1">Fecal Examination</span>
              <Field label="Methods" value={labResult.fecalExamination?.methodsPerformed?.join(", ") || null} />
              <Field label="Consistency" value={labResult.fecalExamination?.consistency} />
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Blood Parasite Examination</span>
              <Field label="Staining Method" value={labResult.bloodParasiteExamination?.stainingMethod} />
              <Field label="Smear Type" value={labResult.bloodParasiteExamination?.smearType} />
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Ectoparasite Examination</span>
              <Field label="Method" value={labResult.ectoparasiteExamination?.examinationMethod} />
              <Field label="Site Examined" value={labResult.ectoparasiteExamination?.siteExamined} />
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Milk Examination</span>
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Semen Analysis</span>
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Urinalysis</span>
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
              <span className="font-bold uppercase text-slate-800 block mb-1">Hematology</span>
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
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
              Clinical Assessment & Diagnostic Control
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Diagnosis Dashboard
            </h1>
          </div>
          <button
            onClick={() => router.push("/forms/diagnosis")}
            className="px-4 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors"
          >
            + Create Diagnosis
          </button>
        </header>

        {/* Doctor Specialty Switcher */}
        <div className="flex gap-1 border-b border-slate-300 pb-2">
          {[
            { id: "petdoc", label: "Pet Doctor" },
            { id: "large doc", label: "Large Animal Doctor" },
            { id: "equine doc", label: "Equine Specialist" },
          ].map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors border ${
                selectedDoc === doc.id
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {doc.label}
            </button>
          ))}
        </div>

        {/* Primary Data Card */}
        <div className="bg-white border border-slate-300 p-4 sm:p-6 space-y-4 shadow-xs">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
                activeTab === "pending"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
              }`}
            >
              Pending Diagnosis ({pendingDiagnosis.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
                activeTab === "completed"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
              }`}
            >
              Completed ({completedDiagnosis.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
                activeTab === "requests"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
              }`}
            >
              Lab Requests ({doctorRequests.length})
            </button>
          </div>

          {activeTab === "requests" && (
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setRequestTab("pending")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${
                  requestTab === "pending"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
                }`}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                onClick={() => setRequestTab("completed")}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${
                  requestTab === "completed"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
                }`}
              >
                Completed ({completedRequests.length})
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
              [SYSTEM ERROR]: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Retrieving Clinical Cases...
            </div>
          ) : activeTab !== "requests" ? (
            displayCases.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-300 bg-slate-50">
                <p className="text-[10px] font-mono uppercase text-slate-500">
                  No {activeTab} diagnostic cases registered under {selectedDoc.toUpperCase()}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full text-left text-[11px] font-mono min-w-[900px]">
                  <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5">Case #</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5">Species</th>
                      <th className="p-2.5">Lab Module</th>
                      <th className="p-2.5">Attending Unit</th>
                      <th className="p-2.5">Diagnosis Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayCases.map((c) => {
                      const labRecord = getLabRecordForCase(c.caseInfo?.caseNumber);
                      const existingDiag = diagnoses.find((d) => d.caseId === c.caseInfo?.caseNumber);
                      const labDisplay = c.lab === "diagnosis" ? "Direct" : c.lab || "-";
                      const docDisplay = c.lab === "diagnosis" ? c.doc : labRecord?.doc || "-";
                      return (
                        <tr key={c._id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{c.caseInfo?.caseNumber}</td>
                          <td className="p-2.5 text-slate-600">
                            {c.caseInfo?.date ? new Date(c.caseInfo.date).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">{c.owner?.fullName || "-"}</td>
                          <td className="p-2.5 text-slate-700">{c.patient?.species || "-"}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-bold uppercase text-[9px]">
                              {labDisplay}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 uppercase text-[9px]">
                              {docDisplay}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {existingDiag ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase text-[9px]">
                                {existingDiag.tentativeDiagnosis?.primary || "Completed"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase text-[9px]">
                                Pending Review
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleViewCase(c._id)}
                                className="px-2.5 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase font-bold hover:bg-slate-100 transition-colors"
                              >
                                View File
                              </button>
                              {existingDiag ? (
                                <button
                                  onClick={() => router.push(`/dashboard/diagnosis/${existingDiag._id}`)}
                                  className="px-2.5 py-1 bg-slate-800 text-white text-[9px] uppercase font-bold hover:bg-slate-700 transition-colors"
                                >
                                  View Dx
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    router.push(`/forms/diagnosis?caseId=${c.caseInfo?.caseNumber}`)
                                  }
                                  className="px-2.5 py-1 bg-slate-900 text-white text-[9px] uppercase font-bold hover:bg-black transition-colors"
                                >
                                  Diagnose
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : displayRequests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 bg-slate-50">
              <p className="text-[10px] font-mono uppercase text-slate-500">
                No {requestTab} lab requests for {selectedDoc.toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-300">
              <table className="w-full text-left text-[11px] font-mono min-w-[800px]">
                <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5">Case #</th>
                    <th className="p-2.5">Lab</th>
                    <th className="p-2.5">Date Requested</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {displayRequests.map((req) => {
                    const labResult = getLabResultForRequest(req);
                    return (
                      <tr key={req._id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{req.caseId}</td>
                        <td className="p-2.5 uppercase">{req.lab}</td>
                        <td className="p-2.5">
                          {req.dateRequested ? new Date(req.dateRequested).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-2.5">
                          {req.status === "completed" ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase text-[9px]">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase text-[9px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() => handleViewRequest(req)}
                            className="px-2.5 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase font-bold hover:bg-slate-100 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedCase && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setShowModal(false)}
              />
              <div className="relative bg-white border-2 border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
                <div className="sticky top-0 z-10 bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between border-b border-slate-800">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                      {selectedRequest ? `Lab Request – ${selectedRequest.lab}` : "Full Case Record Archive"}
                    </span>
                    <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider">
                      Case #{selectedCase.caseInfo?.caseNumber}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1 border border-white text-white text-[10px] font-mono uppercase hover:bg-white hover:text-slate-900 transition-colors"
                  >
                    Close [X]
                  </button>
                </div>

                <div className="p-4 space-y-4 font-mono text-xs">
                  {/* Patient & Owner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-300 p-3 space-y-2 bg-slate-50">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        Patient Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                        <Field label="Species" value={selectedCase.patient?.species} />
                        <Field label="Breed" value={selectedCase.patient?.breed} />
                        <Field label="Sex" value={selectedCase.patient?.sex} />
                        <Field label="Age" value={selectedCase.patient?.age} />
                        <Field label="Weight" value={selectedCase.patient?.weight ? `${selectedCase.patient.weight} KG` : null} />
                        <Field label="Animal ID" value={selectedCase.patient?.animalId} />
                        <Field label="Number of Animals" value={selectedCase.patient?.numberOfAnimals} />
                      </div>
                    </div>
                    <div className="border border-slate-300 p-3 space-y-2 bg-slate-50">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        Owner & Intake History
                      </h3>
                      <div className="text-[10px] space-y-1">
                        <Field label="Owner Name" value={selectedCase.owner?.fullName} />
                        <Field label="Telephone" value={selectedCase.owner?.telephone} />
                        <Field label="Address" value={selectedCase.owner?.address} />
                        <Field label="Chief Complaint" value={selectedCase.anamnesis?.primaryComplaint} />
                        <Field label="History" value={selectedCase.anamnesis?.history} />
                      </div>
                    </div>
                  </div>

                  {/* Physical Exam */}
                  <div className="border border-slate-300 p-3 bg-white space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                      Physical Exam & Vital Signs
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <Field label="Temp" value={selectedCase.physicalExam?.temperature ? `${selectedCase.physicalExam.temperature}°C` : null} />
                      <Field label="Demeanor" value={selectedCase.physicalExam?.demeanor} />
                      <Field label="BCS" value={selectedCase.physicalExam?.bcs} />
                      <Field label="Mucous Memb" value={selectedCase.physicalExam?.mucousMembrane} />
                      <Field label="Resp Rate" value={selectedCase.physicalExam?.respiratoryRate} />
                      <Field label="CRT" value={selectedCase.physicalExam?.crt} />
                      <Field label="Pulse" value={selectedCase.physicalExam?.pulseRate} />
                      <Field label="Heart Sound" value={selectedCase.physicalExam?.heartSound} />
                      <Field label="GI Motility" value={selectedCase.physicalExam?.giMotility} />
                      <Field label="Lung Sound" value={selectedCase.physicalExam?.lungSound} />
                      <Field label="Other Findings" value={selectedCase.physicalExam?.otherFindings} />
                    </div>
                  </div>

                  {/* Lab Directives */}
                  <div className="border-2 border-slate-800 p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
                      {selectedRequest ? "Requested Lab Investigations" : "Lab Directives from Case"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {["blood", "urine", "feces", "nasal", "rumen"].map((type) => {
                        const tests = selectedRequest
                          ? selectedRequest.labDirectives?.[type]?.tests
                          : selectedCase.labDirectives?.[type]?.tests;
                        const notes = selectedRequest
                          ? selectedRequest.labDirectives?.[type]?.notes
                          : selectedCase.labDirectives?.[type]?.notes;
                        return (
                          <div key={type} className="border border-slate-300 p-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-1 mb-2">
                              {type} Tests
                            </h4>
                            {tests?.length > 0 ? (
                              <ul className="space-y-0.5">
                                {tests.map((test, i) => (
                                  <li key={i} className="text-[10px] font-mono text-slate-700 flex items-start gap-1">
                                    <span className="text-slate-400 mt-0.5">▪</span> {test}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[10px] font-mono text-slate-400 italic">None specified</p>
                            )}
                            {notes && (
                              <p className="text-[10px] font-mono text-slate-500 mt-1 border-t border-slate-200 pt-1">
                                Note: {notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lab Requests for this case */}
                  {!selectedRequest && (
                    <div className="border-2 border-slate-800 p-4 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
                        Lab Requests for this Case
                      </h3>
                      {(() => {
                        const caseReqs = labRequests.filter(
                          (r) => r.caseId === selectedCase.caseInfo?.caseNumber
                        );
                        if (caseReqs.length === 0) {
                          return (
                            <p className="text-[10px] font-mono text-slate-400 italic">
                              No lab requests have been sent for this case.
                            </p>
                          );
                        }
                        return caseReqs.map((req) => {
                          const labResult = getLabResultForRequest(req);
                          return (
                            <div key={req._id} className="border border-slate-300 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-800">
                                  {req.lab} – Requested on {new Date(req.dateRequested).toLocaleDateString()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${
                                    req.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                  }`}
                                >
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
                              {req.status === "completed" && labResult && (
                                <div>
                                  <span className="font-bold uppercase text-slate-700 text-[10px] block mb-1">
                                    Lab Result:
                                  </span>
                                  {renderLabResult(labResult, req.lab)}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Original Lab Result (direct assignment) */}
                  {!selectedRequest && selectedCase.lab !== "diagnosis" && (
                    (() => {
                      const labRecord = getLabRecordForCase(selectedCase.caseInfo?.caseNumber);
                      if (!labRecord) return null;
                      const labType = getLabType(selectedCase.caseInfo?.caseNumber);
                      return (
                        <div className="border-2 border-slate-800 p-3 sm:p-4 space-y-3 bg-white">
                          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Original Lab Result ({labType})
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-100 p-2 border border-slate-300">
                            <Field label="Doc" value={labRecord.doc} />
                            <Field label="Sample Type" value={labRecord.sample?.type} />
                            <Field label="Received" value={labRecord.dateReceived ? new Date(labRecord.dateReceived).toLocaleDateString() : null} />
                            <Field label="Completed" value={labRecord.dateCompleted ? new Date(labRecord.dateCompleted).toLocaleDateString() : null} />
                          </div>
                          {renderLabResult(labRecord, labType)}
                        </div>
                      );
                    })()
                  )}

                  {/* Direct to diagnosis */}
                  {!selectedRequest && selectedCase.lab === "diagnosis" && (
                    <div className="border-2 border-slate-800 p-4 bg-white space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-2">
                        Direct to Diagnosis
                      </h3>
                      <p className="text-[10px] font-mono text-slate-700">
                        This case was sent directly to <strong>{selectedCase.doc || "doctor"}</strong> without laboratory testing.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-300">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] uppercase font-bold hover:bg-slate-100 transition-colors"
                    >
                      Close Window
                    </button>
                    {selectedRequest && selectedRequest.status === "completed" ? (
                      <button
                        onClick={() => {
                          setShowModal(false);
                          router.push(`/forms/diagnosis?caseId=${selectedCase.caseInfo?.caseNumber}`);
                        }}
                        className="px-4 py-2 bg-slate-900 text-white text-[10px] uppercase font-bold hover:bg-black transition-colors"
                      >
                        Proceed To Diagnose
                      </button>
                    ) : selectedRequest ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-400 text-white text-[10px] uppercase font-bold cursor-not-allowed"
                        title="Lab results not yet available"
                      >
                        Awaiting Lab Results
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            router.push(`/forms/diagnosis?caseId=${selectedCase.caseInfo?.caseNumber}`);
                          }}
                          className="px-4 py-2 bg-slate-900 text-white text-[10px] uppercase font-bold hover:bg-black transition-colors"
                        >
                          Proceed To Diagnose
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            router.push(
                              `/forms/lab-request?caseId=${selectedCase.caseInfo?.caseNumber}&doc=${selectedDoc}`
                            );
                          }}
                          className="px-4 py-2 border border-slate-800 text-slate-800 text-[10px] uppercase font-bold hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          Request Lab
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}