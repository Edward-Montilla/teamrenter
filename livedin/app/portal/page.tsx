"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass } from "@/lib/ui";

export default function PortalPage() {
  const [items, setItems] = useState<PortfolioPropertyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPortfolioProperties()
      .then((response) => setItems(response.properties))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load portfolio."),
      );
  }, []);

  const averageTrust = useMemo(() => {
    if (items.length === 0) return "0.0";
    return (
      items.reduce((sum, item) => sum + item.trustscore_display_0_5, 0) /
      items.length
    ).toFixed(1);
  }, [items]);

  return (
    <div className="space-y-6">
      <section className={`${sectionCardClass} p-6`}>
        <h1 className="text-2xl font-semibold">Portfolio dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {items.length} properties · average trust score {averageTrust}/5
        </p>
      </section>
      {error ? (
        <section className={`${sectionCardClass} border-red-200 p-6`}>
          <p className="text-red-700">{error}</p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className={`${sectionCardClass} p-5`}>
              <h2 className="font-semibold">{item.display_name}</h2>
              <p className="text-sm text-zinc-500">
                {item.address_line1}, {item.city}, {item.province}
              </p>
              <p className="mt-2 text-sm">
                Trust {item.trustscore_display_0_5}/5 · {item.review_count} reviews
              </p>
              <div className="mt-3 flex gap-2">
                <Link href={`/portal/performance?propertyId=${item.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">
                  Performance
                </Link>
                <Link href={`/portal/reviews?propertyId=${item.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">
                  Reviews
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass } from "@/lib/ui";
export default function PortalPage() {
  const [items, setItems] = useState<PortfolioPropertyItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetchPortfolioProperties().then((r) => setItems(r.properties)).catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load")); }, []);
  return <section className={`${sectionCardClass} p-6`}><h1 className="text-2xl font-semibold">Dashboard</h1>{error ? <p className="mt-3 text-red-700">{error}</p> : <p className="mt-3 text-sm text-zinc-600">{items.length} properties in portfolio</p>}</section>;
}
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass } from "@/lib/ui";

export default function PortalPage() {
  const [items, setItems] = useState<PortfolioPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; void fetchPortfolioProperties().then((res) => active && setItems(res.properties)).catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Failed to load portfolio.")).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  const avg = useMemo(() => items.length ? (items.reduce((s, i) => s + i.trustscore_display_0_5, 0) / items.length).toFixed(1) : "0.0", [items]);
  return <div className="space-y-6"><section className={`${sectionCardClass} p-6`}><h1 className="text-2xl font-semibold">Portfolio dashboard</h1><p className="mt-1 text-sm text-zinc-500">Trust scores and review volume.</p></section>
  {loading ? <section className={`${sectionCardClass} p-6`}><p className="text-zinc-500">Loading…</p></section> : error ? <section className={`${sectionCardClass} border-red-200 p-6`}><p className="text-red-700">{error}</p></section> : <section className="grid gap-4 lg:grid-cols-2">{items.map((p) => <article key={p.id} className={`${sectionCardClass} p-5`}><h2 className="font-semibold">{p.display_name}</h2><p className="text-sm text-zinc-500">{p.address_line1}, {p.city}, {p.province}</p><p className="mt-2 text-sm">Trust {p.trustscore_display_0_5}/5 · {p.review_count} reviews</p><div className="mt-3 flex gap-2"><Link href={`/portal/performance?propertyId=${p.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Performance</Link><Link href={`/portal/reviews?propertyId=${p.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Reviews</Link></div></article>)}</section>}
  <p className="text-sm text-zinc-500">Portfolio average trust: {avg}/5</p></div>;
}
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass } from "@/lib/ui";

export default function PortalDashboardPage() {
  const [items, setItems] = useState<PortfolioPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; void fetchPortfolioProperties().then((res) => {
    if (!active) return; setItems(res.properties); setError(null);
  }).catch((e: unknown) => {
    if (!active) return; setError(e instanceof Error ? e.message : "Failed to load portfolio.");
  }).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  const stats = useMemo(() => ({ total: items.length, reviews: items.reduce((s, i) => s + i.review_count, 0), avg: items.length ? (items.reduce((s, i) => s + i.trustscore_display_0_5, 0) / items.length).toFixed(1) : "0.0" }), [items]);
  return <div className="space-y-6"><section className={`${sectionCardClass} p-6`}><h1 className="text-2xl font-semibold">Portfolio dashboard</h1><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs uppercase text-zinc-500">Properties</p><p className="text-xl font-semibold">{stats.total}</p></div><div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs uppercase text-zinc-500">Reviews</p><p className="text-xl font-semibold">{stats.reviews}</p></div><div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs uppercase text-zinc-500">Avg trust</p><p className="text-xl font-semibold">{stats.avg} / 5</p></div></div></section>
  {loading ? <section className={`${sectionCardClass} p-6`}><p className="text-zinc-500">Loading portfolio…</p></section> : error ? <section className={`${sectionCardClass} border-red-200 p-6`}><p className="text-red-700">{error}</p></section> : items.length === 0 ? <section className={`${sectionCardClass} p-6`}><p className="text-zinc-600">No properties assigned.</p></section> : <section className="grid gap-4 lg:grid-cols-2">{items.map((p) => <article key={p.id} className={`${sectionCardClass} p-5`}><h2 className="font-semibold">{p.display_name}</h2><p className="text-sm text-zinc-500">{p.address_line1}, {p.city}, {p.province}</p><div className="mt-3 flex gap-2 text-sm"><span className="rounded-full bg-zinc-100 px-3 py-1">Trust {p.trustscore_display_0_5}/5</span><span className="rounded-full bg-zinc-100 px-3 py-1">{p.review_count} reviews</span></div><div className="mt-4 flex gap-2"><Link href={`/portal/performance?propertyId=${p.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Performance</Link><Link href={`/portal/reviews?propertyId=${p.id}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Reviews</Link></div></article>)}</section>}
  </div>;
}
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass } from "@/lib/ui";

export default function PortalDashboardPage() {
  const [items, setItems] = useState<PortfolioPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchPortfolioProperties()
      .then((res) => {
        if (!active) return;
        setItems(res.properties);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load portfolio.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const reviewCount = items.reduce((sum, item) => sum + item.review_count, 0);
    const avgScore =
      items.length > 0
        ? (
            items.reduce((sum, item) => sum + item.trustscore_display_0_5, 0) /
            items.length
          ).toFixed(1)
        : "0.0";
    return { reviewCount, avgScore };
  }, [items]);

  return (
    <div className="space-y-6">
      <section className={`${sectionCardClass} p-6`}>
        <h1 className="text-2xl font-semibold">Portfolio dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor trust scores, review volume, and route into analytics for each managed property.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Properties</p>
            <p className="mt-1 text-xl font-semibold">{items.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total reviews</p>
            <p className="mt-1 text-xl font-semibold">{totals.reviewCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Average trust score</p>
            <p className="mt-1 text-xl font-semibold">{totals.avgScore} / 5</p>
          </div>
        </div>
      </section>

      {loading ? (
        <section className={`${sectionCardClass} p-6`}>
          <p className="text-zinc-500">Loading portfolio properties…</p>
        </section>
      ) : error ? (
        <section className={`${sectionCardClass} border-red-200 p-6`}>
          <p className="text-red-700">{error}</p>
        </section>
      ) : items.length === 0 ? (
        <section className={`${sectionCardClass} p-6`}>
          <p className="text-zinc-600">No properties are assigned to your portfolio yet.</p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {items.map((property) => (
            <article key={property.id} className={`${sectionCardClass} p-5`}>
              <h2 className="text-lg font-semibold">{property.display_name}</h2>
              <p className="text-sm text-zinc-500">
                {property.address_line1}, {property.city}, {property.province}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="rounded-full bg-zinc-100 px-3 py-1">
                  Trust score: {property.trustscore_display_0_5} / 5
                </span>
                <span className="rounded-full bg-zinc-100 px-3 py-1">
                  Reviews: {property.review_count}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/portal/performance?propertyId=${property.id}`}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  View performance
                </Link>
                <Link
                  href={`/portal/reviews?propertyId=${property.id}`}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Review feed
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
