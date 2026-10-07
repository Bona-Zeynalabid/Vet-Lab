"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { diagnosisApi, pharmacyApi, medicineApi, casesApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";
import { Sparkles, Loader2, X, Check, AlertCircle } from "lucide-react";

const confirmationMethods = [
  "Clinical Signs", "Lab Results", "Radiography", "Ultrasound",
  "Post-mortem", "Response to Treatment", "Biopsy", "Culture Results",
];

const AI_TARGETS = [
  { value: "primaryTentative", label: "Primary Tentative Diagnosis" },
  { value: "differentialDiagnoses", label: "Differential Diagnoses" },
  { value: "clinicalJustification", label: "Clinical Justification" },
  { value: "definitiveDiagnosis", label: "Definitive Diagnosis" },
  { value: "diagnosticNotes", label: "Diagnostic Notes" },
];

const defaultTargetFor = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("tentative")) return "primaryTentative";
  if (t.includes("differential")) return "differentialDiagnoses";
  if (t.includes("justification")) return "clinicalJustification";
  if (t.includes("definitive")) return "definitiveDiagnosis";
  if (t.includes("next steps") || t.includes("recommended")) return "diagnosticNotes";
  return "diagnosticNotes";
};

const parseAiResponse = (text) => {
  if (!text) return [];

  // Strip any instruction/placeholder lines the model may have echoed
  const cleaned = String(text)
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      // Drop lines that are clearly placeholders
      if (/^<.*>$/.test(l)) return false;
      if (/^[-•]\s*<.*>$/.test(l)) return false;
      if (/^respond with/i.test(l)) return false;
      if (/^keep the total/i.test(l)) return false;
      if (/^you are a licensed veterinarian/i.test(l)) return false;
      return true;
    })
    .join("\n")
    .trim();

  const normalized = `\n${cleaned}`;
  const parts = normalized.split(/\n(?=\d+\.\s)/);
  const out = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const header = lines[0];
    const m = header.match(/^(\d+)\.\s*(.+)$/);
    if (!m) continue;

    const title = m[2].trim();
    const content = lines.slice(1).join("\n").trim();

    // Skip sections with no real content
    if (!content || content.length < 3) continue;
    // Skip sections where content is just a placeholder
    if (/^<.*>$/.test(content)) continue;

    out.push({
      id: m[1],
      title,
      content,
      selected: true,
      target: defaultTargetFor(title),
    });
  }

  return out;
};

export default function DoctorDiagnosisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdFromUrl = searchParams.get("caseId");

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const [medicinesList, setMedicinesList] = useState([]);
  const [patientWeight, setPatientWeight] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);

  // ----- AI state -----
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState([]);
  const [aiError, setAiError] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

  const totalSteps = 4;

  const [formData, setFormData] = useState({
    caseNumber: caseIdFromUrl || "",
    date: "",
    attendingVet: "",
    primaryTentative: "",
    differentialDiagnoses: "",
    clinicalJustification: "",
    definitiveDiagnosis: "",
    confirmationMethods: [],
    diagnosticNotes: "",
    medicines: [{ name: "", concentration: "", dosage: "", route: "", frequency: "", duration: "", amount: "", instructions: "" }],
    prognosis: "",
    followUpDate: "",
    followUpInstructions: "",
  });

  // Fetch case details (weight + full record for AI)
  useEffect(() => {
    const fetchCase = async () => {
      if (!caseIdFromUrl) return;
      try {
        const result = await casesApi.list({ caseNumber: caseIdFromUrl });
        if (result && result.length > 0) {
          const doc = result[0];
          setCaseDetails(doc);
          const weight = doc.patient?.weight;
          if (weight) setPatientWeight(Number(weight));
        }
      } catch (err) {
        console.error("Failed to fetch case details:", err);
      }
    };
    fetchCase();
  }, [caseIdFromUrl]);

  useEffect(() => {
    if (caseIdFromUrl) {
      setFormData((prev) => ({ ...prev, caseNumber: caseIdFromUrl }));
    }
  }, [caseIdFromUrl]);

  useEffect(() => {
    const name = getLoggedInUserName();
    if (name) {
      setFormData((prev) => ({ ...prev, attendingVet: name }));
    }
  }, []);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await medicineApi.list();
        setMedicinesList(data || []);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
      }
    };
    fetchMedicines();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (item) => {
    setFormData((prev) => {
      const current = prev.confirmationMethods || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, confirmationMethods: updated };
    });
  };

  // ===== AI handlers =====
  const handleAskAi = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSections([]);
    setShowAiPanel(true);

    try {
      let doc = caseDetails;
      if (!doc && caseIdFromUrl) {
        const result = await casesApi.list({ caseNumber: caseIdFromUrl });
        doc = result?.[0] || null;
        if (doc) setCaseDetails(doc);
      }
      if (!doc) throw new Error("Case details not found");

      const res = await fetch("/api/ai-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData: doc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      const parsed = parseAiResponse(data.diagnosis || "");
      if (parsed.length === 0) {
        throw new Error("AI returned an unparsable response");
      }
      setAiSections(parsed);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    const toApply = aiSections.filter((s) => s.selected && s.content.trim());
    if (toApply.length === 0) {
      setAiError("Select at least one section to apply.");
      return;
    }
    setFormData((prev) => {
      const next = { ...prev };
      toApply.forEach((sec) => {
        const existing = (next[sec.target] || "").trim();
        next[sec.target] = existing
          ? `${existing}\n${sec.content}`
          : sec.content;
      });
      return next;
    });
    setShowAiPanel(false);
    setAiSections([]);
    setAiError("");
  };

  const cancelAi = () => {
    setShowAiPanel(false);
    setAiSections([]);
    setAiError("");
  };

  const toggleAiSection = (index) => {
    setAiSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const changeAiSectionTarget = (index, target) => {
    setAiSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, target } : s))
    );
  };

  const toggleAllAiSections = (selected) => {
    setAiSections((prev) => prev.map((s) => ({ ...s, selected })));
  };

  // ===== Medicine helpers =====
  const extractNumeric = (str) => {
    if (!str) return null;
    const match = String(str).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const extractUnit = (concentration) => {
    if (!concentration) return "";
    const match = String(concentration).match(/\/\s*([a-zA-Z]+)/);
    return match ? match[1] : "";
  };

  const computeAmount = (medicine) => {
    if (!patientWeight) return null;
    const doseVal = extractNumeric(medicine.dosage);
    const concVal = extractNumeric(medicine.concentration);
    if (doseVal === null || concVal === null || concVal <= 0) return null;
    const amount = (patientWeight * doseVal) / concVal;
    const unit = extractUnit(medicine.concentration);
    return unit ? `${amount.toFixed(2)} ${unit}` : amount.toFixed(2);
  };

  const handleMedicineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.medicines];
      const current = { ...updated[index], [field]: value };

      if (field === "name") {
        const medicine = medicinesList.find(
          (m) => m.name.toLowerCase() === value.toLowerCase().trim()
        );
        if (medicine) {
          if (medicine.concentration) current.concentration = medicine.concentration;
          if (medicine.doseRate) current.dosage = medicine.doseRate;
        }
      }

      if (field === "name" || field === "concentration" || field === "dosage") {
        const computed = computeAmount(current);
        if (computed !== null) current.amount = computed;
      }

      updated[index] = current;
      return { ...prev, medicines: updated };
    });
  };

  const addMedicine = () => {
    setFormData((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: "", concentration: "", dosage: "", route: "", frequency: "", duration: "", amount: "", instructions: "" },
      ],
    }));
  };

  const removeMedicine = (index) => {
    if (formData.medicines.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.caseNumber.trim() !== "" &&
          formData.date.trim() !== "" &&
          formData.attendingVet.trim() !== ""
        );
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setError("Mandatory fields (*) must be completed.");
      return;
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSkip = () => {
    if (!isCurrentStepValid()) return;
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleReset = () => {
    setSubmitted(false);
    setCurrentStep(1);
    setError("");
    setLoading(false);
    setSavedRecord(null);
    setAiSections([]);
    setAiError("");
    setShowAiPanel(false);
    setFormData({
      caseNumber: caseIdFromUrl || "",
      date: "",
      attendingVet: "",
      primaryTentative: "",
      differentialDiagnoses: "",
      clinicalJustification: "",
      definitiveDiagnosis: "",
      confirmationMethods: [],
      diagnosticNotes: "",
      medicines: [{ name: "", concentration: "", dosage: "", route: "", frequency: "", duration: "", amount: "", instructions: "" }],
      prognosis: "",
      followUpDate: "",
      followUpInstructions: "",
    });
  };

  const buildDiagnosisPayload = () => ({
    caseId: formData.caseNumber,
    date: formData.date,
    veterinarian: { name: formData.attendingVet, licenseNumber: "" },
    tentativeDiagnosis: {
      primary: formData.primaryTentative || "",
      differentials: formData.differentialDiagnoses
        ? formData.differentialDiagnoses.split("\n").filter(Boolean)
        : [],
      clinicalJustification: formData.clinicalJustification || "",
    },
    definitiveDiagnosis: {
      finalDiagnosis: formData.definitiveDiagnosis || "",
      confirmedBy: formData.confirmationMethods || [],
      diagnosticNotes: formData.diagnosticNotes || "",
    },
    prognosis: formData.prognosis || "fair",
    followUp: {
      date: formData.followUpDate || undefined,
      instructions: formData.followUpInstructions || "",
    },
    status: "finalized",
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) {
      setError("System validation failed.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const diagPayload = buildDiagnosisPayload();
      const diagRes = await diagnosisApi.create(diagPayload);

      for (const med of formData.medicines) {
        if (med.name.trim()) {
          await pharmacyApi.create({
            caseId: formData.caseNumber,
            prescriptionDate: formData.date,
            veterinarian: formData.attendingVet,
            medicine: {
              name: med.name,
              concentration: med.concentration,
              dosage: med.dosage,
              route: med.route || "oral",
              frequency: med.frequency || "SID",
              duration: med.duration,
              amount: med.amount,
              instructions: med.instructions,
            },
            status: "pending",
          });
        }
      }

      setSavedRecord(diagRes);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono";
  const labelStyle =
    "block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <header className="border-b-2 border-slate-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
              Clinical Decision Support
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Diagnosis & Treatment Entry
            </h1>
          </div>
          {!submitted && (
            <div className="self-start sm:self-auto font-mono text-xs border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700">
              STAGE {String(currentStep).padStart(2, "0")} /{" "}
              {String(totalSteps).padStart(2, "0")}
            </div>
          )}
        </header>

        {submitted ? (
          <div className="bg-white border-2 border-slate-800 p-4 sm:p-8 space-y-4">
            <div className="border-l-4 border-slate-800 pl-4 space-y-1">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                Diagnosis Committed
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                CASE: {formData.caseNumber} | VET: {formData.attendingVet} | STAMP:{" "}
                {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              Diagnosis saved and prescriptions sent to pharmacy for dispensing.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
              >
                Log New Diagnosis
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/diagnosis")}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-400 text-slate-700 text-xs uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="w-full bg-slate-200 h-1">
              <div
                className="bg-slate-800 h-full transition-all duration-200"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 1: Case Particulars
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Case Number</label>
                    <input
                      type="text"
                      value={formData.caseNumber}
                      onChange={(e) => handleInputChange("caseNumber", e.target.value)}
                      className={inputStyle}
                      readOnly={!!caseIdFromUrl}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Veterinarian <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      value={formData.attendingVet}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 2: Tentative & Definitive Diagnosis
                  </h3>
                  <button
                    type="button"
                    onClick={handleAskAi}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? "Asking AI..." : "Ask AI for Diagnosis"}</span>
                  </button>
                </div>

                <div>
                  <label className={labelStyle}>Primary Tentative Diagnosis</label>
                  <input
                    type="text"
                    placeholder="e.g. Bacterial Bronchopneumonia"
                    value={formData.primaryTentative}
                    onChange={(e) => handleInputChange("primaryTentative", e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Differential Diagnoses</label>
                  <textarea
                    rows={3}
                    placeholder="One per line..."
                    value={formData.differentialDiagnoses}
                    onChange={(e) => handleInputChange("differentialDiagnoses", e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Clinical Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Supporting findings..."
                    value={formData.clinicalJustification}
                    onChange={(e) => handleInputChange("clinicalJustification", e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <label className={labelStyle}>Definitive Diagnosis</label>
                  <input
                    type="text"
                    placeholder="e.g. Pasteurella multocida Bronchopneumonia"
                    value={formData.definitiveDiagnosis}
                    onChange={(e) => handleInputChange("definitiveDiagnosis", e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <fieldset className="border border-slate-300 p-3 space-y-2">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                    Confirmation Methods
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {confirmationMethods.map((method) => (
                      <label key={method} className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.confirmationMethods.includes(method)}
                          onChange={() => handleCheckboxToggle(method)}
                          className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                        />
                        <span className="text-slate-700 truncate">{method}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className={labelStyle}>Diagnostic Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Lab verification parameters..."
                    value={formData.diagnosticNotes}
                    onChange={(e) => handleInputChange("diagnosticNotes", e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 3: Prescriptions
                  </h3>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="px-2.5 py-1 border border-slate-800 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
                  >
                    + Add Medicine
                  </button>
                </div>
                {formData.medicines.map((med, idx) => (
                  <div key={idx} className="border border-slate-300 p-3 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-600">
                        Medicine #{idx + 1}
                      </span>
                      {formData.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicine(idx)}
                          className="text-[10px] font-mono uppercase text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className={labelStyle}>Name</label>
                        <input
                          type="text"
                          list="medicines-datalist"
                          placeholder="e.g. Amoxicillin"
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Concentration</label>
                        <input
                          type="text"
                          placeholder="e.g. 250 mg/mL"
                          value={med.concentration}
                          onChange={(e) => handleMedicineChange(idx, "concentration", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g. 10 mg/kg"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Route</label>
                        <select
                          value={med.route}
                          onChange={(e) => handleMedicineChange(idx, "route", e.target.value)}
                          className={inputStyle}
                        >
                          <option value="">Select</option>
                          <option value="oral">Oral</option>
                          <option value="subcutaneous">SC</option>
                          <option value="intramuscular">IM</option>
                          <option value="intravenous">IV</option>
                          <option value="topical">Topical</option>
                          <option value="otic">Otic</option>
                          <option value="ophthalmic">Ophthalmic</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Frequency</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                          className={inputStyle}
                        >
                          <option value="">Select</option>
                          <option value="FID">FID</option>
                          <option value="BID">BID</option>
                          <option value="TID">TID</option>
                          <option value="QID">QID</option>
                          <option value="SID">SID</option>
                          <option value="Every 12h">Every 12h</option>
                          <option value="STAT">STAT</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Duration</label>
                        <input
                          type="text"
                          placeholder="e.g. 7 days"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Amount</label>
                        <input
                          type="text"
                          placeholder="e.g. 21 tablets"
                          value={med.amount}
                          onChange={(e) => handleMedicineChange(idx, "amount", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Instructions</label>
                        <input
                          type="text"
                          placeholder="e.g. With food"
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <datalist id="medicines-datalist">
                  {medicinesList.map((med) => (
                    <option key={med._id} value={med.name} />
                  ))}
                </datalist>
                {patientWeight && (
                  <div className="text-xs text-slate-500 font-mono border-t border-slate-200 pt-2">
                    Patient weight:{" "}
                    <span className="font-semibold">{patientWeight} kg</span> – amount
                    auto‑calculated from concentration × dosage.
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 4: Prognosis & Follow-Up
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Prognosis</label>
                    <select
                      value={formData.prognosis}
                      onChange={(e) => handleInputChange("prognosis", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="guarded">Guarded</option>
                      <option value="poor">Poor</option>
                      <option value="grave">Grave</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Follow-Up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Owner directives, monitoring protocols..."
                    value={formData.followUpInstructions}
                    onChange={(e) => handleInputChange("followUpInstructions", e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
                [ERROR]: {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-3 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-red-700 hover:bg-red-50 transition-colors border sm:border-0 border-red-200"
              >
                Cancel / Reset
              </button>
              <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest hover:bg-slate-100 transition-colors text-center"
                  >
                    Back
                  </button>
                )}
                {currentStep < totalSteps && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={!isCurrentStepValid()}
                    className="flex-1 sm:flex-none px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors text-center"
                  >
                    Skip
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 sm:flex-none px-5 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors text-center"
                  >
                    Next Stage
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors text-center disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Commit Diagnosis"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== AI Diagnosis Panel ===== */}
      {showAiPanel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={cancelAi}
            />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-purple-700 text-white p-4 flex items-center justify-between border-b border-purple-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-purple-200 block">
                      AI Clinical Assistant
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      Suggested Diagnosis — Select Sections to Apply
                    </h2>
                  </div>
                </div>
                <button
                  onClick={cancelAi}
                  className="p-1 border border-white/40 text-white hover:bg-white hover:text-purple-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                      Analyzing case data...
                    </p>
                  </div>
                )}

                {aiError && !aiLoading && (
                  <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                {aiSections.length > 0 && !aiLoading && (
                  <>
                    {/* Bulk controls */}
                    <div className="flex items-center justify-between border border-slate-300 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAllAiSections(true)}
                          className="text-[10px] font-mono uppercase tracking-widest text-slate-700 hover:text-slate-900 underline"
                        >
                          Select all
                        </button>
                        <span className="text-slate-400">|</span>
                        <button
                          type="button"
                          onClick={() => toggleAllAiSections(false)}
                          className="text-[10px] font-mono uppercase tracking-widest text-slate-700 hover:text-slate-900 underline"
                        >
                          Clear all
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {aiSections.filter((s) => s.selected).length} of{" "}
                        {aiSections.length} selected
                      </span>
                    </div>

                    {/* Section cards */}
                    <div className="space-y-3">
                      {aiSections.map((section, idx) => (
                        <div
                          key={idx}
                          className={`border-2 transition-colors ${
                            section.selected
                              ? "border-purple-400 bg-purple-50/40"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3 p-3 border-b border-slate-200 bg-white">
                            <input
                              type="checkbox"
                              checked={section.selected}
                              onChange={() => toggleAiSection(idx)}
                              className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-600 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-800">
                                {section.id}. {section.title}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <select
                                value={section.target}
                                onChange={(e) =>
                                  changeAiSectionTarget(idx, e.target.value)
                                }
                                className="text-[10px] font-mono bg-white border border-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600"
                              >
                                {AI_TARGETS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    → {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="p-3">
                            <pre className="text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {section.content}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] font-mono text-slate-500 italic">
                      Applied content will be appended to the destination field. You
                      can edit it afterwards.
                    </p>
                  </>
                )}
              </div>

              {/* Footer */}
              {!aiLoading && (
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelAi}
                    className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyAiResult}
                    disabled={
                      aiSections.length === 0 ||
                      aiSections.filter((s) => s.selected).length === 0
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}