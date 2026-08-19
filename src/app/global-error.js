"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
          <div className="bg-white border-2 border-slate-800 p-8 max-w-md w-full shadow-xs text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600">
              Critical Error
            </span>
            <h1 className="text-xl font-mono font-bold text-slate-900 mt-2 mb-4">
              Something went terribly wrong
            </h1>
            <p className="text-xs font-mono text-slate-600 mb-6">
              {error?.message || "Please try again later."}
            </p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-slate-900 text-white text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}