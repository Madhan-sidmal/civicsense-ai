import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/lib/mockPipeline";

interface Props {
  steps: PipelineStep[];
}

export function PipelineLog({ steps }: Props) {
  return (
    <section id="pipeline" className="panel p-6 lg:p-7">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="mono text-[10px] tracking-widest text-primary">02 / EXECUTION</div>
          <h2 className="font-display text-xl font-semibold">Live Pipeline Log</h2>
        </div>
        <span className="mono text-[10px] text-muted-foreground">
          {steps.filter((s) => s.status === "done").length}/{steps.length} STEPS
        </span>
      </header>

      <ol className="relative space-y-3">
        <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border/70" aria-hidden />
        {steps.map((s, i) => {
          const active = s.status === "running";
          const done = s.status === "done";
          return (
            <li key={s.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div
                className={cn(
                  "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all",
                  done && "border-primary bg-primary/15 text-primary",
                  active && "border-primary bg-primary/10 text-primary animate-pulse-glow",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-2 w-2 fill-current" />
                )}
              </div>

              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span
                    className={cn(
                      "mono text-[10px] tracking-widest",
                      done ? "text-primary" : active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    [{s.module.toUpperCase()}]
                  </span>
                  <span className={cn("text-sm", !done && !active && "text-muted-foreground")}>
                    {s.label}
                  </span>
                  {s.durationMs !== undefined && (
                    <span className="mono ml-auto text-[10px] text-muted-foreground">{s.durationMs}ms</span>
                  )}
                  {active && (
                    <span className="mono ml-auto text-[10px] text-primary animate-blink">RUNNING…</span>
                  )}
                </div>
                {s.detail && (
                  <p className="mono mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
