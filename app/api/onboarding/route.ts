import { NextRequest, NextResponse } from "next/server";
import { sendOnboardingEmail } from "@/lib/email/send";

/**
 * Onboarding email trigger — called after a successful checkout.
 * In production, this is called by the Stripe webhook handler after
 * `provisionUserAccess` succeeds.
 *
 * Can also be called directly for testing or manual triggers.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, plan } = body as {
      email: string;
      name?: string;
      plan: "protocol" | "coaching";
    };

    if (!email || !plan) {
      return NextResponse.json({ error: "email and plan are required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[onboarding] RESEND_API_KEY not set — skipping email send");
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
    }

    await sendOnboardingEmail({ to: email, name: name ?? "", plan });

    console.log(`[onboarding] Welcome email sent to ${email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding]", err);
    return NextResponse.json({ error: "Failed to send onboarding email" }, { status: 500 });
  }
}
