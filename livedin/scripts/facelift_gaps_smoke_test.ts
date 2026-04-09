/**
 * Smoke test for Facelift gap closure: public HTML routes return 200 and include
 * expected markers (no Playwright). Requires a running dev server or production URL.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npx tsx scripts/facelift_gaps_smoke_test.ts
 */

const base = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type Check = { name: string; path: string; expect: RegExp };

const checks: Check[] = [
  {
    name: "Home (facelift shell)",
    path: "/",
    expect: /data-ui="facelift"|TrustScore|LivedIn/i,
  },
  {
    name: "Search",
    path: "/search",
    expect: /data-ui="facelift"|Search|properties/i,
  },
  {
    name: "Sign-in (Facelift card)",
    path: "/sign-in",
    expect: /Welcome back|Sign in|data-ui="facelift"/i,
  },
  {
    name: "Submit review flow entry",
    path: "/submit-review/new",
    expect: /Write a review|Choose property|data-ui="facelift"/i,
  },
  {
    name: "Dashboard (auth gate client)",
    path: "/dashboard",
    expect: /My dashboard|Loading your dashboard|data-ui="facelift"/i,
  },
  {
    name: "Neighbourhoods (empty state)",
    path: "/neighbourhoods",
    expect: /Explore neighbourhoods|Phase 5|data-ui="facelift"/i,
  },
  {
    name: "Comparison (empty or table)",
    path: "/comparison",
    expect: /Compare properties|data-ui="facelift"/i,
  },
];

async function fetchText(path: string): Promise<{ status: number; text: string }> {
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "text/html" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function fetchJsonPropertyId(): Promise<string | null> {
  try {
    const res = await fetch(`${base}/api/properties?q=`);
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ id?: string }> };
    return data.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function main() {
  let failed = false;
  console.log(`Facelift gaps smoke test against ${base}\n`);

  for (const c of checks) {
    try {
      const { status, text } = await fetchText(c.path);
      if (status !== 200) {
        console.error(`FAIL - ${c.name}: HTTP ${status} for ${c.path}`);
        failed = true;
        continue;
      }
      if (!c.expect.test(text)) {
        console.error(`FAIL - ${c.name}: body did not match ${c.expect}`);
        failed = true;
        continue;
      }
      console.log(`PASS - ${c.name}`);
    } catch (e) {
      console.error(`FAIL - ${c.name}:`, e);
      failed = true;
    }
  }

  const pid = await fetchJsonPropertyId();
  if (pid) {
    const name = "Property detail (TrustScore + seven categories)";
    try {
      const { status, text } = await fetchText(`/properties/${pid}`);
      if (status !== 200) {
        console.error(`FAIL - ${name}: HTTP ${status}`);
        failed = true;
      } else if (
        !/TrustScore|Landlord Responsiveness|Value for Money|data-ui="facelift"/i.test(
          text,
        )
      ) {
        console.error(`FAIL - ${name}: missing expected markers`);
        failed = true;
      } else {
        console.log(`PASS - ${name}`);
      }
    } catch (e) {
      console.error(`FAIL - ${name}:`, e);
      failed = true;
    }
  } else {
    console.log(
      "SKIP - Property detail (no property id from GET /api/properties?q=)",
    );
  }

  if (failed) {
    process.exit(1);
  }
  console.log("\nAll runnable checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
