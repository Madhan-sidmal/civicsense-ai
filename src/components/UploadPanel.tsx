import { useCallback, useRef, useState } from "react";
import { ImagePlus, MapPin, Loader2, Send, X, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (data: { file: File; preview: string; location: string }) => void;
  isProcessing: boolean;
}

export function UploadPanel({ onSubmit, isProcessing }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const useGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setLocation("Unknown — geolocation denied"),
    );
  };

  const submit = () => {
    if (!file || !preview || !location.trim() || isProcessing) return;
    onSubmit({ file, preview, location: location.trim() });
  };

  return (
    <section className="panel p-6 lg:p-7">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="mono text-[10px] tracking-widest text-primary">01 / INTAKE</div>
          <h2 className="font-display text-xl font-semibold">Submit Civic Report</h2>
        </div>
        <span className="mono text-xs text-muted-foreground">
          <span className="status-dot mr-2 bg-success text-success" />
          BACKEND READY
        </span>
      </header>

      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/70 hover:border-primary/60 hover:bg-primary/[0.03]",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <>
              <img src={preview} alt="Upload preview" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              {isProcessing && (
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="absolute inset-x-0 h-24 animate-scan"
                    style={{
                      background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.45), transparent)",
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute right-3 top-3 rounded-md bg-background/80 p-1.5 backdrop-blur hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 mono text-[10px] tracking-widest text-primary">
                IMG_LOADED · {(file!.size / 1024).toFixed(1)} KB
              </div>
            </>
          ) : (
            <>
              <div className="grid-bg absolute inset-0 opacity-30" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/30 transition-transform group-hover:scale-110">
                  <ImagePlus className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop image or click to browse</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG · max 10MB</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="loc" className="mono text-[10px] tracking-widest text-muted-foreground">
              LOCATION
            </Label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="loc"
                  placeholder="Address or lat, lng"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9 bg-input/60"
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={useGeo} title="Use my location">
                <Crosshair className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="mono text-[10px] tracking-widest text-muted-foreground">PIPELINE PREVIEW</div>
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
