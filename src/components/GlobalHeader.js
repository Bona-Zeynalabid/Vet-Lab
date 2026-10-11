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
    <header className="bg-orange-500 border-b-2 border-orange-600 px-3 sm:px-6 py-2 flex items-center justify-between font-sans shadow-sm min-w-0 w-full print:hidden">
      {/* Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="bg-white/95 rounded-md p-1 shadow-sm">
            <Image
              src="/assets/Screenshot 2025-12-18 091949.png"
              alt="University Logo"
              width={32}
              height={32}
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          <div className="bg-white/95 rounded-md p-1 shadow-sm">
            <Image
              src="/assets/blogo.png"
              alt="Brook Logo"
              width={32}
              height={32}
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold uppercase font-mono text-white tracking-tight truncate">
              Hawassa University FVM
            </span>
          </div>
          <p className="text-[9px] font-mono text-orange-100 uppercase tracking-widest leading-none hidden sm:block truncate">
            Veterinary Clinical System
          </p>
        </div>
      </div>

      {/* User Avatar – click to go to profile */}
      {user && (
        <div
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white text-orange-500 font-bold text-sm uppercase border-2 border-white shadow-sm cursor-pointer hover:bg-orange-50 transition-colors"
          title={`${user.firstName} ${user.lastName}`}
          onClick={() => router.push("/dashboard/profile")}
        >
          {user.firstName ? user.firstName[0].toUpperCase() : "U"}
        </div>
      )}
    </header>
  );
}