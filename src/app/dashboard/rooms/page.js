"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  BugAntIcon,
  Square3Stack3DIcon,
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function RoomsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("vet_user="));
    if (!cookie) {
      router.push("/login");
      return;
    }
    try {
      const userData = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
      setUser(userData);
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const rooms = [
    { label: "Case Registration", dashboardRoute: "/dashboard/case-registration", pinRoute: "/pin?role=case_registration", role: "case_registration", icon: ClipboardDocumentCheckIcon, code: "REG-01" },
    { label: "Pathology Lab", dashboardRoute: "/dashboard/pathology", pinRoute: "/pin?role=pathology", role: "pathology", icon: BeakerIcon, code: "LAB-PATH" },
    { label: "Bacteriology Lab", dashboardRoute: "/dashboard/bacteriology", pinRoute: "/pin?role=bacteriology", role: "bacteriology", icon: Square3Stack3DIcon, code: "LAB-BACT" },
    { label: "Parasitology Lab", dashboardRoute: "/dashboard/parasitology", pinRoute: "/pin?role=parasitology", role: "parasitology", icon: BugAntIcon, code: "LAB-PARA" },
   { label: "Diagnosis - Pet Doctor", dashboardRoute: "/dashboard/diagnosis/pet", pinRoute: "/pin?role=diagnosis_petdoc", role: "diagnosis_petdoc", icon: UserIcon, code: "DX-PET" },
{ label: "Diagnosis - Large Animal", dashboardRoute: "/dashboard/diagnosis/large", pinRoute: "/pin?role=diagnosis_largedoc", role: "diagnosis_largedoc", icon: AcademicCapIcon, code: "DX-LRG" },
{ label: "Diagnosis - Equine Specialist", dashboardRoute: "/dashboard/diagnosis/equine", pinRoute: "/pin?role=diagnosis_equinedoc", role: "diagnosis_equinedoc", icon: ShieldCheckIcon, code: "DX-EQN" },
    { label: "Pharmacy", dashboardRoute: "/dashboard/pharmacy", pinRoute: "/pin?role=pharmacy", role: "pharmacy", icon: BuildingStorefrontIcon, code: "PHARM-01" },
  ];

  const isAdmin = user?.role === "admin";
  const isUnlocked = (role) => {
    if (isAdmin) return true;
    const expiry = sessionStorage.getItem(`vet_unlocked_${role}`);
    return expiry && Date.now() < parseInt(expiry, 10);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Rooms</h1>
          <p className="text-[10px] font-mono text-slate-500 mt-1">Select a module to access</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const unlocked = isUnlocked(room.role);
            const link = unlocked ? room.dashboardRoute : room.pinRoute;
            const IconComponent = room.icon;

            return (
              <Link
                key={room.role}
                href={link}
                className={`group flex flex-col justify-between border-2 transition-all duration-200 p-5 bg-white shadow-xs hover:shadow-md ${
                  unlocked
                    ? "border-slate-800 hover:border-black"
                    : "border-slate-300 hover:border-slate-500"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-mono font-bold uppercase tracking-wider ${
                        unlocked
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      {unlocked ? (
                        <>
                          <LockOpenIcon className="w-3 h-3 text-emerald-700" />
                          <span>{isAdmin ? "No PIN" : "Unlocked"}</span>
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="w-3 h-3 text-slate-500" />
                          <span>PIN Required</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 w-fit border border-slate-300 bg-slate-50 group-hover:border-slate-800 transition-colors">
                      <IconComponent
                        className={`w-6 h-6 ${unlocked ? "text-slate-900" : "text-slate-500"}`}
                      />
                    </div>
                    <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900">
                      {room.label}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold">
                  <span className={unlocked ? "text-slate-900" : "text-slate-500"}>
                    {unlocked ? "Access Console" : "Enter Passcode"}
                  </span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}