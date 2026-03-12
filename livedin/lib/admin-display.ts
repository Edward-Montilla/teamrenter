import type {
  AdminRoleRequestState,
  CurrentUserRole,
  DistilledInsightStatus,
  ReviewStatus,
} from "@/lib/types";

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function summarizeUser(userId: string): string {
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

export function formatBytes(value: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function roleBadgeClass(role: CurrentUserRole): string {
  switch (role) {
    case "admin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "verified":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function reviewStatusBadgeClass(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "removed":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function insightStatusBadgeClass(status: DistilledInsightStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "hidden":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function requestStatusBadgeClass(status: AdminRoleRequestState): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function propertyStatusBadgeClass(status: "active" | "inactive"): string {
  return status === "active"
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}
