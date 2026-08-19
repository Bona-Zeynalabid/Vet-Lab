"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import {
  LayoutDashboard,
  User,
  DoorOpen,
  KeyRound,
  Users,
  BarChart3,
  Settings,
  ScrollText,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const clinicNavItems = [
  { href: "/dashboard/case-registration", label: "Case Registration", requiredRole: "case_registration" },
  { href: "/dashboard/pathology", label: "Pathology Lab", requiredRole: "pathology" },
  { href: "/dashboard/bacteriology", label: "Bacteriology Lab", requiredRole: "bacteriology" },
  { href: "/dashboard/parasitology", label: "Parasitology Lab", requiredRole: "parasitology" },
  { href: "/dashboard/diagnosis/pet", label: "Diagnosis - Pet Doctor", requiredRole: "diagnosis_petdoc" },
  { href: "/dashboard/diagnosis/large", label: "Diagnosis - Large Animal", requiredRole: "diagnosis_largedoc" },
  { href: "/dashboard/diagnosis/equine", label: "Diagnosis - Equine Specialist", requiredRole: "diagnosis_equinedoc" },
  { href: "/dashboard/pharmacy", label: "Pharmacy", requiredRole: "pharmacy" },
];

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
  { href: "/dashboard/rooms", label: "Rooms", icon: DoorOpen, exact: false },
];

const adminNavItems = [
  { href: "/dashboard/admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/dashboard/admin/credentials", label: "Credentials", icon: KeyRound, exact: false },
  { href: "/dashboard/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings, exact: false },

];

function getRequiredRoleForPath(pathname) {
  const item = clinicNavItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );
  return item ? item.requiredRole : null;
}

function isRoomUnlocked(requiredRole) {
  const expiry = sessionStorage.getItem(`vet_unlocked_${requiredRole}`);
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Read user from cookie
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("vet_user="));
    if (cookie) {
      try {
        setCurrentUser(JSON.parse(decodeURIComponent(cookie.split("=")[1])));
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }, [pathname]);

  const requiredRole = getRequiredRoleForPath(pathname);
  const isUserDashboard = pathname.startsWith("/dashboard") && !requiredRole;

  useEffect(() => {
    if (isUserDashboard) {
      setAuthChecked(true);
      return;
    }

    const validate = () => {
      if (currentUser?.role === "admin") {
        setAuthChecked(true);
        return;
      }

      if (!requiredRole) {
        setAuthChecked(true);
        return;
      }

      if (isRoomUnlocked(requiredRole)) {
        setAuthChecked(true);
        return;
      }

      router.replace(`/pin?role=${requiredRole}&next=${encodeURIComponent(pathname)}`);
    };

    setAuthChecked(false);
    const timer = setTimeout(validate, 50);
    return () => clearTimeout(timer);
  }, [pathname, router, requiredRole, isUserDashboard, currentUser]);

  // ========== USER DASHBOARD LAYOUT (White Sidebar with Black Active State) ==========
  if (isUserDashboard) {
    const isAdmin = currentUser?.role === "admin";
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
        <GlobalHeader />

        <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
          {/* Unscrollable White Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-900 border-r border-slate-300 flex flex-col justify-between overflow-hidden transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col overflow-hidden">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-300 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-800">
                    User Panel
                  </h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 text-slate-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-3 space-y-4 overflow-hidden">
                {/* Main Links */}
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Main Menu
                  </p>
                  {userNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                          isActive
                            ? "bg-black text-white"
                            : "text-slate-700 hover:bg-slate-100 hover:text-black"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-600"}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Administrative Links */}
                {isAdmin && (
                  <div className="space-y-1 pt-3 border-t border-slate-200">
                    <div className="px-3 flex items-center justify-between">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                        Admin Controls
                      </p>
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                            isActive
                              ? "bg-black text-white"
                              : "text-slate-700 hover:bg-slate-100 hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-600"}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="w-3 h-3 text-white" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </nav>
            </div>

            {/* Sidebar Footer User Info */}
            {currentUser && (
              <div className="p-3 border-t border-slate-300 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="w-7 h-7 bg-black text-white font-mono font-bold flex items-center justify-center text-xs">
                    {currentUser.firstName ? currentUser.firstName[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-black truncate">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 capitalize truncate">
                      {currentUser.role}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Mobile Navigation Header */}
            <div className="lg:hidden p-2.5 bg-white border-b border-slate-300 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 bg-slate-50 text-slate-800 text-xs font-mono uppercase tracking-wider hover:bg-slate-100"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>

            <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  // ========== CLINIC DASHBOARD LAYOUT (No sidebar) ==========
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      <GlobalHeader />
      <div className="flex-1 min-w-0">
        <main className="p-3 sm:p-4 lg:p-6">
          {authChecked ? (
            children
          ) : (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-black rounded-full animate-spin"></div>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Verifying Access...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}