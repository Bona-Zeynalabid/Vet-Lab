"use client";

import { useState, useEffect } from "react";
import { credentialApi } from "@/lib/api";

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
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    role: "",
    pin: "",
    label: "",
    route: "",
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const data = await credentialApi.list();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (cred) => {
    setEditingId(cred._id);
    setFormData({
      role: cred.role,
      pin: cred.pin,
      label: cred.label,
      route: cred.route,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ role: "", pin: "", label: "", route: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.role || !formData.pin || !formData.label || !formData.route) {
      setError("All fields are required.");
      return;
    }
    if (formData.pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    setError("");
    try {
      if (editingId) {
        await credentialApi.update(editingId, formData);
      } else {
        await credentialApi.create(formData);
      }
      handleCancelEdit();
      fetchCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this credential?")) return;
    try {
      await credentialApi.delete(id);
      fetchCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2 text-[10px] font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800";

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-slate-800 pb-3">
        <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
          Credential Management
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-300 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-800">
          {editingId ? "Edit Credential" : "Add New Credential"}
        </h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">Select Role</option>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-700 mb-1">
              PIN (6 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={formData.pin}
              onChange={(e) =>
                handleInputChange("pin", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={inputStyle}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              className={inputStyle}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-700 mb-1">
              Route
            </label>
            <input
              type="text"
              value={formData.route}
              onChange={(e) => handleInputChange("route", e.target.value)}
              className={inputStyle}
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white text-[10px] uppercase font-bold hover:bg-slate-700"
            >
              {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] uppercase font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
          [ERROR]: {error}
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-slate-300 p-4">
        {loading ? (
          <p className="text-center py-6 text-[10px] font-mono uppercase text-slate-500">
            Loading...
          </p>
        ) : credentials.length === 0 ? (
          <p className="text-center py-6 text-[10px] font-mono uppercase text-slate-500">
            No credentials found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono">
              <thead className="bg-slate-800 text-white uppercase">
                <tr>
                  <th className="p-2">Role</th>
                  <th className="p-2">Label</th>
                  <th className="p-2">PIN</th>
                  <th className="p-2">Route</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {credentials.map((cred) => (
                  <tr key={cred._id} className="hover:bg-slate-50">
                    <td className="p-2 font-semibold">{cred.role}</td>
                    <td className="p-2">{cred.label}</td>
                    <td className="p-2">{cred.pin}</td>
                    <td className="p-2">{cred.route}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(cred)}
                          className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cred._id)}
                          className="px-2 py-1 border border-red-300 text-red-700 text-[9px] uppercase hover:bg-red-50"
                        >
                          Delete
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
    </div>
  );
}