import {
  Dna,
  Dumbbell,
  Brain,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  FileText,
  Users,
  Clock,
} from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const FAQ_ITEMS = [
  {
    q: "Does HelixForge sell or prescribe peptides?",
    a: "No. HelixForge provides education, genetic blueprints, and training/nutrition plans only. We never sell, compound, or prescribe peptides. Every protocol requires consultation with your own licensed physician.",
  },
  {
    q: "How does the DNA analysis work?",
    a: "Upload your raw DNA file from 23andMe or AncestryDNA. Our system analyzes 270,000+ gene-peptide-pathway connections through The Signal Kit API to identify your unique optimization targets.",
  },
  {
    q: "What results can I expect?",
    a: "Most members see measurable progress within weeks 5–8 as peptide pathway activation protocols take effect. Your physician will help assess biological markers throughout the 90-day program.",
  },
  {
    q: "Is my genetic data secure?",
    a: "Yes. Your DNA data is encrypted at rest and in transit. We use Supabase with row-level security. HelixForge never shares your genetic data with third parties.",
  },
  {
    q: "Can I cancel the coaching subscription?",
    a: "Yes, cancel anytime from your account settings. Your protocol blueprint remains accessible. The one-time Protocol Access purchase is non-refundable after 30 days.",
  },
  {
    q: "Do I need prior peptide therapy experience?",
    a: "No. Protocol Access is designed for both newcomers and experienced users. Your genetic blueprint personalizes the approach regardless of your prior knowledge level.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,oklch(0.205_0_0/0.08),transparent)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-primary inline" />
                AI-Powered · DNA-Driven · Physician-Verified
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Your 90-Day Peptide{" "}
                <span className="text-primary">Optimization Protocol</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Upload your DNA. Get a hyper-personalized protocol built on{" "}
                <strong>270,000+ gene-peptide-pathway connections</strong>. Evidence-based
                training, precision nutrition, and AI coaching — all orchestrated by Paperclip
                AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <LinkButton href="/checkout?plan=coaching" size="lg" className="text-base w-full sm:w-auto">
                  Start Your Protocol — $97/mo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </LinkButton>
                <LinkButton href="/checkout?plan=protocol" size="lg" variant="outline" className="text-base w-full sm:w-auto">
                  Protocol Access — $297
                </LinkButton>
              </div>

              <p className="text-sm text-muted-foreground">
                Includes physician consultation checklist &bull; Cancel coaching anytime
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-14 text-sm text-muted-foreground">
              {[
                { icon: ShieldCheck, label: "Physician-verified protocols" },
                { icon: Dna, label: "270K+ gene connections" },
                { icon: Users, label: "1,200+ members optimized" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ── How It Works ──────────────────────────────────── */}
        <section id="how-it-works" className="py-20 sm:py-28 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                From DNA to Protocol in 3 Steps
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A streamlined process designed to get your personalized protocol live within
                days of uploading your genetic data.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  icon: FileText,
                  title: "Upload Your DNA",
                  description:
                    "Upload your raw DNA file from 23andMe or AncestryDNA. Your genetic data is encrypted and never shared.",
                  detail: "Takes ~5 minutes — compatible with most direct-to-consumer tests",
                },
                {
                  step: "02",
                  icon: Brain,
                  title: "AI Genetic Analysis",
                  description:
                    "Paperclip AI analyzes 270,000+ gene-peptide-pathway connections to identify your unique optimization targets.",
                  detail: "Powered by The Signal Kit's validated genomic database",
                },
                {
                  step: "03",
                  icon: Dna,
                  title: "Your 90-Day Protocol",
                  description:
                    "Receive a complete blueprint: peptide pathway activation, training phases, and precision nutrition — all personalized to your genetics.",
                  detail: "Reviewed by your physician before implementation",
                },
              ].map(({ step, icon: Icon, title, description, detail }) => (
                <div key={step} className="relative">
                  {/* Connector line */}
                  <div
                    className="hidden sm:block absolute top-10 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-px bg-border"
                    aria-hidden
                  />
                  <Card className="relative z-10 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-4xl font-black text-muted/20 select-none">{step}</span>
                      </div>
                      <CardTitle className="text-xl">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-muted-foreground leading-relaxed">{description}</p>
                      <p className="text-xs text-muted-foreground/70 font-medium">{detail}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ── The Signal Kit ───────────────────────────────── */}
        <section id="protocols" className="py-20 sm:py-28 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">
                  Powered by The Signal Kit
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                  270,000+ Gene-Peptide-Pathway Connections
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Your genetic variants don&apos;t exist in isolation. The Signal Kit maps your unique
                  gene expression patterns to peptide mechanisms of action — giving you a protocol
                  that&apos;s statistically optimized for your biology, not the average case.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      title: "Peptide Sensitivity Mapping",
                      desc: "Identify which peptide pathways your body responds to best based on receptor density and affinity gene variants.",
                    },
                    {
                      title: "Methylation & Metabolism Analysis",
                      desc: "Understand how your body processes and clears peptides — critical for dosing and stacking decisions.",
                    },
                    {
                      title: "Athletic Expression Profiling",
                      desc: "ACTN3, ACE, and BDNF variants inform your power-endurance balance and recovery capacity.",
                    },
                    {
                      title: "Tissue Repair Pathways",
                      desc: "Collagen, elastin, and growth factor gene expression guides your healing and adaptation timeline.",
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual DNA card */}
              <Card className="p-6 sm:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Dna className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Sample Genetic Insight</p>
                      <p className="text-sm text-muted-foreground">From your DNA blueprint</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { gene: "BDKRB2", variant: "rs8017985", finding: "Heightened peptide sensitivity", confidence: "94%" },
                      { gene: "MTHFR", variant: "rs1801133", finding: "Slow methylation — support needed", confidence: "89%" },
                      { gene: "ACTN3", variant: "rs1815739", finding: "Power-endurance hybrid type", confidence: "91%" },
                    ].map(({ gene, variant, finding, confidence }) => (
                      <div
                        key={gene}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div>
                          <p className="font-mono text-sm font-semibold">{gene}</p>
                          <p className="text-xs text-muted-foreground">{variant}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{finding}</p>
                          <p className="text-xs text-primary font-medium">{confidence} confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Recommended peptide stack for your profile:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["BPC-157", "TB-500", "Selank"].map((p) => (
                        <Badge key={p} variant="secondary">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Training & Nutrition ──────────────────────────── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Protocol Is More Than Peptides
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Your 90-day protocol integrates strength training, precision nutrition, and
                recovery optimization — all aligned with your genetic expression.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Dumbbell,
                  title: "Evidence-Based Training",
                  desc: "Periodized strength programming adapted to your ACTN3/ACE profile. Optimize power, endurance, or hybrid based on your genes.",
                  phase: "Weeks 1–12",
                },
                {
                  icon: Brain,
                  title: "Precision Nutrition",
                  desc: "Macro and micronutrient blueprints informed by MTHFR, FTO, and metabolic gene variants. No generic templates.",
                  phase: "Personalized",
                },
                {
                  icon: Clock,
                  title: "Recovery Optimization",
                  desc: "Sleep, stress, and peptide timing protocols calibrated to your circadian and cortisol gene expression.",
                  phase: "Daily Protocol",
                },
              ].map(({ icon: Icon, title, desc, phase }) => (
                <Card key={title} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-xs text-muted-foreground">{phase}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Pricing ──────────────────────────────────────── */}
        <section id="pricing" className="py-20 sm:py-28 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                One-time protocol access or ongoing AI coaching. Both plans include your complete
                genetic blueprint.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Protocol Access */}
              <Card className="p-8">
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    One-Time Purchase
                  </Badge>
                  <CardTitle className="text-3xl font-black">$297</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">Protocol Access</p>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Your complete 90-day DNA-driven protocol blueprint. Everything you need to
                  begin optimizing — delivered once, yours forever.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Complete genetic analysis",
                    "270,000+ gene-peptide-pathway connections",
                    "Personalized 90-day protocol",
                    "Evidence-based training plan",
                    "Precision nutrition blueprint",
                    "Digital dashboard access",
                    "Physician consultation checklist",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <LinkButton href="/checkout?plan=protocol" size="lg" variant="outline" className="w-full">
                  Get Protocol Access
                </LinkButton>
              </Card>

              {/* Protocol + AI Coaching */}
              <Card className="p-8 border-primary/40 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    Subscription
                  </Badge>
                  <CardTitle className="text-3xl font-black">$97/mo</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">Protocol + AI Coaching</p>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Everything in Protocol Access, plus unlimited AI coaching sessions and weekly
                  protocol adjustments as your data evolves.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Protocol Access",
                    "Unlimited AI coaching sessions",
                    "Weekly protocol adjustments",
                    "Progress tracking & analytics",
                    "Monthly check-in reports",
                    "Priority physician coordination",
                    "Community access",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <LinkButton href="/checkout?plan=coaching" size="lg" className="w-full">
                  Start AI Coaching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </LinkButton>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Secure Stripe checkout
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cancel coaching anytime
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Physician-verified protocols
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Medical Disclaimer Banner ───────────────────── */}
        <section className="py-12 bg-muted/20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Education & Planning Only</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              HelixForge never sells, compounds, or prescribes peptides. Our platform provides
              genetic education and protocol planning tools. All protocols must be reviewed and
              approved by your personal licensed physician before implementation.
            </p>
          </div>
        </section>

        <Separator />

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section id="faq" className="py-20 sm:py-28 scroll-mt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map(({ q, a }) => (
                <Card key={q} className="p-6">
                  <p className="font-semibold mb-2">{q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Still have questions? We&apos;re here to help.
              </p>
              <LinkButton href="/sign-in?redirect=/dashboard/coaching" variant="outline">
                Chat with AI Coaching
                <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Your Protocol Is Waiting
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-xl mx-auto">
              Upload your DNA today and have your complete 90-day optimization blueprint ready
              within 48 hours. First step takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <LinkButton
                href="/checkout?plan=coaching"
                size="lg"
                variant="secondary"
                className="text-base w-full sm:w-auto"
              >
                Start AI Coaching — $97/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton
                href="/checkout?plan=protocol"
                size="lg"
                variant="outline"
                className="text-base w-full sm:w-auto"
              >
                Protocol Access — $297
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
