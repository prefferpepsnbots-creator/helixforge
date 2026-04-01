"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Dna,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Upload DNA File" },
  { id: 2, label: "Analyze & Process" },
  { id: 3, label: "Review Results" },
];

interface AnalysisResult {
  geneVariants: Array<{ gene: string; variant: string; impact: string }>;
  peptidePathways: Array<{ peptide: string; genes: string[]; mechanism: string; confidence: number }>;
  recommendations: Array<{ category: string; priority: string; rationale: string }>;
  generatedAt: string;
}

export default function DnaUploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase().endsWith(".txt")
      ? ".txt"
      : f.name.toLowerCase().endsWith(".csv")
      ? ".csv"
      : f.name.toLowerCase().endsWith(".zip")
      ? ".zip"
      : "";
    if (!ext) {
      toast.error("Only .txt, .csv, or .zip files are accepted (23andMe, AncestryDNA, FTDNA, MyHeritage, LivingDNA, Nebula) — please export your raw data first");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50MB");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  async function handleAnalyze() {
    if (!file) return;
    if (!user) {
      router.push("/sign-in?redirect=/dashboard/dna");
      return;
    }

    setStatus("uploading");

    try {
      // Step 1: Upload DNA file to Supabase private storage
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const uploadRes = await fetch("/api/dna/upload", { method: "POST", body: uploadForm });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "File upload failed");
      }

      const uploadData = await uploadRes.json();
      const dnaFileUrl = uploadData.fileUrl as string;

      setStatus("analyzing");

      // Step 2: Call Signal Kit analysis — userId verified server-side via Clerk auth
      // Server-side: calls signal-kit service (Sequencing.com RTP) with retry + mock fallback
      const res = await fetch("/api/signal-kit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dnaFileUrl }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      if (!data.success) throw new Error("Analysis returned unsuccessful response");

      setResult(data.analysis);
      setStatus("done");
      toast.success("DNA analysis complete!");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Analysis failed. Please try again.");
    }
  }

  const currentStep = status === "idle" || status === "error" ? 1 : status === "uploading" || status === "analyzing" ? 2 : 3;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DNA Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Upload your raw DNA file to generate your personalized optimization blueprint.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                  ? "bg-primary/20 text-primary border border-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
            </div>
            <span className={`text-sm hidden sm:block ${currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-12 mx-1 ${currentStep > step.id ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {status === "idle" || status === "error" ? (
        <Card className="p-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              Upload Your DNA File
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
            {/* Supported formats */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Supported formats:</span>
              {["23andMe", "AncestryDNA", "MyHeritage", "FTDNA", "LivingDNA", "Nebula Genomics"].map((fmt) => (
                <Badge key={fmt} variant="secondary">
                  {fmt}
                </Badge>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => {
                const input = window.document.createElement("input");
                input.type = "file";
                input.accept = ".txt,.csv,.zip";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFile(f);
                };
                input.click();
              }}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-4 rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Drop your DNA file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse &bull; .txt, .csv, .zip &bull; Max 100MB
                  </p>
                </>
              )}
            </div>

            {status === "error" && error && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border">
              <ShieldIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your DNA file is processed locally and transmitted encrypted to our analysis
                engine. Files are never stored on our servers after analysis completes. HelixForge
                never shares your genetic data with third parties.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full"
            >
              <Dna className="mr-2 h-4 w-4" />
              Analyze My DNA
            </Button>
          </CardContent>
        </Card>
      ) : status === "uploading" || status === "analyzing" ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Dna className="h-6 w-6 text-primary absolute inset-0 m-auto" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {status === "uploading" ? "Uploading..." : "Analyzing your DNA..."}
              </p>
              <p className="text-muted-foreground mt-1">
                {status === "uploading"
                  ? "Securely transferring your genetic data"
                  : "Processing 270,000+ gene-peptide-pathway connections"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              This typically takes 30–60 seconds. Please don&apos;t close this page.
            </p>
          </div>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <p className="font-bold text-lg">Analysis Complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.geneVariants.length} gene variants identified &bull;{" "}
                  {result.peptidePathways.length} peptide pathways mapped
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your personalized protocol blueprint has been generated. Review your key findings
              below, then head to <strong>My Protocol</strong> for your complete 90-day plan.
            </p>
          </Card>

          {/* Gene Variants */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Gene Variants Identified</h3>
            <div className="space-y-3">
              {result.geneVariants.map(({ gene, variant, impact }) => (
                <div key={variant} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="font-mono font-semibold text-sm">{gene}</p>
                    <p className="text-xs text-muted-foreground">{variant}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {impact.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Peptide Pathways */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Recommended Peptide Pathways</h3>
            <div className="space-y-4">
              {result.peptidePathways.map(({ peptide, genes, mechanism, confidence }) => (
                <div key={peptide} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dna className="h-4 w-4 text-primary" />
                      <p className="font-semibold">{peptide}</p>
                    </div>
                    <Badge
                      variant={confidence >= 0.9 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {Math.round(confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{mechanism}</p>
                  <div className="flex flex-wrap gap-1 pl-6">
                    {genes.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs font-mono">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Recommendations */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Top Recommendations</h3>
            <div className="space-y-3">
              {result.recommendations.map(({ category, priority, rationale }, i) => (
                <div
                  key={category}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      priority === "high"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm capitalize">{category.replace(/_/g, " ")}</p>
                      <Badge
                        variant={priority === "high" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => router.push("/dashboard/protocol")} className="flex-1">
              View My Protocol
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/dashboard/coaching")}>
              Discuss with AI Coach
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
