import { Suspense } from "react";
import ParasitologyContent from "./comp";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm">Loading...</div>}>
      <ParasitologyContent />
    </Suspense>
  );
}