import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

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
    // Verify user server-side — do NOT trust userId from client request body.
    // Call auth() and currentUser() separately to avoid TypeScript inference issues
    // with Promise.all array destructuring.
    const authObj = await auth();
    const clerkUserId = authObj.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body as { plan: "protocol" | "coaching" };

    if (!plan || !["protocol", "coaching"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = plan === "protocol" ? PRICE_PROTOCOL : PRICE_COACHING;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Get email from Clerk user object (server-verified), not client body
    const clerkUser = await currentUser();
    const primaryEmailId = clerkUser?.primaryEmailAddressId;
    const email =
      primaryEmailId && clerkUser?.emailAddresses
        ? clerkUser.emailAddresses.find((e) => e.id === primaryEmailId)?.emailAddress
        : clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined;

    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: plan === "coaching" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${appUrl}/checkout?plan=${plan}&canceled=true`,
      metadata: {
        plan,
        // Use server-verified Clerk userId — never trust the client body
        userId: clerkUserId,
      },
      ...(email ? { customer_email: email } : {}),
      ...(plan === "coaching"
        ? {
            subscription_data: {
              metadata: { plan, userId: clerkUserId },
            },
          }
        : {
            payment_intent_data: {
              metadata: { plan, userId: clerkUserId },
            },
          }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
