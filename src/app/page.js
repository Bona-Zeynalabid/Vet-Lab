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
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a]">

      {/* Navigation – original header */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/Screenshot 2025-12-18 091949.png"
            alt="University Logo"
            width={36}
            height={36}
            className="object-contain"
            unoptimized
            priority
          />
          <Image
            src="/assets/blogo.png"
            alt="Brooke Logo"
            width={36}
            height={36}
            className="object-contain"
            unoptimized
            priority
          />
          <span className="font-mono uppercase tracking-widest text-sm font-bold text-[#1a1a1a]">
            Hawassa University FVM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => handleAuthClick(e, "/login")}
            className="px-5 py-2 bg-[#1a1a1a] text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-orange-500 transition-colors rounded-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* === HERO – split left/right === */}
      <section className="relative min-h-[80vh] flex items-center bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left side – text content */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-block px-4 py-1.5 border border-orange-500/30 text-orange-600 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full mb-6 bg-orange-50/80 backdrop-blur-sm">
                Veterinary Clinical System
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-tight">
                <span className="text-[#1a1a1a]">HU-Brooke</span>
                <span className="text-orange-500 block sm:inline"> VetTrack</span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#1a1a1a]/70 font-mono max-w-lg mx-auto lg:mx-0">
                Complete clinical management — case registration, lab diagnostics, diagnosis, and pharmacy.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
                <button
                  onClick={(e) => handleAuthClick(e, "/login")}
                  className="px-8 py-3.5 bg-[#1a1a1a] text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-500 transition-colors rounded-sm shadow-md"
                >
                  Get Started
                </button>
                <button
                  onClick={(e) => handleAuthClick(e, "/register")}
                  className="px-8 py-3.5 border border-slate-300 text-[#1a1a1a] text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors rounded-sm bg-white/60 backdrop-blur-sm"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Right side – logo image (not stretched) */}
            <div className="flex-1 flex justify-center lg:justify-end items-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-orange-500/5 rounded-full blur-2xl -z-10" />
                <Image
                  src="/assets/blogo.png"
                  alt="Brooke Logo"
                  fill
                  className="object-contain drop-shadow-2xl"
                  unoptimized
                  priority
                />
              </div>
            </div>

          </div>
        </div>

        {/* Decorative orange accent – subtle */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
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
              className="px-8 py-3.5 bg-[#1a1a1a] text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-500 transition-colors rounded-sm shadow-md"
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