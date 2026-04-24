// Mock AI pipeline — simulates the FastAPI + Vision + Gemini + n8n flow
// Replace these with real API calls to your FastAPI backend later.

export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type Priority = "NORMAL" | "CRITICAL";

export interface PipelineStep {
  id: string;
  module: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  durationMs?: number;
}

export interface PipelineResult {
  id: string;
  userId?: number;
  createdAt: string;
  imagePreview: string;
  location: string;
  labels: string[];
  explanation: string;
  severity: Severity;
  priority: Priority;
  authority: string;
  upvotes: number;
  notifications: { email: boolean; sheets: boolean; messaging: boolean };
}

const SCENARIOS: Array<Omit<PipelineResult, "id" | "createdAt" | "imagePreview" | "location">> = [
  {
    labels: ["garbage", "plastic waste", "street", "urban", "overflow"],
    explanation:
      "Unmanaged plastic waste detected on a high-density urban street. Visible overflow from a public bin suggests collection cycle has been missed for 48+ hours. Risk of clogged drains and vector-borne illness if not cleared before next rainfall.",
    severity: "HIGH",
    priority: "CRITICAL",
    authority: "Municipal Waste Department",
    notifications: { email: true, sheets: true, messaging: true },
  },
  {
    labels: ["pothole", "asphalt", "road damage", "traffic"],
    explanation:
      "Medium-sized pothole identified on a primary vehicular route. Edges show progressive erosion. Recommend patching within 7 days to prevent vehicle damage and avoid escalation during monsoon.",
    severity: "MEDIUM",
    priority: "NORMAL",
    authority: "Public Works (Roads)",
    notifications: { email: true, sheets: true, messaging: false },
  },
  {
    labels: ["street light", "pole", "night", "outage"],
    explanation:
      "Non-functional street light in a residential corridor. Single-point failure, not a grid issue. Low immediate risk but contributes to night-time safety concerns. Schedule for routine maintenance.",
    severity: "LOW",
    priority: "NORMAL",
    authority: "Electrical Maintenance Division",
    notifications: { email: true, sheets: true, messaging: false },
  },
  {
    labels: ["graffiti", "wall", "vandalism", "public property"],
    explanation:
      "Vandalism detected on public infrastructure. No hate symbols or threats identified. Cosmetic priority — assign to standard cleaning roster.",
    severity: "LOW",
    priority: "NORMAL",
    authority: "Sanitation NGO Partner",
    notifications: { email: true, sheets: true, messaging: false },
  },
  {
    labels: ["water leak", "pipe", "puddle", "road"],
    explanation:
      "Active water leakage from underground supply line. Continuous flow detected. Risk of water loss and road subsidence. Dispatch crew immediately.",
    severity: "HIGH",
    priority: "CRITICAL",
    authority: "Water Supply Board",
    notifications: { email: true, sheets: true, messaging: true },
  },
];

export const PIPELINE_STEPS: Omit<PipelineStep, "status" | "durationMs">[] = [
  { id: "upload", module: "Backend", label: "Receive image + geo-tag" },
  { id: "vision", module: "Google Vision", label: "Detect objects & scene labels" },
  { id: "gemini", module: "Gemini", label: "Reason & generate explanation" },
  { id: "risk", module: "Risk Engine", label: "Compute severity score" },
  { id: "priority", module: "Priority Engine", label: "Assign urgency tier" },
  { id: "routing", module: "Routing Engine", label: "Resolve responsible authority" },
  { id: "n8n", module: "n8n Automation", label: "Trigger Gmail + Sheets webhook" },
];

export function pickScenario(seed?: string) {
  const idx = seed
    ? [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % SCENARIOS.length
    : Math.floor(Math.random() * SCENARIOS.length);
  return SCENARIOS[idx];
}

export function severityColor(s: Severity) {
  return s === "HIGH" ? "destructive" : s === "MEDIUM" ? "warning" : "success";
}
