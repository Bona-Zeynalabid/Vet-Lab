"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { pathologyApi, pathoreqApi, labRequestApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";

const cmtQuarters = [
  { label: "Right Front (RF)", key: "rf" },
  { label: "Right Hind (RH)", key: "rh" },
  { label: "Left Front (LF)", key: "lf" },
  { label: "Left Hind (LH)", key: "lh" },
];

const spermDefects = [
  "Bent Tail",
  "Coiled Tail",
  "Detached Head",
  "Proximal Droplet",
  "Distal Droplet",
  "Acrosome Defect",
  "Midpiece Defect",
  "Double Head",
];

const chemicalFields = [
  { label: "pH", key: "ph", placeholder: "e.g., 6.5", type: "number", step: "0.1" },
  { label: "Protein", key: "protein", placeholder: "e.g., Negative, +, ++", type: "text" },
  { label: "Glucose", key: "glucose", placeholder: "e.g., Negative, +", type: "text" },
  { label: "Ketones", key: "ketones", placeholder: "e.g., Negative, +", type: "text" },
  { label: "Blood", key: "blood", placeholder: "e.g., Negative, +", type: "text" },
  { label: "Bilirubin", key: "bilirubin", placeholder: "e.g., Negative, +", type: "text" },
];

const erythrocyteRows = [
  { key: "rbc", measurand: "RBC count (10¹²/L)", ref: "5.0–7.2" },
  { key: "hb", measurand: "Haemoglobin (g/L)", ref: "87–124" },
  { key: "hct", measurand: "Haematocrit (L/L)", ref: "0.25–0.33" },
  { key: "mcv", measurand: "MCV (fL)", ref: "38–51" },
  { key: "mch", measurand: "MCH (pg)", ref: "14–19" },
  { key: "mchc", measurand: "MCHC (g/L)", ref: "340–380" },
];

const leukocyteRows = [
  { key: "plt", measurand: "Platelet count (10⁹/L)", ref: "252–724" },
  { key: "wbc", measurand: "WBC count (10⁹/L)", ref: "5.9–14.0" },
  { key: "neut", measurand: "Neutrophils (10⁹/L)", ref: "1.8–7.2" },
  { key: "band", measurand: "Band neutrophils (10⁹/L)", ref: "0.0–0.3" },
  { key: "lymph", measurand: "Lymphocytes (10⁹/L)", ref: "1.7–7.5" },
  { key: "mono", measurand: "Monocytes (10⁹/L)", ref: "0.0–0.9" },
  { key: "eos", measurand: "Eosinophils (10⁹/L)", ref: "0.0–1.3" },
  { key: "baso", measurand: "Basophils (10⁹/L)", ref: "0.0–0.3" },
];

const plasmaProteinRows = [
  { key: "tp", measurand: "Total Protein (g/L)", ref: "60–80" },
  { key: "alb", measurand: "Albumin (g/L)", ref: "27–38" },
  { key: "glob", measurand: "Globulin (g/L)", ref: "27–46" },
  { key: "ag_ratio", measurand: "A:G Ratio", ref: "0.6–1.1" },
  { key: "fib", measurand: "Fibrinogen (g/L)", ref: "1.0–4.0" },
];

export default function PathologyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const docFromUrl = searchParams.get("doc") || "";           // from lab request

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  const totalSteps = 6;

  const [formData, setFormData] = useState({
    caseNumber: caseIdFromUrl,
    dateReceived: "",
    cmt: { rf: "", rh: "", lf: "", lh: "" },
    scc: "",
    electricalConductivity: "",
    milkPh: "",
    bacterialCulture: "",
    antibioticResidue: "",
    milkAppearance: "",
    semenVolume: "",
    semenColor: "",
    semenConsistency: "",
    semenPh: "",
    massMotility: "",
    individualMotilityPct: "",
    individualMotilityGrade: "",
    normalSpermPct: "",
    spermDefects: {},
    catalaseTest: "",
    vesicularNeurosis: "",
    liveDeadRatio: "",
    spermConcentration: "",
    urineAppearance: "",
    urineColor: "",
    specificGravity: "",
    urineChemical: {},
    urineMicroscopic: "",
    erythrocytes: {},
    leukocytes: {},
    plasmaProteins: {},
    pathologistNotes: "",
    doc: docFromUrl,               // pre‑filled from request
    pathologist: "",
    dateCompleted: "",
  });

  useEffect(() => {
    if (caseIdFromUrl) {
      setFormData((prev) => ({ ...prev, caseNumber: caseIdFromUrl }));
    }
  }, [caseIdFromUrl]);

  useEffect(() => {
  const name = getLoggedInUserName();
  if (name) {
    setFormData(prev => ({ ...prev, pathologist: name }));
  }
}, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (category, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.dateReceived.trim() !== "";
      case 6:
        return formData.doc.trim() !== "" && formData.pathologist.trim() !== "";
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

  const handleBack = () => { setError(""); setCurrentStep((prev) => Math.max(prev - 1, 1)); };
  const handleSkip = () => { if (!isCurrentStepValid()) return; setError(""); setCurrentStep((prev) => Math.min(prev + 1, totalSteps)); };

  const handleReset = () => {
    setSubmitted(false);
    setCurrentStep(1);
    setError("");
    setLoading(false);
    setSavedRecord(null);
    setFormData({
      caseNumber: caseIdFromUrl,
      dateReceived: "",
      cmt: { rf: "", rh: "", lf: "", lh: "" },
      scc: "",
      electricalConductivity: "",
      milkPh: "",
      bacterialCulture: "",
      antibioticResidue: "",
      milkAppearance: "",
      semenVolume: "",
      semenColor: "",
      semenConsistency: "",
      semenPh: "",
      massMotility: "",
      individualMotilityPct: "",
      individualMotilityGrade: "",
      normalSpermPct: "",
      spermDefects: {},
      catalaseTest: "",
      vesicularNeurosis: "",
      liveDeadRatio: "",
      spermConcentration: "",
      urineAppearance: "",
      urineColor: "",
      specificGravity: "",
      urineChemical: {},
      urineMicroscopic: "",
      erythrocytes: {},
      leukocytes: {},
      plasmaProteins: {},
      pathologistNotes: "",
      doc: docFromUrl,
      pathologist: "",
      dateCompleted: "",
    });
  };

  const buildPayload = () => {
    const cmt = {
      rightFront: formData.cmt.rf,
      rightHind: formData.cmt.rh,
      leftFront: formData.cmt.lf,
      leftHind: formData.cmt.lh,
    };

    const semenAbnormalities = {};
    spermDefects.forEach((defect) => {
      const key = defect.toLowerCase().replace(/\s+/g, "");
      semenAbnormalities[key] = formData.spermDefects[defect] ? Number(formData.spermDefects[defect]) : 0;
    });

    const erythrocytes = {};
    erythrocyteRows.forEach((row) => {
      erythrocytes[row.key] = formData.erythrocytes[row.key] ? Number(formData.erythrocytes[row.key]) : null;
    });

    const leukocytes = {};
    leukocyteRows.forEach((row) => {
      leukocytes[row.key] = formData.leukocytes[row.key] ? Number(formData.leukocytes[row.key]) : null;
    });

    const plasmaProteins = {};
    plasmaProteinRows.forEach((row) => {
      plasmaProteins[row.key] = formData.plasmaProteins[row.key] ? Number(formData.plasmaProteins[row.key]) : null;
    });

    return {
      caseId: formData.caseNumber,
      doc: formData.doc,
      date: formData.dateReceived,   // matches the pathology model's 'date' field
      milkExamination: {
        cmt,
        somaticCellCount: formData.scc,
        electricalConductivity: formData.electricalConductivity ? Number(formData.electricalConductivity) : null,
        milkPh: formData.milkPh ? Number(formData.milkPh) : null,
        bacterialCulture: formData.bacterialCulture,
        antibioticResidue: formData.antibioticResidue || undefined,
        appearance: formData.milkAppearance,
      },
      semenAnalysis: {
        volume: formData.semenVolume ? Number(formData.semenVolume) : null,
        color: formData.semenColor,
        consistency: formData.semenConsistency,
        ph: formData.semenPh ? Number(formData.semenPh) : null,
        massMotility: formData.massMotility,
        individualMotility: formData.individualMotilityPct ? Number(formData.individualMotilityPct) : null,
        individualMotilityGrade: formData.individualMotilityGrade,
        morphology: {
          normalPercentage: formData.normalSpermPct ? Number(formData.normalSpermPct) : null,
          abnormalities: semenAbnormalities,
        },
        catalaseTest: formData.catalaseTest || undefined,
        vesicularNeurosis: formData.vesicularNeurosis || undefined,
        liveDeadRatio: formData.liveDeadRatio,
        spermConcentration: formData.spermConcentration ? Number(formData.spermConcentration) : null,
      },
      urinalysis: {
        appearance: formData.urineAppearance,
        color: formData.urineColor,
        specificGravity: formData.specificGravity ? Number(formData.specificGravity) : null,
        ph: formData.urineChemical?.ph ? Number(formData.urineChemical.ph) : null,
        protein: formData.urineChemical?.protein || "",
        glucose: formData.urineChemical?.glucose || "",
        ketones: formData.urineChemical?.ketones || "",
        blood: formData.urineChemical?.blood || "",
        bilirubin: formData.urineChemical?.bilirubin || "",
        microscopicFindings: formData.urineMicroscopic,
      },
      hematology: {
        erythrocytes,
        leukocytes,
        plasmaProteins,
      },
      technician: formData.pathologist,
      dateCompleted: formData.dateCompleted || undefined,
    };
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) {
      setError("System validation failed. Please check inputs before committing.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = buildPayload();

      if (docFromUrl) {
        // Save to PathologyRequest collection and update LabRequest status
        const newRequestResult = await pathoreqApi.create({
          ...payload,
          status: "completed",
        });
        setSavedRecord(newRequestResult);

        // Mark the original LabRequest (unified) as completed
        const labReq = await labRequestApi.list({
          caseId: formData.caseNumber,
          lab: "pathology",
          status: "pending",
        });
        if (labReq && labReq.length > 0) {
          await labRequestApi.update(labReq[0]._id, { status: "completed" });
        }
      } else {
        // Normal case assignment – save to Pathology collection
        const res = await pathologyApi.create(payload);
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Clinical Diagnostics System / Module PATH-01</span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">Pathology Laboratory Record</h1>
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
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">Pathology Record Saved</h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                CASE: {savedRecord?.caseId || formData.caseNumber} | DOC: {savedRecord?.doc || formData.doc} | STAMP: {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              Data saved to {docFromUrl ? "Pathology Request" : "Pathology"} collection.
            </p>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={handleReset} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors">Log New Analysis</button>
              <button type="button" onClick={() => router.push("/dashboard/pathology")} className="w-full sm:w-auto px-4 py-2.5 border border-slate-400 text-slate-700 text-xs uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors">Back to Dashboard</button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="w-full bg-slate-200 h-1"><div className="bg-slate-800 h-full transition-all duration-200" style={{ width: `${(currentStep / totalSteps) * 100}%` }} /></div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 1: Specimen & Patient Identifiers</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Case Number</label>
                    <input type="text" value={formData.caseNumber} onChange={(e) => handleInputChange("caseNumber", e.target.value)} className={inputStyle} readOnly={!!caseIdFromUrl} />
                  </div>
                  <div>
                    <label className={labelStyle}>Date Received <span className="text-red-600">*</span></label>
                    <input type="date" required value={formData.dateReceived} onChange={(e) => handleInputChange("dateReceived", e.target.value)} className={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 2: Milk Examination Profile</h3></div>
                <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">California Mastitis Test (CMT) Scores</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cmtQuarters.map((quarter) => (
                      <div key={quarter.key}>
                        <label className={labelStyle}>{quarter.label}</label>
                        <select value={formData.cmt[quarter.key] || ""} onChange={(e) => handleNestedChange("cmt", quarter.key, e.target.value)} className={inputStyle}>
                          <option value="">Select Score</option>
                          <option value="negative">Negative (0)</option>
                          <option value="trace">Trace (T)</option>
                          <option value="1">1 - Weak Positive</option>
                          <option value="2">2 - Distinct Positive</option>
                          <option value="3">3 - Strong Positive</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className={labelStyle}>Somatic Cell Count (cells/mL)</label><input type="text" placeholder="e.g. 200,000" value={formData.scc} onChange={(e) => handleInputChange("scc", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Electrical Conductivity (mS/cm)</label><input type="number" step="0.1" placeholder="e.g. 4.8" value={formData.electricalConductivity} onChange={(e) => handleInputChange("electricalConductivity", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Milk pH</label><input type="number" step="0.1" placeholder="e.g. 6.7" value={formData.milkPh} onChange={(e) => handleInputChange("milkPh", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Bacterial Culture Result</label><input type="text" placeholder="e.g. No growth / Staph. aureus" value={formData.bacterialCulture} onChange={(e) => handleInputChange("bacterialCulture", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Antibiotic Residue Test</label><select value={formData.antibioticResidue} onChange={(e) => handleInputChange("antibioticResidue", e.target.value)} className={inputStyle}><option value="">Select Result</option><option value="negative">Negative</option><option value="positive">Positive</option></select></div>
                  <div><label className={labelStyle}>Milk Appearance</label><select value={formData.milkAppearance} onChange={(e) => handleInputChange("milkAppearance", e.target.value)} className={inputStyle}><option value="">Select</option><option value="normal">Normal</option><option value="watery">Watery</option><option value="clotted">Clotted / Flakes</option><option value="blood_tinged">Blood-tinged</option><option value="yellowish">Yellowish</option></select></div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 3: Semen Evaluation Profile</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className={labelStyle}>Volume (mL)</label><input type="number" step="0.1" placeholder="e.g. 5.0" value={formData.semenVolume} onChange={(e) => handleInputChange("semenVolume", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Color</label><select value={formData.semenColor} onChange={(e) => handleInputChange("semenColor", e.target.value)} className={inputStyle}><option value="">Select</option><option value="creamy_white">Creamy White</option><option value="milky_white">Milky White</option><option value="greyish">Greyish</option><option value="yellowish">Yellowish</option><option value="brownish">Brownish</option></select></div>
                  <div><label className={labelStyle}>Consistency</label><select value={formData.semenConsistency} onChange={(e) => handleInputChange("semenConsistency", e.target.value)} className={inputStyle}><option value="">Select</option><option value="thin">Thin / Watery</option><option value="moderate">Moderate</option><option value="thick">Thick / Creamy</option></select></div>
                  <div><label className={labelStyle}>pH</label><input type="number" step="0.1" placeholder="e.g. 6.8" value={formData.semenPh} onChange={(e) => handleInputChange("semenPh", e.target.value)} className={inputStyle} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 pt-4">
                  <div><label className={labelStyle}>Mass Motility</label><select value={formData.massMotility} onChange={(e) => handleInputChange("massMotility", e.target.value)} className={inputStyle}><option value="">Select Score</option><option value="4">4+ - Very Good</option><option value="3">3+ - Good</option><option value="2">2+ - Fair</option><option value="1">1+ - Poor</option><option value="0">0 - No Motility</option></select></div>
                  <div><label className={labelStyle}>Individual Motility (%)</label><input type="number" min="0" max="100" placeholder="e.g. 75" value={formData.individualMotilityPct} onChange={(e) => handleInputChange("individualMotilityPct", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Individual Motility Grade</label><select value={formData.individualMotilityGrade} onChange={(e) => handleInputChange("individualMotilityGrade", e.target.value)} className={inputStyle}><option value="">Select Grade</option><option value="a">Grade A - Rapid progressive</option><option value="b">Grade B - Slow progressive</option><option value="c">Grade C - Non-progressive</option><option value="d">Grade D - Immotile</option></select></div>
                  <div><label className={labelStyle}>Normal Sperm (%)</label><input type="number" min="0" max="100" placeholder="e.g. 80" value={formData.normalSpermPct} onChange={(e) => handleInputChange("normalSpermPct", e.target.value)} className={inputStyle} /></div>
                </div>
                <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">Sperm Morphological Defect Distribution (%)</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {spermDefects.map((defect) => (
                      <div key={defect}>
                        <label className={labelStyle}>{defect} (%)</label>
                        <input type="number" min="0" max="100" placeholder="0" value={formData.spermDefects[defect] || ""} onChange={(e) => handleNestedChange("spermDefects", defect, e.target.value)} className={inputStyle} />
                      </div>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 pt-4">
                  <div><label className={labelStyle}>Catalase Test</label><select value={formData.catalaseTest} onChange={(e) => handleInputChange("catalaseTest", e.target.value)} className={inputStyle}><option value="">Select Result</option><option value="negative">Negative</option><option value="positive_1">+</option><option value="positive_2">++</option><option value="positive_3">+++</option></select></div>
                  <div><label className={labelStyle}>Vesicular Neurosis</label><select value={formData.vesicularNeurosis} onChange={(e) => handleInputChange("vesicularNeurosis", e.target.value)} className={inputStyle}><option value="">Select</option><option value="absent">Absent</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div>
                  <div><label className={labelStyle}>Live/Dead Ratio (%)</label><input type="text" placeholder="e.g. 85/15" value={formData.liveDeadRatio} onChange={(e) => handleInputChange("liveDeadRatio", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Sperm Concentration (10⁹/mL)</label><input type="number" step="0.1" placeholder="e.g. 1.2" value={formData.spermConcentration} onChange={(e) => handleInputChange("spermConcentration", e.target.value)} className={inputStyle} /></div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 4: Urinalysis Panel</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className={labelStyle}>Appearance</label><select value={formData.urineAppearance} onChange={(e) => handleInputChange("urineAppearance", e.target.value)} className={inputStyle}><option value="">Select</option><option value="clear">Clear</option><option value="slightly_cloudy">Slightly Cloudy</option><option value="cloudy">Cloudy</option><option value="turbid">Turbid</option></select></div>
                  <div><label className={labelStyle}>Color</label><select value={formData.urineColor} onChange={(e) => handleInputChange("urineColor", e.target.value)} className={inputStyle}><option value="">Select</option><option value="pale_yellow">Pale Yellow</option><option value="yellow">Yellow</option><option value="dark_yellow">Dark Yellow</option><option value="amber">Amber</option><option value="red">Red</option><option value="brown">Brown</option><option value="colorless">Colorless</option></select></div>
                  <div><label className={labelStyle}>Specific Gravity</label><input type="number" step="0.001" placeholder="e.g. 1.025" value={formData.specificGravity} onChange={(e) => handleInputChange("specificGravity", e.target.value)} className={inputStyle} /></div>
                </div>
                <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">Chemical Dipstick Analysis</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    {chemicalFields.map((field) => (
                      <div key={field.key}>
                        <label className={labelStyle}>{field.label}</label>
                        <input type={field.type} step={field.step} placeholder={field.placeholder} value={formData.urineChemical[field.key] || ""} onChange={(e) => handleNestedChange("urineChemical", field.key, e.target.value)} className={inputStyle} />
                      </div>
                    ))}
                  </div>
                </fieldset>
                <div><label className={labelStyle}>Microscopic Findings</label><textarea rows={4} placeholder="e.g., RBC: 0-2/hpf, WBC: 0-1/hpf..." value={formData.urineMicroscopic} onChange={(e) => handleInputChange("urineMicroscopic", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 5: Hematology & Hemogram Profile</h3></div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 block">Erythrocyte Parameters</span>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono min-w-[500px]">
                      <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Measurand (Units)</th><th className="p-2.5">Result Value</th><th className="p-2.5">Reference Interval</th></tr></thead>
                      <tbody className="divide-y divide-slate-200 bg-slate-50">
                        {erythrocyteRows.map((row) => (
                          <tr key={row.key} className="hover:bg-slate-100">
                            <td className="p-2 font-semibold text-slate-700">{row.measurand}</td>
                            <td className="p-2"><input type="text" value={formData.erythrocytes[row.key] || ""} onChange={(e) => handleNestedChange("erythrocytes", row.key, e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs focus:outline-none focus:border-slate-800" /></td>
                            <td className="p-2 text-slate-500">{row.ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 block">Leukocyte & Platelet Parameters</span>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono min-w-[500px]">
                      <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Measurand (Units)</th><th className="p-2.5">Result Value</th><th className="p-2.5">Reference Interval</th></tr></thead>
                      <tbody className="divide-y divide-slate-200 bg-slate-50">
                        {leukocyteRows.map((row) => (
                          <tr key={row.key} className="hover:bg-slate-100">
                            <td className="p-2 font-semibold text-slate-700">{row.measurand}</td>
                            <td className="p-2"><input type="text" value={formData.leukocytes[row.key] || ""} onChange={(e) => handleNestedChange("leukocytes", row.key, e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs focus:outline-none focus:border-slate-800" /></td>
                            <td className="p-2 text-slate-500">{row.ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 block">Plasma Proteins & Indices</span>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono min-w-[500px]">
                      <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider"><tr><th className="p-2.5">Measurand (Units)</th><th className="p-2.5">Result Value</th><th className="p-2.5">Reference Interval</th></tr></thead>
                      <tbody className="divide-y divide-slate-200 bg-slate-50">
                        {plasmaProteinRows.map((row) => (
                          <tr key={row.key} className="hover:bg-slate-100">
                            <td className="p-2 font-semibold text-slate-700">{row.measurand}</td>
                            <td className="p-2"><input type="text" value={formData.plasmaProteins[row.key] || ""} onChange={(e) => handleNestedChange("plasmaProteins", row.key, e.target.value)} className="w-full bg-white border border-slate-300 p-1 text-xs focus:outline-none focus:border-slate-800" /></td>
                            <td className="p-2 text-slate-500">{row.ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div><label className={labelStyle}>Pathologist Remarks & Interpretation</label><textarea rows={4} placeholder="Document clinical interpretation..." value={formData.pathologistNotes} onChange={(e) => handleInputChange("pathologistNotes", e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Section 6: Sign-Off & Department Assignment</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Pathologist Name <span className="text-red-600">*</span></label><input type="text" readOnly required placeholder="e.g. Dr. John Doe" value={formData.pathologist} onChange={(e) => handleInputChange("pathologist", e.target.value)} className={inputStyle} /></div>

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