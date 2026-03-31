import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Clerk Sync Webhook Handler
 *
 * Set this URL in Clerk Dashboard > Webhooks:
 * POST https://your-domain/api/auth/sync
 * Events: user.created, user.updated
 *
 * This keeps Supabase profiles in sync with Clerk user metadata
 * so that name/avatar changes in Clerk are reflected immediately.
 */

export async function POST(req: NextRequest) {
  // Verify this is coming from Clerk (basic check — add Clerk webhook secret for production)
  const clerkSecretKey = process.env.CLERK_WEBHOOK_SECRET;
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  // In production, verify the Svix signature:
  // const wh = new Webhook(clerkSecretKey);
  // wh.verify(body, { "svix-id": svixId, ... });

  if (!svixId || !svixTimestamp || !svixSignature) {
    // Allow without svix headers in dev if CLERK_WEBHOOK_SECRET is not set
    if (!clerkSecretKey) {
      console.warn("[auth/sync] Clerk webhook secret not set — skipping signature verification");
    } else {
      return NextResponse.json({ error: "Missing Clerk webhook headers" }, { status: 400 });
    }
  }

  try {
    const body = await req.json();
    const { type, data } = body as { type: string; data: Record<string, unknown> };

    if (type !== "user.created" && type !== "user.updated") {
      return NextResponse.json({ received: true });
    }

    const userId = data.id as string;
    const email = (data.email_addresses as Array<{ email: string }>)?.[0]?.email ?? "";
    const firstName = (data.first_name as string) ?? "";
    const lastName = (data.last_name as string) ?? "";
    const imageUrl = (data.image_url as string) ?? "";

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: imageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("[auth/sync] Profile sync failed:", error);
      return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }

    console.log(`[auth/sync] Synced Clerk user ${userId} to Supabase profiles`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[auth/sync] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
