import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return url;
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return key;
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return key;
}

// Client-side Supabase (uses anon key)
export function createBrowserClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

// Server-side Supabase with Clerk user context
export async function createServerClient() {
  const { userId } = await auth();
  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

  if (userId) {
    // Set the Clerk user ID so Supabase RLS can reference it
    supabase.auth.setSession({
      access_token: userId, // Used for custom RLS policies via user_metadata
      refresh_token: "",
    });
  }

  return supabase;
}

// Service-role Supabase client — bypasses RLS. Use only in trusted contexts (webhooks, server actions)
export function createServiceRoleClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
