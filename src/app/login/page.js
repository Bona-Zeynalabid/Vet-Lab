"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Load the Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize the Google Sign-In button
  useEffect(() => {
    if (!googleScriptLoaded || typeof window.google === "undefined") return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleButton"),
      { theme: "outline", size: "large" }
    );
  }, [googleScriptLoaded]);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError("");
    try {
      const result = await authApi.verifyGoogleToken(response.credential);

      if (result.exists) {
        // Store user in session storage
        sessionStorage.setItem("vet_user", JSON.stringify(result.user));
        router.push("/dashboard");
      } else {
        // New user – redirect to registration with Google data
        sessionStorage.setItem(
          "google_registration",
          JSON.stringify(result.googleData)
        );
        router.push("/register");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center font-sans text-slate-900">
      <div className="bg-white border-2 border-slate-800 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-lg">
        <div className="border-b-2 border-slate-800 pb-4">
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            Sign in with your Google account
          </p>
        </div>

        {error && (
          <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono">
            [AUTH ERROR]: {error}
          </div>
        )}

        <div className="flex justify-center">
          <div id="googleButton"></div>
        </div>

        {loading && (
          <p className="text-center text-[10px] font-mono uppercase text-slate-500">
            Verifying...
          </p>
        )}
      </div>
    </div>
  );
}