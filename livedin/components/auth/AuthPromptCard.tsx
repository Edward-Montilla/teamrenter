"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Action =
  | {
      label: string;
      href: string;
    }
  | {
      label: string;
      onClick: () => void | Promise<void>;
      disabled?: boolean;
    };

type AuthPromptCardProps = {
  title: string;
  description: ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
};

function ActionButton({
  action,
  variant,
}: {
  action: Action;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
      : "inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50";

  if ("href" in action) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void action.onClick()}
      disabled={action.disabled}
      className={className}
    >
      {action.label}
    </button>
  );
}

export function AuthPromptCard({
  title,
  description,
  primaryAction,
  secondaryAction,
}: AuthPromptCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {primaryAction && (
            <ActionButton action={primaryAction} variant="primary" />
          )}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="secondary" />
          )}
        </div>
      )}
    </div>
  );
}
