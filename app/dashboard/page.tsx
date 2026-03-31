import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Dna,
  Dumbbell,
  Brain,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createServerClient, getClerkUserId } from "@/lib/supabase/server";

const STATIC_PHASES = [
  {
    week: "Week 1–4",
    name: "Foundation",
    description: "Genetic analysis review & baseline assessment",
    progress: 33,
    status: "active",
  },
  {
    week: "Week 5–8",
    name: "Optimization",
    description: "Peptide pathway activation protocols",
    progress: 0,
    status: "upcoming",
  },
  {
    week: "Week 9–12",
    name: "Consolidation",
    description: "Training adaptation & nutrition refinement",
    progress: 0,
    status: "upcoming",
  },
];

const STATIC_TASKS = [
  { label: "Complete baseline strength assessment", done: false },
  { label: "Review genetic blueprint summary", done: true },
  { label: "Upload DNA data (23andMe/AncestryDNA)", done: false },
  { label: "Schedule physician consultation", done: false },
];

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  const userId = await getClerkUserId();
  const name = clerkUser?.firstName ?? "Member";

  // Fetch real protocol data from Supabase if configured
  let phases = STATIC_PHASES;
  let tasks = STATIC_TASKS;
  let daysRemaining = 78;
  const compliance = 94;

  if (userId) {
    const supabase = await createServerClient();
    const { data: protocol } = await supabase
      .from("protocols")
      .select("status, phase, started_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (protocol) {
      // Calculate days remaining from protocol start date
      if (protocol.started_at) {
        const started = new Date(protocol.started_at);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, 90 - elapsed);
      }

      // Map stored phase progress to UI phases
      phases = phases.map((p, i) => ({
        ...p,
        status: i + 1 === protocol.phase ? "active" : i + 1 < protocol.phase ? "completed" : "upcoming",
        progress: i + 1 < protocol.phase ? 100 : i + 1 === protocol.phase ? 33 : 0,
      }));
    }

    // Fetch user's checklist tasks
    const { data: userTasks } = await supabase
      .from("user_tasks")
      .select("label, completed")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(4);

    if (userTasks && userTasks.length > 0) {
      tasks = userTasks.map((t) => ({ label: t.label, done: t.completed }));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
          <p className="text-muted-foreground mt-1">
            Your 90-day protocol is active. Let&apos;s optimize today.
          </p>
        </div>
        <Link
          href="/dashboard/protocol"
          className={cn(buttonVariants({ size: "lg" }), "inline-flex items-center")}
        >
          View Full Protocol
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Protocol Status", value: "Active", icon: Zap, color: "text-primary" },
          { label: "Current Phase", value: phases.find((p) => p.status === "active")?.name ?? "Foundation", icon: Clock, color: "text-blue-500" },
          { label: "Days Remaining", value: String(daysRemaining), icon: TrendingUp, color: "text-green-500" },
          { label: "Compliance", value: `${compliance}%`, icon: CheckCircle2, color: "text-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Protocol Phases */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">90-Day Protocol Phases</h2>
          {phases.map((phase) => (
            <Card key={phase.name} className={`p-5 ${phase.status === "active" ? "border-primary/40" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={phase.status === "active" ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {phase.week}
                  </Badge>
                  <CardTitle className="text-lg">{phase.name}</CardTitle>
                </div>
                {phase.status === "active" && (
                  <Badge variant="outline" className="text-primary border-primary">In Progress</Badge>
                )}
                {phase.status === "upcoming" && (
                  <Badge variant="secondary">Upcoming</Badge>
                )}
                {phase.status === "completed" && (
                  <Badge variant="default" className="bg-green-600">Completed</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>
              {phase.status === "active" ? (
                <Progress value={phase.progress} className="h-2" />
              ) : (
                <div className="h-2 rounded-full bg-muted" />
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {phase.status === "active" ? `${phase.progress}% complete` : phase.status === "completed" ? "Done" : "Not started"}
              </p>
            </Card>
          ))}
        </div>

        {/* Today's Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Today&apos;s Tasks</h2>
          <Card className="p-5">
            <ul className="space-y-3">
              {tasks.map(({ label, done }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border mt-0.5 shrink-0 ${done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {done && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                  <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Quick Links */}
          <h2 className="text-xl font-semibold pt-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/coaching", label: "AI Coaching", icon: Brain },
              { href: "/dashboard/training", label: "Training", icon: Dumbbell },
              { href: "/dashboard/protocol", label: "Protocol", icon: Dna },
              { href: "/dashboard/settings", label: "Settings", icon: Clock },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-20 flex-col gap-2 items-center justify-center"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
