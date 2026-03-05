/**
 * One-off script to get a JWT for testing the review submission API (Slice 07).
 *
 * Usage from livedin (load .env.prod or .env.local first):
 *   npx tsx scripts/get-review-test-jwt.ts
 *   # with env: REVIEW_TEST_EMAIL, REVIEW_TEST_PASSWORD (and SUPABASE_URL, SUPABASE_ANON_KEY from env file)
 *
 * Or inline:
 *   REVIEW_TEST_EMAIL=... REVIEW_TEST_PASSWORD=... npx tsx scripts/get-review-test-jwt.ts
 *
 * Requires: SUPABASE_URL, SUPABASE_ANON_KEY, REVIEW_TEST_EMAIL, REVIEW_TEST_PASSWORD
 * Prints: the access_token (use as Authorization: Bearer <token>)
 */

import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function main() {
  const url = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const email = getEnv("REVIEW_TEST_EMAIL");
  const password = getEnv("REVIEW_TEST_PASSWORD");

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Sign-in failed:", error.message);
    process.exit(1);
  }

  const token = data.session?.access_token;
  if (!token) {
    console.error("No access_token in session.");
    process.exit(1);
  }

  console.log(token);
}

main();
