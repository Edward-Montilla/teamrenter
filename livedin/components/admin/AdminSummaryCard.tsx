"use client";

import Link from "next/link";
import { cn, mutedCardClass, secondaryButtonClass } from "@/lib/ui";

type AdminSummaryCardProps = {
  label: string;
  value: string | number;
  description: string;
  href?: string;
  ctaLabel?: string;
  className?: string;
};

export function AdminSummaryCard({
  label,
  value,
  description,
  href,
  ctaLabel,
  className,
}: AdminSummaryCardProps) {
  return (
    <section className={cn(`${mutedCardClass} p-5`, className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {href && ctaLabel ? (
        <div className="mt-4">
          <Link href={href} className={secondaryButtonClass}>
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
