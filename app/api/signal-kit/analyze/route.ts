import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  transformResultsToAnalysis,
  type SignalKitResults,
  type AnalysisOutput,
} from "@/lib/signal-kit";
import { parseDnaFile } from "@/lib/dna-parser";

/**
 * Signal Kit DNA Analysis API — HEL-72 + HEL-71 deliverable.
 *
 * Flow (when dnaFileUrl is provided):
 *  1. Fetch DNA file from Supabase signed URL
 *  2. Parse with multi-provider DNA parser (23andMe, Ancestry, FTDNA, etc.)
 *  3. If SIGNAL_KIT_API_URL set → send mappings to signal-kit service for
 *     AlphaGenome enrichment (Sequencing.com RTP path)
 *  4. Transform to dashboard format and persist to Supabase
 *
 * Flow (no file — returning user):
 *  1. Fetch cached results from signal-kit service
 *  2. Transform and return
 *
 * Fallback: mock data when signal-kit service unavailable (dev mode)
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

// ─── Signal Kit enrichment: send parsed mappings for AlphaGenome scoring ────────

async function enrichWithSignalKit(
  customerId: string,
  genePeptideMappings: SignalKitResults["gene_peptide_mappings"]
): Promise<SignalKitResults> {
  const url = `${SIGNAL_KIT_API_URL}/api/protocols/generate`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SIGNAL_KIT_API_KEY) {
    headers["Authorization"] = `Bearer ${SIGNAL_KIT_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: customerId,
      genetic_results: {
        total_snps_analyzed: 0, // unknown at this point
        genes_with_pathways: genePeptideMappings.length,
        peptide_relevance_genes: genePeptideMappings.length,
        gene_peptide_mappings: genePeptideMappings,
        wellness_markers: {},
      },
      user_goals: ["peptide_optimization"],
    }),
  });

  if (!res.ok) {
    throw new Error(`Signal Kit enrichment failed: ${res.status} ${res.statusText}`);
  }

  // protocols/generate returns { success, protocol, scored_peptide_count, ... }
  const data = (await res.json()) as {
    success: boolean;
    protocol?: { gene_peptide_mappings?: SignalKitResults["gene_peptide_mappings"] };
    error?: string;
  };

  if (!data.success) {
    throw new Error(`Signal Kit enrichment error: ${data.error}`);
  }

  // Re-fetch results to get full AlphaGenome-scored mappings
  return callSignalKitService(customerId);
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
    const { dnaFileUrl } = body as { dnaFileUrl?: string };

    let analysis: AnalysisOutput;
    let source: string;

    // ── Path A: User uploaded a DNA file → parse and analyze ──────────────
    if (dnaFileUrl) {
      console.log(`[signal-kit/analyze] Fetching DNA file: ${dnaFileUrl.slice(0, 60)}...`);

      let fileBuffer: Buffer;
      try {
        const fileRes = await fetch(dnaFileUrl);
        if (!fileRes.ok) {
          throw new Error(`Failed to fetch DNA file: ${fileRes.status} ${fileRes.statusText}`);
        }
        const arrayBuffer = await fileRes.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      } catch (fetchErr) {
        console.error("[signal-kit/analyze] DNA file fetch failed:", fetchErr);
        return NextResponse.json(
          { error: "Failed to retrieve uploaded DNA file. Please re-upload." },
          { status: 502 }
        );
      }

      // Parse the DNA file (multi-provider format detection)
      const filename = dnaFileUrl.split("/").pop()?.split("?")[0] ?? "dna.txt";
      const parseResult = await parseDnaFile(fileBuffer, filename);

      console.log(
        `[signal-kit/analyze] Parsed ${parseResult.totalSnps} SNPs (` +
          `${parseResult.peptideRelevantSnps} peptide-relevant) from ${parseResult.detectedFormat} file ` +
          `in ${parseResult.parseTimeMs}ms`
      );

      if (parseResult.warnings.length > 0) {
        console.warn(`[signal-kit/analyze] Parse warnings: ${parseResult.warnings.join("; ")}`);
      }

      if (parseResult.genePeptideMappings.length === 0) {
        return NextResponse.json({
          success: false,
          error:
            "No peptide-relevant genetic variants found in your file. " +
            "This may be due to genome build differences or a format issue. " +
            "Please ensure you exported the full raw DNA data.",
          warnings: parseResult.warnings,
        }, { status: 422 });
      }

      // Send mappings to signal-kit for AlphaGenome enrichment (Sequencing.com path)
      const { data: enrichedResults, usedFallback } = await withRetry(
        () => enrichWithSignalKit(clerkUserId, parseResult.genePeptideMappings),
        "enrichWithSignalKit"
      );

      if (!usedFallback && enrichedResults) {
        analysis = transformResultsToAnalysis(enrichedResults);
        source = "dna-upload-sequencing-rtp";
      } else {
        // Fallback: transform locally parsed mappings directly
        analysis = transformParsedMappingsLocally({
          genePeptideMappings: parseResult.genePeptideMappings,
          detectedFormat: parseResult.detectedFormat,
        });
        source = "dna-upload-local-parse";
      }
    }

    // ── Path B: No file → fetch cached results from signal-kit service ──────
    else {
      const { data: signalKitResults, usedFallback } = await withRetry(
        () => callSignalKitService(clerkUserId),
        "callSignalKitService"
      );

      if (!usedFallback && signalKitResults) {
        analysis = transformResultsToAnalysis(signalKitResults);
        source = "sequencing-com-rtp";
        console.log(
          `[signal-kit/analyze] Live results for ${clerkUserId}: ` +
            `${signalKitResults.summary.total_snps_analyzed} SNPs, ` +
            `${signalKitResults.gene_peptide_mappings.length} gene mappings`
        );
      } else {
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

/**
 * Transform locally parsed gene-peptide mappings into AnalysisOutput format.
 * Used as fallback when signal-kit service is unavailable.
 */
function transformParsedMappingsLocally(
  parseResult: { genePeptideMappings: SignalKitResults["gene_peptide_mappings"]; detectedFormat: string }
): AnalysisOutput {
  const geneVariantMap = new Map<string, { gene: string; variant: string; impact: string }>();

  for (const mapping of parseResult.genePeptideMappings) {
    if (!geneVariantMap.has(mapping.gene_symbol)) {
      geneVariantMap.set(mapping.gene_symbol, {
        gene: mapping.gene_symbol,
        variant: mapping.rsid,
        impact: `${mapping.gene_symbol.toLowerCase()}_detected`,
      });
    }
  }

  const geneVariants = Array.from(geneVariantMap.values());

  // Build peptide pathways from parsed mappings (without AlphaGenome confidence scores)
  const peptidePathways = parseResult.genePeptideMappings
    .filter((m) => m.relevant_peptides.length > 0)
    .map((m) => ({
      peptide: m.relevant_peptides[0].peptide_name,
      genes: [m.gene_symbol],
      mechanism: m.relevant_peptides[0].clinical_significance,
      confidence: m.relevant_peptides[0].alpha_genome_confidence ?? 0.7,
    }));

  return {
    geneVariants,
    peptidePathways,
    recommendations: [
      {
        category: "dna_analysis_complete",
        priority: "high",
        rationale: `${geneVariants.length} peptide-relevant genes identified from your ${parseResult.detectedFormat} DNA file.`,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
