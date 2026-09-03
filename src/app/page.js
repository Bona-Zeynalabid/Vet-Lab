"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const handleAuthClick = (e, target) => {
    e.preventDefault();
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("vet_user="));
    if (cookie) {
      router.push("/dashboard");
    } else {
      router.push(target);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] overflow-hidden">

      {/* === HERO SECTION === */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#1a1a1a]">
        
        {/* Dominant blogo.png – huge, centered, subtle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[90%] max-w-4xl aspect-square opacity-20 md:opacity-30">
            <Image
              src="/assets/blogo.png"
              alt="Brooke Logo"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Orange glow accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content overlay */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Small badge */}
          <div className="inline-block px-4 py-1.5 border border-orange-500/30 text-orange-400 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full mb-6 bg-orange-500/10 backdrop-blur-sm">
            Veterinary Clinical System
          </div>

          {/* Main headline – HU-Brooke VetTrack */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-tight">
            <span className="text-white">HU-Brooke</span>
            <span className="text-orange-500 block sm:inline"> VetTrack</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-white/70 font-mono max-w-2xl mx-auto bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
            Complete clinical management — case registration, lab diagnostics, diagnosis, and pharmacy.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={(e) => handleAuthClick(e, "/login")}
              className="px-8 py-3.5 bg-orange-500 text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-600 transition-colors rounded-sm shadow-lg shadow-orange-500/25"
            >
              Get Started
            </button>
            <button
              onClick={(e) => handleAuthClick(e, "/register")}
              className="px-8 py-3.5 border border-white/20 text-white/80 text-xs font-mono uppercase tracking-widest font-bold hover:bg-white/10 hover:border-white/40 transition-colors rounded-sm bg-white/5 backdrop-blur-sm"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] animate-bounce">
          Scroll
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="bg-[#f5f5f5] py-20 px-4 border-t border-orange-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-600 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full mb-3">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1a1a1a]">
              Built for <span className="text-orange-500">Veterinary</span> Excellence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: "01", title: "Case Registration", desc: "Capture patient history, vitals, and lab directives." },
              { num: "02", title: "Laboratory", desc: "Pathology, Bacteriology, and Parasitology reporting." },
              { num: "03", title: "Diagnosis", desc: "Tentative and definitive diagnosis with treatment plans." },
              { num: "04", title: "Pharmacy", desc: "Prescription tracking and dispensing with accountability." },
            ].map((feature) => (
              <div
                key={feature.num}
                className="bg-white border border-white/40 p-6 hover:border-orange-500/60 hover:shadow-lg transition-all shadow-sm rounded-sm"
              >
                <div className="w-10 h-10 bg-[#1a1a1a] text-orange-500 flex items-center justify-center font-mono font-bold text-sm rounded-sm">
                  {feature.num}
                </div>
                <h3 className="mt-4 font-bold uppercase text-sm tracking-wider text-[#1a1a1a]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[10px] font-mono text-[#1a1a1a]/60 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="bg-[#1a1a1a] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full mb-3">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight">
              How It <span className="text-orange-500">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register Case", desc: "Assign lab or direct diagnosis." },
              { step: "02", title: "Process Lab", desc: "Fill findings and send to doctor." },
              { step: "03", title: "Diagnose & Treat", desc: "Doctor diagnoses, pharmacy dispenses." },
            ].map((item) => (
              <div key={item.step} className="text-center border border-white/10 rounded-sm p-8 bg-white/5 backdrop-blur-sm hover:border-orange-500/40 transition-colors">
                <div className="text-5xl font-mono font-bold text-orange-500">{item.step}</div>
                <h3 className="mt-3 font-bold uppercase text-sm tracking-wider">{item.title}</h3>
                <p className="mt-2 text-[10px] font-mono text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="bg-white py-20 px-4 border-t border-orange-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1a1a1a]">
            Ready to <span className="text-orange-500">streamline</span> your clinic?
          </h2>
          <p className="mt-3 text-xs font-mono text-[#1a1a1a]/60">
            Join veterinary professionals using HU-Brooke VetTrack.
          </p>
          <div className="mt-6">
            <button
              onClick={(e) => handleAuthClick(e, "/login")}
              className="px-8 py-3.5 bg-orange-500 text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-600 transition-colors rounded-sm shadow-lg shadow-orange-500/25"
            >
              Start Now
            </button>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-[#1a1a1a] border-t border-white/10 px-4 py-6 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} Hawassa University FVM. All rights reserved.
        </p>
      </footer>
    </div>
  );
}