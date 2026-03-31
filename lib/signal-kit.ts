/**
 * Signal Kit Types — aligned with helixforge-signal-kit repo
 *
 * Source of truth: helixforge-signal-kit/src/lib/types.ts
 * API contract mirrors Sequencing.com RTP webhook payload
 */

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus =
  | "processing"
  | "shipped"
  | "registered"
  | "received"
  | "analyzing"
  | "complete"
  | "cancelled"
  | "error";

export interface SignalKitOrder {
  id: string;
  status: OrderStatus;
  test_type: "saliva_kit" | "data_upload";
  created_at: string;
  estimated_fulfillment_days?: number;
  tracking_number?: string;
  kit_barcode?: string;
  shipped_at?: string;
  registered_at?: string;
  received_at?: string;
  results_ready?: boolean;
  customer_id?: string;
}

// ============================================================
// RESULTS TYPES (from RTP webhook / GET results)
// ============================================================

export type EvidenceLevel = "strong" | "moderate" | "emerging" | "theoretical";
export type InteractionType = "sensitizer" | "modulator" | "inhibitor" | "supporter";

export interface PeptideRecommendation {
  peptide_name: string;
  evidence_level: EvidenceLevel;
  interaction_type: InteractionType;
  clinical_significance: string;
  contraindications: string[];
  pmid_sources?: string[];
  alpha_genome_confidence?: number;
}

export interface GenePeptideMapping {
  gene_symbol: string;
  gene_name: string;
  rsid: string;
  genotype: string;
  pathway: string;
  relevant_peptides: PeptideRecommendation[];
}

export interface WellnessMarker {
  status: "optimal" | "normal" | "elevated_risk";
  genes: string[];
  score: number; // 0-1 scale
  description?: string;
}

export interface SignalKitResults {
  order_id: string;
  customer_id: string;
  status: string;
  completed_at?: string;
  data_version: string;
  genome_build: string;
  summary: {
    total_snps_analyzed: number;
    genes_with_pathways: number;
    peptide_relevance_genes: number;
  };
  gene_peptide_mappings: GenePeptideMapping[];
  wellness_markers: Record<string, WellnessMarker>;
}

// ============================================================
// ANALYSIS OUTPUT (what we return to the dashboard)
// ============================================================

export interface GeneVariant {
  gene: string;
  variant: string;
  impact: string;
}

export interface PeptidePathway {
  peptide: string;
  genes: string[];
  mechanism: string;
  confidence: number;
}

export interface Recommendation {
  category: string;
  priority: "high" | "medium" | "low";
  rationale: string;
}

export interface AnalysisOutput {
  geneVariants: GeneVariant[];
  peptidePathways: PeptidePathway[];
  recommendations: Recommendation[];
  generatedAt: string;
}

// ============================================================
// WEBHOOK PAYLOAD (Sequencing.com RTP callback)
// ============================================================

export interface SequencingWebhookPayload {
  order_id: string;
  customer_id: string;
  status: "complete" | "error" | "failed";
  completed_at: string;
  results_url?: string;
  data_version?: string;
  genome_build?: string;
  error_code?: string;
  error_message?: string;
}

// ============================================================
// TRANSFORMATION: SignalKitResults → AnalysisOutput
// ============================================================

/**
 * Transform raw SignalKit results into the dashboard-compatible AnalysisOutput format.
 * This is the bridge between the signal-kit service and the helixforge frontend.
 */
export function transformResultsToAnalysis(
  results: SignalKitResults
): AnalysisOutput {
  // Build gene variant list from mappings
  const geneVariants: GeneVariant[] = results.gene_peptide_mappings.map((m) => ({
    gene: m.gene_symbol,
    variant: m.rsid,
    impact: determineImpact(m),
  }));

  // Build peptide pathway list (top 5 by confidence)
  const peptideMap = new Map<
    string,
    { genes: string[]; mechanism: string; confidence: number }
  >();

  for (const mapping of results.gene_peptide_mappings) {
    for (const peptide of mapping.relevant_peptides) {
      const existing = peptideMap.get(peptide.peptide_name);
      const confidence = peptide.alpha_genome_confidence ?? 0.75;
      if (!existing || confidence > existing.confidence) {
        peptideMap.set(peptide.peptide_name, {
          genes: [mapping.gene_symbol],
          mechanism: peptide.clinical_significance,
          confidence,
        });
      } else {
        existing.genes.push(mapping.gene_symbol);
      }
    }
  }

  const peptidePathways: PeptidePathway[] = Array.from(peptideMap.entries())
    .sort((a, b) => b[1].confidence - a[1].confidence)
    .slice(0, 5)
    .map(([peptide, data]) => ({
      peptide,
      genes: [...new Set(data.genes)],
      mechanism: data.mechanism,
      confidence: data.confidence,
    }));

  // Build recommendations from wellness markers and top pathways
  const recommendations: Recommendation[] = [];

  for (const [key, marker] of Object.entries(results.wellness_markers)) {
    if (marker.status === "elevated_risk") {
      recommendations.push({
        category: key,
        priority: "high",
        rationale: marker.description ?? `${key} markers elevated — targeted support recommended.`,
      });
    }
  }

  // Add top peptide recommendations
  for (const pathway of peptidePathways.slice(0, 2)) {
    recommendations.push({
      category: pathway.peptide.toLowerCase().replace(/\s+/g, "_"),
      priority: "medium",
      rationale: `${pathway.peptide} selected with ${Math.round(pathway.confidence * 100)}% confidence based on ${pathway.genes.join(", ")} profile.`,
    });
  }

  return {
    geneVariants,
    peptidePathways,
    recommendations,
    generatedAt: results.completed_at ?? new Date().toISOString(),
  };
}

function determineImpact(mapping: GenePeptideMapping): string {
  const topPeptide = mapping.relevant_peptides[0];
  if (!topPeptide) return "neutral";

  const interaction = topPeptide.interaction_type;
  const evidence = topPeptide.evidence_level;

  if (interaction === "sensitizer" && evidence === "strong") {
    return `${mapping.gene_symbol.toLowerCase()}_high_sensitivity`;
  }
  if (interaction === "modulator") return `${mapping.gene_symbol.toLowerCase()}_modulated`;
  if (interaction === "inhibitor") return `${mapping.gene_symbol.toLowerCase()}_reduced`;
  return `${mapping.gene_symbol.toLowerCase()}_normal`;
}
