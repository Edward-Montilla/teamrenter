import Link from "next/link";
import { Home, MapPin } from "lucide-react";

/**
 * No `neighbourhoods` table yet — Facelift layout with an honest empty state (no mock rows).
 */
export default function NeighbourhoodsPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h1
            className="mb-4 text-4xl font-bold text-[#0F1F38]"
            style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
          >
            Explore neighbourhoods
          </h1>
          <p className="max-w-2xl text-xl text-[#717182]">
            Neighbourhood guides need a dedicated index in the database (Phase 5). Until then,
            search by address and save properties to your shortlist from listing pages.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-[16px] border border-[#E2DDD6] bg-white">
            <div className="relative flex h-64 items-center justify-center bg-[linear-gradient(135deg,#334155_0%,#64748b_100%)]">
              <MapPin className="h-16 w-16 text-white/40" aria-hidden />
            </div>
            <div className="p-6">
              <h2
                className="mb-2 text-xl font-bold text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                City-wide search
              </h2>
              <p className="mb-6 text-[#717182]">
                Use filters on the search page to narrow by city, street, or management company.
              </p>
              <Link
                href="/search"
                className="inline-block font-semibold text-[#E8913A] hover:text-[#d17f2f]"
              >
                Go to search →
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#E2DDD6] bg-white">
            <div className="relative flex h-64 items-center justify-center bg-[linear-gradient(135deg,#0F1F38_0%,#1e3a5f_100%)]">
              <Home className="h-16 w-16 text-white/30" aria-hidden />
            </div>
            <div className="p-6">
              <h2
                className="mb-2 text-xl font-bold text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                Per-area pages
              </h2>
              <p className="mb-6 text-[#717182]">
                Deep neighbourhood profiles will link from here once data and RLS policies exist.
              </p>
              <span className="text-sm font-medium text-[#717182]">Coming in Phase 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
