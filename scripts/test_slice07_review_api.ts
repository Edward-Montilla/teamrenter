#!/usr/bin/env npx tsx
/**
 * Slice 07: Test the review submission API (POST /api/properties/[id]/reviews).
 * Prerequisites:
 *   - Supabase local or remote with migrations + seed applied
 *   - Livedin app running (e.g. npm run dev in livedin/) so BASE_URL works
 *
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SEED_PASSWORD (default: seedpassword)
 *      BASE_URL (default: http://localhost:3000)
 */
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string, def?: string): string {
  const value = process.env[name] ?? def;
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const password = getEnv("SUPABASE_SEED_PASSWORD", "seedpassword");
  const baseUrl = getEnv("BASE_URL", "http://localhost:3000");

  const supabase = createClient(supabaseUrl, anonKey);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: "verified@example.com",
    password,
  });
  if (signInError || !signInData.session?.access_token) {
    console.error("Sign-in failed. Run seed so verified@example.com exists.", signInError);
    process.exitCode = 1;
    return;
  }
  const token = signInData.session.access_token;

  const propertyId = "a0000004-0004-4000-8000-000000000004";
  const payload = {
    property_id: propertyId,
    management_responsiveness: 4,
    maintenance_timeliness: 4,
    listing_accuracy: 4,
    fee_transparency: 4,
    lease_clarity: 4,
    text_input: "Slice 07 API test",
    tenancy_start: null,
    tenancy_end: null,
  };

  const url = `${baseUrl}/api/properties/${propertyId}/reviews`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 201 && body.review_id) {
    console.log("PASS – POST review returned 201 with review_id:", body.review_id);
  } else {
    console.error("FAIL – expected 201 + review_id. Got", res.status, body);
    process.exitCode = 1;
    return;
  }

  const res2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body2 = await res2.json().catch(() => ({}));
  if (res2.status === 409) {
    console.log("PASS – duplicate submission returned 409");
  } else {
    console.error("FAIL – expected 409 for duplicate. Got", res2.status, body2);
    process.exitCode = 1;
  }
}

main();
