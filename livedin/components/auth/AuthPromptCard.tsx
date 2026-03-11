"use client";

import type { ReactNode } from "react";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";

type AuthPromptCardProps = {
  title: string;
  description: ReactNode;
  primaryAction?: Parameters<typeof FeedbackPanel>[0]["primaryAction"];
  secondaryAction?: Parameters<typeof FeedbackPanel>[0]["secondaryAction"];
};

export function AuthPromptCard({
  title,
  description,
  primaryAction,
  secondaryAction,
}: AuthPromptCardProps) {
  return (
    <FeedbackPanel
      title={title}
      description={description}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    />
  );
}
