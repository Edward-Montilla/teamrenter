import { Suspense } from "react";
import { FaceliftSearchPage } from "@/components/facelift/FaceliftSearchPage";

function SearchFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[#717182]">
      Loading search…
    </div>
  );
}

export default function SearchRoutePage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <FaceliftSearchPage />
    </Suspense>
  );
}
