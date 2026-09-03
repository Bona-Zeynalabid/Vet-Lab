"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { casesApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";

const bloodTests = [
  "CBC / Hemogram",
  "Serum Biochemistry",
  "Blood Smear",
  "Blood Culture",
  "Serology",
  "PCR",
  "Hormone Assay",
  "Coagulation Profile",
  "Blood Parasites",
  "Heavy Metal Analysis",
];

const urineTests = [
  "Complete Urinalysis",
  "Urine Culture & Sensitivity",
  "Urine Protein:Creatinine Ratio",
  "Urine Sediment Exam",
  "Urine Electrolytes",
  "Urine Cortisol",
  "Urine Toxicology",
  "Urine Cytology",
];

const fecesTests = [
  "Fecal Flotation",
  "Fecal Sedimentation",
  "Fecal Culture",
  "Fecal Cytology",
  "Fecal Occult Blood",
  "Fecal PCR (Parasites)",
  "Fecal ELISA",
  "Direct Smear",
];

const nasalTests = [
  "Bacterial Culture & Sensitivity",
  "Fungal Culture",
  "PCR (Respiratory Panel)",
  "Cytology",
  "Viral Isolation",
  "Mycoplasma Culture",
  "Antigen Detection",
];

const rumenTests = [
  "pH Measurement",
  "Protozoa Count & Viability",
  "Gram Staining",
  "Methylene Blue Reduction Test",
  "Volatile Fatty Acids (VFA)",
  "Sedimentation Activity Test",
  "Chloride Concentration",
  "Microbial Culture",
];

export default function VeterinaryCaseForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  const [formData, setFormData] = useState({
    date: "",
    caseNumber: "",
    lab: "",
    doc: "",
    by: "",
    ownerName: "",
    address: "",
    telephone: "",
    species: "",
    numberOfAnimals: "",
    breed: "",
    animalId: "",
    sex: "",
    age: "",
    weight: "",
    medicalHistory: "",
    demeanor: "",
    bcs: "",
    mucousMembrane: "",
    respiratoryRate: "",
    crt: "",
    pulseRate: "",
    heartSound: "",
    giMotility: "",
    lungSound: "",
    temperature: "",
    otherClinicalFindings: "",
    selectedBloodTests: [],
    bloodNotes: "",
    selectedUrineTests: [],
    urineNotes: "",
    selectedFecesTests: [],
    fecesNotes: "",
    selectedNasalTests: [],
    nasalNotes: "",
    selectedRumenTests: [],
    rumenNotes: "",
  });

  const totalSteps = 7;

  // On mount: fetch case for edit (or leave caseNumber empty for new)
  useEffect(() => {
    if (editId) {
      fetchCaseForEdit(editId);
    }
    // No auto‑generation for new cases – number will be assigned on save
  }, [editId]);

  // Auto-fill "Recorded By" with logged-in user's name
  useEffect(() => {
    const name = getLoggedInUserName();
    if (name) {
      setFormData((prev) => ({ ...prev, by: name }));
    }
  }, []);

  const fetchCaseForEdit = async (id) => {
    setLoading(true);
    try {
      const data = await casesApi.getById(id);
      setFormData({
        date: data.caseInfo?.date
          ? new Date(data.caseInfo.date).toISOString().split("T")[0]
          : "",
        caseNumber: data.caseInfo?.caseNumber || "",
        lab: data.lab || "",
        doc: data.doc || "",
        by: data.by || "",
        ownerName: data.owner?.fullName || "",
        address: data.owner?.address || "",
        telephone: data.owner?.telephone || "",
        species: data.patient?.species || "",
        numberOfAnimals: data.patient?.numberOfAnimals || "",
        breed: data.patient?.breed || "",
        animalId: data.patient?.animalId || "",
        sex: data.patient?.sex || "",
        age: data.patient?.age || "",
        weight: data.patient?.weight || "",
        medicalHistory: data.anamnesis?.history || "",
        demeanor: data.physicalExam?.demeanor || "",
        bcs: data.physicalExam?.bcs || "",
        mucousMembrane: data.physicalExam?.mucousMembrane || "",
        respiratoryRate: data.physicalExam?.respiratoryRate || "",
        crt: data.physicalExam?.crt || "",
        pulseRate: data.physicalExam?.pulseRate || "",
        heartSound: data.physicalExam?.heartSound || "",
        giMotility: data.physicalExam?.giMotility || "",
        lungSound: data.physicalExam?.lungSound || "",
        temperature: data.physicalExam?.temperature || "",
        otherClinicalFindings: data.physicalExam?.otherFindings || "",
        selectedBloodTests: data.labDirectives?.blood?.tests || [],
        bloodNotes: data.labDirectives?.blood?.notes || "",
        selectedUrineTests: data.labDirectives?.urine?.tests || [],
        urineNotes: data.labDirectives?.urine?.notes || "",
        selectedFecesTests: data.labDirectives?.feces?.tests || [],
        fecesNotes: data.labDirectives?.feces?.notes || "",
        selectedNasalTests: data.labDirectives?.nasal?.tests || [],
        nasalNotes: data.labDirectives?.nasal?.notes || "",
        selectedRumenTests: data.labDirectives?.rumen?.tests || [],
        rumenNotes: data.labDirectives?.rumen?.notes || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (categoryKey, item) => {
    setFormData((prev) => {
      const currentList = prev[categoryKey] || [];
      const updated = currentList.includes(item)
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return { ...prev, [categoryKey]: updated };
    });
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.date.trim() !== "" && formData.caseNumber.trim() !== "";
      case 2:
        return formData.ownerName.trim() !== "";
      case 3:
        return formData.species.trim() !== "";
      case 7:
        if (formData.lab === "diagnosis") {
          return formData.lab.trim() !== "" && formData.doc.trim() !== "";
        }
        return formData.lab.trim() !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setError(
        "Please complete all mandatory fields marked with (*) before proceeding.",
      );
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
    setFormData({
      date: "",
      caseNumber: "",
      lab: "",
      doc: "",
      by: "",
      ownerName: "",
      address: "",
      telephone: "",
      species: "",
      numberOfAnimals: "",
      breed: "",
      animalId: "",
      sex: "",
      age: "",
      weight: "",
      medicalHistory: "",
      demeanor: "",
      bcs: "",
      mucousMembrane: "",
      respiratoryRate: "",
      crt: "",
      pulseRate: "",
      heartSound: "",
      giMotility: "",
      lungSound: "",
      temperature: "",
      otherClinicalFindings: "",
      selectedBloodTests: [],
      bloodNotes: "",
      selectedUrineTests: [],
      urineNotes: "",
      selectedFecesTests: [],
      fecesNotes: "",
      selectedNasalTests: [],
      nasalNotes: "",
      selectedRumenTests: [],
      rumenNotes: "",
    });
  };

  const buildPayload = (overrideCaseNumber = null) => {
    const caseNumber = overrideCaseNumber || formData.caseNumber;
    return {
      caseInfo: {
        date: formData.date,
        caseNumber: caseNumber,
      },
      owner: {
        fullName: formData.ownerName,
        address: formData.address,
        telephone: formData.telephone,
      },
      patient: {
        species: formData.species,
        numberOfAnimals: formData.numberOfAnimals
          ? Number(formData.numberOfAnimals)
          : 1,
        breed: formData.breed,
        animalId: formData.animalId,
        sex: formData.sex,
        age: formData.age,
        weight: formData.weight ? Number(formData.weight) : null,
      },
      lab: formData.lab,
      doc: formData.doc,
      by: formData.by,
      anamnesis: {
        history: formData.medicalHistory,
      },
      physicalExam: {
        demeanor: formData.demeanor,
        bcs: formData.bcs,
        mucousMembrane: formData.mucousMembrane,
        respiratoryRate: formData.respiratoryRate,
        crt: formData.crt,
        pulseRate: formData.pulseRate,
        heartSound: formData.heartSound,
        giMotility: formData.giMotility,
        lungSound: formData.lungSound,
        temperature: formData.temperature ? Number(formData.temperature) : null,
        otherFindings: formData.otherClinicalFindings,
      },
      labDirectives: {
        blood: {
          tests: formData.selectedBloodTests,
          notes: formData.bloodNotes,
        },
        urine: {
          tests: formData.selectedUrineTests,
          notes: formData.urineNotes,
        },
        feces: {
          tests: formData.selectedFecesTests,
          notes: formData.fecesNotes,
        },
        nasal: {
          tests: formData.selectedNasalTests,
          notes: formData.nasalNotes,
        },
        rumen: {
          tests: formData.selectedRumenTests,
          notes: formData.rumenNotes,
        },
      },
    };
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) {
      setError("Required fields are missing.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let finalCaseNumber = formData.caseNumber;

      // For new cases, fetch the next number before saving
      if (!editId) {
        const res = await fetch("/api/case/next-number");
        const data = await res.json();
        if (!data.caseNumber) {
          throw new Error("Failed to generate case number");
        }
        finalCaseNumber = data.caseNumber;
        // Update the form display immediately
        setFormData((prev) => ({ ...prev, caseNumber: finalCaseNumber }));
      }

      const payload = buildPayload(finalCaseNumber);
      let data;
      if (editId) {
        data = await casesApi.update(editId, payload);
      } else {
        data = await casesApi.create(payload);
      }

      setSavedRecord(data);
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

  const showLabDirectives = formData.lab && formData.lab !== "diagnosis";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <header className="border-b-2 border-slate-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
              System Ledger / Intake Protocol
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {editId ? "Edit Case Record" : "Veterinary Clinical Case Intake"}
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
                {editId ? "Case Record Updated" : "Case Record Committed"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                RECORD ID:{" "}
                {savedRecord?.caseInfo?.caseNumber ||
                  formData.caseNumber ||
                  "SYS-PENDING"}{" "}
                | STAMP: {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              {editId
                ? "The case record has been updated successfully."
                : "The clinical record has been written to the institutional database. Associated lab directives have been queued for processing."}
            </p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
              >
                Create New Entry
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/case-registration")}
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
                    Section 1: Case Identification
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Record Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Case Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.caseNumber}
                      readOnly
                      className={inputStyle}
                      placeholder={editId ? "" : "Pending (will be assigned on save)"}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Recorded By</label>
                    <input
                      type="text"
                      value={formData.by}
                      readOnly
                      className={inputStyle}
                      placeholder="Auto‑filled from your account"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 2: Owner / Client Record
                  </h3>
                </div>
                <div>
                  <label className={labelStyle}>
                    Owner Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Surname, First Name"
                    value={formData.ownerName}
                    onChange={(e) =>
                      handleInputChange("ownerName", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Complete Address</label>
                    <input
                      type="text"
                      placeholder="Street, City, Postal Code"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Telephone Number</label>
                    <input
                      type="tel"
                      placeholder="Primary contact line"
                      value={formData.telephone}
                      onChange={(e) =>
                        handleInputChange("telephone", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 3: Patient Signalment (General)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Species <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Canine, Bovine, Feline"
                      value={formData.species}
                      onChange={(e) =>
                        handleInputChange("species", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Head Count / Animals</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.numberOfAnimals}
                      onChange={(e) =>
                        handleInputChange("numberOfAnimals", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Breed Standard</label>
                    <input
                      type="text"
                      placeholder="Breed designation"
                      value={formData.breed}
                      onChange={(e) =>
                        handleInputChange("breed", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Animal ID / Tag Number</label>
                    <input
                      type="text"
                      placeholder="e.g. AID-99402"
                      value={formData.animalId}
                      onChange={(e) =>
                        handleInputChange("animalId", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 4: Patient Metrics
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Biological Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange("sex", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Unspecified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="neutered_male">Neutered Male</option>
                      <option value="spayed_female">Spayed Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Age / Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Years"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Body Weight (KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 5: Medical & Clinical History
                  </h3>
                </div>
                <div>
                  <label className={labelStyle}>
                    Medical & Clinical History
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Prior treatments, vaccination history, environmental exposure, presenting complaint, and all relevant medical background..."
                    value={formData.medicalHistory}
                    onChange={(e) =>
                      handleInputChange("medicalHistory", e.target.value)
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
                    Section 6: Physical Examination & Vitals
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className={labelStyle}>Demeanor</label>
                    <input
                      type="text"
                      placeholder="e.g. BAR, Lethargic"
                      value={formData.demeanor}
                      onChange={(e) =>
                        handleInputChange("demeanor", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>BCS Index</label>
                    <input
                      type="text"
                      placeholder="e.g. 5/9"
                      value={formData.bcs}
                      onChange={(e) => handleInputChange("bcs", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Mucous Membrane</label>
                    <input
                      type="text"
                      placeholder="Pink, CRT < 2s"
                      value={formData.mucousMembrane}
                      onChange={(e) =>
                        handleInputChange("mucousMembrane", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Resp Rate (BPM)</label>
                    <input
                      type="text"
                      placeholder="Min count"
                      value={formData.respiratoryRate}
                      onChange={(e) =>
                        handleInputChange("respiratoryRate", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>CRT Time</label>
                    <input
                      type="text"
                      placeholder="< 2 sec"
                      value={formData.crt}
                      onChange={(e) => handleInputChange("crt", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Pulse Rate</label>
                    <input
                      type="text"
                      placeholder="BPM"
                      value={formData.pulseRate}
                      onChange={(e) =>
                        handleInputChange("pulseRate", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Heart Auscultation</label>
                    <input
                      type="text"
                      placeholder="Normal / Abnormal"
                      value={formData.heartSound}
                      onChange={(e) =>
                        handleInputChange("heartSound", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>GI Motility</label>
                    <input
                      type="text"
                      placeholder="Motility rating"
                      value={formData.giMotility}
                      onChange={(e) =>
                        handleInputChange("giMotility", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="38.5"
                      value={formData.temperature}
                      onChange={(e) =>
                        handleInputChange("temperature", e.target.value)
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>
                    Other Physical Examination Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Palpation findings, lesions, abnormalities..."
                    value={formData.otherClinicalFindings}
                    onChange={(e) =>
                      handleInputChange("otherClinicalFindings", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 7: Lab Assignment & Directives
                  </h3>
                </div>

                <div>
                  <label className={labelStyle}>
                    Lab / Department <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.lab}
                    onChange={(e) => handleInputChange("lab", e.target.value)}
                    className={inputStyle}
                    required
                  >
                    <option value="">— Select Lab —</option>
                    <option value="pathology">Pathology</option>
                    <option value="bacteriology">Bacteriology</option>
                    <option value="parasitology">Parasitology</option>
                    <option value="diagnosis">Diagnosis (Direct)</option>
                  </select>
                </div>

                {formData.lab === "diagnosis" && (
                  <div>
                    <label className={labelStyle}>
                      Assign to Doctor (Doc){" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.doc || ""}
                      onChange={(e) => handleInputChange("doc", e.target.value)}
                      className={inputStyle}
                      required
                    >
                      <option value="">— Select Doctor —</option>
                      <option value="petdoc">Pet Doc</option>
                      <option value="large doc">Large Doc</option>
                      <option value="equine doc">Equine Doc</option>
                    </select>
                  </div>
                )}

                {showLabDirectives && (
                  <>
                    <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                      <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                        Blood Sample Directives
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {bloodTests.map((test) => (
                          <label
                            key={test}
                            className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedBloodTests.includes(test)}
                              onChange={() =>
                                handleCheckboxToggle("selectedBloodTests", test)
                              }
                              className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                            />
                            <span className="text-slate-700 truncate">{test}</span>
                          </label>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Specific blood diagnostic instructions..."
                        value={formData.bloodNotes}
                        onChange={(e) =>
                          handleInputChange("bloodNotes", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </fieldset>

                    <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                      <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                        Urine Sample Directives
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {urineTests.map((test) => (
                          <label
                            key={test}
                            className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedUrineTests.includes(test)}
                              onChange={() =>
                                handleCheckboxToggle("selectedUrineTests", test)
                              }
                              className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                            />
                            <span className="text-slate-700 truncate">{test}</span>
                          </label>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Specific urinalysis instructions..."
                        value={formData.urineNotes}
                        onChange={(e) =>
                          handleInputChange("urineNotes", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </fieldset>

                    <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                      <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                        Fecal Sample Directives
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {fecesTests.map((test) => (
                          <label
                            key={test}
                            className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedFecesTests.includes(test)}
                              onChange={() =>
                                handleCheckboxToggle("selectedFecesTests", test)
                              }
                              className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                            />
                            <span className="text-slate-700 truncate">{test}</span>
                          </label>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Specific parasitology instructions..."
                        value={formData.fecesNotes}
                        onChange={(e) =>
                          handleInputChange("fecesNotes", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </fieldset>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                        <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                          Nasal Directives
                        </legend>
                        <div className="space-y-1.5">
                          {nasalTests.map((test) => (
                            <label
                              key={test}
                              className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={formData.selectedNasalTests.includes(test)}
                                onChange={() =>
                                  handleCheckboxToggle("selectedNasalTests", test)
                                }
                                className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                              />
                              <span className="text-slate-700 truncate">
                                {test}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="border border-slate-300 p-3 sm:p-4 space-y-3">
                        <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                          Rumen Directives
                        </legend>
                        <div className="space-y-1.5">
                          {rumenTests.map((test) => (
                            <label
                              key={test}
                              className="flex items-center space-x-2 text-xs cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={formData.selectedRumenTests.includes(test)}
                                onChange={() =>
                                  handleCheckboxToggle("selectedRumenTests", test)
                                }
                                className="rounded-none border-slate-400 text-slate-800 focus:ring-0 shrink-0"
                              />
                              <span className="text-slate-700 truncate">
                                {test}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
                [VALIDATION ERROR]: {error}
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
                    {loading
                      ? "Saving..."
                      : editId
                        ? "Update Record"
                        : "Commit Record"}
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