import Link from "next/link";
import { Dna, CheckCircle2, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import { createServerClient, getClerkUserId } from "@/lib/supabase/server";

type PhaseStatus = "active" | "upcoming" | "completed";

interface ProtocolPhase {
  week: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  peptideStack: string[];
  training: string;
  nutrition: string;
  tasks: { label: string; done: boolean }[];
}

const DEFAULT_PHASES: ProtocolPhase[] = [
  {
    week: "Week 1–4",
    name: "Foundation",
    description:
      "Genetic analysis review, baseline assessments, and foundational support optimization. Establish baseline biomarkers and prepare tissue for peptide pathway activation.",
    status: "active" as const,
    progress: 25,
    peptideStack: ["Baseline bloodwork", "Methylated B-complex", "Vitamin D + K2"],
    training: "Assessment & neuromuscular priming",
    nutrition: "Protein optimization (2g/kg), circadian-aligned meals",
    tasks: [
      { label: "Upload DNA data", done: false },
      { label: "Complete baseline blood panel", done: false },
      { label: "Physician consultation", done: false },
      { label: "Baseline strength assessment", done: true },
    ],
  },
  {
    week: "Week 5–8",
    name: "Optimization",
    description:
      "Peptide pathway activation protocols begin. BPC-157 and TB-500 introduced with training protocol calibrated to your ACTN3/ACE expression profile.",
    status: "upcoming" as const,
    progress: 0,
    peptideStack: ["BPC-157", "TB-500", "Selank (if anxiety/stress present)"],
    training: "Accumulation phase — volume emphasis",
    nutrition: "Glycemic management + omega-3 optimization",
    tasks: [
      { label: "Begin peptide protocol", done: false },
      { label: "Weekly training log review", done: false },
      { label: "Month-1 bloodwork check", done: false },
    ],
  },
  {
    week: "Week 9–12",
    name: "Consolidation",
    description:
      "Training adaptation consolidation and nutrition refinement. Assess peptide response and make evidence-based protocol adjustments.",
    status: "upcoming" as const,
    progress: 0,
    peptideStack: ["Peptide cycling review", "Adjustment based on biomarkers"],
    training: "Intensification phase — load emphasis",
    nutrition: "Body composition fine-tuning",
    tasks: [
      { label: "End-of-protocol bloodwork", done: false },
      { label: "Physician review session", done: false },
      { label: "90-day protocol assessment", done: false },
    ],
  },
];

export default async function ProtocolPage() {
  const userId = await getClerkUserId();
  let phases = DEFAULT_PHASES;
  let hasDnaAnalysis = false;
  let signalKitReport: Record<string, unknown> | null = null;

  if (userId) {
    const supabase = await createServerClient();

    // Fetch protocol with DNA analysis results
    const { data: protocol } = await supabase
      .from("protocols")
      .select("status, phase, started_at, signal_kit_report, protocol_blueprint")
      .eq("user_id", userId)
      .maybeSingle();

    if (protocol) {
      hasDnaAnalysis = !!protocol.signal_kit_report;
      signalKitReport = protocol.signal_kit_report as Record<string, unknown> | null;

      // Update phase statuses based on stored protocol state
      phases = phases.map((phase, i) => {
        const phaseNum = i + 1;
        if (phaseNum < (protocol.phase ?? 1)) {
          return { ...phase, status: "completed" as const, progress: 100 };
        }
        if (phaseNum === (protocol.phase ?? 1)) {
          return { ...phase, status: "active" as const };
        }
        return { ...phase, status: "upcoming" as const, progress: 0 };
      });
    }

    // Fetch user tasks to populate task completion status
    const { data: userTasks } = await supabase
      .from("user_tasks")
      .select("label, completed")
      .eq("user_id", userId)
      .order("created_at");

    if (userTasks && userTasks.length > 0) {
      phases = phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) => {
          const match = userTasks.find((ut) => ut.label.toLowerCase().includes(task.label.toLowerCase()));
          return match ? { ...task, done: match.completed } : task;
        }),
      }));
    }
  }

  // Calculate stats from phase data
  const activePhase = phases.find((p) => p.status === "active");
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const totalTasks = phases.flatMap((p) => p.tasks).length;
  const doneTasks = phases.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const compliance = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null;

  const stats = [
    { label: "Days Active", value: completedCount > 0 ? String(completedCount * 28) : "10", icon: Clock },
    { label: "Current Phase", value: activePhase?.name ?? "Foundation", icon: Dna },
    { label: "Compliance", value: compliance !== null ? `${compliance}%` : "75%", icon: CheckCircle2 },
    { label: "Next Milestone", value: activePhase ? `Week ${(phases.indexOf(activePhase) + 1) * 4 + 1}` : "Week 5", icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My 90-Day Protocol</h1>
          <p className="text-muted-foreground mt-1">
            Your complete genetic-driven optimization blueprint
          </p>
        </div>
        <LinkButton href="/dashboard/dna">
          <Dna className="mr-2 h-4 w-4" />
          {hasDnaAnalysis ? "View Genetic Analysis" : "Upload DNA"}
        </LinkButton>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* DNA Analysis Summary (shown if analysis exists) */}
      {signalKitReport && (
        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Dna className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Genetic Analysis Active</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your DNA analysis from{" "}
            {signalKitReport.generatedAt
              ? new Date(signalKitReport.generatedAt as string).toLocaleDateString()
              : "your last upload"}{" "}
            is powering this protocol.{" "}
            <Link href="/dashboard/dna" className="text-primary underline">
              View full analysis
            </Link>
          </p>
        </Card>
      )}

      {/* Protocol Phases */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Protocol Phases</h2>
        {phases.map((phase, i) => (
          <Card key={phase.name} className="overflow-hidden">
            {/* Phase header */}
            <div
              className={`px-6 py-4 flex items-center justify-between ${
                phase.status === "active"
                  ? "bg-primary/5 border-b border-primary/20"
                  : "bg-muted/30 border-b border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={phase.status === "active" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {phase.week}
                </Badge>
                <CardTitle className="text-lg">{phase.name}</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                {phase.status === "active" && (
                  <Badge variant="outline" className="text-primary border-primary">
                    In Progress
                  </Badge>
                )}
                {phase.status === "completed" && (
                  <Badge variant="default" className="bg-green-600">Completed</Badge>
                )}
                {i < phases.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <p className="text-muted-foreground text-sm leading-relaxed">{phase.description}</p>

              {phase.status === "active" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Phase Progress</span>
                    <span className="text-muted-foreground">{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
              )}

              <Separator />

              <div className="grid sm:grid-cols-3 gap-6">
                {/* Peptide Stack */}
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Dna className="h-3.5 w-3.5 text-primary" />
                    Peptide Stack
                  </p>
                  <ul className="space-y-1.5">
                    {phase.peptideStack.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Training */}
                <div>
                  <p className="text-sm font-semibold mb-2">Training Focus</p>
                  <p className="text-sm text-muted-foreground">{phase.training}</p>
                </div>

                {/* Nutrition */}
                <div>
                  <p className="text-sm font-semibold mb-2">Nutrition Focus</p>
                  <p className="text-sm text-muted-foreground">{phase.nutrition}</p>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-sm font-semibold mb-3">Phase Tasks</p>
                <div className="space-y-2">
                  {phase.tasks.map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border shrink-0 ${
                          done ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <span
                        className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Physician note */}
      <Card className="p-5 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground">
          <strong>Important:</strong> All peptide protocols require physician approval before
          implementation. Your consultation checklist is available in your account settings.
          HelixForge provides education and planning only.
        </p>
      </Card>
    </div>
  );
}
