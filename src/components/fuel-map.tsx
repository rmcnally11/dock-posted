"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { freshness } from "@/lib/freshness";
import { CORRIDORS, type CorridorId, type Dock } from "@/lib/types";
import { formatQuote } from "@/lib/format";
import { displayDiesel, displayGas } from "@/lib/freshness";

const RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function pinColor(dock: Dock): string {
  const state = freshness(dock);
  if (state === "fresh") return "#1f8a5b";
  if (state === "stale") return "#c9891a";
  return "#c45c26";
}

export function FuelMap({
  docks,
  corridor,
  selectedId,
  onSelect,
}: {
  docks: Dock[];
  corridor: CorridorId;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: RASTER_STYLE,
        center: CORRIDORS[corridor].center,
        zoom: CORRIDORS[corridor].zoom,
        attributionControl: false,
        fadeDuration: 0,
      });
    } catch {
      setStatus("failed");
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© OpenStreetMap © CARTO",
      }),
    );

    const resize = () => {
      map.resize();
    };

    map.on("load", () => {
      resize();
      setStatus("ready");
    });
    map.on("error", () => {
      if (!map.isStyleLoaded()) setStatus("failed");
    });

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);

    mapRef.current = map;
    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Map is created once; corridor changes are handled by easeTo below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    const view = CORRIDORS[corridor];
    map.easeTo({ center: view.center, zoom: view.zoom, duration: 600 });
  }, [corridor, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    for (const dock of docks) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "dock-pin";
      el.style.background = pinColor(dock);
      el.dataset.selected = dock.id === selectedId ? "true" : "false";
      el.setAttribute("aria-label", dock.name);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(dock.id);
      });

      const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
        `<strong>${dock.name}</strong><br/>${formatQuote(displayGas(dock))}<br/>Diesel ${formatQuote(displayDiesel(dock))}`,
      );

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([dock.lng, dock.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [docks, selectedId, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || !selectedId) return;
    const dock = docks.find((item) => item.id === selectedId);
    if (!dock) return;
    map.easeTo({ center: [dock.lng, dock.lat], zoom: Math.max(map.getZoom(), 12), duration: 450 });
  }, [selectedId, docks, status]);

  return (
    <div className="absolute inset-0 bg-sand">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-white/90 px-2 py-1 text-xs text-harbor/70">
          Loading chart…
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="absolute bottom-3 left-3 z-10 max-w-xs rounded-md bg-white/95 px-3 py-2 text-xs text-harbor/70 shadow-sm">
          Chart tiles did not load in this browser. The dock list on the right still works.
        </p>
      ) : null}
    </div>
  );
}
