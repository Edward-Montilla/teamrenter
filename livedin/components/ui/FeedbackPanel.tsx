"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { UiFeedbackTone } from "@/lib/types";
import {
  cn,
  feedbackToneClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui";

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

type FeedbackPanelProps = {
  tone?: UiFeedbackTone;
  title?: string;
  description: ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
  className?: string;
  role?: "status" | "alert";
};

function FeedbackAction({
  action,
  variant,
}: {
  action: Action;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary" ? primaryButtonClass : secondaryButtonClass;

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

export function FeedbackPanel({
  tone = "info",
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  role = tone === "error" ? "alert" : "status",
}: FeedbackPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        feedbackToneClass(tone),
        className,
      )}
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
    >
      {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
      <div className={cn("text-sm leading-6", title ? "mt-2" : "")}>
        {description}
      </div>
      {primaryAction || secondaryAction ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {primaryAction ? (
            <FeedbackAction action={primaryAction} variant="primary" />
          ) : null}
          {secondaryAction ? (
            <FeedbackAction action={secondaryAction} variant="secondary" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
