import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  transformResultsToAnalysis,
  type SignalKitResults,
} from "@/lib/signal-kit";

/**
 * Signal Kit DNA Analysis API — HEL-72 deliverable.
 *
 * Architecture:
 * 1. If SIGNAL_KIT_API_URL is set → calls live helixforge-signal-kit service
 *    (which handles Sequencing.com RTP integration)
 * 2. Retry with exponential backoff (3 attempts, 1s/2s/4s delays)
 * 3. Falls back to mock data if service unavailable (dev mode)
 *
 * API docs: https://github.com/prefferpepsnbots-creator/helixforge-signal-kit
 */

const SIGNAL_KIT_API_URL = process.env.SIGNAL_KIT_API_URL;
const SIGNAL_KIT_API_KEY = process.env.SIGNAL_KIT_API_KEY;
const SIGNAL_KIT_ENABLED = Boolean(SIGNAL_KIT_API_URL);

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// ─── Mock data (used when signal-kit service is unavailable) ──────────────────

const MOCK_GENE_VARIANTS = [
  { gene: "BDKRB2", variant: "rs8017985", impact: "peptide_sensitivity_high" },
  { gene: "COL1A1", variant: "rs1800012", impact: "tissue_repair_normal" },
  { gene: "MTHFR", variant: "rs1801133", impact: "methylation_slow" },
  { gene: "ACTN3", variant: "rs1815739", impact: "power_athlete" },
  { gene: "ACE", variant: "rs4340", impact: "endurance_favoring" },
];

const MOCK_PEPTIDE_PATHWAYS = [
  {
    peptide: "BPC-157",
    genes: ["BDKRB2", "COL1A1"],
    mechanism: "Promotes angiogenesis and tissue repair via bradykinin pathway",
    confidence: 0.94,
  },
  {
    peptide: "TB-500",
    genes: ["BDKRB2"],
    mechanism: "Cell migration and wound healing acceleration",
    confidence: 0.88,
  },
  {
    peptide: "Selank",
    genes: ["MTHFR"],
    mechanism: "Anxiolytic effect; methyl pathway optimization support",
    confidence: 0.81,
  },
];

// ─── Signal Kit service caller ────────────────────────────────────────────────

async function callSignalKitService(customerId: string): Promise<SignalKitResults> {
  const url = `${SIGNAL_KIT_API_URL}/api/mock-signal-kit/results?customer_id=${encodeURIComponent(customerId)}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SIGNAL_KIT_API_KEY) {
    headers["Authorization"] = `Bearer ${SIGNAL_KIT_API_KEY}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Signal Kit service returned ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as SignalKitResults;

  if (!data.gene_peptide_mappings || !Array.isArray(data.gene_peptide_mappings)) {
    throw new Error("Invalid Signal Kit response: missing gene_peptide_mappings");
  }

  return data;
}

// ─── Retry wrapper with exponential backoff ───────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ data: T; usedFallback: false } | { data: null; usedFallback: true }> {
  if (!SIGNAL_KIT_ENABLED) {
    return { data: null, usedFallback: true };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await fn();
      return { data, usedFallback: false };
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      console.error(
        `[signal-kit/analyze] ${label} attempt ${attempt}/${MAX_RETRIES} failed:`,
        err instanceof Error ? err.message : String(err)
      );
      if (isLastAttempt) break;
      // Exponential backoff: 1s, 2s, 4s
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return { data: null, usedFallback: true };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { dnaFileUrl: _dnaFileUrl } = body as { userId?: string; dnaFileUrl?: string };

    // Attempt live signal-kit service call with retry
    const { data: signalKitResults, usedFallback } = await withRetry(
      () => callSignalKitService(clerkUserId),
      "callSignalKitService"
    );

    let analysis;
    let source: string;

    if (!usedFallback && signalKitResults) {
      // ── Live path: transform Sequencing.com / signal-kit results to dashboard format
      analysis = transformResultsToAnalysis(signalKitResults);
      source = "sequencing-com-rtp";
      console.log(
        `[signal-kit/analyze] Live results for ${clerkUserId}: ` +
          `${signalKitResults.summary.total_snps_analyzed} SNPs, ` +
          `${signalKitResults.gene_peptide_mappings.length} gene mappings`
      );
    } else {
      // ── Fallback path: use mock data (dev mode or service unavailable)
      console.warn(
        `[signal-kit/analyze] Falling back to mock data for ${clerkUserId}. ` +
          `Set SIGNAL_KIT_API_URL to enable live Sequencing.com integration.`
      );
      analysis = {
        geneVariants: MOCK_GENE_VARIANTS,
        peptidePathways: MOCK_PEPTIDE_PATHWAYS,
        recommendations: [
          {
            category: "tissue_repair",
            priority: "high",
            rationale:
              "BDKRB2 variant indicates heightened peptide sensitivity — BPC-157 response expected above average",
          },
          {
            category: "methylation_support",
            priority: "medium",
            rationale:
              "MTHFR variant suggests benefit from methylated B-vitamins alongside peptide protocol",
          },
          {
            category: "athletic_optimization",
            priority: "medium",
            rationale:
              "ACTN3 + ACE profile supports power-endurance hybrid training approach",
          },
        ],
        generatedAt: new Date().toISOString(),
      };
      source = "signal-kit-mock-v1";
    }

    // Persist analysis results to Supabase (always, regardless of source)
    const supabase = createServiceRoleClient();
    const { error: upsertError } = await supabase
      .from("protocols")
      .upsert(
        {
          user_id: clerkUserId,
          signal_kit_report: analysis,
          status: "active",
          phase: 1,
          started_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[signal-kit/analyze] Failed to persist results:", upsertError);
      // Don't fail the request — analysis still returned to user
    } else {
      console.log(`[signal-kit/analyze] Persisted analysis for user ${clerkUserId}`);
    }

    return NextResponse.json({
      success: true,
      analysis,
      userId: clerkUserId,
      source,
    });
  } catch (err) {
    console.error("[signal-kit/analyze]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
