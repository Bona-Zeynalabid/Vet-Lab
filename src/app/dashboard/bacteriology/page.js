"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { casesApi, bacteriologyApi, labRequestApi } from "@/lib/api";

export default function BacteriologyDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [bacteriologyRecords, setBacteriologyRecords] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null); // store the lab request if viewing from one

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesData, bactData, requestsData] = await Promise.all([
        casesApi.list({ lab: "bacteriology" }),
        bacteriologyApi.list(),
        labRequestApi.list({ lab: "bacteriology", status: "pending" }),
      ]);
      setCases(casesData || []);
      setBacteriologyRecords(bactData || []);
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
      let request = null;
      if (item.type === "case") {
        const data = await casesApi.getById(item.data._id);
        setSelectedCase(data);
      } else {
        // lab request
        request = item.data;
        doc = request.doc;
        const result = await casesApi.list({ caseNumber: request.caseId });
        if (result.length > 0) {
          setSelectedCase(result[0]);
        } else {
          setSelectedCase({
            caseInfo: { caseNumber: request.caseId },
            error: true,
          });
        }
      }
      setSelectedDoc(doc);
      setSelectedRequest(request);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingItems = [
    ...cases
      .filter(
        (c) =>
          !bacteriologyRecords.some((b) => b.caseId === c.caseInfo?.caseNumber),
      )
      .map((c) => ({ type: "case", data: c })),
    ...labRequests.map((req) => ({ type: "labRequest", data: req })),
  ];

  const completedCases = cases.filter((c) =>
    bacteriologyRecords.some((b) => b.caseId === c.caseInfo?.caseNumber),
  );

  const displayItems =
    activeTab === "pending"
      ? pendingItems
      : completedCases.map((c) => ({ type: "case", data: c }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Diagnostic Laboratory / Bacteriology Unit
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            Bacteriology Dashboard
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
                    const existingRecord = bacteriologyRecords.find(
                      (b) => b.caseId === c.caseInfo?.caseNumber,
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
                                    `/dashboard/bacteriology/${existingRecord._id}`,
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
                                    `/forms/bacteriology?caseId=${c.caseInfo?.caseNumber}`,
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
                                  `/forms/bacteriology?caseId=${req.caseId}&doc=${req.doc}`,
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

      {/* Modal – full detail view */}
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
                {/* Patient & Owner info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500">Species:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.species || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Breed:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.breed || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Sex:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.sex || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Age:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.age || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Weight:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.weight
                            ? `${selectedCase.patient.weight} KG`
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Animal ID:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.patient?.animalId || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-300 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                      Owner & Clinical Info
                    </h3>
                    <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500">Owner:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.owner?.fullName || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.owner?.telephone || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Complaint:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.anamnesis?.primaryComplaint || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Temperature:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.physicalExam?.temperature
                            ? `${selectedCase.physicalExam.temperature}°C`
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Demeanor:</span>{" "}
                        <span className="font-semibold">
                          {selectedCase.physicalExam?.demeanor || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Directives */}
                <div className="border-2 border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2">
                    Required Lab Investigations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {["blood", "urine", "feces", "nasal", "rumen"].map(
                      (type) => {
                        // If viewing a lab request, show the request's tests; otherwise show the case's
                        const tests = selectedRequest
                          ? selectedRequest.labDirectives?.[type]?.tests
                          : selectedCase.labDirectives?.[type]?.tests;
                        const notes = selectedRequest
                          ? selectedRequest.labDirectives?.[type]?.notes
                          : selectedCase.labDirectives?.[type]?.notes;
                        return (
                          <div
                            key={type}
                            className="border border-slate-300 p-3"
                          >
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-1 mb-2">
                              {type} Tests
                            </h4>
                            {tests?.length > 0 ? (
                              <ul className="space-y-0.5">
                                {tests.map((test, i) => (
                                  <li
                                    key={i}
                                    className="text-[10px] font-mono text-slate-700 flex items-start gap-1"
                                  >
                                    <span className="text-slate-400 mt-0.5">
                                      ▪
                                    </span>{" "}
                                    {test}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[10px] font-mono text-slate-400 italic">
                                None specified
                              </p>
                            )}
                            {notes && (
                              <p className="text-[10px] font-mono text-slate-500 mt-1 border-t border-slate-200 pt-1">
                                Note: {notes}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Physical Exam */}
                <div className="border border-slate-300 p-3 space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                    Physical Exam & History
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500">BCS:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.bcs || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Mucous Memb:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.mucousMembrane || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Resp Rate:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.respiratoryRate || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">CRT:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.crt || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pulse:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.pulseRate || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Heart:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.heartSound || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">GI Motility:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.giMotility || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Lung:</span>{" "}
                      <span className="font-semibold">
                        {selectedCase.physicalExam?.lungSound || "-"}
                      </span>
                    </div>
                  </div>
                </div>

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
                        ? `/forms/bacteriology?caseId=${selectedCase.caseInfo?.caseNumber}&doc=${selectedDoc}`
                        : `/forms/bacteriology?caseId=${selectedCase.caseInfo?.caseNumber}`;
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
