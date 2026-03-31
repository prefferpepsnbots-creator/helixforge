import { Brain, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NUTRIENT_GUIDANCE = [
  {
    nutrient: "Methylated B-Complex",
    gene: "MTHFR",
    rationale: "rs1801133 variant causes slow methylation — non-methylated B-vitamins are poorly utilized",
    recommendation: "Methylfolate, methylcobalamin, P-5-P. Avoid folic acid.",
    priority: "high",
  },
  {
    nutrient: "Omega-3 (EPA/DHA)",
    gene: "FADS1 / General",
    rationale: "Anti-inflammatory support for peptide pathway optimization. EPA 2-3g/day.",
    recommendation: "Fatty fish 3x/week + omega-3 supplement. Genetic FADS1 variant may affect conversion.",
    priority: "high",
  },
  {
    nutrient: "Protein",
    gene: "General",
    rationale: "2.0–2.2g/kg lean body mass for tissue repair during peptide protocol",
    recommendation: "Whey or beef protein post-workout. Spread across 4-5 feedings.",
    priority: "high",
  },
  {
    nutrient: "Vitamin D + K2",
    gene: "General",
    rationale: "Critical for tissue repair, bone health, and peptide synergy",
    recommendation: "5000 IU D3 + 100mcg K2 MK-7 daily with fatty meal",
    priority: "medium",
  },
  {
    nutrient: "Magnesium",
    gene: "MTHFR + General",
    rationale: "MTHFR variants increase magnesium utilization. Also supports sleep quality.",
    recommendation: "300-400mg magnesium glycinate before bed. Reduces cortisol.",
    priority: "medium",
  },
  {
    nutrient: "Collagen peptides",
    gene: "COL1A1",
    rationale: "COL1A1 variant influences tissue repair capacity. Collagen supports BPC-157 synergy.",
    recommendation: "10-15g collagen peptides daily. Hydrolyzed for bioavailability.",
    priority: "medium",
  },
];

const DAILY_TEMPLATE = [
  { meal: "Meal 1 (7–8 AM)", macros: "30–40g protein, moderate fat, low carb", foods: "Eggs, meat, leafy greens, olive oil" },
  { meal: "Pre-Workout (10–11 AM)", macros: "30g protein, 30–50g carbs", foods: "Chicken, rice, banana, or oats" },
  { meal: "Post-Workout (1–2 PM)", macros: "40–50g protein, 50–60g carbs", foods: "Meat/fish, starchy carb, vegetables" },
  { meal: "Meal 4 (4–5 PM)", macros: "30g protein, moderate fat", foods: "Fish, avocado, cruciferous vegetables" },
  { meal: "Meal 5 (7–8 PM)", macros: "30–40g protein, low carb", foods: "Lean meat, cottage cheese, vegetables" },
];

export default function NutritionPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Precision Nutrition</h1>
        <p className="text-muted-foreground mt-1">
          Nutrigenomic-aligned nutrition blueprint based on your genetic expression
        </p>
      </div>

      {/* Priority nutrients */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Key Nutrient Guidance</h2>
        <div className="space-y-4">
          {NUTRIENT_GUIDANCE.map(({ nutrient, gene, rationale, recommendation, priority }) => (
            <Card key={nutrient} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{nutrient}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="font-mono text-xs">
                    {gene}
                  </Badge>
                  <Badge variant={priority === "high" ? "default" : "secondary"} className="text-xs">
                    {priority}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rationale}</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{recommendation}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Daily template */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle>Sample Daily Nutrition Template</CardTitle>
          <p className="text-sm text-muted-foreground">
            ~2,200–2,600 kcal — adjust based on training volume and body composition goals
          </p>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          {DAILY_TEMPLATE.map(({ meal, macros, foods }) => (
            <div
              key={meal}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm">{meal}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{macros}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm">{foods}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="p-5 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This is a starting template. Your AI coach can help you
          adjust macros based on training volume, body composition changes, and how you&apos;re
          responding to the peptide protocol. Share your progress logs for personalized tweaks.
        </p>
      </Card>
    </div>
  );
}
