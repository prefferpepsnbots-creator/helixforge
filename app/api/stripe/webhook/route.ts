import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Lazy initialization to avoid build-time failures
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

type Plan = "protocol" | "coaching";

async function provisionUserAccess(
  userId: string,
  plan: Plan,
  stripeSessionId: string,
  stripeCustomerId?: string,
  email?: string
) {
  const supabase = createServiceRoleClient();

  // Upsert profile — uses Clerk user ID as primary key (not a FK to Supabase auth.users)
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        plan,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: plan === "coaching" ? stripeSessionId : null,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("[stripe/webhook] Profile upsert failed:", profileError);
    throw profileError;
  }

  // For one-time protocol purchase, create the initial protocol record
  if (plan === "protocol") {
    const { error: protocolError } = await supabase
      .from("protocols")
      .insert({
        user_id: userId,
        name: "My 90-Day Protocol",
        status: "active",
        phase: 1,
        started_at: new Date().toISOString(),
      });

    if (protocolError) {
      console.error("[stripe/webhook] Protocol insert failed:", protocolError);
      throw protocolError;
    }
  }

  console.log(`[stripe] Provisioned ${plan} access for user ${userId}`);

  // Trigger onboarding email (fire-and-forget — non-blocking)
  if (email) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    }).catch((err) => console.warn("[stripe/webhook] Onboarding email trigger failed:", err));
  }
}

async function revokeSubscriptionAccess(subscriptionId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("profiles")
    .update({ subscription_status: "canceled" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("[stripe/webhook] Subscription revocation failed:", error);
    throw error;
  }

  console.log(`[stripe] Revoked subscription ${subscriptionId}`);
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const plan = session.metadata?.plan as Plan;
        const userId = session.metadata?.userId;
        if (!userId || !plan) {
          console.error("[stripe] Missing metadata on checkout.session:", session.id);
          break;
        }
        console.log(`[stripe] Checkout completed — plan: ${plan}, userId: ${userId}`);
        await provisionUserAccess(
          userId,
          plan,
          session.subscription as string || session.id,
          session.customer as string,
          session.customer_details?.email ?? undefined
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe] Subscription canceled: ${subscription.id}`);
        await revokeSubscriptionAccess(subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[stripe] Payment failed for invoice: ${invoice.id}`);
        // TODO: Send payment failure notification email via Resend
        break;
      }

      default:
        console.log(`[stripe] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
