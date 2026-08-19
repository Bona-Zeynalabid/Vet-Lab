import { Suspense } from "react";
import CaseContent from "./CaseContent";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Loading Form...</p>
        </div>
      </div>
    }>
      <CaseContent />
    </Suspense>
  );
}