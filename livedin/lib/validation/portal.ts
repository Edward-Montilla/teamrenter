/**
 * Validation for portal-specific inputs (Slice 50).
 */

import type { ReviewResponseCreateInput, TeamMemberInviteInput } from "@/lib/types";

const RESPONSE_BODY_MAX = 1000;
const VALID_TEAM_ROLES = ["viewer", "editor", "admin"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PortalValidationErrors = Record<string, string>;

export function validateReviewResponse(
  input: Partial<ReviewResponseCreateInput>
): { valid: boolean; errors: PortalValidationErrors } {
  const errors: PortalValidationErrors = {};

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!body) {
    errors.body = "Response body is required.";
  } else if (body.length > RESPONSE_BODY_MAX) {
    errors.body = `Response body must be ${RESPONSE_BODY_MAX} characters or less.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTeamInvite(
  input: Partial<TeamMemberInviteInput>
): { valid: boolean; errors: PortalValidationErrors } {
  const errors: PortalValidationErrors = {};

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const role = input.role as string;
  if (!role) {
    errors.role = "Role is required.";
  } else if (!(VALID_TEAM_ROLES as readonly string[]).includes(role)) {
    errors.role = "Role must be viewer, editor, or admin.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
