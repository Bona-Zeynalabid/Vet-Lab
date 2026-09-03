"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GlobalHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("vet_user="));
    if (cookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
        setUser(userData);
      } catch (e) {
        // ignore invalid cookie
      }
    }
  }, []);

  return (
    <header className="bg-white border-b-2 border-orange-400 px-3 sm:px-6 py-2 flex items-center justify-between font-sans shadow-xs min-w-0 w-full print:hidden">
      {/* Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            alt="Brook Logo"
            width={36}
            height={36}
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold uppercase font-mono text-slate-900 tracking-tight truncate">
              Hawassa University FVM
            </span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none hidden sm:block truncate">
            Veterinary Clinical System
          </p>
        </div>
      </div>

      {/* User Avatar – click to go to profile */}
      {user && (
        <div
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-sm uppercase border border-slate-700 cursor-pointer"
          title={`${user.firstName} ${user.lastName}`}
          onClick={() => router.push("/dashboard/profile")}
        >
          {user.firstName ? user.firstName[0].toUpperCase() : "U"}
        </div>
      )}
    </header>
  );
}