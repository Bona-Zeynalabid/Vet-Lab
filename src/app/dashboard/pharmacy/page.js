"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { pharmacyApi, casesApi, diagnosisApi } from "@/lib/api";

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editFields, setEditFields] = useState({ batchNumber: "", expiryDate: "", dispensedBy: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await pharmacyApi.list();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    try {
      setSelectedRecord(record);
      setEditFields({
        batchNumber: record.batchNumber || "",
        expiryDate: record.expiryDate ? new Date(record.expiryDate).toISOString().split("T")[0] : "",
        dispensedBy: record.dispensedBy || "",
      });

      const [caseRes, diagRes] = await Promise.all([
        casesApi.list({ caseNumber: record.caseId }),
        diagnosisApi.list({ caseId: record.caseId }),
      ]);
      setCaseData(caseRes[0] || null);
      setDiagnosisData(diagRes[0] || null);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDispense = async () => {
    setSaving(true);
    try {
      await pharmacyApi.update(selectedRecord._id, {
        batchNumber: editFields.batchNumber,
        expiryDate: editFields.expiryDate || undefined,
        dispensedBy: editFields.dispensedBy,
        status: "dispensed",
        dispensedDate: new Date().toISOString(),
      });
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pending = records.filter(r => r.status === "pending");
  const dispensed = records.filter(r => r.status === "dispensed");
  const cancelled = records.filter(r => r.status === "cancelled");

  const display = activeTab === "pending" ? pending : activeTab === "dispensed" ? dispensed : cancelled;

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Pharmacy / Dispensing Unit</span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">Pharmacy Dashboard</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-300 p-4 space-y-4">
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          {["pending", "dispensed", "cancelled"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
                activeTab === tab ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "pending" ? pending.length : tab === "dispensed" ? dispensed.length : cancelled.length})
            </button>
          ))}
        </div>

        {error && <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">[ERROR]: {error}</div>}

        {loading ? (
          <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">Loading...</div>
        ) : display.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-300"><p className="text-[10px] font-mono uppercase text-slate-500">No {activeTab} prescriptions</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono min-w-[900px]">
              <thead className="bg-slate-800 text-white uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Case #</th>
                  <th className="p-2.5">Medicine</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Route</th>
                  <th className="p-2.5">Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Veterinarian</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {display.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold">{r.caseId}</td>
                    <td className="p-2.5">{r.medicine?.name || "-"}</td>
                    <td className="p-2.5">{r.medicine?.dosage || "-"}</td>
                    <td className="p-2.5">{r.medicine?.route || "-"}</td>
                    <td className="p-2.5">{r.medicine?.frequency || "-"}</td>
                    <td className="p-2.5">{r.medicine?.duration || "-"}</td>
                    <td className="p-2.5">{r.veterinarian || "-"}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 uppercase border ${
                        r.status === "dispensed" ? "bg-green-50 text-green-800 border-green-300" :
                        r.status === "cancelled" ? "bg-red-50 text-red-800 border-red-300" :
                        "bg-yellow-50 text-yellow-800 border-yellow-300"
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => handleView(r)} className="px-2 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase hover:bg-slate-100">View</button>
                        {r.status === "pending" && (
                          <button onClick={async () => { await pharmacyApi.update(r._id, { status: "dispensed", dispensedDate: new Date().toISOString() }); fetchRecords(); }} className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase hover:bg-slate-700">Dispense</button>
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

      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">Prescription Detail</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider">{selectedRecord.prescriptionNumber || selectedRecord.caseId}</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="px-3 py-1 border border-white text-white text-[10px] font-mono uppercase hover:bg-white hover:text-slate-900">Close</button>
              </div>

              <div className="p-4 space-y-4">
                {/* Case Info */}
                {caseData && (
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div><span className="text-slate-500">Owner:</span> <span className="font-semibold">{caseData.owner?.fullName || "-"}</span></div>
                      <div><span className="text-slate-500">Species:</span> <span className="font-semibold">{caseData.patient?.species || "-"}</span></div>
                      <div><span className="text-slate-500">Breed:</span> <span className="font-semibold">{caseData.patient?.breed || "-"}</span></div>
                      <div><span className="text-slate-500">Weight:</span> <span className="font-semibold">{caseData.patient?.weight ? `${caseData.patient.weight} KG` : "-"}</span></div>
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                {diagnosisData && (
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Diagnosis</h3>
                    <div className="text-[10px] font-mono space-y-0.5">
                      <div><span className="text-slate-500">Tentative:</span> <span className="font-semibold">{diagnosisData.tentativeDiagnosis?.primary || "-"}</span></div>
                      <div><span className="text-slate-500">Definitive:</span> <span className="font-semibold">{diagnosisData.definitiveDiagnosis?.finalDiagnosis || "-"}</span></div>
                      <div><span className="text-slate-500">Prognosis:</span> <span className="font-semibold">{diagnosisData.prognosis || "-"}</span></div>
                    </div>
                  </div>
                )}

                {/* Prescription Details */}
                <div className="border-2 border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">Prescription</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
                    <div><span className="text-slate-500">Medicine:</span> <span className="font-semibold">{selectedRecord.medicine?.name || "-"}</span></div>
                    <div><span className="text-slate-500">Concentration:</span> <span className="font-semibold">{selectedRecord.medicine?.concentration || "-"}</span></div>
                    <div><span className="text-slate-500">Dosage:</span> <span className="font-semibold">{selectedRecord.medicine?.dosage || "-"}</span></div>
                    <div><span className="text-slate-500">Route:</span> <span className="font-semibold">{selectedRecord.medicine?.route || "-"}</span></div>
                    <div><span className="text-slate-500">Frequency:</span> <span className="font-semibold">{selectedRecord.medicine?.frequency || "-"}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="font-semibold">{selectedRecord.medicine?.duration || "-"}</span></div>
                    <div><span className="text-slate-500">Amount:</span> <span className="font-semibold">{selectedRecord.medicine?.amount || "-"}</span></div>
                    <div><span className="text-slate-500">Instructions:</span> <span className="font-semibold">{selectedRecord.medicine?.instructions || "-"}</span></div>
                    <div><span className="text-slate-500">Veterinarian:</span> <span className="font-semibold">{selectedRecord.veterinarian || "-"}</span></div>
                    <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{selectedRecord.prescriptionDate ? new Date(selectedRecord.prescriptionDate).toLocaleDateString() : "-"}</span></div>
                  </div>
                </div>

                {/* Dispensing Fields */}
                <div className="border border-slate-300 p-3 space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Dispensing Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Batch Number</label>
                      <input type="text" value={editFields.batchNumber} onChange={e => setEditFields(prev => ({ ...prev, batchNumber: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Expiry Date</label>
                      <input type="date" value={editFields.expiryDate} onChange={e => setEditFields(prev => ({ ...prev, expiryDate: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-700 mb-1">Dispensed By</label>
                      <input type="text" placeholder="Pharmacist name" value={editFields.dispensedBy} onChange={e => setEditFields(prev => ({ ...prev, dispensedBy: e.target.value }))} className="w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100">Close</button>
                  {selectedRecord.status === "pending" && (
                    <button onClick={handleDispense} disabled={saving} className="px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase font-bold hover:bg-slate-700 disabled:opacity-50">
                      {saving ? "Saving..." : "Save & Dispense"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}