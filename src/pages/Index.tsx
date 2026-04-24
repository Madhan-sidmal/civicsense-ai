import { useCallback, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UploadPanel } from "@/components/UploadPanel";
import { PipelineLog } from "@/components/PipelineLog";
import { ResultCard, ResultCardEmpty } from "@/components/ResultCard";
import { ReportsDashboard } from "@/components/ReportsDashboard";
import { MapDashboard } from "@/components/MapDashboard";
import { ImpactBanner } from "@/components/ImpactBanner";
import { PIPELINE_STEPS, pickScenario, type PipelineResult, type PipelineStep } from "@/lib/mockPipeline";
import { Activity, Heart, LogOut, Map as MapIcon, List as ListIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE_URL = "http://127.0.0.1:8000";

// Fallback logic if geolocation is denied
const DEFAULT_LAT = 34.0522;
const DEFAULT_LNG = -118.2437;
const getRandomJitter = () => (Math.random() - 0.5) * 0.05; // rough ~2 mile scatter

const Index = () => {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" })),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState<PipelineResult | null>(null);
  const [reports, setReports] = useState<PipelineResult[]>([]);
  const [filterMine, setFilterMine] = useState(false);

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

  // Fetch reports on load
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/reports`);
        if (!res.ok) return;
        const data = await res.json();
        
        const mapped: PipelineResult[] = data.map((d: any) => ({
          id: `rep_${d.id}`,
          userId: d.user_id,
          createdAt: d.timestamp,
          imagePreview: `${BASE_URL}/${d.image_path}`,
          location: d.latitude ? `${d.latitude}, ${d.longitude}` : "Unknown Location",
          labels: typeof d.labels === "string" ? JSON.parse(d.labels) : d.labels,
          explanation: d.explanation,
          severity: d.severity,
          priority: d.priority,
          authority: d.authority,
          upvotes: d.upvotes,
          notifications: { email: true, sheets: true, messaging: d.severity === "HIGH" },
        }));
        setReports(mapped);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };
    fetchReports();
  }, []);

  const runPipeline = useCallback(
    async (data: { file: File; preview: string; location: string }) => {
      setIsProcessing(true);
      setActiveResult(null);

      const fresh: PipelineStep[] = PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" }));
      setSteps(fresh);

      // Get location (Dynamic GPS or Jittered Default)
      let lat = String(DEFAULT_LAT + getRandomJitter());
      let lng = String(DEFAULT_LNG + getRandomJitter());
      let locString = "Unknown Location";

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        lat = String(pos.coords.latitude);
        lng = String(pos.coords.longitude);
        locString = `${lat.slice(0,7)}, ${lng.slice(0,8)}`;
      } catch (e) {
        // User denied or timeout, use jittered default
        locString = `${lat.slice(0,7)}, ${lng.slice(0,8)} (Estimated)`;
        console.log("Geolocation fallback used");
      }

      try {
        const formData = new FormData();
        formData.append("image", data.file);
        formData.append("latitude", lat);
        formData.append("longitude", lng);

        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}/api/report`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to process report");
        const scenario = await res.json();

        const stepDetails: Record<string, string> = {
          upload: `POST /api/report · ${(data.file.size / 1024).toFixed(1)}KB · @${locString}`,
          vision: `labels = [${scenario.labels.slice(0, 3).map((l: string) => `"${l}"`).join(", ")}…]`,
          gemini: scenario.explanation.slice(0, 90) + "…",
          risk: `severity = ${scenario.severity}`,
          priority: `priority = ${scenario.priority}`,
          routing: `authority = ${scenario.authority}`,
          n8n: `webhook → gmail ✓ sheets ✓ ${scenario.severity === "HIGH" ? "telegram ✓" : ""}`,
        };

        // Animate UI steps identically
        for (let i = 0; i < fresh.length; i++) {
          await new Promise((r) => setTimeout(r, 150));
          setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
          const dur = 200 + Math.floor(Math.random() * 400);
          await new Promise((r) => setTimeout(r, dur));
          setSteps((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: "done", durationMs: dur, detail: stepDetails[s.id] } : s,
            ),
          );
        }

        const result: PipelineResult = {
          id: `rep_${scenario.id}`,
          userId: scenario.user_id,
          createdAt: new Date().toISOString(),
          imagePreview: `${BASE_URL}${scenario.image_url}`,
          location: locString,
          labels: scenario.labels,
          explanation: scenario.explanation,
          severity: scenario.severity,
          priority: scenario.priority,
          authority: scenario.authority,
          upvotes: scenario.upvotes,
          notifications: { email: true, sheets: true, messaging: scenario.severity === "HIGH" },
        };
        
        setActiveResult(result);
        
        setReports((prev) => {
          const existingIdx = prev.findIndex(r => r.id === result.id);
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = result;
            return next;
          }
          return [result, ...prev];
        });
        
        setIsProcessing(false);

        toast.success("Thank you — your report is on its way!", {
          description: `Routed to ${result.authority}. You're helping make ${result.location} better.`,
          icon: <Heart className="h-4 w-4 text-accent" />,
        });
      } catch (err) {
        console.error(err);
        toast.error("Pipeline failed.");
        setIsProcessing(false);
      }
    },
    [token],
  );

  const displayedReports = filterMine ? reports.filter(r => r.userId === userId) : reports;

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
                OPERATIONAL
              </span>
              <div className="w-px h-4 bg-border mx-1"></div>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Button 
                    variant={filterMine ? "default" : "secondary"} 
                    size="sm" 
                    onClick={() => setFilterMine(!filterMine)}
                  >
                    {filterMine ? "Showing My Reports" : "My Reports"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <AuthDialog />
              )}
            </div>
          </header>

          {/* Hero strip */}
          <section className="border-b border-border/60 bg-background/30">
            <div className="grid-bg">
              <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
                <div className="mono mb-2 text-[10px] tracking-widest text-primary">
                  CIVIC INTELLIGENCE · BUILT FOR PEOPLE
                </div>
                <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                  Spot it. Snap it. <span className="text-gradient-warm">Solve it together.</span>
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Your report becomes a real action in seconds. Our AI sees, understands, and routes it to the
                  right team — so the change you want to see actually happens.
                </p>
              </div>
            </div>
          </section>

          {/* Main grid */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:py-8">
            <div className="mb-6">
              <ImpactBanner reportCount={displayedReports.length} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <UploadPanel onSubmit={runPipeline} isProcessing={isProcessing} />
              <PipelineLog steps={steps} />
            </div>

            <div className="mt-6">
              {activeResult ? <ResultCard result={activeResult} /> : <ResultCardEmpty />}
            </div>

            <div className="mt-6">
              <Tabs defaultValue="map" className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold">Live Data</h3>
                  <TabsList className="bg-muted/50 border border-border/40">
                    <TabsTrigger value="map" className="gap-2 text-xs h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      <MapIcon className="w-3 h-3" /> Map View
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2 text-xs h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      <ListIcon className="w-3 h-3" /> List View
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="map" className="m-0 border border-border/60 rounded-lg overflow-hidden">
                  <MapDashboard reports={displayedReports} onSelect={setActiveResult} />
                </TabsContent>
                <TabsContent value="list" className="m-0">
                  <ReportsDashboard reports={displayedReports} onSelect={setActiveResult} />
                </TabsContent>
              </Tabs>
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
