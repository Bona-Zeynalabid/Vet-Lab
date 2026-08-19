"use client";

import { useState } from "react";

export default function PharmacyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 3;

  const [formData, setFormData] = useState({
    // Stage 1: Identification & Product Particulars
    patientId: "",
    caseNumber: "",
    medicineName: "",
    concentration: "",

    // Stage 2: Posology & Dispensing Protocol
    dosage: "",
    route: "",
    frequency: "",
    duration: "",

    // Stage 3: Inventory & Sign-off
    amount: "",
    batchNumber: "",
    dispensedBy: "",
    specialInstructions: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.patientId.trim() !== "" &&
          formData.medicineName.trim() !== ""
        );
      case 2:
        return formData.route.trim() !== "" && formData.frequency.trim() !== "";
      case 3:
        return formData.amount.trim() !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setError("Mandatory clinical fields marked with (*) must be completed.");
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
    setFormData({
      patientId: "",
      caseNumber: "",
      medicineName: "",
      concentration: "",
      dosage: "",
      route: "",
      frequency: "",
      duration: "",
      amount: "",
      batchNumber: "",
      dispensedBy: "",
      specialInstructions: "",
    });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isCurrentStepValid()) {
      setError("System validation failed. Verify mandatory inputs before committing.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono";

  const labelStyle =
    "block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
              Pharmaceutical Services / Module Rx-01
            </span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Prescription & Dispensing Record
            </h1>
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
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                Dispensing Ledger Committed
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-mono break-all">
                PATIENT: {formData.patientId} | AGENT: {formData.medicineName} ({formData.amount}) | STAMP: {new Date().toISOString()}
              </p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
              The pharmaceutical record has been validated and committed to the pharmacy information ledger. Inventory levels have been updated accordingly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white text-xs uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
              >
                Issue New Order
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Step Progress Bar */}
            <div className="w-full bg-slate-200 h-1">
              <div
                className="bg-slate-800 h-full transition-all duration-200"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {/* STAGE 1: Identification & Product Particulars */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 1: Identification & Product Particulars
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Patient ID <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AID-12345"
                      value={formData.patientId}
                      onChange={(e) => handleInputChange("patientId", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Case Number</label>
                    <input
                      type="text"
                      placeholder="e.g. VET-2026-001"
                      value={formData.caseNumber}
                      onChange={(e) => handleInputChange("caseNumber", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className={labelStyle}>
                      Medicine Name / Agent <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin"
                      value={formData.medicineName}
                      onChange={(e) => handleInputChange("medicineName", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Concentration / Strength</label>
                    <input
                      type="text"
                      placeholder="e.g. 250 mg/mL, 500mg tablet"
                      value={formData.concentration}
                      onChange={(e) => handleInputChange("concentration", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: Posology & Administration Protocol */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 2: Posology & Administration Protocol
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Calculated Dosage Rate</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 mg/kg BID for 7 days"
                      value={formData.dosage}
                      onChange={(e) => handleInputChange("dosage", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Administration Route <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.route}
                      onChange={(e) => handleInputChange("route", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select Route</option>
                      <option value="oral">Oral (PO)</option>
                      <option value="subcutaneous">Subcutaneous (SC)</option>
                      <option value="intramuscular">Intramuscular (IM)</option>
                      <option value="intravenous">Intravenous (IV)</option>
                      <option value="topical">Topical</option>
                      <option value="otic">Otic (Ear)</option>
                      <option value="ophthalmic">Ophthalmic (Eye)</option>
                      <option value="intramammary">Intramammary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Frequency Interval <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => handleInputChange("frequency", e.target.value)}
                      className={inputStyle}
                    >
                      <option value="">Select Frequency</option>
                      <option value="once">Once (Stat)</option>
                      <option value="bid">BID (Twice daily)</option>
                      <option value="tid">TID (Three times daily)</option>
                      <option value="qid">QID (Four times daily)</option>
                      <option value="every_8h">Every 8 hours</option>
                      <option value="every_12h">Every 12 hours</option>
                      <option value="once_daily">Once daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Treatment Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days, 2 weeks"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: Inventory Control & Sign-Off */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Stage 3: Inventory Control & Dispensing Sign-off
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Quantity Dispensed <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 21 tablets, 100 mL"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Batch / Lot Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-2026-X9"
                      value={formData.batchNumber}
                      onChange={(e) => handleInputChange("batchNumber", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Dispensing Pharmacist / Clinician</label>
                    <input
                      type="text"
                      placeholder="Name or License ID"
                      value={formData.dispensedBy}
                      onChange={(e) => handleInputChange("dispensedBy", e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Special Instructions & Precautions</label>
                  <textarea
                    rows={4}
                    placeholder="Document withdrawal periods, storage directives, or administration precautions..."
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Validation Error Banner */}
            {error && (
              <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
                [SYSTEM VALIDATION ERROR]: {error}
              </div>
            )}

            {/* Navigation / Action Deck */}
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
                    className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors text-center"
                  >
                    Commit Order
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