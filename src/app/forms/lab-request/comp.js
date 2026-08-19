"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { labRequestApi } from "@/lib/api";

const bloodTests = [
  "CBC / Hemogram", "Serum Biochemistry", "Blood Smear", "Blood Culture",
  "Serology", "PCR", "Hormone Assay", "Coagulation Profile",
  "Blood Parasites", "Heavy Metal Analysis",
];
const urineTests = [
  "Complete Urinalysis", "Urine Culture & Sensitivity", "Urine Protein:Creatinine Ratio",
  "Urine Sediment Exam", "Urine Electrolytes", "Urine Cortisol",
  "Urine Toxicology", "Urine Cytology",
];
const fecesTests = [
  "Fecal Flotation", "Fecal Sedimentation", "Fecal Culture", "Fecal Cytology",
  "Fecal Occult Blood", "Fecal PCR (Parasites)", "Fecal ELISA", "Direct Smear",
];
const nasalTests = [
  "Bacterial Culture & Sensitivity", "Fungal Culture", "PCR (Respiratory Panel)",
  "Cytology", "Viral Isolation", "Mycoplasma Culture", "Antigen Detection",
];
const rumenTests = [
  "pH Measurement", "Protozoa Count & Viability", "Gram Staining",
  "Methylene Blue Reduction Test", "Volatile Fatty Acids (VFA)",
  "Sedimentation Activity Test", "Chloride Concentration", "Microbial Culture",
];

export default function LabRequestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const docFromUrl = searchParams.get("doc") || "";

  const [formData, setFormData] = useState({
    caseId: caseIdFromUrl,
    lab: "",
    doc: docFromUrl,
    selectedBlood: [],
    bloodNotes: "",
    selectedUrine: [],
    urineNotes: "",
    selectedFeces: [],
    fecesNotes: "",
    selectedNasal: [],
    nasalNotes: "",
    selectedRumen: [],
    rumenNotes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (categoryKey, item) => {
    setFormData((prev) => {
      const list = prev[categoryKey] || [];
      const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
      return { ...prev, [categoryKey]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseId || !formData.lab || !formData.doc) {
      setError("Case ID, Lab and Doctor are required.");
      return;
    }
    setError("");
    setLoading(true);

    const payload = {
      caseId: formData.caseId,
      lab: formData.lab,
      doc: formData.doc,
      labDirectives: {
        blood: { tests: formData.selectedBlood, notes: formData.bloodNotes },
        urine: { tests: formData.selectedUrine, notes: formData.urineNotes },
        feces: { tests: formData.selectedFeces, notes: formData.fecesNotes },
        nasal: { tests: formData.selectedNasal, notes: formData.nasalNotes },
        rumen: { tests: formData.selectedRumen, notes: formData.rumenNotes },
      },
    };

    try {
      await labRequestApi.create(payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono";
  const labelStyle = "block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1";

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
        <div className="max-w-2xl mx-auto bg-white border-2 border-slate-800 p-4 sm:p-8 space-y-4">
          <h2 className="text-base font-bold uppercase">Lab Request Sent</h2>
          <p className="text-[10px] font-mono">The lab has been notified.</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 text-white text-xs uppercase font-bold hover:bg-slate-700">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="border-b-2 border-slate-800 pb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Clinical Request</span>
          <h1 className="text-lg font-bold uppercase">Request Laboratory Test</h1>
        </header>

        <div className="bg-white border border-slate-300 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelStyle}>Case Number <span className="text-red-600">*</span></label>
              <input type="text" value={formData.caseId} onChange={(e) => handleInputChange("caseId", e.target.value)} className={inputStyle} readOnly={!!caseIdFromUrl} />
            </div>
            <div>
              <label className={labelStyle}>Lab <span className="text-red-600">*</span></label>
              <select value={formData.lab} onChange={(e) => handleInputChange("lab", e.target.value)} className={inputStyle} required>
                <option value="">Select</option>
                <option value="pathology">Pathology</option>
                <option value="bacteriology">Bacteriology</option>
                <option value="parasitology">Parasitology</option>
              </select>
            </div>
            {!docFromUrl && (
              <div>
                <label className={labelStyle}>Requesting Doctor <span className="text-red-600">*</span></label>
                <select value={formData.doc} onChange={(e) => handleInputChange("doc", e.target.value)} className={inputStyle} required>
                  <option value="">— Select Doctor —</option>
                  <option value="petdoc">Pet Doc</option>
                  <option value="large doc">Large Doc</option>
                  <option value="equine doc">Equine Doc</option>
                </select>
              </div>
            )}
          </div>

          {/* Blood Tests */}
          <fieldset className="border border-slate-300 p-3 space-y-2">
            <legend className="text-[10px] font-mono font-bold uppercase">Blood Tests</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {bloodTests.map((t) => (
                <label key={t} className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" checked={formData.selectedBlood.includes(t)} onChange={() => handleCheckboxToggle("selectedBlood", t)} className="rounded-none border-slate-400 text-slate-800" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
            </div>
            <input type="text" placeholder="Notes" value={formData.bloodNotes} onChange={(e) => handleInputChange("bloodNotes", e.target.value)} className={inputStyle} />
          </fieldset>

          {/* Urine Tests */}
          <fieldset className="border border-slate-300 p-3 space-y-2">
            <legend className="text-[10px] font-mono font-bold uppercase">Urine Tests</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {urineTests.map((t) => (
                <label key={t} className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" checked={formData.selectedUrine.includes(t)} onChange={() => handleCheckboxToggle("selectedUrine", t)} className="rounded-none border-slate-400 text-slate-800" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
            </div>
            <input type="text" placeholder="Notes" value={formData.urineNotes} onChange={(e) => handleInputChange("urineNotes", e.target.value)} className={inputStyle} />
          </fieldset>

          {/* Fecal Tests */}
          <fieldset className="border border-slate-300 p-3 space-y-2">
            <legend className="text-[10px] font-mono font-bold uppercase">Fecal Tests</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fecesTests.map((t) => (
                <label key={t} className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" checked={formData.selectedFeces.includes(t)} onChange={() => handleCheckboxToggle("selectedFeces", t)} className="rounded-none border-slate-400 text-slate-800" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
            </div>
            <input type="text" placeholder="Notes" value={formData.fecesNotes} onChange={(e) => handleInputChange("fecesNotes", e.target.value)} className={inputStyle} />
          </fieldset>

          {/* Nasal & Rumen */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="border border-slate-300 p-3 space-y-2">
              <legend className="text-[10px] font-mono font-bold uppercase">Nasal</legend>
              {nasalTests.map((t) => (
                <label key={t} className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" checked={formData.selectedNasal.includes(t)} onChange={() => handleCheckboxToggle("selectedNasal", t)} className="rounded-none border-slate-400 text-slate-800" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
              <input type="text" placeholder="Notes" value={formData.nasalNotes} onChange={(e) => handleInputChange("nasalNotes", e.target.value)} className={inputStyle} />
            </fieldset>
            <fieldset className="border border-slate-300 p-3 space-y-2">
              <legend className="text-[10px] font-mono font-bold uppercase">Rumen</legend>
              {rumenTests.map((t) => (
                <label key={t} className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" checked={formData.selectedRumen.includes(t)} onChange={() => handleCheckboxToggle("selectedRumen", t)} className="rounded-none border-slate-400 text-slate-800" />
                  <span className="truncate">{t}</span>
                </label>
              ))}
              <input type="text" placeholder="Notes" value={formData.rumenNotes} onChange={(e) => handleInputChange("rumenNotes", e.target.value)} className={inputStyle} />
            </fieldset>
          </div>

          {error && <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">[ERROR]: {error}</div>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] uppercase font-bold hover:bg-slate-100">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-slate-900 text-white text-[10px] uppercase font-bold hover:bg-black disabled:opacity-50">
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}