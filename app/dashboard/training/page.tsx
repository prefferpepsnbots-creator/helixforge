import { Dumbbell, TrendingUp, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const GENETIC_INSIGHTS = [
  { gene: "ACTN3", finding: "Power-endurance hybrid type", implication: "Compound emphasis, moderate volume" },
  { gene: "ACE", finding: "Endurance-favoring", implication: "Higher frequency tolerated" },
  { gene: "BDKRB2", finding: "High peptide sensitivity", implication: "Optimized recovery with BPC-157" },
];

const TRAINING_WEEKS = [
  { week: "Week 1–2", focus: "Neuromuscular priming", sessions: 4, intensity: "55–65% 1RM", volume: "12–16 sets/muscle", note: "Movement pattern mastery, RPE 6-7" },
  { week: "Week 3–4", focus: "Accumulation", sessions: 5, intensity: "65–75% 1RM", volume: "16–20 sets/muscle", note: "Volume emphasis, RPE 7-8" },
  { week: "Week 5–8", focus: "Peptide integration", sessions: 5, intensity: "70–80% 1RM", volume: "18–22 sets/muscle", note: "BPC-157/TB-500 active — focus on tissue tolerance" },
  { week: "Week 9–12", focus: "Intensification", sessions: 4, intensity: "80–90% 1RM", volume: "14–18 sets/muscle", note: "Load emphasis, protocol assessment weeks 10-11" },
];

const WORKOUT_TYPES = [
  { label: "Heavy Compound", desc: "Squat, deadlift, bench, OHP — primary strength days", days: "Mon / Thu" },
  { label: "Volume / Accessories", desc: "Hypertrophy-focused isolation and compound variations", days: "Tue / Fri" },
  { label: "Conditioning", desc: "Low-impact cardio, HIIT, or zone 2 based on ACE profile", days: "Wed / Sat" },
  { label: "Recovery", desc: "Mobility, stretching, peptides on rest days", days: "Sun" },
];

export default function TrainingPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Plan</h1>
        <p className="text-muted-foreground mt-1">
          Periodized strength programming calibrated to your ACTN3 + ACE expression
        </p>
      </div>

      {/* Genetic Profile */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Your Athletic Expression Profile
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {GENETIC_INSIGHTS.map(({ gene, finding, implication }) => (
            <div key={gene} className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-mono font-semibold text-sm mb-1">{gene}</p>
              <p className="text-xs text-primary font-medium mb-2">{finding}</p>
              <p className="text-xs text-muted-foreground">{implication}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Periodization */}
      <div>
        <h2 className="font-semibold text-lg mb-4">90-Day Periodization</h2>
        <div className="space-y-4">
          {TRAINING_WEEKS.map((w) => (
            <Card key={w.week}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{w.week}</Badge>
                    <CardTitle className="text-base">{w.focus}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" />
                      {w.sessions} sessions
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Intensity</p>
                    <p className="font-medium">{w.intensity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Volume</p>
                    <p className="font-medium">{w.volume}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Note</p>
                    <p className="font-medium">{w.note}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={(TRAINING_WEEKS.indexOf(w) + 1) * 25} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Structure */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Weekly Training Structure</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {WORKOUT_TYPES.map(({ label, desc, days }) => (
            <div key={label} className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {days}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recovery Protocol */}
      <Card className="p-6 bg-muted/30">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recovery & Peptide Timing
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Training days:</strong> BPC-157 subcutaneous injection
            30–60 minutes before training. Target tissue area or abdominal fat.
          </p>
          <p>
            <strong className="text-foreground">Off days:</strong> TB-500 injection. Focus on
            areas of prior injury or high training stress.
          </p>
          <p>
            <strong className="text-foreground">Sleep:</strong> 7–9 hours minimum. BDNF variants
            affect your recovery sleep architecture — prioritize consistent bedtime.
          </p>
          <p className="text-xs">
            Coordinate specific dosing with your physician. Never self-prescribe peptides.
          </p>
        </div>
      </Card>
    </div>
  );
}
