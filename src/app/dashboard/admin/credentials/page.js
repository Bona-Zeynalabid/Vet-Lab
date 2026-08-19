"use client";

import { useState, useEffect } from "react";
import { credentialApi } from "@/lib/api";
import {
  KeyIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const roleOptions = [
  { value: "case_registration", label: "Case Registration" },
  { value: "pathology", label: "Pathology Lab" },
  { value: "bacteriology", label: "Bacteriology Lab" },
  { value: "parasitology", label: "Parasitology Lab" },
  { value: "diagnosis_petdoc", label: "Diagnosis - Pet Doctor" },
  { value: "diagnosis_largedoc", label: "Diagnosis - Large Animal Doctor" },
  { value: "diagnosis_equinedoc", label: "Diagnosis - Equine Specialist" },
  { value: "pharmacy", label: "Pharmacy" },
];

export default function AdminCredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ role: "", pin: "", label: "" });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await credentialApi.list();
      setCredentials(data || []);
    } catch (err) {
      setError(err.message || "Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (cred) => {
    setEditingId(cred._id || cred.id);
    setFormData({
      role: cred.role || "",
      pin: cred.pin || "",
      label: cred.label || "",
    });
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ role: "", pin: "", label: "" });
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.role || !formData.pin || !formData.label) {
      setError("All fields (Role, PIN, and Label) are required.");
      return;
    }
    if (formData.pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (editingId) {
        await credentialApi.update(editingId, formData);
        setSuccess("Credential successfully updated.");
      } else {
        await credentialApi.create(formData);
        setSuccess("New access credential generated.");
      }
      handleCancelEdit();
      fetchCredentials();
    } catch (err) {
      setError(err.message || "Failed to save credential.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to revoke and delete this station PIN?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await credentialApi.delete(id);
      setSuccess("Credential revoked successfully.");
      fetchCredentials();
    } catch (err) {
      setError(err.message || "Failed to delete credential.");
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400";

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Page Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
           
            
          </div>
          <h1 className="text-2xl font-extrabold uppercase font-mono text-slate-900 tracking-tight flex items-center gap-2.5 mt-0.5">
            <ShieldCheckIcon className="w-7 h-7 text-slate-800" />
            <span>Station PIN Credentials</span>
          </h1>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Audit Trail Active • 6-Digit PIN Security
        </div>
      </div>

      {/* Action Banners */}
      {error && (
        <div className="p-3.5 border-l-4 border-red-600 bg-red-50 text-red-900 text-xs font-mono font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
            <span>[SECURITY ERROR]: {error}</span>
          </div>
          <button onClick={() => setError("")} className="hover:text-black">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 border-l-4 border-emerald-600 bg-emerald-50 text-emerald-900 text-xs font-mono font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>[SUCCESS]: {success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="hover:text-black">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="border-b pb-3 mb-4 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-slate-700" />
            <span>{editingId ? "Update Station Credential" : "Generate New Station PIN"}</span>
          </h3>
         
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Station Role Selection */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                Target Station / Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className={inputStyle}
                required
              >
                <option value="">Select Station Role...</option>
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Credential Station Label */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                Station Terminal Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange("label", e.target.value)}
                className={inputStyle}
                placeholder="e.g. Main Lab Desk 01"
                required
              />
            </div>

            {/* 6-Digit Station Security PIN */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                6-Digit Access PIN *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.pin}
                  onChange={(e) =>
                    handleInputChange("pin", e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={`${inputStyle} tracking-widest font-extrabold pr-8`}
                  placeholder="••••••"
                  required
                />
                <LockClosedIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-[10px] font-mono uppercase font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[10px] font-mono uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : editingId ? (
                <>
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  <span>Update Credential</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Save Credential</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Station Credentials Table */}
      <div className="bg-white border-2 border-slate-300 p-5 shadow-xs">
        <div className="border-b pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Active Station Security Keys
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Authorized hardware PIN access credentials across clinical rooms
            </p>
          </div>
          <button
            onClick={fetchCredentials}
            className="p-1.5 border border-slate-300 hover:border-slate-800 bg-slate-50 text-slate-700 hover:text-black transition-colors"
            title="Refresh Table"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 font-mono text-slate-500">
            <ArrowPathIcon className="w-6 h-6 animate-spin mb-2 text-slate-800" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Loading Credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-10 font-mono border-2 border-dashed border-slate-200">
            <KeyIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase text-slate-600">No Credentials Configured</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Use the form above to add station security PINs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-bold border-b border-slate-900">Station Role</th>
                  <th className="p-3 font-bold border-b border-slate-900">Terminal Label</th>
                  <th className="p-3 font-bold border-b border-slate-900">Security PIN</th>
                  <th className="p-3 font-bold border-b border-slate-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {credentials.map((cred) => {
                  const id = cred._id || cred.id;
                  const isEditing = editingId === id;
                  const roleObj = roleOptions.find((r) => r.value === cred.role);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isEditing ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-slate-800 rounded-full shrink-0" />
                          <span>{roleObj ? roleObj.label : cred.role}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">{cred.label || "—"}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-300 text-slate-900 font-extrabold tracking-widest text-[11px]">
                          {cred.pin}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(cred)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                            title="Edit Credential"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Credential"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
          <span>Total Records: {credentials.length}</span>
          <span>Access Security: Enforced</span>
        </div>
      </div>

    </div>
  );
}