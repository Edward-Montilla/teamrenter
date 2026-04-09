"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { FaceliftPropertyCard } from "@/components/facelift/FaceliftPropertyCard";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { propertyDetailToListItem } from "@/lib/property-detail-to-list-item";
import { readShortlistIds, writeShortlistIds } from "@/lib/shortlist-local";
import type { PropertyDetailPublic, PropertyListItem } from "@/lib/types";

type Phase = "checking" | "ready";

/**
 * Auth gate uses the browser Supabase session (localStorage). There is no cookie
 * middleware yet; unauthenticated users are redirected client-side to /sign-in.
 *
 * Shortlist is client-only until `user_property_shortlist` + API (Phase 5).
 */
export function DashboardClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [activeTab, setActiveTab] = useState<"shortlist" | "reviews">("shortlist");
  const [shortlistItems, setShortlistItems] = useState<PropertyListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [shortlistVersion, setShortlistVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/sign-in?redirect=/dashboard");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        router.replace("/sign-in?redirect=/dashboard");
        return;
      }

      const ids = readShortlistIds();
      setLoadingList(true);
      if (ids.length === 0) {
        if (!cancelled) {
          setShortlistItems([]);
          setLoadingList(false);
          setPhase("ready");
        }
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/properties/${id}`);
          if (!res.ok) return null;
          const detail = (await res.json()) as PropertyDetailPublic;
          return propertyDetailToListItem(detail);
        }),
      );

      if (!cancelled) {
        setShortlistItems(results.filter((x): x is PropertyListItem => x != null));
        setLoadingList(false);
        setPhase("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, shortlistVersion]);

  const handleHeartClick = (id: string) => {
    const ids = readShortlistIds();
    const next = ids.filter((x) => x !== id);
    writeShortlistIds(next);
    setShortlistVersion((v) => v + 1);
  };

  if (phase === "checking") {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-[#717182]">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="bg-[#F7F4EF] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h1
            className="mb-2 text-4xl font-bold text-[#0F1F38]"
            style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
          >
            My dashboard
          </h1>
          <p className="text-[#717182]">
            Shortlist is stored in this browser until server persistence ships (Phase 5).
          </p>
        </div>

        <div className="mb-8 flex gap-4 border-b border-[#E2DDD6]">
          <button
            type="button"
            onClick={() => setActiveTab("shortlist")}
            className={`relative flex items-center gap-2 px-6 pb-4 font-semibold transition-colors ${
              activeTab === "shortlist" ? "text-[#E8913A]" : "text-[#717182] hover:text-[#0F1F38]"
            }`}
          >
            <Heart className="h-5 w-5" />
            Shortlist ({shortlistItems.length})
            {activeTab === "shortlist" ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8913A]" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`relative flex items-center gap-2 px-6 pb-4 font-semibold transition-colors ${
              activeTab === "reviews" ? "text-[#E8913A]" : "text-[#717182] hover:text-[#0F1F38]"
            }`}
          >
            <FileText className="h-5 w-5" />
            My reviews
            {activeTab === "reviews" ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8913A]" />
            ) : null}
          </button>
        </div>

        {activeTab === "shortlist" ? (
          <div>
            {loadingList ? (
              <p className="text-[#717182]">Loading saved properties…</p>
            ) : shortlistItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shortlistItems.map((item) => (
                  <FaceliftPropertyCard
                    key={item.id}
                    item={item}
                    onHeartClick={handleHeartClick}
                    isShortlisted
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-12 text-center">
                <Heart className="mx-auto mb-4 h-16 w-16 text-[#E2DDD6]" />
                <h3
                  className="mb-2 text-xl font-semibold text-[#0F1F38]"
                  style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                >
                  No properties shortlisted yet
                </h3>
                <p className="mb-6 text-[#717182]">
                  Save hearts from property pages or search results to build your list.
                </p>
                <Link
                  href="/search"
                  className="inline-block rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f]"
                >
                  Browse properties
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-[#E2DDD6]" />
            <h3
              className="mb-2 text-xl font-semibold text-[#0F1F38]"
              style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
            >
              Review history
            </h3>
            <p className="text-[#717182]">
              A per-user review history view will connect here when the product API exposes it.
              You can still submit reviews from any property page.
            </p>
            <Link
              href="/submit-review/new"
              className="mt-6 inline-block font-semibold text-[#E8913A] hover:text-[#d17f2f]"
            >
              Write a review →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
