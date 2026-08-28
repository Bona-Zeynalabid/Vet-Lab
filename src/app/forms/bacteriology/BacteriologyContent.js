"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { bacteriologyApi, bactreqApi, labRequestApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";

const cultureMediaList = [
  "Blood Agar",
  "MacConkey Agar",
  "Chocolate Agar",
  "Sabouraud Dextrose Agar",
  "Mueller Hinton Agar",
  "Brilliant Green Agar",
  "XLD Agar",
  "SS Agar",
  "Mannitol Salt Agar",
  "Nutrient Agar",
  "Thioglycolate Broth",
  "Tryptic Soy Broth",
];

const biochemicalRows = [
  [
    { name: "Catalase", options: ["", "Positive (+)", "Negative (-)"] },
    { name: "Coagulase", options: ["", "Positive (+)", "Negative (-)"] },
  ],
  [
    { name: "Oxidase", options: ["", "Positive (+)", "Negative (-)"] },
    { name: "Urease", options: ["", "Positive (+)", "Negative (-)"] },
  ],
  [
    { name: "Indole", options: ["", "Positive (+)", "Negative (-)"] },
    {
      name: "Citrate Utilization",
      options: ["", "Positive (+)", "Negative (-)"],
    },
  ],
  [
    { name: "Methyl Red (MR)", options: ["", "Positive (+)", "Negative (-)"] },
    {
      name: "Voges-Proskauer (VP)",
      options: ["", "Positive (+)", "Negative (-)"],
    },
  ],
  [
    {
      name: "Triple Sugar Iron (TSI)",
      options: ["", "A/A", "K/A", "K/K", "H2S+"],
    },
    { name: "Motility", options: ["", "Motile", "Non-motile"] },
  ],
  [
    { name: "Hemolysis (Blood Agar)", options: ["", "Alpha", "Beta", "Gamma"] },
    { name: "Growth on MacConkey", options: ["", "Yes", "No"] },
  ],
  [
    {
      name: "Gelatin Hydrolysis",
      options: ["", "Positive (+)", "Negative (-)"],
    },
    {
      name: "Nitrate Reduction",
      options: ["", "Positive (+)", "Negative (-)"],
    },
  ],
  [
    {
      name: "Esculin Hydrolysis",
      options: ["", "Positive (+)", "Negative (-)"],
    },
    { name: "DNase", options: ["", "Positive (+)", "Negative (-)"] },
  ],
  [
    { name: "CAMP Test", options: ["", "Positive (+)", "Negative (-)"] },
    { name: "Bile Solubility", options: ["", "Positive (+)", "Negative (-)"] },
  ],
  [
    { name: "Pigment Production", options: ["", "Yes", "No"] },
    { name: "Spore Formation", options: ["", "Yes", "No"] },
  ],
];

const defaultAntibiotics = [
  "Penicillin",
  "Amoxicillin",
  "Ampicillin",
  "Ceftriaxone",
  "Gentamicin",
  "Enrofloxacin",
  "Tetracycline",
  "Trimethoprim-Sulfa",
];

export default function BacteriologyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const docFromUrl = searchParams.get("doc") || ""; // if present, this is a lab request

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  const totalSteps = 6;

  const [formData, setFormData] = useState({
    caseNumber: caseIdFromUrl,
    dateReceived: "",
    sampleType: "",
    collectionMethod: "",
    sampleSite: "",
    selectedMedia: [],
    incubationTemp: "",
    incubationAtmosphere: "",
    incubationDuration: "",
    growth24h: "",
    growth48h: "",
    growth72h: "",
    colonySize: "",
    colonyShape: "",
    colonyColor: "",
    colonyOpacity: "",
    colonyElevation: "",
    colonyMargin: "",
    colonyConsistency: "",
    colonyHemolysis: "",
    colonyOdor: "",
    gramReaction: "",
    bacterialMorphology: "",
    microscopicDescription: "",
    biochemicalResults: {},
    organismIdentified: "",
    confidenceLevel: "",
    mixedCultureNotes: "",
    astMethod: "",
    astResults: defaultAntibiotics.map((ab) => ({
      name: ab,
      zone: "",
      interpretation: "",
    })),
    bacteriologist: "",
    dateCompleted: "",
    doc: docFromUrl,
  });

  useEffect(() => {
    if (caseIdFromUrl)
      setFormData((prev) => ({ ...prev, caseNumber: caseIdFromUrl }));
  }, [caseIdFromUrl]);

  useEffect(() => {
    const name = getLoggedInUserName();
    if (name) {
      setFormData((prev) => ({ ...prev, bacteriologist: name }));
    }
  }, []);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleCheckboxToggle = (categoryKey, item) => {
    setFormData((prev) => {
      const list = prev[categoryKey] || [];
      return {
        ...prev,
        [categoryKey]: list.includes(item)
          ? list.filter((i) => i !== item)
          : [...list, item],
      };
    });
  };
  const handleBiochemicalChange = (testName, value) =>
    setFormData((prev) => ({
      ...prev,
      biochemicalResults: { ...prev.biochemicalResults, [testName]: value },
    }));
  const handleAstChange = (index, field, value) =>
    setFormData((prev) => {
      const ast = [...prev.astResults];
      ast[index] = { ...ast[index], [field]: value };
      return { ...prev, astResults: ast };
    });

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.dateReceived.trim() !== "" &&
          formData.sampleType.trim() !== ""
        );
      case 2:
        return formData.selectedMedia.length > 0;
      case 3:
        return formData.gramReaction.trim() !== "";
      case 4:
        return formData.organismIdentified.trim() !== "";
      case 6:
        return (
          formData.bacteriologist.trim() !== "" && formData.doc.trim() !== ""
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setError("Mandatory fields must be completed.");
      return;
    }
    setError("");
    setCurrentStep((p) => Math.min(p + 1, totalSteps));
  };
  const handleBack = () => {
    setError("");
    setCurrentStep((p) => Math.max(p - 1, 1));
  };
  const handleSkip = () => {
    if (!isCurrentStepValid()) return;
    setError("");
    setCurrentStep((p) => Math.min(p + 1, totalSteps));
  };

  const handleReset = () => {
    setSubmitted(false);
    setCurrentStep(1);
    setError("");
    setLoading(false);
    setSavedRecord(null);
    setFormData({
      caseNumber: caseIdFromUrl,
      dateReceived: "",
      sampleType: "",
      collectionMethod: "",
      sampleSite: "",
      selectedMedia: [],
      incubationTemp: "",
      incubationAtmosphere: "",
      incubationDuration: "",
      growth24h: "",
      growth48h: "",
      growth72h: "",
      colonySize: "",
      colonyShape: "",
      colonyColor: "",
      colonyOpacity: "",
      colonyElevation: "",
      colonyMargin: "",
      colonyConsistency: "",
      colonyHemolysis: "",
      colonyOdor: "",
      gramReaction: "",
      bacterialMorphology: "",
      microscopicDescription: "",
      biochemicalResults: {},
      organismIdentified: "",
      confidenceLevel: "",
      mixedCultureNotes: "",
      astMethod: "",
      astResults: defaultAntibiotics.map((ab) => ({
        name: ab,
        zone: "",
        interpretation: "",
      })),
      bacteriologist: "",
      dateCompleted: "",
      doc: docFromUrl,
    });
  };

  const buildPayload = () => {
    const biochem = {};
    const mapping = {
      Catalase: "catalase",
      Coagulase: "coagulase",
      Oxidase: "oxidase",
      Urease: "urease",
      Indole: "indole",
      "Citrate Utilization": "citrate",
      "Methyl Red (MR)": "methylRed",
      "Voges-Proskauer (VP)": "vogesProskauer",
      "Triple Sugar Iron (TSI)": "tsi",
      Motility: "motility",
    };
    Object.entries(formData.biochemicalResults).forEach(([test, result]) => {
      if (!result) return;
      let clean = result.startsWith("Positive")
        ? "positive"
        : result.startsWith("Negative")
          ? "negative"
          : result;
      const field = mapping[test];
      if (field) biochem[field] = clean;
    });
    const astResults = formData.astResults
      .filter((ab) => ab.zone || ab.interpretation)
      .map((ab) => ({
        antibiotic: ab.name,
        zoneSize: ab.zone,
        interpretation: ab.interpretation
          ? ab.interpretation.charAt(0).toLowerCase()
          : "",
      }));

    return {
      caseId: formData.caseNumber,
      doc: formData.doc,
      dateReceived: formData.dateReceived,
      sample: {
        type: formData.sampleType,
        collectionMethod: formData.collectionMethod,
        site: formData.sampleSite,
      },
      cultureDetails: {
        mediaUsed: formData.selectedMedia,
        incubation: {
          temperature: formData.incubationTemp || "37°C",
          atmosphere: formData.incubationAtmosphere || "aerobic",
          duration: formData.incubationDuration || "24-72 hours",
        },
        growthObservation: {
          hours24: formData.growth24h || "no_growth",
          hours48: formData.growth48h || "no_growth",
          hours72: formData.growth72h || "no_growth",
        },
      },
      colonyMorphology: {
        size: formData.colonySize,
        shape: formData.colonyShape,
        color: formData.colonyColor,
        opacity: formData.colonyOpacity,
        elevation: formData.colonyElevation,
        margin: formData.colonyMargin,
        consistency: formData.colonyConsistency,
        hemolysis: formData.colonyHemolysis,
        odor: formData.colonyOdor,
      },
      gramStain: {
        gramReaction: formData.gramReaction,
        bacterialMorphology: formData.bacterialMorphology,
        microscopicFindings: formData.microscopicDescription,
      },
      biochemicalTests: biochem,
      organismIdentification: {
        organismName: formData.organismIdentified,
        confidenceLevel: formData.confidenceLevel || "tentative",
      },
      antibioticSensitivity: {
        method: formData.astMethod || "kirby_bauer",
        results: astResults,
      },
      interpretation: formData.mixedCultureNotes || "",
      bacteriologist: formData.bacteriologist,
      dateCompleted: formData.dateCompleted || undefined,
    };
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) {
      setError("Mandatory fields must be completed.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = buildPayload();

      if (docFromUrl) {
        // This is a lab request – create a new BacteriologyRequest with full result
        const newRequestResult = await bactreqApi.create({
          ...payload,
          status: "completed",
        });
        setSavedRecord(newRequestResult);

        // Also mark the original LabRequest (unified) as completed
        const labReq = await labRequestApi.list({
          caseId: formData.caseNumber,
          lab: "bacteriology",
          status: "pending",
        });
        if (labReq && labReq.length > 0) {
          await labRequestApi.update(labReq[0]._id, { status: "completed" });
        }
      } else {
        // Normal case assignment – save to Bacteriology collection
        const res = await bacteriologyApi.create(payload);
        setSavedRecord(res);
      }

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
              Diagnostic Laboratory Protocol
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Bacteriology Laboratory Record
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
                Record Saved
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                CASE: {savedRecord?.caseId || formData.caseNumber} | DOC:{" "}
                {savedRecord?.doc || formData.doc} | STAMP:{" "}
                {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              Data saved to{" "}
              {docFromUrl ? "Bacteriology Request" : "Bacteriology"} collection.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
              >
                Log New Analysis
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/bacteriology")}
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
                    Section 1: Specimen & Intake
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Case Number</label>
                    <input
                      type="text"
                      value={formData.caseNumber}
                      onChange={(e) =>
                        handleInputChange("caseNumber", e.target.value)
                      }
                      className={inputStyle}
                      readOnly={!!caseIdFromUrl}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Date Received <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateReceived}
                      onChange={(e) =>
                        handleInputChange("dateReceived", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Sample Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.sampleType}
                      onChange={(e) =>
                        handleInputChange("sampleType", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="blood">Blood</option>
                      <option value="urine">Urine</option>
                      <option value="milk">Milk</option>
                      <option value="feces">Feces</option>
                      <option value="nasal_swab">Nasal Swab</option>
                      <option value="pus">Pus / Abscess</option>
                      <option value="tissue">Tissue / Biopsy</option>
                      <option value="ear_swab">Ear Swab</option>
                      <option value="skin">Skin Scraping</option>
                      <option value="csf">CSF</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Collection Method</label>
                    <input
                      type="text"
                      placeholder="e.g. Aseptic collection"
                      value={formData.collectionMethod}
                      onChange={(e) =>
                        handleInputChange("collectionMethod", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Sample Site</label>
                    <input
                      type="text"
                      placeholder="e.g. Left Ear Canal"
                      value={formData.sampleSite}
                      onChange={(e) =>
                        handleInputChange("sampleSite", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 2: Culture & Incubation
                  </h3>
                </div>
                <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                    Culture Media <span className="text-red-600">*</span>
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {cultureMediaList.map((media) => (
                      <label
                        key={media}
                        className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedMedia.includes(media)}
                          onChange={() =>
                            handleCheckboxToggle("selectedMedia", media)
                          }
                          className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                        />
                        <span className="text-slate-700 truncate">{media}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                    <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                      Incubation
                    </legend>
                    <div>
                      <label className={labelStyle}>Temperature (°C)</label>
                      <input
                        type="text"
                        placeholder="e.g. 37"
                        value={formData.incubationTemp}
                        onChange={(e) =>
                          handleInputChange("incubationTemp", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Atmosphere</label>
                      <select
                        value={formData.incubationAtmosphere}
                        onChange={(e) =>
                          handleInputChange(
                            "incubationAtmosphere",
                            e.target.value,
                          )
                        }
                        className={inputStyle}
                      >
                        <option value="">Select</option>
                        <option value="aerobic">Aerobic</option>
                        <option value="anaerobic">Anaerobic</option>
                        <option value="microaerophilic">Microaerophilic</option>
                        <option value="co2">5-10% CO2</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Duration (Hours)</label>
                      <input
                        type="text"
                        placeholder="e.g. 24-48"
                        value={formData.incubationDuration}
                        onChange={(e) =>
                          handleInputChange(
                            "incubationDuration",
                            e.target.value,
                          )
                        }
                        className={inputStyle}
                      />
                    </div>
                  </fieldset>
                  <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                    <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                      Growth Observations
                    </legend>
                    {["24h", "48h", "72h"].map((h, i) => {
                      const val =
                        i === 0
                          ? formData.growth24h
                          : i === 1
                            ? formData.growth48h
                            : formData.growth72h;
                      const field =
                        i === 0
                          ? "growth24h"
                          : i === 1
                            ? "growth48h"
                            : "growth72h";
                      return (
                        <div key={h}>
                          <label className={labelStyle}>{h} Reading</label>
                          <select
                            value={val}
                            onChange={(e) =>
                              handleInputChange(field, e.target.value)
                            }
                            className={inputStyle}
                          >
                            <option value="">Select</option>
                            <option value="no_growth">No Growth</option>
                            <option value="scanty">Scanty</option>
                            <option value="moderate">Moderate</option>
                            <option value="heavy">Heavy</option>
                          </select>
                        </div>
                      );
                    })}
                  </fieldset>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 3: Microscopy & Gram Stain
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Gram Reaction <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.gramReaction}
                      onChange={(e) =>
                        handleInputChange("gramReaction", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="gram_positive">Gram Positive (+)</option>
                      <option value="gram_negative">Gram Negative (-)</option>
                      <option value="acid-fast">Acid Fast</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Bacterial Morphology</label>
                    <select
                      value={formData.bacterialMorphology}
                      onChange={(e) =>
                        handleInputChange("bacterialMorphology", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="cocci_clusters">Cocci in Clusters</option>
                      <option value="cocci_chains">Cocci in Chains</option>
                      <option value="cocci_pairs">Diplococci</option>
                      <option value="rods">Rods (Bacilli)</option>
                      <option value="coccobacilli">Coccobacilli</option>
                      <option value="spiral">Spiral</option>
                      <option value="pleomorphic">Pleomorphic</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Colony Size</label>
                    <select
                      value={formData.colonySize}
                      onChange={(e) =>
                        handleInputChange("colonySize", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="pinpoint">Pinpoint</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Colony Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Cream"
                      value={formData.colonyColor}
                      onChange={(e) =>
                        handleInputChange("colonyColor", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Hemolysis</label>
                    <select
                      value={formData.colonyHemolysis}
                      onChange={(e) =>
                        handleInputChange("colonyHemolysis", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="alpha">Alpha</option>
                      <option value="beta">Beta</option>
                      <option value="gamma">Gamma</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Microscopic Observations</label>
                  <textarea
                    rows={3}
                    placeholder="Note arrangement, spores..."
                    value={formData.microscopicDescription}
                    onChange={(e) =>
                      handleInputChange(
                        "microscopicDescription",
                        e.target.value,
                      )
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 4: Biochemical Tests & Identification
                  </h3>
                </div>
                <div className="border border-slate-300 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[500px]">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5">Test</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Test</th>
                        <th className="p-2.5">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {biochemicalRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-100">
                          <td className="p-2 font-semibold text-slate-700">
                            {row[0].name}
                          </td>
                          <td className="p-2">
                            <select
                              value={
                                formData.biochemicalResults[row[0].name] || ""
                              }
                              onChange={(e) =>
                                handleBiochemicalChange(
                                  row[0].name,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-slate-300 p-1 text-xs"
                            >
                              <option value="">-- Select --</option>
                              {row[0].options
                                .filter((o) => o)
                                .map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-2 font-semibold text-slate-700">
                            {row[1].name}
                          </td>
                          <td className="p-2">
                            <select
                              value={
                                formData.biochemicalResults[row[1].name] || ""
                              }
                              onChange={(e) =>
                                handleBiochemicalChange(
                                  row[1].name,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-slate-300 p-1 text-xs"
                            >
                              <option value="">-- Select --</option>
                              {row[1].options
                                .filter((o) => o)
                                .map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Organism Identified{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Staphylococcus aureus"
                      value={formData.organismIdentified}
                      onChange={(e) =>
                        handleInputChange("organismIdentified", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Confidence</label>
                    <select
                      value={formData.confidenceLevel}
                      onChange={(e) =>
                        handleInputChange("confidenceLevel", e.target.value)
                      }
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="definitive">Definitive</option>
                      <option value="presumptive">Presumptive</option>
                      <option value="tentative">Tentative</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 5: Antibiotic Sensitivity (AST)
                  </h3>
                </div>
                <div>
                  <label className={labelStyle}>Method</label>
                  <select
                    value={formData.astMethod}
                    onChange={(e) =>
                      handleInputChange("astMethod", e.target.value)
                    }
                    className="w-full sm:w-72 bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono"
                  >
                    <option value="">Select</option>
                    <option value="kirby_bauer">Kirby-Bauer</option>
                    <option value="mic">MIC</option>
                    <option value="e_test">E-Test</option>
                    <option value="vitek">VITEK</option>
                  </select>
                </div>
                <div className="border border-slate-300 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[500px]">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5">Antibiotic</th>
                        <th className="p-2.5">Zone / MIC</th>
                        <th className="p-2.5">S/I/R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-slate-50">
                      {formData.astResults.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-100">
                          <td className="p-2 font-semibold">{item.name}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. 22mm"
                              value={item.zone}
                              onChange={(e) =>
                                handleAstChange(idx, "zone", e.target.value)
                              }
                              className="w-full bg-white border border-slate-300 p-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.interpretation}
                              onChange={(e) =>
                                handleAstChange(
                                  idx,
                                  "interpretation",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-slate-300 p-1 text-xs"
                            >
                              <option value="">-</option>
                              <option value="s">S</option>
                              <option value="i">I</option>
                              <option value="r">R</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className={labelStyle}>Interpretation / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Additional findings..."
                    value={formData.mixedCultureNotes}
                    onChange={(e) =>
                      handleInputChange("mixedCultureNotes", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 6: Sign-Off
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Bacteriologist <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      value={formData.bacteriologist}
                      onChange={(e) =>
                        handleInputChange("bacteriologist", e.target.value)
                      }
                      className={inputStyle}
                      readOnly
                    />
                  </div>

                  {docFromUrl ? (
                    <div>
                      <label className={labelStyle}>
                        Doc (Department) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.doc}
                        readOnly
                        className={inputStyle}
                      />
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        Auto‑filled from lab request
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className={labelStyle}>
                        Doc (Department) <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.doc}
                        onChange={(e) =>
                          handleInputChange("doc", e.target.value)
                        }
                        className={inputStyle}
                        required
                      >
                        <option value="">Select Doc</option>
                        <option value="petdoc">Pet Doc</option>
                        <option value="large doc">Large Doc</option>
                        <option value="equine doc">Equine Doc</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={labelStyle}>Date Completed</label>
                    <input
                      type="date"
                      value={formData.dateCompleted}
                      onChange={(e) =>
                        handleInputChange("dateCompleted", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
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
                    {loading ? "Saving..." : "Commit Record"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
