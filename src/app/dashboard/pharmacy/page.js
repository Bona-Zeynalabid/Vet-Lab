"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { pharmacyApi, casesApi, diagnosisApi, medicineApi } from "@/lib/api";
import { getLoggedInUserName } from "@/lib/userUtils";
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [prescriptionTab, setPrescriptionTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [editFields, setEditFields] = useState({
    batchNumber: "",
    expiryDate: "",
    dispensedBy: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Updated medicineForm – matches the new model
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    isLiquid: false,
    pricePerMlMg: 0,      // for liquids
    price: 0,             // for solids
    dosageForm: "other",
    stockQuantity: 0,
    doseRate: "",         // new
    concentration: "",    // new
  });

  // State for modal case records with prices
  const [caseRecordsWithPrices, setCaseRecordsWithPrices] = useState([]);
  const [caseTotal, setCaseTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pharmacyData, medicineData] = await Promise.all([
        pharmacyApi.list(),
        medicineApi.list(),
      ]);
      setRecords(pharmacyData);
      setMedicines(medicineData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse quantity from amount string (e.g., "21 tablets" -> 21)
  const parseQuantity = (amountStr) => {
    if (!amountStr) return 1;
    const match = amountStr.match(/^[\d.]+/);
    if (match) return parseFloat(match[0]);
    return 1;
  };

  const handleView = async (record) => {
    try {
      setSelectedRecord(record);
      setEditFields({
        batchNumber: record.batchNumber || "",
        expiryDate: record.expiryDate
          ? new Date(record.expiryDate).toISOString().split("T")[0]
          : "",
        dispensedBy: record.dispensedBy || "",
      });

      const [caseRes, diagRes] = await Promise.all([
        casesApi.list({ caseNumber: record.caseId }),
        diagnosisApi.list({ caseId: record.caseId }),
      ]);
      setCaseData(caseRes[0] || null);
      setDiagnosisData(diagRes[0] || null);

      // Gather all prescriptions for this case
      const caseRecords = records.filter((r) => r.caseId === record.caseId);

      // Deduplicate by medicine content (not just _id)
      const seen = new Set();
      const uniqueRecords = [];
      for (const rec of caseRecords) {
        const med = rec.medicine || {};
        const key = [
          med.name || "",
          med.concentration || "",
          med.dosage || "",
          med.route || "",
          med.frequency || "",
          med.duration || "",
          med.amount || "",
          med.instructions || "",
        ].join("|");
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRecords.push(rec);
        }
      }

      const withPrices = uniqueRecords.map((rec) => {
        const medName = rec.medicine?.name || "";
        const stockItem = medicines.find(
          (m) => m.name.toLowerCase() === medName.toLowerCase()
        );
        let unitPrice = 0;
        let priceLabel = "N/A";
        if (stockItem) {
          if (stockItem.isLiquid) {
            unitPrice = stockItem.pricePerMlMg || 0;
            priceLabel = `${unitPrice} / ${stockItem.unit || "ml"}`;
          } else {
            unitPrice = stockItem.price || 0;
            priceLabel = `${unitPrice} ETB`;
          }
        }
        const quantity = parseQuantity(rec.medicine?.amount || "1");
        const total = unitPrice * quantity;
        return { ...rec, unitPrice, quantity, total, priceLabel };
      });
      const total = withPrices.reduce((sum, r) => sum + r.total, 0);
      setCaseRecordsWithPrices(withPrices);
      setCaseTotal(total);

      setShowPrescriptionModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDispense = async () => {
    setSaving(true);
    try {
      const userName = getLoggedInUserName() || editFields.dispensedBy || "Unknown";
      await pharmacyApi.update(selectedRecord._id, {
        batchNumber: editFields.batchNumber,
        expiryDate: editFields.expiryDate || undefined,
        dispensedBy: userName,
        status: "dispensed",
        dispensedDate: new Date().toISOString(),
      });

      const archiveRes = await fetch("/api/completed-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedRecord.caseId }),
      });
      if (!archiveRes.ok) {
        const errData = await archiveRes.json();
        throw new Error(errData.error || "Archive failed");
      }

      setShowPrescriptionModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicineApi.create(medicineForm);
      resetMedicineForm();
      setShowMedicineModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMedicine = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicineApi.update(editingMedicine._id, medicineForm);
      setShowEditMedicineModal(false);
      resetMedicineForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!confirm("Delete this medicine? This action cannot be undone.")) return;
    try {
      await medicineApi.delete(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetMedicineForm = () => {
    setMedicineForm({
      name: "",
      isLiquid: false,
      pricePerMlMg: 0,
      price: 0,
      dosageForm: "other",
      stockQuantity: 0,
      doseRate: "",
      concentration: "",
    });
    setEditingMedicine(null);
  };

  const openEditMedicine = (med) => {
    setEditingMedicine(med);
    setMedicineForm({
      name: med.name || "",
      isLiquid: med.isLiquid || false,
      pricePerMlMg: med.pricePerMlMg || 0,
      price: med.price || 0,
      dosageForm: med.dosageForm || "other",
      stockQuantity: med.stockQuantity || 0,
      doseRate: med.doseRate || "",
      concentration: med.concentration || "",
    });
    setShowEditMedicineModal(true);
  };

  const pending = records.filter((r) => r.status === "pending");
  const dispensed = records.filter((r) => r.status === "dispensed");
  const cancelled = records.filter((r) => r.status === "cancelled");
  const lowStock = medicines.filter((m) => (m.stockQuantity || 0) < 10);

  // ---- Group prescriptions by caseId ----
  const groupedCases = useMemo(() => {
    let filtered = [];
    if (prescriptionTab === "pending") filtered = pending;
    else if (prescriptionTab === "dispensed") filtered = dispensed;
    else filtered = cancelled;

    const groups = {};
    for (const rec of filtered) {
      const key = rec.caseId;
      if (!groups[key]) {
        groups[key] = {
          caseId: key,
          records: [],
          veterinarian: rec.veterinarian || "-",
          status: rec.status,
        };
      }
      groups[key].records.push(rec);
    }

    return Object.values(groups).map((group) => {
      let caseTotal = 0;
      const uniqueMedNames = new Set();
      for (const rec of group.records) {
        const medName = rec.medicine?.name || "";
        if (medName) uniqueMedNames.add(medName);
        const stockItem = medicines.find(
          (m) => m.name.toLowerCase() === medName.toLowerCase()
        );
        let unitPrice = 0;
        if (stockItem) {
          if (stockItem.isLiquid) {
            unitPrice = stockItem.pricePerMlMg || 0;
          } else {
            unitPrice = stockItem.price || 0;
          }
        }
        const quantity = parseQuantity(rec.medicine?.amount || "1");
        caseTotal += unitPrice * quantity;
      }
      return {
        ...group,
        medicineCount: group.records.length,
        medicineNames: Array.from(uniqueMedNames).join(", "),
        caseTotal,
        firstRecord: group.records[0],
      };
    });
  }, [records, medicines, prescriptionTab]);

  // Filter groups by search query
  const filteredGroups = groupedCases.filter((group) => {
    const q = searchQuery.toLowerCase();
    return (
      group.caseId.toLowerCase().includes(q) ||
      group.veterinarian.toLowerCase().includes(q) ||
      group.medicineNames.toLowerCase().includes(q)
    );
  });

  // ---- Filter medicines for the Medicines tab ----
  const filteredMedicines = medicines.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.dosageForm || "").toLowerCase().includes(q) ||
      (m.doseRate || "").toLowerCase().includes(q)
    );
  });

  const StatusBadge = ({ status }) => {
    const config = {
      pending: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "Pending" },
      dispensed: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", label: "Dispensed" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Cancelled" },
    };
    const { bg, text, border, label } = config[status] || config.pending;
    return (
      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border ${bg} ${text} ${border}`}>
        {label}
      </span>
    );
  };

  const KPI_Card = ({ icon: Icon, label, value, subtext, color = "slate" }) => {
    const colorMap = {
      slate: "border-slate-300 text-slate-700",
      amber: "border-amber-300 text-amber-700",
      emerald: "border-emerald-300 text-emerald-700",
      red: "border-red-300 text-red-700",
      blue: "border-blue-300 text-blue-700",
    };
    return (
      <div className="bg-white border-2 border-slate-300 p-4 shadow-xs flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">{value}</p>
          {subtext && <p className="text-[9px] font-mono text-slate-500 mt-1 truncate">{subtext}</p>}
        </div>
        <div className={`p-1.5 sm:p-2 bg-slate-100 border border-slate-300 shrink-0 ml-1 ${colorMap[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Pharmacy / Dispensing Unit
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            Pharmacy Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMedicineModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/rooms")}
            className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-100 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI_Card
          icon={ClipboardDocumentCheckIcon}
          label="Total Prescriptions"
          value={records.length}
          subtext="All records"
          color="slate"
        />
        <KPI_Card
          icon={ClockIcon}
          label="Pending"
          value={pending.length}
          subtext="Awaiting dispense"
          color="amber"
        />
        <KPI_Card
          icon={CheckCircleIcon}
          label="Dispensed"
          value={dispensed.length}
          subtext="Completed"
          color="emerald"
        />
        <KPI_Card
          icon={CubeIcon}
          label="Medicines"
          value={medicines.length}
          subtext="Formulations"
          color="blue"
        />
        <KPI_Card
          icon={ExclamationTriangleIcon}
          label="Low Stock"
          value={lowStock.length}
          subtext={`${lowStock.length} items < 10 units`}
          color="red"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono flex items-center justify-between">
          <span>[ERROR]: {error}</span>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 border-b border-slate-300 pb-2">
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
            activeTab === "prescriptions"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
          }`}
        >
          Prescriptions
        </button>
        <button
          onClick={() => setActiveTab("medicines")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
            activeTab === "medicines"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
          }`}
        >
          Medicines
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 w-full sm:max-w-xs">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder={activeTab === "prescriptions" ? "Search by case, medicine, vet..." : "Search medicines..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[10px] font-mono focus:outline-none"
        />
      </div>

      {/* Content */}
      {activeTab === "prescriptions" ? (
        <div className="bg-white border border-slate-300 p-4 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {["pending", "dispensed", "cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setPrescriptionTab(tab)}
                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
                  prescriptionTab === tab
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "pending" ? pending.length : tab === "dispensed" ? dispensed.length : cancelled.length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Loading...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 bg-slate-50">
              <p className="text-[10px] font-mono uppercase text-slate-500">
                No {prescriptionTab} cases found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono min-w-[1000px]">
                <thead className="bg-slate-800 text-white uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Case #</th>
                    <th className="p-2.5">Medicines</th>
                    <th className="p-2.5">Count</th>
                    <th className="p-2.5">Veterinarian</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Total (ETB)</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredGroups.map((group) => (
                    <tr key={group.caseId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold">{group.caseId}</td>
                      <td className="p-2.5 max-w-xs truncate" title={group.medicineNames}>
                        {group.medicineNames || "-"}
                      </td>
                      <td className="p-2.5">{group.medicineCount}</td>
                      <td className="p-2.5">{group.veterinarian}</td>
                      <td className="p-2.5"><StatusBadge status={group.status} /></td>
                      <td className="p-2.5 text-right font-bold">
                        {group.caseTotal.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleView(group.firstRecord)}
                            className="px-2.5 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            View
                          </button>
                          {group.status === "pending" && (
                            <button
                              onClick={async () => {
                                try {
                                  const userName = getLoggedInUserName() || "";
                                  for (const rec of group.records) {
                                    await pharmacyApi.update(rec._id, {
                                      status: "dispensed",
                                      dispensedDate: new Date().toISOString(),
                                      dispensedBy: userName,
                                    });
                                  }
                                  const archiveRes = await fetch("/api/completed-case", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ caseId: group.caseId }),
                                  });
                                  if (!archiveRes.ok) {
                                    const errData = await archiveRes.json();
                                    setError(errData.error || "Archive failed");
                                    return;
                                  }
                                  fetchData();
                                } catch (err) {
                                  setError(err.message);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-[9px] uppercase font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Dispense All
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Medicines Tab
        <div className="bg-white border border-slate-300 p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Loading...
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 bg-slate-50">
              <p className="text-[10px] font-mono uppercase text-slate-500">
                No medicines found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono min-w-[900px]">
                <thead className="bg-slate-800 text-white uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Form</th>
                    <th className="p-2.5">Dose Rate</th>
                    <th className="p-2.5">Concentration</th>
                    <th className="p-2.5">Price (ETB)</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredMedicines.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold">{m.name}</td>
                      <td className="p-2.5">{m.dosageForm || "-"}</td>
                      <td className="p-2.5">{m.doseRate || "-"}</td>
                      <td className="p-2.5">{m.concentration || "-"}</td>
                      <td className="p-2.5">
                        {m.isLiquid
                          ? `${m.pricePerMlMg || 0} / ml`
                          : `${m.price || 0}`}
                      </td>
                      <td className="p-2.5">
                        <span className={`${m.stockQuantity < 10 ? "text-red-600 font-bold" : ""}`}>
                          {m.stockQuantity || 0}
                        </span>
                        {m.stockQuantity < 10 && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-300 text-[8px] uppercase font-bold">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditMedicine(m)}
                            className="p-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(m._id)}
                            className="p-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Prescription Detail Modal (unchanged) */}
      {showPrescriptionModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPrescriptionModal(false)} />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                    Prescription Detail
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-3">
                    Case #{selectedRecord.caseId}
                    <span className="text-emerald-300 text-xs font-mono">
                      Total: {caseTotal.toFixed(2)} ETB
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-3 py-1 border border-white text-white text-[10px] font-mono uppercase hover:bg-white hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Patient & Case */}
                {caseData && (
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] font-mono">
                      <div><span className="text-slate-500">Owner:</span> <span className="font-semibold">{caseData.owner?.fullName || "-"}</span></div>
                      <div><span className="text-slate-500">Species:</span> <span className="font-semibold">{caseData.patient?.species || "-"}</span></div>
                      <div><span className="text-slate-500">Breed:</span> <span className="font-semibold">{caseData.patient?.breed || "-"}</span></div>
                      <div><span className="text-slate-500">Weight:</span> <span className="font-semibold">{caseData.patient?.weight ? `${caseData.patient.weight} KG` : "-"}</span></div>
                      <div><span className="text-slate-500">Sex:</span> <span className="font-semibold">{caseData.patient?.sex || "-"}</span></div>
                      <div><span className="text-slate-500">Age:</span> <span className="font-semibold">{caseData.patient?.age || "-"}</span></div>
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                {diagnosisData && (
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                      Diagnosis
                    </h3>
                    <div className="text-[10px] font-mono space-y-0.5">
                      <div><span className="text-slate-500">Tentative:</span> <span className="font-semibold">{diagnosisData.tentativeDiagnosis?.primary || "-"}</span></div>
                      <div><span className="text-slate-500">Definitive:</span> <span className="font-semibold">{diagnosisData.definitiveDiagnosis?.finalDiagnosis || "-"}</span></div>
                      <div><span className="text-slate-500">Prognosis:</span> <span className="font-semibold">{diagnosisData.prognosis || "-"}</span></div>
                    </div>
                  </div>
                )}

                {/* Prescription Table – All Medicines for the Case */}
                <div className="border-2 border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
                    All Prescriptions for this Case
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead className="bg-slate-200 text-slate-800 uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5">Medicine</th>
                          <th className="p-2.5">Concentration</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Route</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Amount</th>
                          <th className="p-2.5">Unit Price</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {caseRecordsWithPrices.map((rec) => (
                          <tr key={rec._id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-semibold">{rec.medicine?.name || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.concentration || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.dosage || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.route || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.frequency || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.duration || "-"}</td>
                            <td className="p-2.5">{rec.medicine?.amount || "-"}</td>
                            <td className="p-2.5">{rec.priceLabel}</td>
                            <td className="p-2.5 text-right font-bold">
                              {rec.total > 0 ? `${rec.total.toFixed(2)} ETB` : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan="8" className="p-2.5 text-right font-bold uppercase text-slate-800">
                            Case Total:
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {caseTotal.toFixed(2)} ETB
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Dispensing Details (unchanged) */}
                <div className="border border-slate-300 p-3 space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                    Dispensing Details {selectedRecord.status === "dispensed" ? "(Completed)" : ""}
                  </h3>
                  {selectedRecord.status === "pending" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Batch Number</label>
                        <input
                          type="text"
                          value={editFields.batchNumber}
                          onChange={(e) => setEditFields((prev) => ({ ...prev, batchNumber: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={editFields.expiryDate}
                          onChange={(e) => setEditFields((prev) => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dispensed By</label>
                        <input
                          type="text"
                          placeholder="Pharmacist name"
                          value={editFields.dispensedBy}
                          onChange={(e) => setEditFields((prev) => ({ ...prev, dispensedBy: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] font-mono">
                      <div><span className="text-slate-500">Batch:</span> <span className="font-semibold">{selectedRecord.batchNumber || "-"}</span></div>
                      <div><span className="text-slate-500">Expiry:</span> <span className="font-semibold">{selectedRecord.expiryDate ? new Date(selectedRecord.expiryDate).toLocaleDateString() : "-"}</span></div>
                      <div><span className="text-slate-500">Dispensed By:</span> <span className="font-semibold">{selectedRecord.dispensedBy || "-"}</span></div>
                      <div><span className="text-slate-500">Dispensed Date:</span> <span className="font-semibold">{selectedRecord.dispensedDate ? new Date(selectedRecord.dispensedDate).toLocaleString() : "-"}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                  {selectedRecord.status === "pending" && (
                    <button
                      onClick={handleDispense}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Saving..." : "Save & Dispense"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal – updated */}
      {showMedicineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMedicineModal(false)} />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-tight text-slate-900">
                  Add Medicine
                </h3>
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="px-3 py-1 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddMedicine} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={medicineForm.name}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="e.g., Amoxicillin 500mg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={medicineForm.dosageForm}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, dosageForm: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="ointment">Ointment</option>
                    <option value="cream">Cream</option>
                    <option value="drops">Drops</option>
                    <option value="suspension">Suspension</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={medicineForm.isLiquid}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, isLiquid: e.target.checked }))}
                    className="w-4 h-4 rounded-none border-slate-400 focus:ring-slate-800"
                  />
                  <label className="text-[10px] font-mono font-semibold uppercase">Liquid form</label>
                </div>

                {medicineForm.isLiquid ? (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Price per ml/mg (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={medicineForm.pricePerMlMg}
                      onChange={(e) => setMedicineForm(prev => ({ ...prev, pricePerMlMg: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={medicineForm.price}
                      onChange={(e) => setMedicineForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={medicineForm.stockQuantity}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dose Rate</label>
                  <input
                    type="text"
                    placeholder="e.g., 10 mg/kg"
                    value={medicineForm.doseRate}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, doseRate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Concentration</label>
                  <input
                    type="text"
                    placeholder="e.g., 250 mg/mL"
                    value={medicineForm.concentration}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, concentration: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setShowMedicineModal(false)} className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] uppercase font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-800 text-white text-[10px] uppercase font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors">
                    {saving ? "Saving..." : "Save Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal – updated */}
      {showEditMedicineModal && editingMedicine && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditMedicineModal(false)} />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-tight text-slate-900">
                  Edit Medicine
                </h3>
                <button
                  onClick={() => setShowEditMedicineModal(false)}
                  className="px-3 py-1 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleEditMedicine} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={medicineForm.name}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={medicineForm.dosageForm}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, dosageForm: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="ointment">Ointment</option>
                    <option value="cream">Cream</option>
                    <option value="drops">Drops</option>
                    <option value="suspension">Suspension</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={medicineForm.isLiquid}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, isLiquid: e.target.checked }))}
                    className="w-4 h-4 rounded-none border-slate-400 focus:ring-slate-800"
                  />
                  <label className="text-[10px] font-mono font-semibold uppercase">Liquid form</label>
                </div>

                {medicineForm.isLiquid ? (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Price per ml/mg (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={medicineForm.pricePerMlMg}
                      onChange={(e) => setMedicineForm(prev => ({ ...prev, pricePerMlMg: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={medicineForm.price}
                      onChange={(e) => setMedicineForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={medicineForm.stockQuantity}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dose Rate</label>
                  <input
                    type="text"
                    placeholder="e.g., 10 mg/kg"
                    value={medicineForm.doseRate}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, doseRate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Concentration</label>
                  <input
                    type="text"
                    placeholder="e.g., 250 mg/mL"
                    value={medicineForm.concentration}
                    onChange={(e) => setMedicineForm(prev => ({ ...prev, concentration: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setShowEditMedicineModal(false)} className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] uppercase font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-800 text-white text-[10px] uppercase font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors">
                    {saving ? "Saving..." : "Update Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}