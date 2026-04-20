import { AlertTriangle, Building2, CheckCircle2, MapPin, Mail, FileSpreadsheet, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineResult } from "@/lib/mockPipeline";

interface Props {
  result: PipelineResult;
}

const sevStyle = {
  HIGH: "bg-destructive/15 text-destructive border-destructive/40",
  MEDIUM: "bg-warning/15 text-warning border-warning/40",
  LOW: "bg-success/15 text-success border-success/40",
};

const priStyle = {
  CRITICAL: "bg-destructive/15 text-destructive border-destructive/40",
  NORMAL: "bg-info/15 text-info border-info/40",
};

export function ResultCard({ result }: Props) {
  return (
    <section className="panel overflow-hidden animate-fade-in">
      <div className="grid md:grid-cols-[260px_1fr]">
        {/* Image */}
        <div className="relative aspect-square md:aspect-auto bg-muted/40">
          <img src={result.imagePreview} alt="Report" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/60 to-transparent md:bg-gradient-to-r" />
          <div className="absolute bottom-3 left-3 mono text-[10px] tracking-widest text-primary">
            REPORT_{result.id.slice(0, 6).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wider",
                sevStyle[result.severity],
              )}
            >
              <AlertTriangle className="h-3 w-3" /> {result.severity} RISK
            </span>
            <span
              className={cn(
                "mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wider",
                priStyle[result.priority],
              )}
            >
              {result.priority}
            </span>
            <span className="mono ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {result.location}
            </span>
          </div>

          <h3 className="font-display text-xl font-semibold leading-tight">
            Routed to <span className="text-primary">{result.authority}</span>
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{result.explanation}</p>

          <div className="mt-4">
            <div className="mono text-[10px] tracking-widest text-muted-foreground">DETECTED LABELS</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.labels.map((l) => (
                <span
                  key={l}
                  className="mono rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary/90"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <div className="mono text-[10px] tracking-widest text-muted-foreground">n8n DISPATCHED</div>
            <NotifBadge active={result.notifications.email} icon={Mail} label="Gmail" />
            <NotifBadge active={result.notifications.sheets} icon={FileSpreadsheet} label="Sheets" />
            <NotifBadge active={result.notifications.messaging} icon={MessageSquare} label="Telegram" />
            <span className="mono ml-auto inline-flex items-center gap-1.5 text-[11px] text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> COMPLETE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotifBadge({
  active,
  icon: Icon,
  label,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/60 bg-muted/30 text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
      <span className={cn("status-dot ml-0.5", active ? "bg-primary text-primary" : "bg-muted-foreground/40 text-muted-foreground/40")} />
    </span>
  );
}

export function ResultCardEmpty() {
  return (
    <section className="panel grid place-items-center p-10 text-center">
      <Building2 className="mb-3 h-8 w-8 text-muted-foreground/60" />
      <h3 className="font-display text-lg">No active report</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Submit an image with a location to see the AI pipeline classify, prioritize, and route it in real-time.
      </p>
    </section>
  );
}
