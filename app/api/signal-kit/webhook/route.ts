import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { transformResultsToAnalysis, type SequencingWebhookPayload } from "@/lib/signal-kit";

/**
 * Signal Kit / Sequencing.com RTP Webhook Handler — HEL-72 deliverable.
 *
 * Receives callbacks from Sequencing.com when DNA analysis is complete.
 * Updates the user's protocol record and triggers downstream protocol generation.
 *
 * Sequencing.com webhook docs:
 * POST /api/signal-kit/webhook
 * Headers: X-Signal-Kit-Signature (HMAC-SHA256 of body)
 *
 * Payload shape (SequencingWebhookPayload):
 * {
 *   order_id: string,
 *   customer_id: string,
 *   status: "complete" | "error" | "failed",
 *   completed_at: string,
 *   results_url?: string,
 *   data_version?: string,
 *   genome_build?: string,
 *   error_code?: string,
 *   error_message?: string,
 * }
 */

const WEBHOOK_SECRET = process.env.SIGNAL_KIT_WEBHOOK_SECRET;

// ─── Signature verification (optional but recommended) ─────────────────────────

async function verifyWebhookSignature(
  req: NextRequest,
  body: string
): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    // No secret configured — skip verification (dev mode)
    console.warn("[signal-kit/webhook] SIGNAL_KIT_WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }

  const signature = req.headers.get("x-signal-kit-signature");
  if (!signature) {
    console.error("[signal-kit/webhook] Missing X-Signal-Kit-Signature header");
    return false;
  }

  // Compute HMAC-SHA256 of the raw body
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Support both raw hex and sha256= prefixed (GitHub-style) signatures
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return `sha256=${expected}` === signature || expected === provided;
}

// ─── Fetch results from signal-kit service ────────────────────────────────────

async function fetchResultsFromSignalKit(
  customerId: string
): Promise<{ order_id: string; customer_id: string; status: string } | null> {
  const url =
    `${process.env.SIGNAL_KIT_API_URL}/api/mock-signal-kit/results?customer_id=${encodeURIComponent(customerId)}`;

  const headers: Record<string, string> = {};
  if (process.env.SIGNAL_KIT_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.SIGNAL_KIT_API_KEY}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`[signal-kit/webhook] Failed to fetch results: ${res.status}`);
      return null;
    }
    return (await res.json()) as { order_id: string; customer_id: string; status: string };
  } catch (err) {
    console.error(`[signal-kit/webhook] Error fetching results:`, err);
    return null;
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Read raw body for signature verification (must read before parsing)
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Verify webhook signature
  if (!(await verifyWebhookSignature(req, rawBody))) {
    console.error("[signal-kit/webhook] Invalid webhook signature — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload
  let payload: SequencingWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SequencingWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { order_id, customer_id, status, completed_at, error_code, error_message } = payload;

  console.log(
    `[signal-kit/webhook] Received callback: order=${order_id} customer=${customer_id} status=${status}`
  );

  // Handle error/failed status
  if (status === "error" || status === "failed") {
    console.error(
      `[signal-kit/webhook] Analysis failed for order ${order_id}: ${error_code} — ${error_message}`
    );
    // Update protocol record to reflect error state
    const supabase = createServiceRoleClient();
    await supabase
      .from("protocols")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", customer_id);
    return NextResponse.json({ received: true, status: "error_logged" });
  }

  if (status !== "complete") {
    // Ignore in-progress status callbacks
    return NextResponse.json({ received: true, status: "ignored" });
  }

  // ── Analysis complete: fetch results and update user protocol ──────────────

  const results = await fetchResultsFromSignalKit(customer_id);

  if (!results) {
    // Results not yet available — return 200 to acknowledge receipt;
    // Sequencing.com will retry via their retry policy
    console.warn(
      `[signal-kit/webhook] Results not yet available for ${customer_id}, acknowledging to trigger retry`
    );
    return NextResponse.json({ received: true, status: "retry_needed" });
  }

  // Transform signal-kit results → dashboard analysis format
  const analysis = transformResultsToAnalysis(
    results as Parameters<typeof transformResultsToAnalysis>[0]
  );

  // Upsert protocol record with real analysis results
  const supabase = createServiceRoleClient();
  const { error: upsertError } = await supabase
    .from("protocols")
    .upsert(
      {
        user_id: customer_id,
        signal_kit_report: analysis,
        status: "active",
        phase: 1,
        started_at: completed_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error(
      `[signal-kit/webhook] Failed to persist results for ${customer_id}:`,
      upsertError
    );
    return NextResponse.json(
      { error: "Failed to persist results", detail: upsertError.message },
      { status: 500 }
    );
  }

  console.log(
    `[signal-kit/webhook] Protocol updated for ${customer_id}: ` +
      `${analysis.geneVariants.length} variants, ` +
      `${analysis.peptidePathways.length} peptide pathways`
  );

  // TODO (Week 4): Trigger Resend onboarding email with protocol summary
  // await triggerOnboardingEmail(customer_id);

  return NextResponse.json({
    received: true,
    status: "complete",
    order_id,
    customer_id,
  });
}

// Support GET for webhook health-check
export async function GET() {
  return NextResponse.json({
    endpoint: "signal-kit-webhook",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
