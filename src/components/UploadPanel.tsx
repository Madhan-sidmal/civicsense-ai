import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  MapPin,
  Loader2,
  Send,
  X,
  Crosshair,
  Camera,
  RefreshCw,
  Aperture,
  SwitchCamera,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (data: { file: File; preview: string; location: string }) => void;
  isProcessing: boolean;
}

type Mode = "camera" | "upload";
type FacingMode = "environment" | "user";

export function UploadPanel({ onSubmit, isProcessing }: Props) {
  const [mode, setMode] = useState<Mode>("camera");
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [dragOver, setDragOver] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [camReady, setCamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Camera lifecycle ──────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setCamReady(false);
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Camera not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCamReady(true);
      }
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera access blocked. Allow it in your browser to capture live."
          : e?.name === "NotFoundError"
            ? "No camera found on this device."
            : "Couldn't start camera. Try uploading instead.";
      setCamError(msg);
    }
  }, [facing, stopCamera]);

  // Auto-request geolocation when camera mode opens
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setLocation("Geolocation unsupported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        );
        setGeoStatus("ok");
      },
      () => {
        setGeoStatus("error");
        setLocation((prev) => prev || "Geolocation denied — type address");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (mode === "camera" && !preview) {
      startCamera();
      if (geoStatus === "idle") requestGeo();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, facing, preview]);

  // ─── Capture & file handling ───────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !camReady) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 960;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], `civic_${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setFile(f);
        setPreview(url);
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }, [camReady, facing, stopCamera]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const retake = () => {
    setPreview(null);
    setFile(null);
    if (mode === "camera") startCamera();
  };

  const submit = () => {
    if (!file || !preview || !location.trim() || isProcessing) return;
    onSubmit({ file, preview, location: location.trim() });
  };

  const flipCamera = () => setFacing((f) => (f === "environment" ? "user" : "environment"));

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <section className="panel overflow-hidden p-6 lg:p-7">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="mono text-[10px] tracking-widest text-primary">01 / CAPTURE</div>
          <h2 className="font-display text-xl font-semibold">Snap the issue</h2>
        </div>
        <span className="mono text-xs text-muted-foreground">
          <span className="status-dot mr-2 bg-success text-success" />
          READY
        </span>
      </header>

      {/* Mode tabs — Instagram-style segmented */}
      <div className="mb-4 inline-flex rounded-full border border-border/70 bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("camera");
            if (!preview) setPreview(null);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
            mode === "camera"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Camera className="h-3.5 w-3.5" />
          Live Camera
          <span className="ml-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
            RECOMMENDED
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
            mode === "upload"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        {/* ─── Capture surface ─── */}
        <div
          className={cn(
            "relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border-2 bg-black",
            dragOver ? "border-primary" : "border-border/70",
          )}
        >
          {/* PREVIEW (after capture or upload) */}
          {preview ? (
            <>
              <img
                src={preview}
                alt="Captured"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              {isProcessing && (
                <>
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className="absolute inset-x-0 h-32 animate-scan"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.55), transparent)",
                        boxShadow: "0 0 40px hsl(var(--primary) / 0.6)",
                      }}
                    />
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="mono rounded-full bg-background/90 px-3 py-1.5 text-[10px] tracking-widest text-primary backdrop-blur">
                      ANALYZING…
                    </div>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={retake}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-background"
                disabled={isProcessing}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retake
              </button>
              <div className="mono absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 text-[10px] tracking-widest text-primary backdrop-blur">
                {file ? `${(file.size / 1024).toFixed(0)} KB · READY` : "READY"}
              </div>
            </>
          ) : mode === "camera" ? (
            <>
              {/* Live video */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  facing === "user" && "scale-x-[-1]",
                )}
              />
              {/* Viewfinder overlay */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-white/80" />
                <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-white/80" />
                <div className="absolute bottom-24 left-4 h-6 w-6 border-b-2 border-l-2 border-white/80" />
                <div className="absolute bottom-24 right-4 h-6 w-6 border-b-2 border-r-2 border-white/80" />
              </div>

              {/* Top status pills */}
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                <span className="mono inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[10px] tracking-widest text-foreground backdrop-blur">
                  <span className="status-dot bg-destructive text-destructive animate-pulse-glow" />
                  LIVE
                </span>
                <span
                  className={cn(
                    "mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] tracking-widest backdrop-blur",
                    geoStatus === "ok"
                      ? "bg-success/90 text-success-foreground"
                      : geoStatus === "locating"
                        ? "bg-background/85 text-foreground"
                        : geoStatus === "error"
                          ? "bg-warning/90 text-warning-foreground"
                          : "bg-background/85 text-muted-foreground",
                  )}
                >
                  {geoStatus === "locating" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                  {geoStatus === "ok"
                    ? "GEOTAGGED"
                    : geoStatus === "locating"
                      ? "LOCATING…"
                      : geoStatus === "error"
                        ? "NO GPS"
                        : "GEO READY"}
                </span>
              </div>

              {/* Camera error */}
              {camError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center">
                  <div className="max-w-xs">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-warning" />
                    <p className="text-sm text-white">{camError}</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={startCamera}>
                        Try again
                      </Button>
                      <Button size="sm" onClick={() => setMode("upload")}>
                        Upload instead
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom camera controls */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-10">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  title="Pick from gallery"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!camReady || !!camError}
                  className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform active:scale-95 disabled:opacity-50"
                  aria-label="Capture photo"
                >
                  <span className="absolute inset-0 rounded-full ring-4 ring-white/90" />
                  <span className="h-12 w-12 rounded-full bg-white shadow-lg transition-transform group-active:scale-90" />
                  <Aperture className="absolute h-6 w-6 text-foreground opacity-0 group-hover:opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={flipCamera}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  title="Flip camera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            // Upload dropzone
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-center bg-muted/40"
            >
              <div className="grid-bg absolute inset-0 opacity-30" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/30 transition-transform group-hover:scale-110">
                  <ImagePlus className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Drop image or click to browse</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG · max 10MB</p>
                </div>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* ─── Form panel ─── */}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="loc" className="mono text-[10px] tracking-widest text-muted-foreground">
              LOCATION {geoStatus === "ok" && <span className="text-success">· AUTO-TAGGED</span>}
            </Label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="loc"
                  placeholder="Address or lat, lng"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setGeoStatus("idle");
                  }}
                  className="pl-9 bg-input/60"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={requestGeo}
                title="Use my location"
                disabled={geoStatus === "locating"}
              >
                {geoStatus === "locating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
              </Button>
            </div>
            {geoStatus === "error" && (
              <p className="mt-1.5 text-[11px] text-warning">
                Location blocked — type an address so we can route correctly.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="mono text-[10px] tracking-widest text-muted-foreground">
              PIPELINE PREVIEW
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["VISION", "GEMINI", "RISK", "PRIORITY", "ROUTING", "n8n"].map((t) => (
                <span
                  key={t}
                  className="mono rounded border border-border/70 bg-background/50 px-1.5 py-0.5 text-[10px] tracking-wider text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={!file || !location.trim() || isProcessing}
            className="mt-auto h-11 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            style={{ boxShadow: "var(--glow-soft)" }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing pipeline…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Run AI Pipeline
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
