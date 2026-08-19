"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiagnosisRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/diagnosis/pet");
  }, []);
  return null;
}