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
          <span className="font-mono uppercase tracking-widest text-sm font-bold text-[#1a1a1a] flex flex-wrap items-center gap-1">
            <span>Hawassa University FVM</span>
            <span className="text-[10px]">•</span>
            <span>Brooke Ethiopia</span>
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

      {/* === HERO – background image, left text, right logos === */}
      <section className="relative min-h-[80vh] flex items-stretch overflow-hidden bg-white">
        {/* Background image – crisp, no extra blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/stocki.jpg"
            alt="Background"
            fill
            className="object-cover"
            unoptimized
            priority
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row items-stretch min-h-[80vh]">
          {/* Left side – text (70%) with subtle dark overlay */}
          <div className="flex-[7] flex items-center justify-center lg:justify-start relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            <div className="relative text-center lg:text-left text-white px-4 py-8 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-tight">
                <span className="text-white">HU-Brooke</span>
                <span className="text-orange-400 block sm:inline">
                  {" "}
                  Vet-Track
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-white/80 font-mono max-w-lg mx-auto lg:mx-0 leading-relaxed">
                An integrated clinical management system developed by Brooke
                Ethiopia in partnership with Hawassa University FVM.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
                <button
                  onClick={(e) => handleAuthClick(e, "/login")}
                  className="px-8 py-3.5 bg-white text-[#1a1a1a] text-xs font-mono uppercase tracking-widest font-bold hover:bg-orange-500 hover:text-white transition-colors rounded-sm shadow-md"
                >
                  Get Started
                </button>
                <button
                  onClick={(e) => handleAuthClick(e, "/register")}
                  className="px-8 py-3.5 border border-white/50 text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-white hover:text-[#1a1a1a] transition-colors rounded-sm bg-white/10 backdrop-blur-sm"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>

          {/* Right side – white background, logos: mobile side-by-side, desktop stacked */}
          <div className="w-full lg:flex-1 bg-white flex flex-row lg:flex-col items-center justify-center gap-3 sm:gap-4 px-4 py-4 lg:py-8 lg:px-6 mt-4 lg:mt-0 lg:max-w-xs">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0">
              <Image
                src="/assets/blogo.png"
                alt="Brooke Logo"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 shrink-0">
              <Image
                src="/assets/Screenshot 2025-12-18 091949.png"
                alt="University Logo"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      </section>

     

      {/* === FOOTER (unchanged) === */}
      <footer className="bg-[#1a1a1a] border-t border-white/10 px-4 py-6 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} Hawassa University FVM. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
