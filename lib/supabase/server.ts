import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

// Client-side Supabase (uses anon key, RLS applies)
export function createBrowserClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

/**
 * Server-side Supabase client for authenticated routes.
 *
 * Clerk middleware already guards all /dashboard/* and /api/* routes — if a
 * request reaches here, the user is authenticated. We use the Clerk userId
 * as a direct query filter (not RLS) to keep the pattern simple and avoid
 * Supabase JWT configuration complexity.
 *
 * For admin operations (webhooks, sync), use createServiceRoleClient() instead.
 */
export async function createServerClient() {
  const { userId } = await auth();
  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

  if (userId) {
    // Attach userId so callers can use it in .eq() filters directly.
    // RLS policies are bypassed via application-level authorization since
    // Clerk has already authenticated the request.
    (supabase as SupabaseClient & { _userId?: string })._userId = userId;
  }

  return supabase;
}

/**
 * Returns the Clerk userId for the current request, or null if unauthenticated.
 * Use this to build .eq() filters — Clerk middleware guards the route.
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

// Service-role Supabase client — bypasses RLS entirely.
// Only use in webhook handlers or server-side admin contexts.
export function createServiceRoleClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
