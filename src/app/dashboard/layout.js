"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard/case-registration", label: "Case Registration", icon: "C", requiredRole: "case_registration" },
  { href: "/dashboard/pathology", label: "Pathology Lab", icon: "P", requiredRole: "pathology" },
  { href: "/dashboard/bacteriology", label: "Bacteriology Lab", icon: "B", requiredRole: "bacteriology" },
  { href: "/dashboard/parasitology", label: "Parasitology Lab", icon: "PR", requiredRole: "parasitology" },
  { href: "/dashboard/diagnosis", label: "Diagnosis", icon: "D", requiredRole: "diagnosis" },
  { href: "/dashboard/pharmacy", label: "Pharmacy", icon: "PH", requiredRole: "pharmacy" },
];

const diagnosisRoles = ["diagnosis_petdoc", "diagnosis_largedoc", "diagnosis_equinedoc"];

function isRoleAllowed(currentRole, requiredRole) {
  if (!currentRole) return false;
  if (requiredRole === "diagnosis") {
    return diagnosisRoles.includes(currentRole);
  }
  return currentRole === requiredRole;
}

function getRequiredRoleForPath(pathname) {
  const item = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  return item ? item.requiredRole : null;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Validate session whenever pathname changes
  useEffect(() => {
    const validate = () => {
      // 1. Admin bypass check (from localStorage)
      const adminBypass = localStorage.getItem("vet_admin_bypass");
      const adminRole = localStorage.getItem("vet_admin_role");
      const adminExpiry = localStorage.getItem("vet_admin_expiry");

      if (
        adminBypass === "true" &&
        adminRole &&
        adminExpiry &&
        Date.now() < parseInt(adminExpiry, 10)
      ) {
        // Grant temporary access and set session storage
        sessionStorage.setItem("vet_auth_role", adminRole);
        sessionStorage.setItem("vet_auth_expiry", String(Date.now() + 30 * 60 * 1000));

        // Clear admin bypass flags
        localStorage.removeItem("vet_admin_bypass");
        localStorage.removeItem("vet_admin_role");
        localStorage.removeItem("vet_admin_expiry");

        setAuthChecked(true);
        return;
      }

      // 2. Normal session check
      const role = sessionStorage.getItem("vet_auth_role");
      const expiry = sessionStorage.getItem("vet_auth_expiry");

      if (!role || !expiry || Date.now() > parseInt(expiry, 10)) {
        sessionStorage.removeItem("vet_auth_role");
        sessionStorage.removeItem("vet_auth_route");
        sessionStorage.removeItem("vet_auth_expiry");
        const requiredRole = getRequiredRoleForPath(pathname) || "case_registration";
        router.replace(`/pin?role=${requiredRole}&next=${encodeURIComponent(pathname)}`);
        return;
      }

      // 3. Role-path permission check
      const requiredRole = getRequiredRoleForPath(pathname);
      if (requiredRole && !isRoleAllowed(role, requiredRole)) {
        sessionStorage.removeItem("vet_auth_role");
        sessionStorage.removeItem("vet_auth_route");
        sessionStorage.removeItem("vet_auth_expiry");
        router.replace(`/pin?role=${requiredRole}&next=${encodeURIComponent(pathname)}`);
        return;
      }

      // All good
      setAuthChecked(true);
    };

    setAuthChecked(false);
    const timer = setTimeout(validate, 50);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  const handleNavClick = (e, href, requiredRole) => {
    const role = sessionStorage.getItem("vet_auth_role");
    const expiry = sessionStorage.getItem("vet_auth_expiry");

    if (!role || !expiry || Date.now() > parseInt(expiry, 10)) {
      e.preventDefault();
      sessionStorage.removeItem("vet_auth_role");
      sessionStorage.removeItem("vet_auth_route");
      sessionStorage.removeItem("vet_auth_expiry");
      router.push(`/pin?role=${requiredRole}&next=${encodeURIComponent(href)}`);
      return;
    }

    if (!isRoleAllowed(role, requiredRole)) {
      e.preventDefault();
      sessionStorage.removeItem("vet_auth_role");
      sessionStorage.removeItem("vet_auth_route");
      sessionStorage.removeItem("vet_auth_expiry");
      router.push(`/pin?role=${requiredRole}&next=${encodeURIComponent(href)}`);
      return;
    }

    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Vet Clinic System
            </h2>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Clinical Dashboard
            </p>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.requiredRole)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border-l-2 border-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent"
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-700 text-[10px] font-bold">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <header className="bg-white border-b border-slate-300 px-4 py-3 flex items-center justify-between lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 border border-slate-300 text-slate-700 text-xs font-mono uppercase"
            >
              Menu
            </button>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              System Ledger / Active Directory
            </div>
          </header>
          <main className="p-3 sm:p-4 lg:p-6">
            {authChecked ? (
              children
            ) : (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Verifying Access...
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}