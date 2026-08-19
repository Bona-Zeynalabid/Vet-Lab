"use client";

import { useState, useEffect } from "react";
import { userApi, casesApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  FolderOpen,
  FileCheck,
  X,
  User,
  GraduationCap,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Ban
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'cases'
  
  // Case Data State
  const [activeCases, setActiveCases] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Action Loading States
  const [savingRole, setSavingRole] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch registered users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    return fullName.includes(term) || email.includes(term);
  });

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetail(true);
    setDetailLoading(true);
    setActiveTab("overview");
    setError("");

    const fullName = `${user.firstName} ${user.lastName}`;

    try {
      // Fetch Active cases from MongoDB API
      const active = await casesApi.list({ by: fullName });
      setActiveCases(Array.isArray(active) ? active : []);

      // Fetch Completed cases from Supabase database
      const { data: completed, error: supabaseError } = await supabase
        .from("completed_cases")
        .select("id, case_no, date, definitive_diagnosis")
        .eq("veterinarian_name", fullName)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        setError(`Supabase Sync Warning: ${supabaseError.message}`);
        setCompletedCases([]);
      } else {
        setCompletedCases(completed || []);
      }
    } catch (err) {
      setError(err.message || "Error retrieving case association history.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!selectedUser) return;
    setSavingRole(true);
    setError("");
    try {
      await userApi.update(selectedUser._id, { role: newRole });
      setSelectedUser((prev) => ({ ...prev, role: newRole }));
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err.message || "Failed to update user privilege level.");
    } finally {
      setSavingRole(false);
    }
  };

  const toggleBlock = async () => {
    if (!selectedUser) return;
    setBlocking(true);
    setError("");
    const updatedState = !selectedUser.blocked;
    try {
      await userApi.update(selectedUser._id, { blocked: updatedState });
      setSelectedUser((prev) => ({ ...prev, blocked: updatedState }));
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, blocked: updatedState } : u))
      );
    } catch (err) {
      setError(err.message || "Failed to update account restriction status.");
    } finally {
      setBlocking(false);
    }
  };

  const closeModal = () => {
    setShowDetail(false);
    setSelectedUser(null);
    setActiveCases([]);
    setCompletedCases([]);
    setError("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 text-slate-800 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system access roles, account restrictions, and review assigned clinical activity logs.
          </p>
        </div>
        
        {/* Quick Stats Summary */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
            <span className="text-slate-500">Total Users: </span>
            <span className="font-semibold text-slate-900">{users.length}</span>
          </div>
          <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
            <span className="text-slate-500">Admins: </span>
            <span className="font-semibold text-indigo-600">
              {users.filter((u) => u.role === "admin").length}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
          />
        </div>
        
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Notification Banner for Errors */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">System Notification:</span> {error}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Fetching system user directories...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs space-y-2">
            <User className="w-8 h-8 stroke-[1.5] text-slate-300" />
            <p className="font-medium text-slate-600">No matching user accounts identified</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search criteria or clear filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 border-b border-slate-200 uppercase text-[10px] font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Student Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-[11px] border border-slate-300">
                        {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                      </div>
                      <span>{user.firstName} {user.lastName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          user.role === "admin"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {user.role === "admin" && <ShieldCheck className="w-3 h-3 mr-1 text-indigo-600" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.student ? (
                        <span className="inline-flex items-center text-emerald-600 text-[11px] font-medium">
                          <GraduationCap className="w-3.5 h-3.5 mr-1" /> Student
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Staff / Other</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.blocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                          <Ban className="w-3 h-3 mr-1" /> Restricted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-[11px] font-medium rounded-md transition-all focus:outline-none"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="relative bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {selectedUser.firstName ? selectedUser.firstName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-white border border-slate-200 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-4 text-xs font-medium border-b-2 transition-all ${
                  activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Overview & Permissions
              </button>
              <button
                onClick={() => setActiveTab("cases")}
                className={`py-3 px-4 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "cases"
                    ? "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Assigned Cases History</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  {activeCases.length + completedCases.length}
                </span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {activeTab === "overview" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Information Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> Account Profile
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Full Name</span>
                        <span className="text-slate-800 font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Email Address</span>
                        <span className="text-slate-800">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Student Affiliation</span>
                        <span className="text-slate-800">{selectedUser.student ? "Yes" : "No"}</span>
                      </div>
                      {selectedUser.student && selectedUser.idNumber && (
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Institutional ID</span>
                          <span className="text-indigo-600 font-mono font-medium">{selectedUser.idNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Account Status</span>
                        {selectedUser.blocked ? (
                          <span className="text-red-600 font-semibold">Blocked</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Administrative Controls */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Access Controls
                    </h3>

                    {/* Role Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-500 font-medium block">Assigned Role</label>
                      <select
                        value={selectedUser.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={savingRole}
                        className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 shadow-sm"
                      >
                        <option value="ordinary">Ordinary User</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {/* Block/Unblock Action */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="text-[11px] text-slate-500 font-medium block mb-2">Security Enforcement</label>
                      <button
                        onClick={toggleBlock}
                        disabled={blocking}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors shadow-sm ${
                          selectedUser.blocked
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        } disabled:opacity-50`}
                      >
                        {blocking && <Loader2 className="w-3 h-3 animate-spin" />}
                        {selectedUser.blocked ? "Revoke Restriction (Unblock)" : "Restrict Access (Block Account)"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Cases Tab */
                <div className="space-y-6">
                  {detailLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>Syncing user case history...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Active MongoDB Cases */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="text-xs font-semibold text-amber-700 flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-amber-600" /> Active Cases ({activeCases.length})
                          </h3>
                        </div>
                        {activeCases.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-4 text-center">No active cases registered.</p>
                        ) : (
                          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {activeCases.map((c) => (
                              <li
                                key={c._id}
                                className="bg-white border border-slate-200 rounded p-2.5 flex justify-between items-center text-xs shadow-sm"
                              >
                                <div>
                                  <span className="font-mono text-indigo-600 font-medium block">
                                    {c.caseInfo?.caseNumber || "Unnumbered"}
                                  </span>
                                  <span className="text-[10px] text-slate-400">Active Register</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {c.caseInfo?.date ? new Date(c.caseInfo.date).toLocaleDateString() : "-"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Completed Supabase Cases */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="text-xs font-semibold text-emerald-700 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-600" /> Completed Cases ({completedCases.length})
                          </h3>
                        </div>
                        {completedCases.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-4 text-center">No completed records synced.</p>
                        ) : (
                          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {completedCases.map((c) => (
                              <li
                                key={c.id}
                                className="bg-white border border-slate-200 rounded p-2.5 flex justify-between items-center text-xs shadow-sm"
                              >
                                <div>
                                  <span className="font-mono text-emerald-600 font-medium block">
                                    {c.case_no || "Unnumbered"}
                                  </span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[150px] block">
                                    {c.definitive_diagnosis || "No Diagnosis Stated"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {c.date ? new Date(c.date).toLocaleDateString() : "-"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md transition-colors border border-slate-300 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}