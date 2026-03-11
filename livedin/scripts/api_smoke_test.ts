import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { GET as getAdminMe } from "../app/api/admin/me/route";
import {
  GET as getAdminProperties,
  POST as postAdminProperty,
} from "../app/api/admin/properties/route";
import {
  GET as getAdminProperty,
  PATCH as patchAdminProperty,
} from "../app/api/admin/properties/[id]/route";
import { GET as getPropertyDetail } from "../app/api/properties/[id]/route";
import { POST as postReview } from "../app/api/properties/[id]/reviews/route";
import { GET as getProperties } from "../app/api/properties/route";

type TestFn = () => Promise<void>;
type Credentials = {
  email: string;
  password: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const defaultPropertyId = "a0000001-0001-4000-8000-000000000001";

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFileFromDisk() {
  const configuredPath = process.env.API_TEST_ENV_FILE;
  const candidates = configuredPath
    ? [configuredPath]
    : [".env.prod", ".env.local", ".env"];

  for (const candidate of candidates) {
    const absolutePath = path.isAbsolute(candidate)
      ? candidate
      : path.join(appDir, candidate);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const contents = readFileSync(absolutePath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = stripWrappingQuotes(rawValue);
    }

    console.log(`Loaded env vars from ${path.relative(appDir, absolutePath) || absolutePath}`);
    return;
  }
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createAnonClient(): SupabaseClient {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_ANON_KEY"));
}

function createRequest(
  url: string,
  init?: RequestInit,
  token?: string,
): NextRequest {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new NextRequest(
    new Request(url, {
      ...init,
      headers,
    }),
  );
}

async function signIn(email: string, password: string): Promise<string> {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session?.access_token) {
    throw new Error(
      error?.message ??
        `Failed to sign in ${email}. Seed your Supabase project or set explicit test credentials.`,
    );
  }
  return data.session.access_token;
}

async function trySignIn(label: string, credentials: Credentials | null): Promise<string | null> {
  if (!credentials) {
    return null;
  }

  try {
    return await signIn(credentials.email, credentials.password);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown authentication error";
    console.warn(
      `WARN - Skipping ${label} checks because sign-in failed for ${credentials.email}: ${message}`,
    );
    return null;
  }
}

async function runTest(name: string, fn: TestFn) {
  try {
    await fn();
    console.log(`PASS - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function skipTest(name: string, reason: string) {
  console.log(`SKIP - ${name} (${reason})`);
}

async function expectJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function getCredentials(prefix: "ADMIN_TEST" | "PUBLIC_TEST" | "REVIEW_TEST", defaultEmail: string): Credentials | null {
  const email = process.env[`${prefix}_EMAIL`] ?? defaultEmail;
  const password =
    process.env[`${prefix}_PASSWORD`] ?? process.env.SUPABASE_SEED_PASSWORD ?? null;

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

async function main() {
  loadEnvFileFromDisk();

  let smokePropertyId = process.env.API_TEST_PROPERTY_ID || defaultPropertyId;
  const adminCredentials = getCredentials("ADMIN_TEST", "admin@example.com");
  const publicCredentials = getCredentials("PUBLIC_TEST", "public@example.com");
  const reviewCredentials = getCredentials("REVIEW_TEST", "verified@example.com");

  const adminToken = await trySignIn("admin", adminCredentials);
  const verifiedToken = await trySignIn("verified review", reviewCredentials);
  const publicToken = await trySignIn("non-verified", publicCredentials);

  let tempPropertyId: string | null = null;

  await runTest("Properties API returns active properties", async () => {
    const res = await getProperties(
      createRequest("http://localhost:3000/api/properties?q=Toronto"),
    );
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }

    const json = (await res.json()) as {
      items: Array<{ id?: string; status?: string; city?: string }>;
      total: number;
    };
    if (!Array.isArray(json.items) || json.items.length === 0) {
      throw new Error("Expected at least one property in search results.");
    }
    if (typeof json.total !== "number" || json.total < json.items.length) {
      throw new Error("Properties API returned an invalid total.");
    }

    if (!process.env.API_TEST_PROPERTY_ID && json.items[0]?.id) {
      smokePropertyId = json.items[0].id;
    }
  });

  await runTest("Property detail API returns an active property", async () => {
    const res = await getPropertyDetail(
      createRequest(`http://localhost:3000/api/properties/${smokePropertyId}`),
      {
        params: Promise.resolve({
          id: smokePropertyId,
        }),
      },
    );
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }

    const json = (await res.json()) as {
      property?: { id?: string };
      aggregates?: { review_count?: number };
    };
    if (json.property?.id !== smokePropertyId) {
      throw new Error("Property detail response returned the wrong property.");
    }
    if (typeof json.aggregates?.review_count !== "number") {
      throw new Error("Property detail response is missing aggregates.");
    }
  });

  await runTest("Review API rejects anonymous users", async () => {
    const res = await postReview(
      createRequest(`http://localhost:3000/api/properties/${smokePropertyId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: smokePropertyId,
          management_responsiveness: 4,
          maintenance_timeliness: 4,
          listing_accuracy: 4,
          fee_transparency: 4,
          lease_clarity: 4,
          text_input: null,
          tenancy_start: null,
          tenancy_end: null,
        }),
      }),
      {
        params: Promise.resolve({
          id: smokePropertyId,
        }),
      },
    );
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  if (publicToken) {
    await runTest("Review API rejects unverified users", async () => {
      const res = await postReview(
        createRequest(
          `http://localhost:3000/api/properties/${smokePropertyId}/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              property_id: smokePropertyId,
              management_responsiveness: 4,
              maintenance_timeliness: 4,
              listing_accuracy: 4,
              fee_transparency: 4,
              lease_clarity: 4,
              text_input: null,
              tenancy_start: null,
              tenancy_end: null,
            }),
          },
          publicToken,
        ),
        {
          params: Promise.resolve({
            id: smokePropertyId,
          }),
        },
      );
      if (res.status !== 403) {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    });
  } else {
    skipTest(
      "Review API rejects unverified users",
      "set PUBLIC_TEST_EMAIL/PUBLIC_TEST_PASSWORD or SUPABASE_SEED_PASSWORD",
    );
  }

  if (adminToken) {
    await runTest("Admin auth and CRUD routes work", async () => {
      const meRes = await getAdminMe(
        createRequest("http://localhost:3000/api/admin/me", undefined, adminToken),
      );
      if (meRes.status !== 200) {
        throw new Error(`Expected admin /me to return 200, got ${meRes.status}`);
      }

      const createRes = await postAdminProperty(
        createRequest(
          "http://localhost:3000/api/admin/properties",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              display_name: `Smoke Test Property ${Date.now()}`,
              address_line1: "500 Test Ave",
              city: "Toronto",
              province: "ON",
              postal_code: "M5V 8T1",
              management_company: "Smoke Test Management",
              status: "active",
            }),
          },
          adminToken,
        ),
      );
      if (createRes.status !== 201) {
        const error = await expectJson(createRes);
        throw new Error(
          `Expected admin property create to return 201, got ${createRes.status}: ${String(
            error.message ?? "unknown error",
          )}`,
        );
      }

      const createJson = (await createRes.json()) as { id?: string };
      if (!createJson.id) {
        throw new Error("Admin property create returned no property id.");
      }
      const createdPropertyId = createJson.id;
      tempPropertyId = createdPropertyId;

      const listRes = await getAdminProperties(
        createRequest(
          "http://localhost:3000/api/admin/properties",
          undefined,
          adminToken,
        ),
      );
      const listJson = (await listRes.json()) as {
        items?: Array<{ id: string }>;
      };
      if (!listJson.items?.some((item) => item.id === createdPropertyId)) {
        throw new Error("Admin property list did not include the created property.");
      }

      const detailRes = await getAdminProperty(
        createRequest(
          `http://localhost:3000/api/admin/properties/${createdPropertyId}`,
          undefined,
          adminToken,
        ),
        { params: Promise.resolve({ id: createdPropertyId }) },
      );
      if (detailRes.status !== 200) {
        throw new Error(`Expected admin property detail to return 200, got ${detailRes.status}`);
      }

      const patchRes = await patchAdminProperty(
        createRequest(
          `http://localhost:3000/api/admin/properties/${createdPropertyId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "inactive",
            }),
          },
          adminToken,
        ),
        { params: Promise.resolve({ id: createdPropertyId }) },
      );
      if (patchRes.status !== 200) {
        throw new Error(`Expected admin property patch to return 200, got ${patchRes.status}`);
      }
    });
  } else {
    skipTest(
      "Admin auth and CRUD routes work",
      "set ADMIN_TEST_EMAIL/ADMIN_TEST_PASSWORD or SUPABASE_SEED_PASSWORD",
    );
  }

  if (verifiedToken && tempPropertyId) {
    const reviewPropertyId = tempPropertyId;
    await runTest("Review API accepts verified users on a new property", async () => {
      const res = await postReview(
        createRequest(
          `http://localhost:3000/api/properties/${reviewPropertyId}/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              property_id: reviewPropertyId,
              management_responsiveness: 4,
              maintenance_timeliness: 4,
              listing_accuracy: 4,
              fee_transparency: 4,
              lease_clarity: 4,
              text_input: "Smoke test review",
              tenancy_start: "2024-01-01",
              tenancy_end: "2024-12-31",
            }),
          },
          verifiedToken,
        ),
        { params: Promise.resolve({ id: reviewPropertyId }) },
      );
      if (res.status !== 201) {
        const error = await expectJson(res);
        throw new Error(
          `Expected verified review create to return 201, got ${res.status}: ${String(
            error.message ?? "unknown error",
          )}`,
        );
      }

      const duplicateRes = await postReview(
        createRequest(
          `http://localhost:3000/api/properties/${reviewPropertyId}/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              property_id: reviewPropertyId,
              management_responsiveness: 4,
              maintenance_timeliness: 4,
              listing_accuracy: 4,
              fee_transparency: 4,
              lease_clarity: 4,
              text_input: "Duplicate smoke test review",
              tenancy_start: "2024-01-01",
              tenancy_end: "2024-12-31",
            }),
          },
          verifiedToken,
        ),
        { params: Promise.resolve({ id: reviewPropertyId }) },
      );
      if (duplicateRes.status !== 409) {
        throw new Error(`Expected duplicate review to return 409, got ${duplicateRes.status}`);
      }
    });
  } else if (verifiedToken && process.env.API_TEST_REVIEW_PROPERTY_ID) {
    await runTest("Review API accepts verified users with a supplied property id", async () => {
      const propertyId = process.env.API_TEST_REVIEW_PROPERTY_ID as string;
      const res = await postReview(
        createRequest(
          `http://localhost:3000/api/properties/${propertyId}/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              property_id: propertyId,
              management_responsiveness: 4,
              maintenance_timeliness: 4,
              listing_accuracy: 4,
              fee_transparency: 4,
              lease_clarity: 4,
              text_input: "Smoke test review",
              tenancy_start: "2024-01-01",
              tenancy_end: "2024-12-31",
            }),
          },
          verifiedToken,
        ),
        { params: Promise.resolve({ id: propertyId }) },
      );
      if (res.status !== 201 && res.status !== 409) {
        const error = await expectJson(res);
        throw new Error(
          `Expected verified review create to return 201 or 409, got ${res.status}: ${String(
            error.message ?? "unknown error",
          )}`,
        );
      }
    });
  } else {
    skipTest(
      "Review API accepts verified users on a new property",
      "set review credentials plus admin credentials, or provide API_TEST_REVIEW_PROPERTY_ID",
    );
  }

  if (tempPropertyId && adminCredentials) {
    const adminClient = createAnonClient();
    const { error: signInError } = await adminClient.auth.signInWithPassword({
      email: adminCredentials.email,
      password: adminCredentials.password,
    });
    if (signInError) {
      throw signInError;
    }

    await adminClient.from("properties").delete().eq("id", tempPropertyId);
  }
}

main().catch((error) => {
  console.error("Unexpected error running API smoke tests", error);
  process.exit(1);
});
