"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { diagnosisApi, pharmacyApi, medicineApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";

const confirmationMethods = [
  "Clinical Signs", "Lab Results", "Radiography", "Ultrasound",
  "Post-mortem", "Response to Treatment", "Biopsy", "Culture Results",
];

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

  useEffect(() => {
    if (caseIdFromUrl) {
      setFormData((prev) => ({ ...prev, caseNumber: caseIdFromUrl }));
    }
  }, [caseIdFromUrl]);

  useEffect(() => {
    const name = getLoggedInUserName();
    if (name) {
      setFormData(prev => ({ ...prev, attendingVet: name }));
    }
  }, []);

  // Fetch medicines for autocomplete suggestions
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
      const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
      return { ...prev, confirmationMethods: updated };
    });
  };

  const handleMedicineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const addMedicine = () => {
    setFormData((prev) => ({ ...prev, medicines: [...prev.medicines, { name: "", concentration: "", dosage: "", route: "", frequency: "", duration: "", amount: "", instructions: "" }] }));
  };

  const removeMedicine = (index) => {
    if (formData.medicines.length === 1) return;
    setFormData((prev) => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== index) }));
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.caseNumber.trim() !== "" && formData.date.trim() !== "" && formData.attendingVet.trim() !== "";
      case 2:
        return formData.primaryTentative.trim() !== "";
      case 3:
        return formData.definitiveDiagnosis.trim() !== "";
      default:
        return true;
    }
  };

  const handleNext = () => { if (!isCurrentStepValid()) { setError("Mandatory fields (*) must be completed."); return; } setError(""); setCurrentStep((prev) => Math.min(prev + 1, totalSteps)); };
  const handleBack = () => { setError(""); setCurrentStep((prev) => Math.max(prev - 1, 1)); };
  const handleSkip = () => { if (!isCurrentStepValid()) return; setError(""); setCurrentStep((prev) => Math.min(prev + 1, totalSteps)); };

  const handleReset = () => {
    setSubmitted(false); setCurrentStep(1); setError(""); setLoading(false); setSavedRecord(null);
    setFormData({
      caseNumber: caseIdFromUrl || "", date: "", attendingVet: "", primaryTentative: "", differentialDiagnoses: "", clinicalJustification: "",
      definitiveDiagnosis: "", confirmationMethods: [], diagnosticNotes: "",
      medicines: [{ name: "", concentration: "", dosage: "", route: "", frequency: "", duration: "", amount: "", instructions: "" }],
      prognosis: "", followUpDate: "", followUpInstructions: "",
    });
  };

  const buildDiagnosisPayload = () => ({
    caseId: formData.caseNumber,
    date: formData.date,
    veterinarian: { name: formData.attendingVet, licenseNumber: "" },
    tentativeDiagnosis: {
      primary: formData.primaryTentative,
      differentials: formData.differentialDiagnoses ? formData.differentialDiagnoses.split("\n").filter(Boolean) : [],
      clinicalJustification: formData.clinicalJustification,
    },
    definitiveDiagnosis: {
      finalDiagnosis: formData.definitiveDiagnosis,
      confirmedBy: formData.confirmationMethods,
      diagnosticNotes: formData.diagnosticNotes,
    },
    prognosis: formData.prognosis || "fair",
    followUp: {
      date: formData.followUpDate || undefined,
      instructions: formData.followUpInstructions,
    },
    status: "finalized",
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) { setError("System validation failed."); return; }
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
              frequency: med.frequency || "once_daily",
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

  const inputStyle = "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono";
  const labelStyle = "block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <header className="border-b-2 border-slate-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Clinical Decision Support</span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">Diagnosis & Treatment Entry</h1>
          </div>
          {!submitted && (
            <div className="self-start sm:self-auto font-mono text-xs border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700">
              STAGE {String(currentStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
            </div>
          )}
        </header>

        {submitted ? (
          <div className="bg-white border-2 border-slate-800 p-4 sm:p-8 space-y-4">
            <div className="border-l-4 border-slate-800 pl-4 space-y-1">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">Diagnosis Committed</h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                CASE: {formData.caseNumber} | VET: {formData.attendingVet} | STAMP: {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">Diagnosis saved and prescriptions sent to pharmacy for dispensing.</p>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={handleReset} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors">Log New Diagnosis</button>
              <button type="button" onClick={() => router.push("/dashboard/diagnosis")} className="w-full sm:w-auto px-4 py-2.5 border border-slate-400 text-slate-700 text-xs uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors">Back to Dashboard</button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="w-full bg-slate-200 h-1"><div className="bg-slate-800 h-full transition-all duration-200" style={{ width: `${(currentStep / totalSteps) * 100}%` }} /></div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Stage 1: Case Particulars</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className={labelStyle}>Case Number</label><input type="text" value={formData.caseNumber} onChange={(e) => handleInputChange("caseNumber", e.target.value)} className={inputStyle} readOnly={!!caseIdFromUrl} /></div>
                  <div><label className={labelStyle}>Date <span className="text-red-600">*</span></label><input type="date" required value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Veterinarian <span className="text-red-600">*</span></label><input type="text" required readOnly placeholder="e.g. Dr. Smith" value={formData.attendingVet} onChange={(e) => handleInputChange("attendingVet", e.target.value)} className={inputStyle} /></div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Stage 2: Tentative & Definitive Diagnosis</h3></div>
                <div><label className={labelStyle}>Primary Tentative Diagnosis <span className="text-red-600">*</span></label><input type="text" required placeholder="e.g. Bacterial Bronchopneumonia" value={formData.primaryTentative} onChange={(e) => handleInputChange("primaryTentative", e.target.value)} className={inputStyle} /></div>
                <div><label className={labelStyle}>Differential Diagnoses</label><textarea rows={3} placeholder="One per line..." value={formData.differentialDiagnoses} onChange={(e) => handleInputChange("differentialDiagnoses", e.target.value)} className={inputStyle} /></div>
                <div><label className={labelStyle}>Clinical Justification</label><textarea rows={2} placeholder="Supporting findings..." value={formData.clinicalJustification} onChange={(e) => handleInputChange("clinicalJustification", e.target.value)} className={inputStyle} /></div>
                <div className="border-t border-slate-200 pt-4">
                  <label className={labelStyle}>Definitive Diagnosis <span className="text-red-600">*</span></label>
                  <input type="text" required placeholder="e.g. Pasteurella multocida Bronchopneumonia" value={formData.definitiveDiagnosis} onChange={(e) => handleInputChange("definitiveDiagnosis", e.target.value)} className={inputStyle} />
                </div>
                <fieldset className="border border-slate-300 p-3 space-y-2">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">Confirmation Methods</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {confirmationMethods.map((method) => (
                      <label key={method} className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={formData.confirmationMethods.includes(method)} onChange={() => handleCheckboxToggle(method)} className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0" />
                        <span className="text-slate-700 truncate">{method}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div><label className={labelStyle}>Diagnostic Notes</label><textarea rows={2} placeholder="Lab verification parameters..." value={formData.diagnosticNotes} onChange={(e) => handleInputChange("diagnosticNotes", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Stage 3: Prescriptions</h3>
                  <button type="button" onClick={addMedicine} className="px-2.5 py-1 border border-slate-800 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors">+ Add Medicine</button>
                </div>
                {formData.medicines.map((med, idx) => (
                  <div key={idx} className="border border-slate-300 p-3 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-600">Medicine #{idx + 1}</span>
                      {formData.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(idx)} className="text-[10px] font-mono uppercase text-red-700 hover:underline">Remove</button>}
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
                      <div><label className={labelStyle}>Concentration</label><input type="text" placeholder="e.g. 250 mg/mL" value={med.concentration} onChange={(e) => handleMedicineChange(idx, "concentration", e.target.value)} className={inputStyle} /></div>
                      <div><label className={labelStyle}>Dosage</label><input type="text" placeholder="e.g. 10 mg/kg" value={med.dosage} onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)} className={inputStyle} /></div>
                      <div><label className={labelStyle}>Route</label><select value={med.route} onChange={(e) => handleMedicineChange(idx, "route", e.target.value)} className={inputStyle}><option value="">Select</option><option value="oral">Oral</option><option value="subcutaneous">SC</option><option value="intramuscular">IM</option><option value="intravenous">IV</option><option value="topical">Topical</option><option value="otic">Otic</option><option value="ophthalmic">Ophthalmic</option></select></div>
                      <div><label className={labelStyle}>Frequency</label><select value={med.frequency} onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)} className={inputStyle}><option value="">Select</option><option value="once">Once</option><option value="bid">BID</option><option value="tid">TID</option><option value="qid">QID</option><option value="every_12h">Every 12h</option><option value="once_daily">Once Daily</option></select></div>
                      <div><label className={labelStyle}>Duration</label><input type="text" placeholder="e.g. 7 days" value={med.duration} onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)} className={inputStyle} /></div>
                      <div><label className={labelStyle}>Amount</label><input type="text" placeholder="e.g. 21 tablets" value={med.amount} onChange={(e) => handleMedicineChange(idx, "amount", e.target.value)} className={inputStyle} /></div>
                      <div><label className={labelStyle}>Instructions</label><input type="text" placeholder="e.g. With food" value={med.instructions} onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)} className={inputStyle} /></div>
                    </div>
                  </div>
                ))}
                <datalist id="medicines-datalist">
                  {medicinesList.map((med) => (
                    <option key={med._id} value={med.name} />
                  ))}
                </datalist>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Stage 4: Prognosis & Follow-Up</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Prognosis</label><select value={formData.prognosis} onChange={(e) => handleInputChange("prognosis", e.target.value)} className={inputStyle}><option value="">Select</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="guarded">Guarded</option><option value="poor">Poor</option><option value="grave">Grave</option></select></div>
                  <div><label className={labelStyle}>Follow-Up Date</label><input type="date" value={formData.followUpDate} onChange={(e) => handleInputChange("followUpDate", e.target.value)} className={inputStyle} /></div>
                </div>
                <div><label className={labelStyle}>Instructions</label><textarea rows={3} placeholder="Owner directives, monitoring protocols..." value={formData.followUpInstructions} onChange={(e) => handleInputChange("followUpInstructions", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {error && <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">[ERROR]: {error}</div>}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={handleReset} className="w-full sm:w-auto px-3 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-red-700 hover:bg-red-50 transition-colors border sm:border-0 border-red-200">Cancel / Reset</button>
              <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                {currentStep > 1 && <button type="button" onClick={handleBack} className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest hover:bg-slate-100 transition-colors text-center">Back</button>}
                {currentStep < totalSteps && <button type="button" onClick={handleSkip} disabled={!isCurrentStepValid()} className="flex-1 sm:flex-none px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors text-center">Skip</button>}
                {currentStep < totalSteps ? <button type="button" onClick={handleNext} className="flex-1 sm:flex-none px-5 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors text-center">Next Stage</button> : <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors text-center disabled:opacity-50">{loading ? "Saving..." : "Commit Diagnosis"}</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}