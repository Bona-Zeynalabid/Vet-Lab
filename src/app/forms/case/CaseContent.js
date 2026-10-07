"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { casesApi, diagnosisApi, pharmacyApi, medicineApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";
import { Sparkles, Loader2, X, Check, AlertCircle } from "lucide-react";

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

const confirmationMethods = [
  "Clinical Signs",
  "Lab Results",
  "Radiography",
  "Ultrasound",
  "Post-mortem",
  "Response to Treatment",
  "Biopsy",
  "Culture Results",
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

const emptyMedicine = () => ({
  name: "",
  concentration: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  amount: "",
  instructions: "",
});

export default function VeterinaryCaseForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const [speciesFetchLoading, setSpeciesFetchLoading] = useState(false);
  const [medicinesList, setMedicinesList] = useState([]);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState([]);
  const [aiError, setAiError] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

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
    // Self-diagnosis fields
    primaryTentative: "",
    differentialDiagnoses: "",
    clinicalJustification: "",
    definitiveDiagnosis: "",
    confirmationMethods: [],
    diagnosticNotes: "",
    medicines: [emptyMedicine()],
    prognosis: "",
    followUpDate: "",
    followUpInstructions: "",
  });

  const isSelfDiagnosis = formData.lab === "self_diagnosis";
  const totalSteps = isSelfDiagnosis ? 10 : 7;

  // Fetch the next case number (without incrementing) for new cases
  const fetchNextNumber = async () => {
    try {
      const res = await fetch("/api/case/next-number");
      const data = await res.json();
      if (data.caseNumber) {
        setFormData((prev) => ({ ...prev, caseNumber: data.caseNumber }));
      }
    } catch (err) {
      console.error("Failed to fetch next case number:", err);
    }
  };

  // On mount: fetch case for edit or generate next number (peek)
  useEffect(() => {
    if (editId) {
      fetchCaseForEdit(editId);
    } else {
      fetchNextNumber();
    }
  }, [editId]);

  // Auto-fill "Recorded By" with logged-in user's name
  useEffect(() => {
    const name = getLoggedInUserName();
    if (name) {
      setFormData((prev) => ({ ...prev, by: name }));
    }
  }, []);

  // Fetch medicines for autocomplete (self-diagnosis)
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
        primaryTentative: "",
        differentialDiagnoses: "",
        clinicalJustification: "",
        definitiveDiagnosis: "",
        confirmationMethods: [],
        diagnosticNotes: "",
        medicines: [emptyMedicine()],
        prognosis: "",
        followUpDate: "",
        followUpInstructions: "",
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

  // ---- Medicine helpers ----
  const computeAmount = (medicine) => {
    const weight = formData.weight ? Number(formData.weight) : null;
    if (!weight) return null;
    const doseVal = extractNumeric(medicine.dosage);
    const concVal = extractNumeric(medicine.concentration);
    if (doseVal === null || concVal === null || concVal <= 0) return null;
    const amount = (weight * doseVal) / concVal;
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

  const addMedicine = () =>
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, emptyMedicine()],
    }));

  const removeMedicine = (index) => {
    if (formData.medicines.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  // ---- AI handlers ----
  const handleAskAi = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSections([]);
    setShowAiPanel(true);

    try {
      const doc = {
        caseInfo: { caseNumber: formData.caseNumber, date: formData.date },
        patient: {
          species: formData.species,
          breed: formData.breed,
          age: formData.age,
          sex: formData.sex,
          weight: formData.weight ? Number(formData.weight) : null,
          numberOfAnimals: formData.numberOfAnimals
            ? Number(formData.numberOfAnimals)
            : 1,
          animalId: formData.animalId,
        },
        anamnesis: { history: formData.medicalHistory },
        physicalExam: {
          demeanor: formData.demeanor,
          bcs: formData.bcs,
          mucousMembrane: formData.mucousMembrane,
          temperature: formData.temperature,
          respiratoryRate: formData.respiratoryRate,
          pulseRate: formData.pulseRate,
          heartSound: formData.heartSound,
          lungSound: formData.lungSound,
          giMotility: formData.giMotility,
          crt: formData.crt,
          otherFindings: formData.otherClinicalFindings,
        },
        labDirectives: {
          blood: { tests: formData.selectedBloodTests, notes: formData.bloodNotes },
          urine: { tests: formData.selectedUrineTests, notes: formData.urineNotes },
          feces: { tests: formData.selectedFecesTests, notes: formData.fecesNotes },
          nasal: { tests: formData.selectedNasalTests, notes: formData.nasalNotes },
          rumen: { tests: formData.selectedRumenTests, notes: formData.rumenNotes },
        },
      };

      const res = await fetch("/api/ai-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData: doc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      const parsed = parseAiResponse(data.diagnosis || "");
      if (parsed.length === 0) throw new Error("AI returned an unparsable response");
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
        next[sec.target] = existing ? `${existing}\n${sec.content}` : sec.content;
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

  // ---- Navigation ----
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
        "Please complete all mandatory fields marked with (*) before proceeding."
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
    setAiSections([]);
    setAiError("");
    setShowAiPanel(false);
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
      primaryTentative: "",
      differentialDiagnoses: "",
      clinicalJustification: "",
      definitiveDiagnosis: "",
      confirmationMethods: [],
      diagnosticNotes: "",
      medicines: [emptyMedicine()],
      prognosis: "",
      followUpDate: "",
      followUpInstructions: "",
    });
    if (!editId) {
      fetchNextNumber();
    }
  };

  const buildPayload = (caseNumber) => ({
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
  });

  const buildDiagnosisPayload = (caseNumber) => ({
    caseId: caseNumber,
    date: formData.date,
    veterinarian: { name: formData.by || "", licenseNumber: "" },
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

  const fetchNextAnimalId = async (species) => {
    if (!species || !species.trim()) return;
    setSpeciesFetchLoading(true);
    try {
      const res = await fetch(
        `/api/case/next-animal-id?species=${encodeURIComponent(species)}`
      );
      const data = await res.json();
      if (data.animalId) {
        setFormData((prev) => ({ ...prev, animalId: data.animalId }));
      }
    } catch (err) {
      console.error("Failed to fetch animal ID:", err);
    } finally {
      setSpeciesFetchLoading(false);
    }
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
      const finalCaseNumber = formData.caseNumber;

      const payload = buildPayload(finalCaseNumber);
      let data;
      if (editId) {
        data = await casesApi.update(editId, payload);
      } else {
        data = await casesApi.create(payload);
      }

      // Only increment the counter after a successful save
      if (!editId) {
        await fetch("/api/case/next-number?increment=true");
      }

      // If self-diagnosis: also create diagnosis and pharmacy records
      if (!editId && isSelfDiagnosis) {
        const diagPayload = buildDiagnosisPayload(finalCaseNumber);
        await diagnosisApi.create(diagPayload);

        for (const med of formData.medicines) {
          if (med.name.trim()) {
            await pharmacyApi.create({
              caseId: finalCaseNumber,
              prescriptionDate: formData.date,
              veterinarian: formData.by,
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

  const showLabDirectives =
    formData.lab &&
    formData.lab !== "diagnosis" &&
    formData.lab !== "self_diagnosis";

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
              {isSelfDiagnosis && currentStep > 7 && (
                <span className="ml-2 text-purple-700 font-bold">· SELF DX</span>
              )}
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
                : isSelfDiagnosis
                  ? "Case, diagnosis, and prescriptions have been recorded. Prescriptions are queued in the pharmacy."
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
                      onChange={(e) => handleInputChange("species", e.target.value)}
                      onBlur={(e) => {
                        if (!editId && e.target.value.trim() && !formData.animalId) {
                          fetchNextAnimalId(e.target.value);
                        }
                      }}
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
                    <label className={labelStyle}>
                      Animal ID / Tag Number
                      {speciesFetchLoading && (
                        <span className="ml-2 text-[9px] text-slate-400 font-mono">
                          (generating...)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AID-99402"
                      value={formData.animalId}
                      onChange={(e) => handleInputChange("animalId", e.target.value)}
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
                    <select
                      value={formData.demeanor}
                      onChange={(e) => handleInputChange("demeanor", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="Bright">Bright</option>
                      <option value="Dull">Dull</option>
                      <option value="Restless">Restless</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>Body Condition</label>
                    <select
                      value={formData.bcs}
                      onChange={(e) => handleInputChange("bcs", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="Normal">Normal</option>
                      <option value="Thin (Poor)">Thin (Poor)</option>
                      <option value="Emaciated">Emaciated</option>
                      <option value="Obese">Obese</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>Mucous Membrane</label>
                    <select
                      value={formData.mucousMembrane}
                      onChange={(e) => handleInputChange("mucousMembrane", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="Pale">Pale</option>
                      <option value="Pale pinkish">Pale pinkish</option>
                      <option value="Hyperemic (brick red)">Hyperemic (brick red)</option>
                      <option value="Cyanotic">Cyanotic</option>
                      <option value="Brownish">Brownish</option>
                      <option value="Jaundice">Jaundice</option>
                      <option value="Petechiae (Ecchymoses)">Petechiae (Ecchymoses)</option>
                    </select>
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
                    <label className={labelStyle}>CRT</label>
                    <select
                      value={formData.crt}
                      onChange={(e) => handleInputChange("crt", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select</option>
                      <option value="< 2 sec">&lt; 2 sec</option>
                      <option value="> 2 sec">&gt; 2 sec</option>
                    </select>
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
                    <label className={labelStyle}>Lung Sound</label>
                    <input
                      type="text"
                      placeholder="Auscultation findings"
                      value={formData.lungSound}
                      onChange={(e) =>
                        handleInputChange("lungSound", e.target.value)
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
                    Section 7: Case Routing & Directives
                  </h3>
                </div>

                <div>
                  <label className={labelStyle}>
                    Route Case To <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.lab}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleInputChange("lab", v);
                      if (v !== "self_diagnosis" && currentStep > 7) {
                        setCurrentStep(7);
                      }
                    }}
                    className={inputStyle}
                    required
                  >
                    <option value="">— Select Destination —</option>

                    <optgroup label="🅐  Send to Laboratory">
                      <option value="pathology">Pathology</option>
                      <option value="bacteriology">Bacteriology</option>
                      <option value="parasitology">Parasitology</option>
                    </optgroup>

                    <optgroup label="🅑  Refer to Doctor">
                      <option value="diagnosis">Doctor Referral</option>
                    </optgroup>

                    <optgroup label="🅒  Process Internally">
                      <option value="self_diagnosis">
                        Self Diagnosis (Continue Below)
                      </option>
                    </optgroup>
                  </select>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {formData.lab === "self_diagnosis"
                      ? "You will continue to diagnosis and prescription entry on the next stages."
                      : formData.lab === "diagnosis"
                        ? "Select a doctor below to assign this case."
                        : formData.lab
                          ? "Select lab directives below, then commit."
                          : "Choose how this case should be handled."}
                  </p>
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

            {/* === Step 8: Diagnosis (self-diagnosis only) === */}
            {currentStep === 8 && isSelfDiagnosis && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 block">
                      Self Diagnosis
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Section 8: Tentative & Definitive Diagnosis
                    </h3>
                  </div>
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
                    onChange={(e) =>
                      handleInputChange("primaryTentative", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Differential Diagnoses</label>
                  <textarea
                    rows={3}
                    placeholder="One per line..."
                    value={formData.differentialDiagnoses}
                    onChange={(e) =>
                      handleInputChange("differentialDiagnoses", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Clinical Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Supporting findings..."
                    value={formData.clinicalJustification}
                    onChange={(e) =>
                      handleInputChange("clinicalJustification", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <label className={labelStyle}>Definitive Diagnosis</label>
                  <input
                    type="text"
                    value={formData.definitiveDiagnosis}
                    onChange={(e) =>
                      handleInputChange("definitiveDiagnosis", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
                <fieldset className="border border-slate-300 p-3 space-y-2">
                  <legend className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 px-1">
                    Confirmation Methods
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {confirmationMethods.map((method) => (
                      <label
                        key={method}
                        className="flex items-center space-x-2 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.confirmationMethods.includes(method)}
                          onChange={() =>
                            handleCheckboxToggle("confirmationMethods", method)
                          }
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
                    value={formData.diagnosticNotes}
                    onChange={(e) =>
                      handleInputChange("diagnosticNotes", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* === Step 9: Prescriptions === */}
            {currentStep === 9 && isSelfDiagnosis && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 block">
                      Self Diagnosis
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Section 9: Prescriptions
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="px-2.5 py-1 border border-slate-800 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
                  >
                    + Add Medicine
                  </button>
                </div>

                {formData.medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-300 p-3 bg-slate-50/50 space-y-3"
                  >
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
                          value={med.name}
                          onChange={(e) =>
                            handleMedicineChange(idx, "name", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Concentration</label>
                        <input
                          type="text"
                          value={med.concentration}
                          onChange={(e) =>
                            handleMedicineChange(idx, "concentration", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) =>
                            handleMedicineChange(idx, "dosage", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Route</label>
                        <select
                          value={med.route}
                          onChange={(e) =>
                            handleMedicineChange(idx, "route", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleMedicineChange(idx, "frequency", e.target.value)
                          }
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
                          value={med.duration}
                          onChange={(e) =>
                            handleMedicineChange(idx, "duration", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Amount</label>
                        <input
                          type="text"
                          value={med.amount}
                          onChange={(e) =>
                            handleMedicineChange(idx, "amount", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Instructions</label>
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) =>
                            handleMedicineChange(idx, "instructions", e.target.value)
                          }
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
                {formData.weight && (
                  <div className="text-xs text-slate-500 font-mono border-t border-slate-200 pt-2">
                    Patient weight:{" "}
                    <span className="font-semibold">{formData.weight} kg</span> —
                    amount auto-calculated from concentration × dosage.
                  </div>
                )}
              </div>
            )}

            {/* === Step 10: Prognosis === */}
            {currentStep === 10 && isSelfDiagnosis && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 block">
                    Self Diagnosis
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Section 10: Prognosis & Follow-Up
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Prognosis</label>
                    <select
                      value={formData.prognosis}
                      onChange={(e) =>
                        handleInputChange("prognosis", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("followUpDate", e.target.value)
                      }
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
                    onChange={(e) =>
                      handleInputChange("followUpInstructions", e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
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
                    className={`flex-1 sm:flex-none px-5 py-2 text-white text-[10px] font-mono uppercase tracking-widest font-bold transition-colors text-center ${
                      currentStep === 7 && isSelfDiagnosis
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    {currentStep === 7 && isSelfDiagnosis
                      ? "Next: Diagnosis →"
                      : "Next Stage"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex-1 sm:flex-none px-5 py-2 text-white text-[10px] font-mono uppercase tracking-widest font-bold transition-colors text-center disabled:opacity-50 ${
                      isSelfDiagnosis
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-slate-900 hover:bg-black"
                    }`}
                  >
                    {loading
                      ? "Saving..."
                      : isSelfDiagnosis
                        ? "Commit Case + Diagnosis"
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

      {/* AI Diagnosis Panel */}
      {showAiPanel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={cancelAi}
            />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
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