import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Admin metrics API — Week 3 deliverable.
 *
 * Returns aggregated platform metrics for the admin dashboard.
 * Access is restricted to ADMIN_USER_IDS env var (Clerk user ID allowlist).
 */

function isAdminUser(userId: string | null): boolean {
  if (!userId) return false;
  const adminIds = process.env.ADMIN_USER_IDS ?? "";
  if (!adminIds) return false;
  return adminIds.split(",").map((id) => id.trim()).includes(userId);
}

export async function GET(_req: NextRequest) {
  const { userId } = await auth();

  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Parallel queries for performance
    const [
      totalUsersResult,
      activeProtocolsResult,
      coachingSessionsResult,
      plansResult,
      statusResult,
      recentUsersResult,
      recentSessionsResult,
    ] = await Promise.all([
      // Total user count
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      // Active protocols
      supabase
        .from("protocols")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      // Coaching sessions total
      supabase
        .from("coaching_sessions")
        .select("*", { count: "exact", head: true }),
      // Plan breakdown (count by plan type)
      supabase
        .from("profiles")
        .select("plan"),
      // Protocol status breakdown
      supabase
        .from("protocols")
        .select("status"),
      // Recent users (last 10)
      supabase
        .from("profiles")
        .select("id, email, plan, subscription_status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      // Recent coaching sessions (last 10)
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

    // Aggregate protocol status counts
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

    // Sessions in last 30 days
    const { count: recentSessionCount } = await supabase
      .from("coaching_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    return NextResponse.json({
      overview: {
        totalUsers: totalUsersResult.count ?? 0,
        activeProtocols: activeProtocolsResult.count ?? 0,
        coachingSessions: coachingSessionsResult.count ?? 0,
        recentSessionCount: recentSessionCount ?? 0,
      },
      plans: planCounts,
      protocolStatus: statusCounts,
      phases: phaseCounts,
      recentUsers: recentUsersResult.data ?? [],
      recentSessions: recentSessionsResult.data ?? [],
    });
  } catch (err) {
    console.error("[admin/metrics]", err);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
