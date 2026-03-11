import type {
  AdminRoleRequestState,
  AdminRoleRequestStatusResponse,
  CurrentUserRole,
} from "@/lib/types";

type StoredAdminRoleRequest = {
  id: string;
  reason: string;
  team_context: string | null;
  status: Exclude<AdminRoleRequestState, "none">;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseCsvEnv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailEligibleForAdminRequest(email: string | null | undefined): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const exactEmails = parseCsvEnv(process.env.ADMIN_REQUEST_ALLOWLIST_EMAILS);
  if (exactEmails.includes(normalizedEmail)) {
    return true;
  }

  const domain = normalizedEmail.split("@")[1] ?? "";
  const allowedDomains = parseCsvEnv(process.env.ADMIN_REQUEST_ALLOWLIST_DOMAINS);
  return allowedDomains.includes(domain);
}

export function buildAdminRequestStatus(params: {
  currentRole: CurrentUserRole;
  email: string | null | undefined;
  latestRequest: StoredAdminRoleRequest | null;
  bootstrapRequired: boolean;
  bootstrapEligible: boolean;
}): AdminRoleRequestStatusResponse {
  const {
    currentRole,
    email,
    latestRequest,
    bootstrapRequired,
    bootstrapEligible,
  } = params;
  const requestStatus = latestRequest?.status ?? "none";

  return {
    eligible: isEmailEligibleForAdminRequest(email),
    hasActiveRequest: requestStatus === "pending",
    requestStatus,
    currentRole,
    bootstrapRequired,
    bootstrapEligible,
    latestRequest,
  };
}
