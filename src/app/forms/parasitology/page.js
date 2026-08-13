"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parasitologyApi, parareqApi, labRequestApi } from "@/lib/api";

const fecalMethods = ["Direct Smear", "Fecal Flotation", "Sedimentation", "Baermann Technique", "McMaster (Quantitative)"];

const endoparasiteList = [
  "Strongyle-type eggs", "Strongyloides spp.", "Trichuris spp. (Whipworm)", "Ancylostoma spp. (Hookworm)",
  "Toxocara spp. (Roundworm)", "Coccidia (Eimeria spp.)", "Giardia spp.", "Cryptosporidium spp.",
  "Taenia spp. (Tapeworm)", "Dipylidium caninum", "Fasciola spp. (Liver Fluke)", "Paramphistomum spp.",
  "Trichomonas spp.", "Balantidium coli", "Spirocerca lupi", "Capillaria spp.",
];

const bloodParasiteList = [
  "Babesia spp.", "Theileria spp.", "Anaplasma spp.", "Ehrlichia spp.", "Trypanosoma spp.",
  "Leishmania spp.", "Hepatozoon spp.", "Hemobartonella (Mycoplasma)", "Dirofilaria immitis (Microfilaria)", "Borrelia spp.",
];

const ectoparasiteList = [
  "Sarcoptes scabiei", "Demodex spp.", "Psoroptes spp.", "Otodectes cynotis", "Cheyletiella spp.",
  "Chorioptes spp.", "Notoedres cati", "Ctenocephalides spp. (Fleas)", "Rhipicephalus spp. (Tick)",
  "Linognathus spp. (Lice)", "Trichodectes spp.", "Trombicula spp. (Chiggers)", "Dermatobia hominis",
];

export default function ParasitologyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const docFromUrl = searchParams.get("doc") || "";           // present if this is a lab request

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  const totalSteps = 5;

  const [formData, setFormData] = useState({
    caseNumber: caseIdFromUrl,
    dateReceived: "",
    sampleType: "",
    collectionMethod: "",
    sampleCondition: "",
    selectedFecalMethods: [],
    fecalConsistency: "",
    fecalParasites: {},
    fecalRemarks: "",
    stainingMethod: "",
    bloodSampleType: "",
    bloodParasites: {},
    ectoExamMethod: "",
    siteExamined: "",
    ectoparasites: {},
    parasitologistName: "",
    dateCompleted: "",
    clinicalInterpretation: "",
    doc: docFromUrl,
  });

  useEffect(() => {
    if (caseIdFromUrl) {
      setFormData((prev) => ({ ...prev, caseNumber: caseIdFromUrl }));
    }
  }, [caseIdFromUrl]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (categoryKey, item) => {
    setFormData((prev) => {
      const currentList = prev[categoryKey] || [];
      const updated = currentList.includes(item) ? currentList.filter((i) => i !== item) : [...currentList, item];
      return { ...prev, [categoryKey]: updated };
    });
  };

  const handleNestedTableChange = (category, item, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [item]: { ...(prev[category]?.[item] || {}), [field]: value } },
    }));
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: return formData.dateReceived.trim() !== "" && formData.sampleType.trim() !== "";
      case 5: return formData.parasitologistName.trim() !== "" && formData.doc.trim() !== "";
      default: return true;
    }
  };

  const handleNext = () => { if (!isCurrentStepValid()) { setError("Mandatory fields (*) must be completed."); return; } setError(""); setCurrentStep((prev) => Math.min(prev + 1, totalSteps)); };
  const handleBack = () => { setError(""); setCurrentStep((prev) => Math.max(prev - 1, 1)); };
  const handleSkip = () => { if (!isCurrentStepValid()) return; setError(""); setCurrentStep((prev) => Math.min(prev + 1, totalSteps)); };

  const handleReset = () => {
    setSubmitted(false); setCurrentStep(1); setError(""); setLoading(false); setSavedRecord(null);
    setFormData({
      caseNumber: caseIdFromUrl, dateReceived: "", sampleType: "", collectionMethod: "", sampleCondition: "",
      selectedFecalMethods: [], fecalConsistency: "", fecalParasites: {}, fecalRemarks: "",
      stainingMethod: "", bloodSampleType: "", bloodParasites: {},
      ectoExamMethod: "", siteExamined: "", ectoparasites: {},
      parasitologistName: "", dateCompleted: "", clinicalInterpretation: "", doc: docFromUrl,
    });
  };

  const buildPayload = () => {
    const fecalFound = Object.entries(formData.fecalParasites)
      .filter(([, v]) => v.stage)
      .map(([name, v]) => ({ parasiteName: name, stageFound: v.stage || "ova", quantity: v.count || "", severity: v.severity || "few" }));

    const bloodFound = Object.entries(formData.bloodParasites)
      .filter(([, v]) => v.detected === "detected")
      .map(([name, v]) => ({ parasiteName: name, detected: v.detected, parasitemiaLevel: v.level || "", stage: v.morphology || "" }));

    const ectoFound = Object.entries(formData.ectoparasites)
      .filter(([, v]) => v.detected === "detected")
      .map(([name, v]) => ({ parasiteName: name, detected: v.detected, lifeStage: v.stage || "adults", quantity: v.load || "few" }));

    return {
      caseId: formData.caseNumber,
      doc: formData.doc,
      dateReceived: formData.dateReceived,
      sample: { type: formData.sampleType, collectionMethod: formData.collectionMethod, condition: formData.sampleCondition || "fresh" },
      fecalExamination: { methodsPerformed: formData.selectedFecalMethods, consistency: formData.fecalConsistency || "formed", parasitesFound: fecalFound },
      bloodParasiteExamination: { stainingMethod: formData.stainingMethod || "giemsa", smearType: formData.bloodSampleType || "thin_smear", parasitesFound: bloodFound },
      ectoparasiteExamination: { examinationMethod: formData.ectoExamMethod || "microscopic", siteExamined: formData.siteExamined, parasitesFound: ectoFound },
      interpretation: formData.clinicalInterpretation || "",
      parasitologist: formData.parasitologistName,
      dateCompleted: formData.dateCompleted || undefined,
    };
  };

 const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  if (!isCurrentStepValid()) { setError("System validation failed."); return; }
  setError(""); setLoading(true);
  try {
    const payload = buildPayload();

    if (docFromUrl) {
      // This is a lab request – create a new ParasitologyRequest with full result
      const newRequestResult = await parareqApi.create({
        ...payload,
        status: "completed",
      });
      setSavedRecord(newRequestResult);

      // Mark the original LabRequest as completed
      const labReq = await labRequestApi.list({
        caseId: formData.caseNumber,
        lab: "parasitology",
        status: "pending",
      });
      if (labReq && labReq.length > 0) {
        await labRequestApi.update(labReq[0]._id, { status: "completed" });
      }
    } else {
      // Normal case assignment – save to Parasitology collection
      const res = await parasitologyApi.create(payload);
      setSavedRecord(res);
    }

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
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Diagnostic Laboratory / Module PAR-01</span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">Parasitology Laboratory Record</h1>
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
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">Parasitology Record Saved</h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                CASE: {savedRecord?.caseId || formData.caseNumber} | DOC: {savedRecord?.doc || formData.doc} | STAMP: {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              Data saved to {docFromUrl ? "Parasitology Request" : "Parasitology"} collection.
            </p>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={handleReset} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors">Log New Analysis</button>
              <button type="button" onClick={() => router.push("/dashboard/parasitology")} className="w-full sm:w-auto px-4 py-2.5 border border-slate-400 text-slate-700 text-xs uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors">Back to Dashboard</button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="w-full bg-slate-200 h-1"><div className="bg-slate-800 h-full transition-all duration-200" style={{ width: `${(currentStep / totalSteps) * 100}%` }} /></div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 1: Specimen & Intake</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Case Number</label><input type="text" value={formData.caseNumber} onChange={(e) => handleInputChange("caseNumber", e.target.value)} className={inputStyle} readOnly={!!caseIdFromUrl} /></div>
                  <div><label className={labelStyle}>Date Received <span className="text-red-600">*</span></label><input type="date" required value={formData.dateReceived} onChange={(e) => handleInputChange("dateReceived", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Sample Type <span className="text-red-600">*</span></label><select value={formData.sampleType} onChange={(e) => handleInputChange("sampleType", e.target.value)} className={inputStyle}><option value="">Select</option><option value="feces">Feces</option><option value="blood_smear">Blood Smear</option><option value="skin_scraping">Skin Scraping</option><option value="hair_pluck">Hair Pluck</option><option value="ear_swab">Ear Swab</option><option value="tissue">Tissue</option><option value="urine">Urine</option><option value="other">Other</option></select></div>
                  <div><label className={labelStyle}>Collection Method</label><input type="text" placeholder="e.g. Rectal Retrieval" value={formData.collectionMethod} onChange={(e) => handleInputChange("collectionMethod", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Sample Condition</label><select value={formData.sampleCondition} onChange={(e) => handleInputChange("sampleCondition", e.target.value)} className={inputStyle}><option value="">Select</option><option value="fresh">Fresh</option><option value="refrigerated">Refrigerated</option><option value="preserved">Preserved</option><option value="old">Old</option></select></div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 2: Fecal Examination</h3></div>
                <fieldset className="border border-slate-300 p-3 space-y-3">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">Methods Performed</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {fecalMethods.map((method) => (
                      <label key={method} className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={formData.selectedFecalMethods.includes(method)} onChange={() => handleCheckboxToggle("selectedFecalMethods", method)} className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0" />
                        <span className="text-slate-700 truncate">{method}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div><label className={labelStyle}>Fecal Consistency</label><select value={formData.fecalConsistency} onChange={(e) => handleInputChange("fecalConsistency", e.target.value)} className="w-full sm:w-72 bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono"><option value="">Select</option><option value="formed">Formed</option><option value="soft">Soft</option><option value="pasty">Pasty</option><option value="watery">Watery</option><option value="mucoid">Mucoid</option><option value="bloody">Bloody</option></select></div>
                <div className="border border-slate-300 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[600px]">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Parasite</th><th className="p-2.5">Stage</th><th className="p-2.5">Count</th><th className="p-2.5">Severity</th></tr></thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {endoparasiteList.map((p) => (
                        <tr key={p} className="hover:bg-slate-100">
                          <td className="p-2 font-semibold">{p}</td>
                          <td className="p-2"><select value={formData.fecalParasites[p]?.stage || ""} onChange={(e) => handleNestedTableChange("fecalParasites", p, "stage", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">N/A</option><option value="ova">Ova</option><option value="larvae">Larvae</option><option value="cysts">Cysts</option><option value="oocysts">Oocysts</option><option value="trophozoites">Trophozoites</option><option value="adult">Adult</option></select></td>
                          <td className="p-2"><input type="text" placeholder="0-500" value={formData.fecalParasites[p]?.count || ""} onChange={(e) => handleNestedTableChange("fecalParasites", p, "count", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs" /></td>
                          <td className="p-2"><select value={formData.fecalParasites[p]?.severity || ""} onChange={(e) => handleNestedTableChange("fecalParasites", p, "severity", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="rare">+ Rare</option><option value="few">++ Few</option><option value="moderate">+++ Moderate</option><option value="many">++++ Many</option></select></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div><label className={labelStyle}>Remarks</label><textarea rows={2} placeholder="Additional observations..." value={formData.fecalRemarks} onChange={(e) => handleInputChange("fecalRemarks", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 3: Blood Parasite Analysis</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Staining</label><select value={formData.stainingMethod} onChange={(e) => handleInputChange("stainingMethod", e.target.value)} className={inputStyle}><option value="">Select</option><option value="giemsa">Giemsa</option><option value="wright">Wright's</option><option value="diff_quick">Diff-Quick</option><option value="leishman">Leishman</option></select></div>
                  <div><label className={labelStyle}>Smear Type</label><select value={formData.bloodSampleType} onChange={(e) => handleInputChange("bloodSampleType", e.target.value)} className={inputStyle}><option value="">Select</option><option value="thin_smear">Thin</option><option value="thick_smear">Thick</option><option value="buffy_coat">Buffy Coat</option></select></div>
                </div>
                <div className="border border-slate-300 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[600px]">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Parasite</th><th className="p-2.5">Detected</th><th className="p-2.5">Level</th><th className="p-2.5">Notes</th></tr></thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {bloodParasiteList.map((p) => (
                        <tr key={p} className="hover:bg-slate-100">
                          <td className="p-2 font-semibold">{p}</td>
                          <td className="p-2"><select value={formData.bloodParasites[p]?.detected || ""} onChange={(e) => handleNestedTableChange("bloodParasites", p, "detected", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="not_detected">Not Detected</option><option value="detected">Detected</option></select></td>
                          <td className="p-2"><select value={formData.bloodParasites[p]?.level || ""} onChange={(e) => handleNestedTableChange("bloodParasites", p, "level", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="rare">&lt;1%</option><option value="low">1-5%</option><option value="moderate">5-10%</option><option value="high">10-20%</option><option value="severe">&gt;20%</option></select></td>
                          <td className="p-2"><input type="text" placeholder="Morphology" value={formData.bloodParasites[p]?.morphology || ""} onChange={(e) => handleNestedTableChange("bloodParasites", p, "morphology", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 4: Ectoparasite Examination</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Method</label><select value={formData.ectoExamMethod} onChange={(e) => handleInputChange("ectoExamMethod", e.target.value)} className={inputStyle}><option value="">Select</option><option value="gross_visual">Gross Visual</option><option value="microscopic">Microscopic</option><option value="tape">Tape Prep</option><option value="hair_pluck">Hair Pluck</option><option value="ear_swab">Ear Swab</option><option value="comb">Comb</option></select></div>
                  <div><label className={labelStyle}>Site</label><input type="text" placeholder="e.g. Dorsal midline" value={formData.siteExamined} onChange={(e) => handleInputChange("siteExamined", e.target.value)} className={inputStyle} /></div>
                </div>
                <div className="border border-slate-300 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[600px]">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Parasite</th><th className="p-2.5">Detected</th><th className="p-2.5">Stage</th><th className="p-2.5">Load</th></tr></thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {ectoparasiteList.map((p) => (
                        <tr key={p} className="hover:bg-slate-100">
                          <td className="p-2 font-semibold">{p}</td>
                          <td className="p-2"><select value={formData.ectoparasites[p]?.detected || ""} onChange={(e) => handleNestedTableChange("ectoparasites", p, "detected", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="not_detected">Not Detected</option><option value="detected">Detected</option></select></td>
                          <td className="p-2"><select value={formData.ectoparasites[p]?.stage || ""} onChange={(e) => handleNestedTableChange("ectoparasites", p, "stage", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="eggs">Eggs</option><option value="larvae">Larvae</option><option value="nymphs">Nymphs</option><option value="adults">Adults</option><option value="mixed">Mixed</option></select></td>
                          <td className="p-2"><select value={formData.ectoparasites[p]?.load || ""} onChange={(e) => handleNestedTableChange("ectoparasites", p, "load", e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs"><option value="">--</option><option value="rare">Rare</option><option value="few">Few</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option></select></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 5: Sign-Off</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Parasitologist <span className="text-red-600">*</span></label><input type="text" required placeholder="Name" value={formData.parasitologistName} onChange={(e) => handleInputChange("parasitologistName", e.target.value)} className={inputStyle} /></div>

                  {docFromUrl ? (
                    <div>
                      <label className={labelStyle}>Doc (Department) <span className="text-red-600">*</span></label>
                      <input type="text" value={formData.doc} readOnly className={inputStyle} />
                      <p className="text-[10px] font-mono text-slate-500 mt-1">Auto‑filled from lab request</p>
                    </div>
                  ) : (
                    <div>
                      <label className={labelStyle}>Doc (Department) <span className="text-red-600">*</span></label>
                      <select value={formData.doc} onChange={(e) => handleInputChange("doc", e.target.value)} className={inputStyle} required>
                        <option value="">Select Doc</option>
                        <option value="petdoc">Pet Doc</option>
                        <option value="large doc">Large Doc</option>
                        <option value="equine doc">Equine Doc</option>
                      </select>
                    </div>
                  )}

                  <div><label className={labelStyle}>Date Completed</label><input type="date" value={formData.dateCompleted} onChange={(e) => handleInputChange("dateCompleted", e.target.value)} className={inputStyle} /></div>
                </div>
                <div><label className={labelStyle}>Interpretation</label><textarea rows={3} placeholder="Clinical significance, recommendations..." value={formData.clinicalInterpretation} onChange={(e) => handleInputChange("clinicalInterpretation", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {error && <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">[ERROR]: {error}</div>}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={handleReset} className="w-full sm:w-auto px-3 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-red-700 hover:bg-red-50 transition-colors border sm:border-0 border-red-200">Cancel / Reset</button>
              <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                {currentStep > 1 && <button type="button" onClick={handleBack} className="flex-1 sm:flex-none px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest hover:bg-slate-100 transition-colors text-center">Back</button>}
                {currentStep < totalSteps && <button type="button" onClick={handleSkip} disabled={!isCurrentStepValid()} className="flex-1 sm:flex-none px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors text-center">Skip</button>}
                {currentStep < totalSteps ? <button type="button" onClick={handleNext} className="flex-1 sm:flex-none px-5 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors text-center">Next Stage</button> : <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors text-center disabled:opacity-50">{loading ? "Saving..." : "Commit Record"}</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}