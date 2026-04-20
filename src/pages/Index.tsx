import { useCallback, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UploadPanel } from "@/components/UploadPanel";
import { PipelineLog } from "@/components/PipelineLog";
import { ResultCard, ResultCardEmpty } from "@/components/ResultCard";
import { ReportsDashboard } from "@/components/ReportsDashboard";
import { PIPELINE_STEPS, pickScenario, type PipelineResult, type PipelineStep } from "@/lib/mockPipeline";
import { Activity } from "lucide-react";

const SEED_REPORTS: PipelineResult[] = [
  {
    id: "rep_a1b2c3",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    imagePreview:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(155 56% 19%)'/><text x='50' y='55' font-family='monospace' font-size='10' fill='hsl(165 71% 50%)' text-anchor='middle'>WASTE</text></svg>`,
      ),
    location: "MG Road, Sector 14",
    labels: ["garbage", "plastic", "overflow"],
    explanation: "Bin overflow detected near transit hub.",
    severity: "HIGH",
    priority: "CRITICAL",
    authority: "Municipal Waste Department",
    notifications: { email: true, sheets: true, messaging: true },
  },
  {
    id: "rep_d4e5f6",
    createdAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    imagePreview:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(210 50% 9%)'/><text x='50' y='55' font-family='monospace' font-size='10' fill='hsl(38 95% 58%)' text-anchor='middle'>POTHOLE</text></svg>`,
      ),
    location: "Ring Road, KM 4.2",
    labels: ["pothole", "road damage"],
    explanation: "Mid-size pothole on primary route.",
    severity: "MEDIUM",
    priority: "NORMAL",
    authority: "Public Works (Roads)",
    notifications: { email: true, sheets: true, messaging: false },
  },
  {
    id: "rep_g7h8i9",
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    imagePreview:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(210 60% 6%)'/><text x='50' y='55' font-family='monospace' font-size='8' fill='hsl(150 70% 50%)' text-anchor='middle'>STREET LIGHT</text></svg>`,
      ),
    location: "Park Lane 22",
    labels: ["street light", "outage"],
    explanation: "Single street light non-functional.",
    severity: "LOW",
    priority: "NORMAL",
    authority: "Electrical Maintenance Division",
    notifications: { email: true, sheets: true, messaging: false },
  },
];

const Index = () => {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" })),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState<PipelineResult | null>(null);
  const [reports, setReports] = useState<PipelineResult[]>(SEED_REPORTS);

  // SEO
  useEffect(() => {
    document.title = "Civic.AI Mission Control — AI Pipeline for Civic Reports";
    const meta =
      document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute(
      "content",
      "Upload a civic issue photo. Our AI pipeline (Vision + Gemini + n8n) detects, prioritizes, and routes it to the right authority in real-time.",
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  const runPipeline = useCallback(
    async (data: { file: File; preview: string; location: string }) => {
      setIsProcessing(true);
      setActiveResult(null);

      const fresh: PipelineStep[] = PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" }));
      setSteps(fresh);

      const scenario = pickScenario(data.file.name + data.location);
      const id = "rep_" + Math.random().toString(36).slice(2, 10);

      const stepDetails: Record<string, string> = {
        upload: `POST /api/report · ${(data.file.size / 1024).toFixed(1)}KB · @${data.location}`,
        vision: `labels = [${scenario.labels.slice(0, 3).map((l) => `"${l}"`).join(", ")}…]`,
        gemini: scenario.explanation.slice(0, 90) + "…",
        risk: `severity = ${scenario.severity}`,
        priority: `priority = ${scenario.priority}`,
        routing: `authority = ${scenario.authority}`,
        n8n: `webhook → gmail ✓ sheets ✓ ${scenario.notifications.messaging ? "telegram ✓" : ""}`,
      };

      for (let i = 0; i < fresh.length; i++) {
        await new Promise((r) => setTimeout(r, 250));
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
        const dur = 400 + Math.floor(Math.random() * 700);
        await new Promise((r) => setTimeout(r, dur));
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "done", durationMs: dur, detail: stepDetails[s.id] } : s,
          ),
        );
      }

      const result: PipelineResult = {
        id,
        createdAt: new Date().toISOString(),
        imagePreview: data.preview,
        location: data.location,
        ...scenario,
      };
      setActiveResult(result);
      setReports((prev) => [result, ...prev]);
      setIsProcessing(false);
    },
    [],
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
            <SidebarTrigger />
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-sm font-semibold tracking-tight">Civic AI Mission Control</h1>
              <span className="mono text-[10px] text-muted-foreground">v0.1 · DEMO</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <span className="mono hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
                <Activity className="h-3 w-3 text-primary" />
                pipeline latency · ~4.2s
              </span>
              <span className="mono inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-2 py-1 text-[10px] tracking-wider text-success">
                <span className="status-dot bg-success text-success animate-pulse-glow" />
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
          </header>

          {/* Hero strip */}
          <section className="border-b border-border/60 bg-background/30">
            <div className="grid-bg">
              <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
                <div className="mono mb-2 text-[10px] tracking-widest text-primary">CIVIC INTELLIGENCE PIPELINE</div>
                <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                  Perception. Reasoning. <span className="text-primary text-glow">Automation.</span>
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Upload a civic issue. Google Vision detects, Gemini reasons, our engines score and route, and n8n
                  dispatches the alert — all in seconds.
                </p>
              </div>
            </div>
          </section>

          {/* Main grid */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <UploadPanel onSubmit={runPipeline} isProcessing={isProcessing} />
              <PipelineLog steps={steps} />
            </div>

            <div className="mt-6">
              {activeResult ? <ResultCard result={activeResult} /> : <ResultCardEmpty />}
            </div>

            <div className="mt-6">
              <ReportsDashboard reports={reports} onSelect={setActiveResult} />
            </div>

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground">
              <span className="mono">© CIVIC.AI · DEMO BUILD</span>
              <span className="mono">FastAPI · Google Vision · Gemini · n8n</span>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
