"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="bg-white border-2 border-slate-800 p-8 max-w-md w-full shadow-xs text-center">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
          Error 404
        </span>
        <h1 className="text-3xl font-mono font-bold text-slate-900 mt-2 mb-4">
          Page Not Found
        </h1>
        <p className="text-xs font-mono text-slate-600 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2 bg-slate-900 text-white text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}