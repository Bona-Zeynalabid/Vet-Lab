"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to the console (or send to your logging service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="bg-white border-2 border-slate-800 p-8 max-w-md w-full shadow-xs text-center">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600">
          Error
        </span>
        <h1 className="text-2xl font-mono font-bold text-slate-900 mt-2 mb-4">
          Something went wrong
        </h1>
        <p className="text-xs font-mono text-slate-600 mb-2">
          {error?.message || "An unexpected error occurred."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-2 bg-slate-900 text-white text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2 border border-slate-800 text-slate-800 text-xs font-mono uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}