import type { SupabaseClient } from "@supabase/supabase-js";
import type { DistilledInsightStatus } from "./types";

type ApprovedReviewSourceRow = {
  property_id: string;
  text_input: string | null;
  management_responsiveness: number;
  maintenance_timeliness: number;
  listing_accuracy: number;
  fee_transparency: number;
  lease_clarity: number;
};

type PropertyRow = {
  id: string;
};

type DistilledInsightRow = {
  property_id: string;
  insights_text: string;
  status: DistilledInsightStatus;
  screened: boolean;
  screening_flags: Record<string, unknown> | null;
  last_generated_at: string;
  screened_at: string | null;
  updated_at: string;
};

type ThemeDefinition = {
  label: string;
  patterns: RegExp[];
};

export type DistilledInsightRecomputeResult =
  | {
      ok: true;
      insight: DistilledInsightRow;
      source_review_count: number;
    }
  | {
      ok: false;
      code: "property_not_found" | "no_source_reviews";
      message: string;
    };

const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    label: "maintenance follow-through",
    patterns: [/maintenance/i, /repair/i, /fix(?:ed|es|ing)?/i, /work order/i],
  },
  {
    label: "management communication",
    patterns: [/communicat/i, /responsive/i, /response/i, /manager/i, /landlord/i],
  },
  {
    label: "fee clarity",
    patterns: [/fee/i, /deposit/i, /charge/i, /bill/i, /utility/i, /rent increase/i],
  },
  {
    label: "lease expectations",
    patterns: [/lease/i, /renew/i, /policy/i, /notice/i, /terms?/i],
  },
  {
    label: "building condition",
    patterns: [/clean/i, /mold/i, /pest/i, /noise/i, /smell/i, /hallway/i],
  },
  {
    label: "amenities and parking",
    patterns: [/parking/i, /laundry/i, /gym/i, /elevator/i, /amenit/i],
  },
  {
    label: "safety and security",
    patterns: [/safe/i, /security/i, /lock/i, /break-?in/i, /lighting/i],
  },
];

const FLAGGED_CONTENT_PATTERNS = [
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "phone", pattern: /(?:\+?\d[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}\b/ },
  { label: "url", pattern: /https?:\/\/\S+/i },
  { label: "unit_reference", pattern: /\b(?:unit|apt|apartment|suite|#)\s*[a-z0-9-]+\b/i },
  { label: "full_name_phrase", pattern: /\b(?:my landlord|property manager)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/ },
];

const POSITIVE_METRIC_LABELS = {
  management_responsiveness: "management responsiveness",
  maintenance_timeliness: "maintenance timeliness",
  listing_accuracy: "listing accuracy",
  fee_transparency: "fee transparency",
  lease_clarity: "lease clarity",
} as const;

type MetricKey = keyof typeof POSITIVE_METRIC_LABELS;

function normalizeReviewText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getThemeHits(texts: string[]): Array<{ label: string; count: number }> {
  return THEME_DEFINITIONS.map((theme) => ({
    label: theme.label,
    count: texts.reduce((total, text) => {
      return total + (theme.patterns.some((pattern) => pattern.test(text)) ? 1 : 0);
    }, 0),
  }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getMetricAverages(rows: ApprovedReviewSourceRow[]): Record<MetricKey, number> {
  const total = rows.length || 1;
  return {
    management_responsiveness:
      rows.reduce((sum, row) => sum + row.management_responsiveness, 0) / total,
    maintenance_timeliness:
      rows.reduce((sum, row) => sum + row.maintenance_timeliness, 0) / total,
    listing_accuracy: rows.reduce((sum, row) => sum + row.listing_accuracy, 0) / total,
    fee_transparency: rows.reduce((sum, row) => sum + row.fee_transparency, 0) / total,
    lease_clarity: rows.reduce((sum, row) => sum + row.lease_clarity, 0) / total,
  };
}

function rankMetricLabels(metricAverages: Record<MetricKey, number>) {
  return (Object.entries(metricAverages) as Array<[MetricKey, number]>).sort(
    (a, b) => b[1] - a[1]
  );
}

function createScreeningFlags(texts: string[], themeHits: Array<{ label: string; count: number }>) {
  const joinedText = texts.join("\n");
  const flaggedSignals = FLAGGED_CONTENT_PATTERNS.filter(({ pattern }) =>
    pattern.test(joinedText)
  ).map(({ label }) => label);

  return {
    automated: true,
    flagged_terms: flaggedSignals,
    requires_manual_review: flaggedSignals.length > 0,
    source_review_count: texts.length,
    source_character_count: joinedText.length,
    theme_hits: Object.fromEntries(themeHits.map((theme) => [theme.label, theme.count])),
  } satisfies Record<string, unknown>;
}

function createSafeSummary(
  rows: ApprovedReviewSourceRow[],
  themeHits: Array<{ label: string; count: number }>
): string {
  const metricAverages = getMetricAverages(rows);
  const rankedMetrics = rankMetricLabels(metricAverages);
  const strongAreas = rankedMetrics
    .filter(([, value]) => value >= 3.5)
    .slice(0, 2)
    .map(([metric]) => POSITIVE_METRIC_LABELS[metric]);
  const weakerAreas = [...rankedMetrics]
    .reverse()
    .filter(([, value]) => value <= 2.5)
    .slice(0, 2)
    .map(([metric]) => POSITIVE_METRIC_LABELS[metric]);
  const recurringThemes = themeHits.slice(0, 3).map((theme) => theme.label);

  const sentences: string[] = [];

  if (recurringThemes.length > 0) {
    sentences.push(
      `Across ${rows.length} approved renter reviews, recurring themes include ${formatList(
        recurringThemes
      )}.`
    );
  } else {
    sentences.push(
      `This summary reflects ${rows.length} approved renter reviews and highlights overall experience patterns instead of individual accounts.`
    );
  }

  if (strongAreas.length > 0 && weakerAreas.length > 0) {
    sentences.push(
      `Overall feedback is mixed, with relatively stronger marks for ${formatList(
        strongAreas
      )} and lower marks for ${formatList(weakerAreas)}.`
    );
  } else if (strongAreas.length > 0) {
    sentences.push(
      `Feedback trends more positive around ${formatList(strongAreas)}.`
    );
  } else if (weakerAreas.length > 0) {
    sentences.push(
      `Feedback most often points to concerns around ${formatList(weakerAreas)}.`
    );
  } else {
    sentences.push(
      `Ratings are fairly balanced across communication, maintenance, listing accuracy, fees, and lease clarity.`
    );
  }

  sentences.push(
    "The summary is intentionally generalized and excludes names, unit references, and verbatim renter text."
  );

  return sentences.join(" ");
}

export async function recomputeDistilledInsightForProperty(
  supabase: SupabaseClient,
  propertyId: string
): Promise<DistilledInsightRecomputeResult> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle<PropertyRow>();

  if (propertyError) {
    throw new Error("Failed to load property.");
  }

  if (!property) {
    return {
      ok: false,
      code: "property_not_found",
      message: "Property not found.",
    };
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews")
    .select(
      "property_id, text_input, management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity"
    )
    .eq("property_id", propertyId)
    .eq("status", "approved");

  if (reviewError) {
    throw new Error("Failed to load approved reviews.");
  }

  const sourceRows = ((reviewRows ?? []) as ApprovedReviewSourceRow[]).filter((row) =>
    Boolean(row.text_input && normalizeReviewText(row.text_input).length > 0)
  );

  if (sourceRows.length === 0) {
    return {
      ok: false,
      code: "no_source_reviews",
      message: "No approved reviews with text are available to summarize.",
    };
  }

  const normalizedTexts = sourceRows.map((row) => normalizeReviewText(row.text_input ?? ""));
  const themeHits = getThemeHits(normalizedTexts);
  const screeningFlags = createScreeningFlags(normalizedTexts, themeHits);
  const timestamp = new Date().toISOString();
  const summary = createSafeSummary(sourceRows, themeHits);

  const { data: insight, error: upsertError } = await supabase
    .from("distilled_insights")
    .upsert(
      {
        property_id: propertyId,
        insights_text: summary,
        status: "pending",
        screened: true,
        screening_flags: screeningFlags,
        last_generated_at: timestamp,
        screened_at: timestamp,
      } as never,
      { onConflict: "property_id" }
    )
    .select(
      "property_id, insights_text, status, screened, screening_flags, last_generated_at, screened_at, updated_at"
    )
    .single<DistilledInsightRow>();

  if (upsertError) {
    throw new Error("Failed to save distilled insight.");
  }

  return {
    ok: true,
    insight,
    source_review_count: sourceRows.length,
  };
}
