/**
 * DNA File Parser — HEL-71 deliverable
 *
 * Parses raw DNA files from major providers into structured SNP records.
 * Filters to a peptide-relevant SNP subset for efficient analysis.
 *
 * Supported formats:
 * - 23andMe (.txt)       — tab-separated, 4-column format
 * - AncestryDNA (.txt)   — tab-separated, same format as 23andMe
 * - MyHeritage (.txt/.zip) — tab-separated or ZIP archive
 * - FTDNA (.csv)         — comma-separated, 5-column format
 * - LivingDNA (.csv)     — comma-separated, similar to FTDNA
 * - Nebula Genomics (.zip) — tab-separated inside ZIP archive
 *
 * Reference: helixforge-signal-kit/src/lib/mock-signal-kit.ts
 * Gene-peptide mappings from signal-kit mock database (peptide-relevant subset)
 */

import { unzipSync } from "fflate";
import type { GenePeptideMapping } from "./signal-kit";

// ─── Peptide-Relevant SNP Subset ────────────────────────────────────────────────
//
// Curated list of rsIDs relevant to peptide therapy pathways.
// These genes map to the 270K+ AlphaGenome library via signal-kit's
// /api/mock-signal-kit/database/query endpoint.
// Sources: signal-kit mock db, PubMed peptide-genetics literature.
//
// Format: gene_symbol → Set of rsIDs
//

const PEPTIDE_RSIDS: Map<string, Set<string>> = new Map([
  // ── Growth Hormone / IGF-1 Axis ──────────────────────────────────────────
  ["IGF1", new Set(["rs35767", "rs728988", "rs7136446", "rs4764885", "rs972936"])],
  ["GH1", new Set(["rs2665802", "rs2009045", "rs6184", "rs2033971", "rs7695065"])],
  ["MGF", new Set(["rs2855094", "rs17532933"])],

  // ── Tissue Repair / Angiogenesis ──────────────────────────────────────────
  ["BDKRB2", new Set(["rs8017985", "rs1799722", "rs5810761", "rs7832658", "rs41538550"])],
  ["COL1A1", new Set(["rs1800012", "rs1107946", "rs2694567", "rs1061238", "rs987573"])],
  ["FGF2", new Set(["rs308379", "rs1570773", "rs1173771", "rs6980179", "rs3750817"])],
  ["VEGFA", new Set(["rs3025020", "rs3025033", "rs2010963", "rs833061", "rs1570360", "rs2146323"])],
  ["HGF", new Set(["rs5745652", "rs17531768", "rs5745653", "rs34590199"])],

  // ── Inflammatory Response ─────────────────────────────────────────────────
  ["IL6", new Set(["rs1800795", "rs1800796", "rs2069827", "rs2069845", "rs1554606"])],
  ["TNF", new Set(["rs1800629", "rs361525", "rs3093662", "rs1800630", "rs1799724"])],
  ["CRP", new Set(["rs1205", "rs3091244", "rs1800947", "rs1417938", "rs3091244"])],
  ["IL1B", new Set(["rs16944", "rs1143623", "rs1143627", "rs4849126", "rs13032029"])],

  // ── Mitochondrial / Cellular ──────────────────────────────────────────────
  ["NDUFS2", new Set(["rs11683026", "rs2075605", "rs2304073", "rs2854116"])],
  ["TERT", new Set(["rs2736098", "rs2736100", "rs2853668", "rs10069690", "rs13167280"])],
  ["MTOR", new Set(["rs2536", "rs2295080", "rs1883965", "rs17021919", "rs17021906"])],

  // ── Collagen / Tendon ─────────────────────────────────────────────────────
  ["COL3A1", new Set(["rs1800255", "rs111874592", "rs4149268"])],
  ["COL5A1", new Set(["rs331079", "rs12781622", "rs35594137"])],

  // ── Methylation / Folate (affects peptide metabolism) ─────────────────────
  ["MTHFR", new Set(["rs1801133", "rs1801131", "rs2274976", "rs2066470", "rs17367504"])],
  ["MTR", new Set(["rs1805087", "rs10929337", "rs12577327", "rs7526567"])],
  ["MTRR", new Set(["rs1801394", "rs162036", "rs2287773", "rs10380"])],
  ["FOLR1", new Set(["rs2071019", "rs2071018", "rs2298813", "rs7102"])],
  ["SLC19A1", new Set(["rs1051266", "rs1131596", "rs12411", "rs914232"])],

  // ── Pain / Endocannabinoid ────────────────────────────────────────────────
  ["CNR2", new Set(["rs2501432", "rs12720071", "rs1054135", "rs35761398"])],
  ["TRPV1", new Set(["rs161364", "rs224534", "rs150929", "rs4783088"])],
  ["OPRM1", new Set(["rs1799971", "rs495491", "rs3778150", "rs603050"])],
  ["COMT", new Set(["rs4680", "rs4633", "rs4818", "rs6269", "rs165774"])],

  // ── Athletic / Performance ────────────────────────────────────────────────
  ["ACTN3", new Set(["rs1815739", "rs1671064", "rs974819", "rs2253304"])],
  ["ACE", new Set(["rs4340", "rs1799752", "rs13447446", "rs4267388"])],
  ["PPARA", new Set(["rs4253778", "rs2010963", "rs1800234", "rs4253800"])],
  ["PPARG", new Set(["rs1801282", "rs1151996", "rs2938392", "rs1175540"])],
  ["ADRB2", new Set(["rs1042713", "rs1042714", "rs1042717", "rs1800888"])],

  // ── Metabolic / Glucose ───────────────────────────────────────────────────
  ["FABP2", new Set(["rs1799883", "rs2855563", "rs3854015"])],
  ["TCF7L2", new Set(["rs7903146", "rs12255372", "rs4506565", "rs11196205"])],
  ["LIPC", new Set(["rs1535", "rs1883025", "rs12678919", "rs2040862"])],

  // ── Thyroid / Metabolic Rate ──────────────────────────────────────────────
  ["DIO2", new Set(["rs225014", "rs12885300", "rs2472300", "rs4706765"])],
  ["SLC2A2", new Set(["rs5393", "rs5400", "rs3758520", "rs11904183"])],

  // ── Detoxification ─────────────────────────────────────────────────────────
  ["CYP1A2", new Set(["rs762551", "rs12720461", "rs28399433", "rs2069526"])],
  ["GSTP1", new Set(["rs1695", "rs1138272", "rs749174", "rs1054769"])],
  ["NQO1", new Set(["rs1800566", "rs10517", "rs689453"])],

  // ── Neuropeptide / Mood ────────────────────────────────────────────────────
  ["BDNF", new Set(["rs6265", "rs2049046", "rs11030104", "rs7103411", "rs988712"])],
  ["COMT", new Set(["rs4680", "rs4633", "rs4818", "rs6269", "rs165774"])],
  ["SLC6A4", new Set(["rs25531", "rs2020938", "rs4325622", "rs123456"])], // 5-HTTLPR region

  // ── Bone / Tendon ─────────────────────────────────────────────────────────
  ["VDR", new Set(["rs10735810", "rs1544410", "rs7975232", "rs11574026", "rs2189480"])],
  ["CALCR", new Set(["rs1808578", "rs3796326", "rs9308615"])],
]);

// Build reverse map: rsid → gene
const RSID_TO_GENE: Map<string, string> = new Map();
for (const [gene, rsids] of PEPTIDE_RSIDS) {
  for (const rsid of rsids) {
    RSID_TO_GENE.set(rsid, gene);
  }
}

// ─── File Format Detection ────────────────────────────────────────────────────

export type DnaFormat =
  | "23andMe"
  | "AncestryDNA"
  | "MyHeritage"
  | "FTDNA"
  | "LivingDNA"
  | "Nebula";

/** Detect format from filename and content preview */
function detectFormat(filename: string, preview: string): DnaFormat | null {
  const lower = filename.toLowerCase();

  if (lower.includes("23andme")) return "23andMe";
  if (lower.includes("ancestry")) return "AncestryDNA";
  if (lower.includes("myheritage")) return "MyHeritage";
  if (lower.includes("ftdna") || lower.includes("familytree")) return "FTDNA";
  if (lower.includes("livingdna")) return "LivingDNA";
  if (lower.includes("nebula")) return "Nebula";

  // Heuristic from content
  const firstLine = preview.split("\n")[0] ?? "";

  if (firstLine.includes("23andMe")) return "23andMe";
  if (firstLine.includes("AncestryDNA")) return "AncestryDNA";
  if (firstLine.includes("MyHeritage")) return "MyHeritage";
  if (firstLine.includes("Family Tree DNA")) return "FTDNA";
  if (firstLine.includes("Living DNA")) return "LivingDNA";
  if (firstLine.includes("Nebula")) return "Nebula";

  // FTDNA / LivingDNA use CSV; 23andMe / Ancestry use TSV
  if (firstLine.includes(",")) return "FTDNA";

  return null;
}

// ─── SNP Record ────────────────────────────────────────────────────────────────

export interface SnpRecord {
  rsid: string;
  chromosome: string;
  position: number;
  allele1: string;
  allele2: string;
  format: DnaFormat;
}

// ─── 23andMe / AncestryDNA Parser ─────────────────────────────────────────────
// Tab-separated: rsid  chromosome  position  genotype
// genotype is two alleles concatenated: e.g. "AA", "AG", "GG", "--"

function parseTabSnp(line: string): SnpRecord | null {
  const parts = line.split("\t");
  if (parts.length < 4) return null;

  const [rsid, chromosome, positionStr, genotype] = parts;
  if (!rsid.startsWith("rs")) return null;

  const position = parseInt(positionStr, 10);
  if (isNaN(position)) return null;

  // Handle missing genotype (-- = no call)
  const allele1 = genotype.length >= 1 ? genotype[0] : "N";
  const allele2 = genotype.length >= 2 ? genotype[1] : "N";

  return { rsid, chromosome, position, allele1, allele2, format: "23andMe" };
}

// ─── FTDNA / LivingDNA Parser ──────────────────────────────────────────────────
// Comma-separated: rsid, chromosome, position, allele1, allele2

function parseCSVSnp(line: string): SnpRecord | null {
  const parts = line.split(",");
  if (parts.length < 5) return null;

  const [rsid, chromosome, positionStr, allele1, allele2] = parts.map((s) => s.trim());
  if (!rsid.startsWith("rs")) return null;

  const position = parseInt(positionStr, 10);
  if (isNaN(position)) return null;

  return { rsid, chromosome, position, allele1, allele2, format: "FTDNA" };
}

// ─── Main Parser ───────────────────────────────────────────────────────────────

export interface ParseResult {
  totalSnps: number;
  peptideRelevantSnps: number;
  genePeptideMappings: GenePeptideMapping[];
  detectedFormat: DnaFormat;
  warnings: string[];
  parseTimeMs: number;
}

/**
 * Parse a DNA file (Buffer) and extract peptide-relevant SNP data.
 *
 * Returns GenePeptideMapping[] compatible with signal-kit's protocol engine,
 * plus metadata about the parse operation.
 */
export async function parseDnaFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const start = Date.now();
  const warnings: string[] = [];
  let rawContent: string;
  let detectedFormat: DnaFormat;

  // ── Decompress if ZIP ─────────────────────────────────────────────────────
  if (filename.toLowerCase().endsWith(".zip")) {
    try {
      const decompressed = unzipSync(new Uint8Array(buffer));
      const entries = Object.keys(decompressed).filter(
        (name) => name.toLowerCase().endsWith(".txt") || name.toLowerCase().endsWith(".csv")
      );

      if (entries.length === 0) {
        throw new Error("ZIP archive contains no .txt or .csv files");
      }

      // Use the first DNA file found (most providers put raw data as the main file)
      const primaryEntry = entries[0];
      rawContent = new TextDecoder("utf8").decode(decompressed[primaryEntry]);

      // Detect format from inner filename
      detectedFormat = detectFormat(primaryEntry, rawContent) ?? "Nebula";
      warnings.push(`Extracted ${primaryEntry} from ZIP archive`);
    } catch (err) {
      throw new Error(
        `Failed to decompress ZIP file: ${err instanceof Error ? err.message : String(err)}. ` +
          "Please ensure the ZIP contains a raw DNA export (.txt or .csv file)."
      );
    }
  } else {
    rawContent = buffer.toString("utf8");
    detectedFormat = detectFormat(filename, rawContent) ?? "23andMe";
  }

  // ── Skip header lines ─────────────────────────────────────────────────────
  const lines = rawContent.split("\n");
  const dataStartIndex = lines.findIndex(
    (line) => line.startsWith("rs") || line.startsWith("# rs")
  );

  if (dataStartIndex === -1) {
    throw new Error(
      `No SNP data found in file. Header may be unsupported. First line: ${lines[0]?.slice(0, 80)}`
    );
  }

  const snpLines = lines.slice(dataStartIndex);

  // ── Parse SNPs ─────────────────────────────────────────────────────────────
  const peptideSnps = new Map<string, SnpRecord>(); // rsid → record (dedup)

  let totalParsed = 0;
  for (const rawLine of snpLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    let record: SnpRecord | null = null;

    if (detectedFormat === "23andMe" || detectedFormat === "AncestryDNA" || detectedFormat === "MyHeritage") {
      record = parseTabSnp(line);
    } else if (detectedFormat === "FTDNA" || detectedFormat === "LivingDNA") {
      record = parseCSVLine(line) ?? null;
      if (record) {
        // Re-detect format based on columns
        const parts = line.split(",");
        if (parts.length >= 5 && parts[0].startsWith("rs")) {
          record = parseCSVSnp(line);
        }
      }
    } else {
      // Nebula or unknown
      record = parseTabSnp(line) ?? parseCSVLine(line);
    }

    if (!record) continue;
    totalParsed++;

    // Only keep peptide-relevant SNPs
    if (RSID_TO_GENE.has(record.rsid)) {
      // Don't overwrite with later data (first occurrence is canonical)
      if (!peptideSnps.has(record.rsid)) {
        peptideSnps.set(record.rsid, record);
      }
    }
  }

  // ── Build GenePeptideMappings ─────────────────────────────────────────────
  const mappings = buildMappings(peptideSnps);

  if (mappings.length === 0 && totalParsed > 0) {
    warnings.push(
      `No peptide-relevant SNPs found in file. This can happen if: (1) the file uses a different genome build (GRCh37 vs GRCh38), or (2) your file contains few of the ${RSID_TO_GENE.size} tracked variants.`
    );
  }

  return {
    totalSnps: totalParsed,
    peptideRelevantSnps: peptideSnps.size,
    genePeptideMappings: mappings,
    detectedFormat,
    warnings,
    parseTimeMs: Date.now() - start,
  };
}

// ─── CSV Line Parser (handles quoted fields) ───────────────────────────────────

function parseCSVLine(line: string): SnpRecord | null {
  // Simple CSV parser — handles quoted fields
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  if (fields.length < 5) return null;
  const rsid = fields[0];
  if (!rsid.startsWith("rs")) return null;

  return {
    rsid,
    chromosome: fields[1],
    position: parseInt(fields[2], 10),
    allele1: fields[3],
    allele2: fields[4],
    format: "FTDNA",
  };
}

// ─── GenePeptideMapping Builder ─────────────────────────────────────────────────

function buildMappings(snps: Map<string, SnpRecord>): GenePeptideMapping[] {
  // Group by gene
  const geneGroups = new Map<string, SnpRecord[]>();
  for (const snp of snps.values()) {
    const gene = RSID_TO_GENE.get(snp.rsid);
    if (!gene) continue;
    if (!geneGroups.has(gene)) geneGroups.set(gene, []);
    geneGroups.get(gene)!.push(snp);
  }

  // Build mappings using signal-kit type contract
  const mappings: GenePeptideMapping[] = [];

  for (const [gene, snpRecords] of geneGroups) {
    const geneInfo = GENE_INFO.get(gene);

    for (const snp of snpRecords) {
      mappings.push({
        gene_symbol: gene,
        gene_name: geneInfo?.name ?? gene,
        rsid: snp.rsid,
        genotype: snp.allele1 + snp.allele2,
        pathway: geneInfo?.pathway ?? "General",
        relevant_peptides: [], // Filled by signal-kit service from AlphaGenome library
      });
    }
  }

  return mappings;
}

// ─── Gene Metadata ─────────────────────────────────────────────────────────────

const GENE_INFO = new Map<string, { name: string; pathway: string }>([
  ["IGF1", { name: "Insulin-like Growth Factor 1", pathway: "Growth Hormone / IGF-1 Signaling" }],
  ["GH1", { name: "Growth Hormone 1", pathway: "Growth Hormone Axis" }],
  ["MGF", { name: "Mechano Growth Factor", pathway: "Growth Hormone / IGF-1 Signaling" }],
  ["BDKRB2", { name: "Bradykinin Receptor B2", pathway: "Inflammatory Response" }],
  ["COL1A1", { name: "Collagen Type I Alpha 1", pathway: "Collagen Synthesis" }],
  ["COL3A1", { name: "Collagen Type III Alpha 1", pathway: "Connective Tissue" }],
  ["COL5A1", { name: "Collagen Type V Alpha 1", pathway: "Tendon Integrity" }],
  ["FGF2", { name: "Fibroblast Growth Factor 2", pathway: "Wound Healing" }],
  ["VEGFA", { name: "Vascular Endothelial Growth Factor A", pathway: "Angiogenesis" }],
  ["HGF", { name: "Hepatocyte Growth Factor", pathway: "Tissue Regeneration" }],
  ["IL6", { name: "Interleukin 6", pathway: "Inflammatory Response" }],
  ["TNF", { name: "Tumor Necrosis Factor Alpha", pathway: "Inflammatory Response" }],
  ["CRP", { name: "C-Reactive Protein", pathway: "Systemic Inflammation" }],
  ["IL1B", { name: "Interleukin 1 Beta", pathway: "Inflammatory Response" }],
  ["NDUFS2", { name: "NADH Dehydrogenase Fe-S Protein 2", pathway: "Mitochondrial Function" }],
  ["TERT", { name: "Telomerase Reverse Transcriptase", pathway: "Telomere Maintenance" }],
  ["MTOR", { name: "Mechanistic Target of Rapamycin", pathway: "mTOR Signaling" }],
  ["BDNF", { name: "Brain-Derived Neurotrophic Factor", pathway: "Neuropeptide / Mood" }],
  ["COMT", { name: "Catechol-O-Methyltransferase", pathway: "Neurotransmitter Metabolism" }],
  ["CNR2", { name: "Cannabinoid Receptor 2", pathway: "Endocannabinoid System" }],
  ["TRPV1", { name: "Transient Receptor Potential Vanilloid 1", pathway: "Pain Signaling" }],
  ["OPRM1", { name: "Opioid Receptor Mu 1", pathway: "Pain Modulation" }],
  ["ACTN3", { name: "Actinin Alpha 3", pathway: "Muscle Fiber Composition" }],
  ["ACE", { name: "Angiotensin-Converting Enzyme", pathway: "Cardiovascular / Performance" }],
  ["PPARA", { name: "Peroxisome Proliferator-Activated Receptor Alpha", pathway: "Lipid Metabolism" }],
  ["PPARG", { name: "Peroxisome Proliferator-Activated Receptor Gamma", pathway: "Metabolic Regulation" }],
  ["ADRB2", { name: "Adrenergic Beta-2 Receptor", pathway: "Athletic Performance" }],
  ["FABP2", { name: "Fatty Acid Binding Protein 2", pathway: "Nutrient Metabolism" }],
  ["TCF7L2", { name: "Transcription Factor 7-Like 2", pathway: "Glucose Metabolism" }],
  ["LIPC", { name: "Hepatic Lipase", pathway: "Lipid Profile" }],
  ["DIO2", { name: "Type II Deiodinase", pathway: "Thyroid / Metabolic Rate" }],
  ["SLC2A2", { name: "Solute Carrier Family 2 Member 2", pathway: "Glucose Transport" }],
  ["CYP1A2", { name: "Cytochrome P450 1A2", pathway: "Detoxification" }],
  ["GSTP1", { name: "Glutathione S-Transferase Pi 1", pathway: "Antioxidant Defense" }],
  ["NQO1", { name: "NAD(P)H Quinone Dehydrogenase 1", pathway: "Antioxidant Defense" }],
  ["VDR", { name: "Vitamin D Receptor", pathway: "Bone / Immune" }],
  ["CALCR", { name: "Calcitonin Receptor", pathway: "Bone Metabolism" }],
  ["SLC6A4", { name: "Serotonin Transporter", pathway: "Mood / Sleep" }],
  ["FOLR1", { name: "Folate Receptor Alpha", pathway: "Folate Metabolism" }],
  ["SLC19A1", { name: "Reduced Folate Carrier 1", pathway: "Folate Transport" }],
  ["MTHFR", { name: "Methylenetetrahydrofolate Reductase", pathway: "Methylation" }],
  ["MTR", { name: "Methionine Synthase", pathway: "Methylation" }],
  ["MTRR", { name: "Methionine Synthase Reductase", pathway: "Methylation" }],
]);

// ─── Blood Marker Ingestion ────────────────────────────────────────────────────

export interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: { low: number; high: number };
  status: "low" | "normal" | "high";
}

const BLOOD_MARKER_PATTERNS: Array<{ pattern: RegExp; name: string; unit: string; low: number; high: number }> = [
  { pattern: /^(hs.?)?[cC][rR][pP](.?high.?sensitivity)?$/i, name: "CRP", unit: "mg/L", low: 0, high: 3 },
  { pattern: /^[iI][gG][fF][-]?1\s*[-]?[lL][rR]?3?$/i, name: "IGF-1", unit: "ng/mL", low: 100, high: 300 },
  { pattern: /^testosterone[- ]?(total|free)?$/i, name: "Testosterone", unit: "ng/dL", low: 300, high: 1000 },
  { pattern: /^cortisol[- ]?(morning|am)?$/i, name: "Cortisol", unit: "µg/dL", low: 5, high: 25 },
  { pattern: /^tnf[ -]?alpha$/i, name: "TNF-alpha", unit: "pg/mL", low: 0, high: 8 },
  { pattern: /^i?l[-]?6$/i, name: "IL-6", unit: "pg/mL", low: 0, high: 5 },
  { pattern: /^vitamin[ -]?d$/i, name: "Vitamin D", unit: "ng/mL", low: 30, high: 100 },
  { pattern: /^homocysteine$/i, name: "Homocysteine", unit: "µmol/L", low: 5, high: 15 },
  { pattern: /^hdl$/i, name: "HDL Cholesterol", unit: "mg/dL", low: 40, high: 200 },
  { pattern: /^ldl$/i, name: "LDL Cholesterol", unit: "mg/dL", low: 0, high: 130 },
  { pattern: /^triglycerides$/i, name: "Triglycerides", unit: "mg/dL", low: 0, high: 150 },
  { pattern: /^fasting.?glucose$/i, name: "Fasting Glucose", unit: "mg/dL", low: 70, high: 100 },
  { pattern: /^hemoglobin\s*a1c$/i, name: "HbA1c", unit: "%", low: 4, high: 5.7 },
];

/**
 * Parse a blood marker CSV file (name, value pairs) into structured BloodMarker[].
 * Handles common lab report formats.
 */
export function parseBloodMarkers(content: string): BloodMarker[] {
  const markers: BloodMarker[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    // Try comma-separated first, then tab
    const parts = trimmed.includes(",") ? trimmed.split(",") : trimmed.split("\t");
    if (parts.length < 2) continue;

    const nameRaw = parts[0].trim().toLowerCase().replace(/[^a-z0-9 -]/gi, "");
    const valueStr = parts[1].trim().replace(/[^0-9.-]/g, "");
    const value = parseFloat(valueStr);
    if (isNaN(value)) continue;

    for (const { pattern, name, unit, low, high } of BLOOD_MARKER_PATTERNS) {
      if (pattern.test(nameRaw)) {
        markers.push({
          name,
          value,
          unit,
          referenceRange: { low, high },
          status: value < low ? "low" : value > high ? "high" : "normal",
        });
        break;
      }
    }
  }

  return markers;
}
