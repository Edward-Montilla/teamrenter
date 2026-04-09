/**
 * Validation for shortlist inputs (Slice 50).
 */

import type { ShortlistToggleInput } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ShortlistValidationErrors = Record<string, string>;

export function validateShortlistToggle(
  input: Partial<ShortlistToggleInput>
): { valid: boolean; errors: ShortlistValidationErrors } {
  const errors: ShortlistValidationErrors = {};

  const propertyId =
    typeof input.property_id === "string" ? input.property_id.trim() : "";
  if (!propertyId) {
    errors.property_id = "property_id is required.";
  } else if (!UUID_RE.test(propertyId)) {
    errors.property_id = "property_id must be a valid UUID.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
