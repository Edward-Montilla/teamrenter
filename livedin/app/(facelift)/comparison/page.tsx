import { Suspense } from "react";
import { ComparisonClient } from "@/components/facelift/ComparisonClient";

export default function ComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-24 text-center text-[#717182]">
          Loading comparison…
        </div>
      }
    >
      <ComparisonClient />
    </Suspense>
  );
}
