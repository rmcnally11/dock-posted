"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { boardHref, type BoardQuery } from "@/lib/board-query";
import { freshness } from "@/lib/freshness";
import { CORRIDORS, type Dock } from "@/lib/types";
import { formatQuote } from "@/lib/format";
import { displayDiesel, displayGas } from "@/lib/freshness";

function pinColor(dock: Dock): string {
  const state = freshness(dock);
  if (state === "fresh") return "#1f8a5b";
  if (state === "stale") return "#c9891a";
  return "#c45c26";
}

export function FuelMap({ docks, query }: { docks: Dock[]; query: BoardQuery }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const queryRef = useRef(query);
  const routerRef = useRef(router);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    queryRef.current = query;
    routerRef.current = router;
  }, [query, router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let cancelled = false;

    void import("leaflet")
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const L = leaflet.default;
        const view = CORRIDORS[queryRef.current.corridor];
        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([view.center[1], view.center[0]], view.zoom);

        L.tileLayer("/api/tiles/{z}/{x}/{y}", {
          attribution: "© OpenStreetMap © CARTO",
          maxZoom: 19,
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        map.whenReady(() => {
          map.invalidateSize();
          setStatus("ready");
        });
        requestAnimationFrame(() => map.invalidateSize());
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    const view = CORRIDORS[query.corridor];
    map.flyTo([view.center[1], view.center[0]], view.zoom, { duration: 0.6 });
    map.invalidateSize();
  }, [query.corridor, status]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || status !== "ready") return;

    void import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      layer.clearLayers();
      for (const dock of docks) {
        const selected = dock.id === query.dock;
        const icon = L.divIcon({
          className: "dock-pin-wrap",
          iconSize: [selected ? 22 : 18, selected ? 22 : 18],
          iconAnchor: [selected ? 11 : 9, selected ? 22 : 18],
          html: `<button type="button" class="dock-pin" data-selected="${selected}" style="background:${pinColor(dock)}" aria-label="${escapeHtml(dock.name)}"></button>`,
        });
        const marker = L.marker([dock.lat, dock.lng], { icon }).addTo(layer);
        marker.bindPopup(
          `<strong>${escapeHtml(dock.name)}</strong><br/>${escapeHtml(formatQuote(displayGas(dock)))}<br/>Diesel ${escapeHtml(formatQuote(displayDiesel(dock)))}`,
        );
        marker.on("click", () => {
          routerRef.current.push(boardHref({ ...queryRef.current, dock: dock.id }));
        });
      }
    });
  }, [docks, query.dock, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || !query.dock) return;
    const dock = docks.find((item) => item.id === query.dock);
    if (!dock) return;
    map.flyTo([dock.lat, dock.lng], Math.max(map.getZoom(), 12), { duration: 0.45 });
  }, [query.dock, docks, status]);

  return (
    <div className="absolute inset-0 bg-sand">
      <div ref={containerRef} className="absolute inset-0" data-testid="fuel-map" />
      {status === "loading" ? (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-md bg-white/90 px-2 py-1 text-xs text-harbor/70">
          Loading chart…
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="absolute bottom-3 left-3 z-[500] max-w-xs rounded-md bg-white/95 px-3 py-2 text-xs text-harbor/70 shadow-sm">
          Chart tiles did not load in this browser. The dock list on the right still works.
        </p>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
