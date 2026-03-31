import { NextRequest, NextResponse } from "next/server";

/**
 * Mock Signal Kit API route — Week 2 deliverable placeholder.
 * In production, replace with actual Signal Kit API calls.
 * API docs: https://developers.signal-kit.com
 *
 * Integrates with The Signal Kit's 270,000+ gene-peptide-pathway
 * connections to generate a personalized analysis.
 */

// Mock gene variant data — production will pull from user's uploaded DNA file
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, dnaFileUrl } = body as { userId?: string; dnaFileUrl?: string };

    // In production: call Signal Kit API
    // const signalKitRes = await fetch(`${process.env.SIGNAL_KIT_API_URL}/analyze`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.SIGNAL_KIT_API_KEY}` },
    //   body: JSON.stringify({ dna_file_url: dnaFileUrl }),
    // });

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      analysis: {
        geneVariants: MOCK_GENE_VARIANTS,
        peptidePathways: MOCK_PEPTIDE_PATHWAYS,
        recommendations: [
          {
            category: "tissue_repair",
            priority: "high",
            rationale: "BDKRB2 variant indicates heightened peptide sensitivity — BPC-157 response expected above average",
          },
          {
            category: "methylation_support",
            priority: "medium",
            rationale: "MTHFR variant suggests benefit from methylated B-vitamins alongside peptide protocol",
          },
          {
            category: "athletic_optimization",
            priority: "medium",
            rationale: "ACTN3 + ACE profile supports power-endurance hybrid training approach",
          },
        ],
        generatedAt: new Date().toISOString(),
      },
      userId,
      source: "signal-kit-mock-v1",
    });
  } catch (err) {
    console.error("[signal-kit/analyze]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
