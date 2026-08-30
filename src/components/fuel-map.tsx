"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { freshness } from "@/lib/freshness";
import { CORRIDORS, type CorridorId, type Dock } from "@/lib/types";
import { formatQuote } from "@/lib/format";
import { displayDiesel, displayGas } from "@/lib/freshness";

const VECTOR_STYLE = "https://tiles.openfreemap.org/styles/liberty";

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

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: VECTOR_STYLE,
      center: CORRIDORS[corridor].center,
      zoom: CORRIDORS[corridor].zoom,
      attributionControl: false,
    });

    let usedFallback = false;
    map.on("error", () => {
      if (usedFallback) return;
      usedFallback = true;
      map.setStyle(RASTER_STYLE);
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© OpenStreetMap © OpenFreeMap",
      }),
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-right",
    );

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Map is created once; corridor changes are handled by easeTo below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const view = CORRIDORS[corridor];
    map.easeTo({ center: view.center, zoom: view.zoom, duration: 600 });
  }, [corridor]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [docks, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const dock = docks.find((item) => item.id === selectedId);
    if (!dock) return;
    map.easeTo({ center: [dock.lng, dock.lat], zoom: Math.max(map.getZoom(), 12), duration: 450 });
  }, [selectedId, docks]);

  return <div ref={containerRef} className="h-full min-h-[320px] w-full" />;
}
