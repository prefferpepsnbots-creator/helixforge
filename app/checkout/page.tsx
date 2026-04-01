"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LandingNav } from "@/components/landing-nav";

const PLAN_DETAILS = {
  protocol: {
    name: "Protocol Access",
    price: 297,
    priceLabel: "$297",
    description: "One-time payment for your complete 90-day DNA-driven protocol blueprint.",
    features: [
      "Complete genetic analysis",
      "270,000+ gene-peptide-pathway connections",
      "Personalized 90-day protocol",
      "Evidence-based training plan",
      "Precision nutrition blueprint",
      "Digital dashboard access",
      "Physician consultation checklist",
    ],
  },
  coaching: {
    name: "Protocol + AI Coaching",
    price: 97,
    priceLabel: "$97/mo",
    description: "Everything in Protocol Access, plus unlimited AI coaching and weekly protocol adjustments.",
    features: [
      "Everything in Protocol Access",
      "Unlimited AI coaching sessions",
      "Weekly protocol adjustments",
      "Progress tracking & analytics",
      "Monthly check-in reports",
      "Priority physician coordination",
      "Community access",
    ],
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const planKey = (searchParams.get("plan") ?? "protocol") as "protocol" | "coaching";
  const canceled = searchParams.get("canceled");
  const plan = PLAN_DETAILS[planKey] ?? PLAN_DETAILS.protocol;

  useEffect(() => {
    if (canceled) {
      toast("Checkout canceled — no charges were made.");
    }
  }, [canceled]);

  async function handleCheckout() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/checkout?plan=${planKey}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{plan.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                    <Badge variant={planKey === "coaching" ? "default" : "secondary"}>
                      {planKey === "coaching" ? "Subscription" : "One-time"}
                    </Badge>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-black">
                      {plan.priceLabel}
                      {planKey === "coaching" && (
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      )}
                      {planKey === "protocol" && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">one-time</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout CTA */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Optimize?</h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {planKey === "coaching"
                  ? "Join 1,200+ members getting weekly protocol adjustments powered by AI coaching."
                  : "Get your complete 90-day DNA-driven protocol blueprint today."}
              </p>

              {/* Trust signals */}
              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: ShieldCheck, label: "Secure Stripe checkout" },
                  { icon: CheckCircle2, label: "Cancel anytime" },
                  { icon: ShieldCheck, label: "Physician-verified" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {label}
                  </div>
                ))}
              </div>

              <Button size="lg" className="text-base w-full" onClick={handleCheckout} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : isSignedIn ? (
                  `Pay ${plan.priceLabel}`
                ) : (
                  "Sign in to Checkout"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                By completing your purchase you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/disclaimer" className="underline hover:text-foreground">Medical Disclaimer</Link>.
                HelixForge does not sell, compound, or prescribe peptides.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
