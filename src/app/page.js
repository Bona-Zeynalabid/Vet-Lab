"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const handleAuthClick = (e, target) => {
    e.preventDefault();
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('vet_user='));
    if (cookie) {
      router.push('/dashboard');
    } else {
      router.push(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 relative overflow-hidden">
      {/* Background Logos */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]">
        <Image
          src="/assets/Screenshot 2025-12-18 091949.png"
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-multiply">
        <Image
          src="/assets/blogo.png"
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur border-b border-slate-300 px-4 py-3 flex items-center justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/Screenshot 2025-12-18 091949.png"
              alt="University Logo"
              width={40}
              height={40}
              className="object-contain"
              unoptimized
              priority
            />
            <Image
              src="/assets/blogo.png"
              alt="Brook Logo"
              width={40}
              height={40}
              className="object-contain"
              unoptimized
              priority
            />
            <span className="font-mono uppercase tracking-widest text-sm font-bold">
              Hawassa University FVM
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => handleAuthClick(e, '/login')}
              className="px-5 py-2 bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <span className="inline-block px-3 py-1 bg-white/80 border border-slate-300 text-slate-700 text-[10px] font-mono uppercase tracking-widest mb-5">
            Veterinary Clinical System
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-slate-900 leading-tight">
            Complete Clinical Workflow
          </h1>
          <p className="mt-5 text-sm sm:text-base text-slate-600 font-mono max-w-2xl mx-auto">
            Case registration, laboratory diagnostics, diagnosis, and pharmacy dispensing in one unified platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={(e) => handleAuthClick(e, '/login')}
              className="px-8 py-3 bg-slate-900 text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={(e) => handleAuthClick(e, '/register')}
              className="px-8 py-3 border border-slate-400 text-slate-700 text-xs font-mono uppercase tracking-widest font-bold hover:bg-white transition-colors"
            >
              Create Account
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { num: "01", title: "Case Registration", desc: "Capture patient history, vitals, and lab directives." },
            { num: "02", title: "Laboratory", desc: "Pathology, Bacteriology, and Parasitology reporting." },
            { num: "03", title: "Diagnosis", desc: "Tentative and definitive diagnosis with treatment plans." },
            { num: "04", title: "Pharmacy", desc: "Prescription tracking and dispensing with accountability." },
          ].map((feature) => (
            <div
              key={feature.num}
              className="bg-white/90 backdrop-blur border border-slate-300 p-6 hover:border-slate-800 transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                {feature.num}
              </div>
              <h3 className="mt-4 font-bold uppercase text-sm tracking-wider">{feature.title}</h3>
              <p className="mt-2 text-[10px] font-mono text-slate-600 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="bg-slate-900 text-white py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-center">
              How It Works
            </h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Register Case", desc: "Assign lab or direct diagnosis." },
                { step: "02", title: "Process Lab", desc: "Fill findings and send to doctor." },
                { step: "03", title: "Diagnose & Treat", desc: "Doctor diagnoses, pharmacy dispenses." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-4xl font-mono font-bold text-emerald-400">{item.step}</div>
                  <h3 className="mt-2 font-bold uppercase text-sm tracking-wider">{item.title}</h3>
                  <p className="mt-2 text-[10px] font-mono text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">
            Ready to streamline your clinic?
          </h2>
          <p className="mt-3 text-xs font-mono text-slate-600">
            Join veterinary professionals using Hawassa University FVM Clinical System.
          </p>
          <div className="mt-6">
            <button
              onClick={(e) => handleAuthClick(e, '/login')}
              className="px-8 py-3 bg-slate-900 text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-black transition-colors"
            >
              Start Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-300 bg-white/80 backdrop-blur px-4 py-5 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            &copy; {new Date().getFullYear()} Hawassa University FVM. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}