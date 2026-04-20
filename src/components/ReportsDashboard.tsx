import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PipelineResult, Severity } from "@/lib/mockPipeline";

interface Props {
  reports: PipelineResult[];
  onSelect: (r: PipelineResult) => void;
}

const sevDot: Record<Severity, string> = {
  HIGH: "bg-destructive text-destructive",
  MEDIUM: "bg-warning text-warning",
  LOW: "bg-success text-success",
};

export function ReportsDashboard({ reports, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | Severity>("ALL");

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSev = filter === "ALL" || r.severity === filter;
      const matchQ =
        !q ||
        r.location.toLowerCase().includes(q.toLowerCase()) ||
        r.authority.toLowerCase().includes(q.toLowerCase()) ||
        r.labels.some((l) => l.toLowerCase().includes(q.toLowerCase()));
      return matchSev && matchQ;
    });
  }, [reports, q, filter]);

  const counts = useMemo(
    () => ({
      total: reports.length,
      HIGH: reports.filter((r) => r.severity === "HIGH").length,
      MEDIUM: reports.filter((r) => r.severity === "MEDIUM").length,
      LOW: reports.filter((r) => r.severity === "LOW").length,
    }),
    [reports],
  );

  return (
    <section id="reports" className="panel p-6 lg:p-7">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mono text-[10px] tracking-widest text-primary">03 / DASHBOARD</div>
          <h2 className="font-display text-xl font-semibold">Reports Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="TOTAL" value={counts.total} />
          <Stat label="HIGH" value={counts.HIGH} accent="destructive" />
          <Stat label="MED" value={counts.MEDIUM} accent="warning" />
          <Stat label="LOW" value={counts.LOW} accent="success" />
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search location, authority, label…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 pl-9 bg-input/60"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 p-0.5">
          <Filter className="ml-2 mr-1 h-3.5 w-3.5 text-muted-foreground" />
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                "mono h-7 px-2.5 text-[10px] tracking-wider",
                filter === f && "bg-primary/15 text-primary hover:bg-primary/20",
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
          No reports match your filters.
        </div>
      ) : (
        <div className="scrollbar-thin -mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 px-2">
            <thead>
              <tr className="mono text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 pb-1 font-normal">ID</th>
                <th className="px-3 pb-1 font-normal">Risk</th>
                <th className="px-3 pb-1 font-normal">Location</th>
                <th className="px-3 pb-1 font-normal">Authority</th>
                <th className="px-3 pb-1 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="group cursor-pointer rounded-lg bg-muted/20 transition hover:bg-primary/5"
                >
                  <td className="rounded-l-md px-3 py-3 mono text-[11px] text-primary">
                    #{r.id.slice(0, 6).toUpperCase()}
                  </td>
                  <td className="px-3 py-3">
                    <span className="mono inline-flex items-center gap-1.5 text-[11px]">
                      <span className={cn("status-dot animate-pulse-glow", sevDot[r.severity])} />
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground/85">{r.location}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground group-hover:text-foreground/85">
                    {r.authority}
                  </td>
                  <td className="rounded-r-md px-3 py-3 mono text-[11px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "destructive" | "warning" | "success" }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-center">
      <div
        className={cn(
          "font-display text-base font-semibold leading-none",
          accent === "destructive" && "text-destructive",
          accent === "warning" && "text-warning",
          accent === "success" && "text-success",
        )}
      >
        {value}
      </div>
      <div className="mono mt-0.5 text-[9px] tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
