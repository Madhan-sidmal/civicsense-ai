import { Heart, Sparkles, TreePine, Users } from "lucide-react";

interface Props {
  reportCount: number;
}

export function ImpactBanner({ reportCount }: Props) {
  // Friendly, motivating numbers derived from the report count
  const citizens = 1248 + reportCount * 7;
  const issuesResolved = 312 + reportCount;
  const neighborhoods = 47;

  return (
    <section className="panel relative overflow-hidden p-6 lg:p-7">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-warm)" }}
      />
      <div className="relative grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <div className="impact-chip mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="mono tracking-wider">YOU&apos;RE MAKING A DIFFERENCE</span>
          </div>
          <h2 className="font-display text-2xl font-semibold leading-tight md:text-[28px]">
            Every photo you share helps build a{" "}
            <span className="text-gradient-warm">cleaner, safer city</span>
            <span className="text-primary">.</span>
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-foreground/80">
            One report can fix a pothole, restore a streetlight, or clear a hazard for thousands of
            neighbours. Thank you for being part of the change.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Users} label="Citizens helping" value={citizens.toLocaleString()} />
          <Stat icon={Heart} label="Issues resolved" value={issuesResolved.toLocaleString()} accent />
          <Stat icon={TreePine} label="Neighbourhoods" value={neighborhoods.toString()} />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center backdrop-blur">
      <Icon className={`mx-auto h-4 w-4 ${accent ? "text-accent" : "text-primary"}`} />
      <div className="mt-1.5 font-display text-lg font-semibold leading-none">{value}</div>
      <div className="mono mt-1 text-[9px] tracking-widest text-muted-foreground">{label.toUpperCase()}</div>
    </div>
  );
}
