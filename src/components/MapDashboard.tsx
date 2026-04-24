import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PipelineResult, Severity } from "@/lib/mockPipeline";

interface Props {
  reports: PipelineResult[];
  onSelect: (r: PipelineResult) => void;
}

const sevColor: Record<Severity, string> = {
  HIGH: "#ef4444",    // destructive
  MEDIUM: "#f59e0b",  // warning
  LOW: "#10b981",     // success
};

export function MapDashboard({ reports, onSelect }: Props) {
  
  // Custom Icon Generator
  const createIcon = (severity: Severity) => {
    const color = sevColor[severity];
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 16px; 
          height: 16px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 10px ${color};
          animation: pulse 2s infinite;
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Center the map on the latest report, or a default location (e.g. LA)
  const center = useMemo<[number, number]>(() => {
    if (reports.length > 0) {
      const [latStr, lngStr] = reports[0].location.split(",");
      if (latStr && lngStr) {
        return [parseFloat(latStr), parseFloat(lngStr)];
      }
    }
    return [34.0522, -118.2437]; // Default
  }, [reports]);

  return (
    <section id="map-dashboard" className="panel p-2 lg:p-3 overflow-hidden relative" style={{ height: "500px" }}>
      {/* We add global pulse keyframes inline for the marker animation if not in index.css */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--primary), 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(var(--primary), 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--primary), 0); }
        }
        .leaflet-container {
          background-color: #0f1115; /* Dark matching background */
        }
      `}</style>

      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {reports.map((r) => {
          const [latStr, lngStr] = r.location.split(",");
          if (!latStr || !lngStr || isNaN(parseFloat(latStr))) return null;

          return (
            <Marker 
              key={r.id} 
              position={[parseFloat(latStr), parseFloat(lngStr)]}
              icon={createIcon(r.severity)}
              eventHandlers={{
                click: () => onSelect(r),
              }}
            >
              <Popup className="civic-popup">
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <img 
                    src={r.imagePreview} 
                    alt="Report" 
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <div>
                    <div className="font-semibold text-sm">{r.authority}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.explanation}
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelect(r)}
                    className="mt-1 w-full bg-primary/10 text-primary text-xs font-medium py-1.5 rounded"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </section>
  );
}
