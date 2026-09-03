"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function CompletedCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseRecord, setCaseRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCompletedCase = async () => {
      try {
        const { data, error } = await supabase
          .from("completed_cases")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setCaseRecord(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchCompletedCase();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Loading case record...
          </p>
        </div>
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-red-600 text-sm font-mono">Error: {error || "Case not found"}</p>
          <button
            onClick={() => router.push("/dashboard/case-registration")}
            className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-mono uppercase hover:bg-slate-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const {
    date,
    case_no,
    owner_name,
    address,
    tel_no,
    species,
    no_of_animals,
    breed,
    animal_id,
    sex,
    age,
    body_weight,
    case_history,
    owners_complaint,
    history_anamnesis,
    clinical_findings,
    demeanor,
    mucous_membrane,
    crt,
    heart_sound,
    lung_sound,
    bcs,
    respiratory_rate,
    pulse_rate,
    gi_motility,
    temperature,
    other_clinical_findings,
    differential_diagnosis,
    tentative_diagnosis,
    sample_taken,
    lab_methods,
    lab_result,
    definitive_diagnosis,
    treatment_given,
    prognosis,
    advice_to_owner,
    veterinarian_name,
    veterinarian_signature,
  } = caseRecord;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans text-slate-900">
      <div className="max-w-[210mm] mx-auto">
        {/* Top action bar */}
        <div className="flex justify-between items-center mb-4 no-print">
          <button
            onClick={() => router.push("/dashboard/case-registration")}
            className="px-4 py-2 border border-slate-400 text-slate-700 text-[10px] font-mono uppercase hover:bg-slate-100"
          >
            Back to Cases
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 text-white text-[10px] font-mono uppercase font-bold hover:bg-slate-700"
          >
            Print / Save PDF
          </button>
        </div>

        {/* Printable sheet - using A4 style with Times New Roman 13px */}
        <div
          className="bg-white shadow-lg p-8 sm:p-12 print:shadow-none print:p-0"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "13px",
            color: "#000",
            lineHeight: "1.4",
          }}
        >
          {/* Header Logos */}
          <div className="flex justify-between items-center mb-6">
            <Image
              src="/assets/Screenshot 2025-12-18 091949.png"
              alt="University Logo"
              width={96}
              height={96}
              className="object-contain"
              unoptimized
              priority
            />
            <Image
              src="/assets/blogo.png"
              alt="Brook Logo"
              width={96}
              height={96}
              className="object-contain"
              unoptimized
              priority
            />
          </div>

          {/* Main Title - 15px bold underline as per reference */}
          <div className="text-center font-bold underline mb-6" style={{ fontSize: "15px" }}>
            Hawassa University FVM Clinical Case Recording Sheet
          </div>

          {/* Patient & Owner Info */}
          <div className="flex flex-wrap items-end gap-x-4 mb-3">
            <span>Date:</span>
            <div className="flex-1 border-b border-black min-w-[80px] px-2">
              {date ? new Date(date).toLocaleDateString() : ""}
            </div>
            <span>Case No.:</span>
            <div className="flex-1 border-b border-black min-w-[100px] px-2">
              {case_no}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 mb-3">
            <span>Owner's Name:</span>
            <div className="flex-1 border-b border-black min-w-[150px] px-2">
              {owner_name}
            </div>
            <span>Address:</span>
            <div className="flex-1 border-b border-black min-w-[150px] px-2">
              {address}
            </div>
            <span>Tel. No.:</span>
            <div className="flex-1 border-b border-black min-w-[80px] px-2">
              {tel_no}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 mb-3">
            <span>Species:</span>
            <div className="flex-1 border-b border-black px-2">{species}</div>
            <span>No. of Animals:</span>
            <div className="flex-1 border-b border-black px-2">{no_of_animals}</div>
            <span>Breed</span>
            <div className="flex-1 border-b border-black px-2">{breed}</div>
            <span>Animal ID:</span>
            <div className="flex-1 border-b border-black px-2">{animal_id}</div>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 mb-4">
            <span>Sex:</span>
            <div className="flex-1 border-b border-black px-2">{sex}</div>
            <span>Age:</span>
            <div className="flex-1 border-b border-black px-2">{age}</div>
            <span>Body Weight:</span>
            <div className="flex-1 border-b border-black px-2">{body_weight}</div>
          </div>

          {/* Owner's Complaint / History */}
      

          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Medical History:</span>
            <div className="flex-1 border-b border-black px-2">{history_anamnesis}</div>
          </div>

          {/* Clinical Findings */}
          <div className="font-bold mb-2 mt-6">Clinical Findings:</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-end gap-x-2">
              <span>Demeanor:</span>
              <div className="flex-1 border-b border-black px-2">{demeanor}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>BCS:</span>
              <div className="flex-1 border-b border-black px-2">{bcs}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Mucous membrane:</span>
              <div className="flex-1 border-b border-black px-2">{mucous_membrane}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Respiratory Rate (RR):</span>
              <div className="flex-1 border-b border-black px-2">{respiratory_rate}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Capillary Refill Time (CRT):</span>
              <div className="flex-1 border-b border-black px-2">{crt}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Pulse Rate:</span>
              <div className="flex-1 border-b border-black px-2">{pulse_rate}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Heart Sound:</span>
              <div className="flex-1 border-b border-black px-2">{heart_sound}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Gastro intestinal Motility:</span>
              <div className="flex-1 border-b border-black px-2">{gi_motility}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Lung sound:</span>
              <div className="flex-1 border-b border-black px-2">{lung_sound}</div>
            </div>
            <div className="flex items-end gap-x-2">
              <span>Temp. (T<sup>0</sup>):</span>
              <div className="flex-1 border-b border-black px-2">{temperature}</div>
            </div>
          </div>

          {/* Other Clinical Findings */}
          <div className="flex items-end gap-x-4 mt-5 mb-3">
            <span>Other clinical findings:</span>
            <div className="flex-1 border-b border-black px-2">{other_clinical_findings}</div>
          </div>

          {/* Diagnosis & Laboratory */}
          <div className="flex items-end gap-x-4 mb-3 mt-6">
            <span className="font-bold">Differential Diagnosis:</span>
            <div className="flex-1 border-b border-black px-2">{differential_diagnosis}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Tentative Diagnosis:</span>
            <div className="flex-1 border-b border-black px-2">{tentative_diagnosis}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Sample Taken:</span>
            <div className="flex-1 border-b border-black px-2">{sample_taken}</div>
            <span className="font-bold">Lab. Methods Employed:</span>
            <div className="flex-1 border-b border-black px-2">{lab_methods}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Result:</span>
            <div className="flex-1 border-b border-black px-2">{lab_result}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Definitive Diagnosis:</span>
            <div className="flex-1 border-b border-black px-2">{definitive_diagnosis}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Treatment Given:</span>
            <div className="flex-1 border-b border-black px-2">{treatment_given}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3 mt-6">
            <span className="font-bold">Prognosis:</span>
            <div className="flex-1 border-b border-black px-2">{prognosis}</div>
          </div>
          <div className="flex items-end gap-x-4 mb-3">
            <span className="font-bold">Advice to Owner:</span>
            <div className="flex-1 border-b border-black px-2">{advice_to_owner}</div>
          </div>

          {/* Footer */}
          <div className="flex items-end gap-x-4 mt-10">
            <span>Name of Veterinarian in Charge:</span>
            <div className="flex-1 border-b border-black px-2">{veterinarian_name}</div>
             <span>Signature:</span>
            <div className="flex-1 border-b border-black px-2"></div>
          </div>
        </div>
      </div>

     {/* Print styling */}
<style jsx>{`
  @media print {
    @page {
      margin: 0; 
      size: A4 portrait;
    }

    .no-print {
      display: none !important;
    }

    body {
      background: white !important;
    }
  }
`}</style>
    </div>
  );
}