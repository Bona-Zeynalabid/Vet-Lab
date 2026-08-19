"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { casesApi, pathologyApi, pathoreqApi } from "@/lib/api";

export default function PathologyDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [pathologyRecords, setPathologyRecords] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesData, pathData, requestsData] = await Promise.all([
        casesApi.list({ lab: "pathology" }),
        pathologyApi.list(),
        pathoreqApi.list({ status: "pending" }),
      ]);
      setCases(casesData || []);
      setPathologyRecords(pathData || []);
      setLabRequests(requestsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = async (item) => {
    try {
      let doc = "";
      if (item.type === "case") {
        const data = await casesApi.getById(item.data._id);
        setSelectedCase(data);
      } else {
        doc = item.data.doc;
        const result = await casesApi.list({ caseNumber: item.data.caseId });
        if (result.length > 0) {
          setSelectedCase(result[0]);
        } else {
          setSelectedCase({
            caseInfo: { caseNumber: item.data.caseId },
            error: true,
          });
        }
      }
      setSelectedDoc(doc);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingItems = [
    ...cases
      .filter(
        (c) =>
          !pathologyRecords.some((p) => p.caseId === c.caseInfo?.caseNumber),
      )
      .map((c) => ({ type: "case", data: c })),
    ...labRequests.map((req) => ({ type: "labRequest", data: req })),
  ];

  const completedCases = cases.filter((c) =>
    pathologyRecords.some((p) => p.caseId === c.caseInfo?.caseNumber),
  );

  const displayItems =
    activeTab === "pending"
      ? pendingItems
      : completedCases.map((c) => ({ type: "case", data: c }));

  return (
    <div className="space-y-4">
      {/* Header – no + New button */}
      <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Diagnostic Laboratory / Pathology Unit
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            Pathology Dashboard
          </h1>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-slate-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tabs & Table */}
      <div className="bg-white border border-slate-300 p-4 space-y-4">
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
              activeTab === "pending"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            Pending ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider ${
              activeTab === "completed"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            Completed ({completedCases.length})
          </button>
        </div>

        {error && (
          <div className="p-3 border-l-2 border-red-600 bg-red-50 text-red-800 text-[10px] font-mono">
            [ERROR]: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Loading records...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-300">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              No {activeTab} cases
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono min-w-[900px]">
              <thead className="bg-slate-800 text-white uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Case Number</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Owner</th>
                  <th className="p-2.5">Species</th>
                  <th className="p-2.5">Doc</th>
                  <th className="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayItems.map((item) => {
                  if (item.type === "case") {
                    const c = item.data;
                    const existingRecord = pathologyRecords.find(
                      (p) => p.caseId === c.caseInfo?.caseNumber,
                    );
                    return (
                      <tr key={c._id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold">
                          {c.caseInfo?.caseNumber}
                        </td>
                        <td className="p-2.5">Case Assignment</td>
                        <td className="p-2.5">
                          {c.caseInfo?.date
                            ? new Date(c.caseInfo.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-2.5">{c.owner?.fullName || "-"}</td>
                        <td className="p-2.5">{c.patient?.species || "-"}</td>
                        <td className="p-2.5">
                          {existingRecord ? (
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-800 border border-green-300">
                              {existingRecord.doc || "Completed"}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleViewCase({ type: "case", data: c })
                              }
                              className="px-2 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase tracking-wider hover:bg-slate-100"
                            >
                              View Case
                            </button>
                            {existingRecord ? (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/pathology/${existingRecord._id}`,
                                  )
                                }
                                className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700"
                              >
                                View Report
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/forms/pathology?caseId=${c.caseInfo?.caseNumber}`,
                                  )
                                }
                                className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700"
                              >
                                Start Analysis
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    const req = item.data;
                    return (
                      <tr key={req._id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold">{req.caseId}</td>
                        <td className="p-2.5">Lab Request</td>
                        <td className="p-2.5">
                          {req.dateRequested
                            ? new Date(req.dateRequested).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-2.5">-</td>
                        <td className="p-2.5">-</td>
                        <td className="p-2.5">{req.doc || "-"}</td>
                        <td className="p-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleViewCase({
                                  type: "labRequest",
                                  data: req,
                                })
                              }
                              className="px-2 py-1 border border-slate-400 text-slate-700 text-[9px] uppercase tracking-wider hover:bg-slate-100"
                            >
                              View Case
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/forms/pathology?caseId=${req.caseId}&doc=${req.doc}`,
                                )
                              }
                              className="px-2 py-1 bg-slate-800 text-white text-[9px] uppercase tracking-wider hover:bg-slate-700"
                            >
                              Start Analysis
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal (same detailed view, link adjusted) */}
      {showModal && selectedCase && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-white border-2 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                    Case Detail View
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {selectedCase.caseInfo?.caseNumber}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 border border-white text-white text-[10px] font-mono uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Patient & Owner info – same as bacteriology modal */}
                {/* ... (same as bacteriology modal) ... */}

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase tracking-wider hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      const link = selectedDoc
                        ? `/forms/pathology?caseId=${selectedCase.caseInfo?.caseNumber}&doc=${selectedDoc}`
                        : `/forms/pathology?caseId=${selectedCase.caseInfo?.caseNumber}`;
                      router.push(link);
                    }}
                    className="px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase tracking-wider font-bold hover:bg-slate-700 transition-colors"
                  >
                    Fill Findings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
