import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Users,
  Dna,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createServiceRoleClient } from "@/lib/supabase/server";

function isAdminUser(userId: string | null): boolean {
  if (!userId) return false;
  const adminIds = process.env.ADMIN_USER_IDS ?? "";
  if (!adminIds) return false;
  return adminIds.split(",").map((id) => id.trim()).includes(userId);
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
}

function MetricCard({ label, value, icon: Icon, description, trend }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-0.5">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface UserRow {
  id: string;
  email: string;
  plan: string | null;
  subscription_status: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface AdminData {
  overview: {
    totalUsers: number;
    activeProtocols: number;
    coachingSessions: number;
    recentSessionCount: number;
  };
  plans: { protocol: number; coaching: number; null: number };
  protocolStatus: { active: number; pending: number; paused: number; completed: number };
  phases: { phase_1: number; phase_2: number; phase_3: number };
  recentUsers: UserRow[];
  recentSessions: SessionRow[];
}

async function loadAdminData(): Promise<AdminData | null> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      totalUsersResult,
      activeProtocolsResult,
      coachingSessionsResult,
      plansResult,
      statusResult,
      recentUsersResult,
      recentSessionsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("protocols")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("coaching_sessions")
        .select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("plan"),
      supabase.from("protocols").select("status"),
      supabase
        .from("profiles")
        .select("id, email, plan, subscription_status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("coaching_sessions")
        .select("id, user_id, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Aggregate plan counts
    const planCounts = { protocol: 0, coaching: 0, null: 0 };
    if (plansResult.data) {
      for (const row of plansResult.data) {
        const key = (row.plan ?? "null") as keyof typeof planCounts;
        if (key in planCounts) planCounts[key]++;
      }
    }

    // Aggregate status counts
    const statusCounts = { active: 0, pending: 0, paused: 0, completed: 0 };
    if (statusResult.data) {
      for (const row of statusResult.data) {
        const key = row.status as keyof typeof statusCounts;
        if (key in statusCounts) statusCounts[key]++;
      }
    }

    // Phase distribution
    const { data: phaseData } = await supabase
      .from("protocols")
      .select("phase");

    const phaseCounts = { phase_1: 0, phase_2: 0, phase_3: 0 };
    if (phaseData) {
      for (const row of phaseData) {
        const key = `phase_${row.phase}` as keyof typeof phaseCounts;
        if (key in phaseCounts) phaseCounts[key]++;
      }
    }

    // Recent sessions in 30 days
    const { count: recentSessionCount } = await supabase
      .from("coaching_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    return {
      overview: {
        totalUsers: totalUsersResult.count ?? 0,
        activeProtocols: activeProtocolsResult.count ?? 0,
        coachingSessions: coachingSessionsResult.count ?? 0,
        recentSessionCount: recentSessionCount ?? 0,
      },
      plans: planCounts,
      protocolStatus: statusCounts,
      phases: phaseCounts,
      recentUsers: (recentUsersResult.data ?? []) as UserRow[],
      recentSessions: (recentSessionsResult.data ?? []) as SessionRow[],
    };
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in?redirect=/dashboard/admin");
  if (!isAdminUser(userId)) redirect("/dashboard");

  const data = await loadAdminData();

  const statusConfig = {
    active: { label: "Active", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    pending: { label: "Pending", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    paused: { label: "Paused", icon: PauseCircle, color: "text-orange-600 bg-orange-50" },
    completed: { label: "Completed", icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and user management
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={data?.overview.totalUsers ?? "—"}
          icon={Users}
          description="All registered users"
        />
        <MetricCard
          label="Active Protocols"
          value={data?.overview.activeProtocols ?? "—"}
          icon={Dna}
          description="Currently in progress"
        />
        <MetricCard
          label="AI Coaching Sessions"
          value={data?.overview.coachingSessions ?? "—"}
          icon={Brain}
          description="All-time interactions"
        />
        <MetricCard
          label="Sessions (30d)"
          value={data?.overview.recentSessionCount ?? "—"}
          icon={Clock}
          description="Last 30 days"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {[
              { label: "Protocol Only", count: data?.plans.protocol ?? 0, color: "bg-primary" },
              { label: "Protocol + Coaching", count: data?.plans.coaching ?? 0, color: "bg-purple-500" },
              { label: "No Plan", count: data?.plans.null ?? 0, color: "bg-muted-foreground" },
            ].map(({ label, count, color }) => {
              const total = (data?.overview.totalUsers ?? 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Protocol Status */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Protocol Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]][]).map(
              ([key, cfg]) => {
                const count = data?.protocolStatus[key] ?? 0;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`h-4 w-4 ${cfg.color.replace("bg-", "text-")}`} />
                      <span className="text-sm text-muted-foreground">{cfg.label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              }
            )}
          </CardContent>
        </Card>

        {/* Phase Progress */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Phase Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {[
              { label: "Foundation (Wks 1–4)", key: "phase_1" as const },
              { label: "Optimization (Wks 5–8)", key: "phase_2" as const },
              { label: "Consolidation (Wks 9–12)", key: "phase_3" as const },
            ].map(({ label, key }) => {
              const count = data?.phases[key] ?? 0;
              const total = (data?.overview.activeProtocols ?? 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Recent Users Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Users</h2>
          <span className="text-sm text-muted-foreground">
            Showing last 10 registrations
          </span>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subscription</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.recentUsers || data.recentUsers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No users yet
                    </td>
                  </tr>
                )}
                {data?.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.plan === "coaching" ? "default" : "secondary"}>
                        {user.plan ?? "No plan"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          user.subscription_status === "active"
                            ? "border-green-500 text-green-600"
                            : "border-muted-foreground/30"
                        }
                      >
                        {user.subscription_status ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Coaching Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent AI Coaching Sessions</h2>
        </div>
        <Card>
          <div className="divide-y">
            {(!data?.recentSessions || data.recentSessions.length === 0) && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No coaching sessions yet
              </div>
            )}
            {data?.recentSessions.map((session) => (
              <div key={session.id} className="px-4 py-3 flex items-start gap-3">
                <Brain className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {truncate(session.message, 120)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(session.created_at)} · User: {session.user_id.slice(0, 8)}…
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stripe Note */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong>Revenue metrics:</strong> Stripe dashboard provides live MRR, churn, and
            conversion data. Connect your Stripe dashboard at{" "}
            <span className="font-mono text-xs">dashboard.stripe.com</span> for real-time
            financial reporting. Set <span className="font-mono text-xs">ADMIN_USER_IDS</span> in
            environment variables to grant admin access.
          </p>
        </div>
      </Card>
    </div>
  );
}
