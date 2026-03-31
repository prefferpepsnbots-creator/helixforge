import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy initialization to avoid build-time failures when env vars are not set
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

// Price IDs — replace with real Stripe Price IDs after creating products in dashboard
const PRICE_PROTOCOL = process.env.STRIPE_PRICE_PROTOCOL ?? "price_protocol_placeholder";
const PRICE_COACHING = process.env.STRIPE_PRICE_COACHING ?? "price_coaching_placeholder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, userId, email } = body as {
      plan: "protocol" | "coaching";
      userId?: string;
      email?: string;
    };

    if (!plan || !["protocol", "coaching"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = plan === "protocol" ? PRICE_PROTOCOL : PRICE_COACHING;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: plan === "coaching" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${appUrl}/checkout?plan=${plan}&canceled=true`,
      metadata: {
        plan,
        userId: userId ?? "",
      },
      ...(email ? { customer_email: email } : {}),
      ...(plan === "coaching"
        ? {
            subscription_data: {
              metadata: { plan, userId: userId ?? "" },
            },
          }
        : {
            payment_intent_data: {
              metadata: { plan, userId: userId ?? "" },
            },
          }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
