"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    student: false,
    idNumber: "",
  });
  const [googleData, setGoogleData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("google_registration");
    if (data) {
      setGoogleData(JSON.parse(data));
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setError("First and last name are required.");
      return;
    }
    if (formData.student && !formData.idNumber) {
      setError("ID number is required for students.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await userApi.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: googleData.email,
        googleId: googleData.googleId,
        student: formData.student,
        idNumber: formData.student ? formData.idNumber : null,
        role: "ordinary",
      });

      sessionStorage.removeItem("google_registration");
      sessionStorage.setItem("vet_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800";

  if (!googleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center font-sans text-slate-900">
      <div className="bg-white border-2 border-slate-800 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-lg">
        <div className="border-b-2 border-slate-800 pb-4">
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
            Complete Your Profile
          </h1>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            We need a few more details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className={inputStyle}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className={inputStyle}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.student}
              onChange={(e) => handleInputChange("student", e.target.checked)}
              className="rounded-none border-slate-400"
            />
            <label className="text-xs font-semibold text-slate-700">
              I am a student
            </label>
          </div>

          {formData.student && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-700 mb-1">
                Student ID Number
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => handleInputChange("idNumber", e.target.value)}
                className={inputStyle}
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
              [REGISTRATION ERROR]: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-900 text-white text-xs uppercase tracking-widest font-bold hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}