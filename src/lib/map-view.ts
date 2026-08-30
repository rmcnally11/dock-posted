import { type BoardQuery } from "@/lib/board-query";
import { CORRIDORS, REGIONS, STATE_VIEWS, type Dock } from "@/lib/types";

export type MapView = {
  center: [number, number];
  zoom: number;
};

function zoomForSpread(docks: Dock[]): number {
  if (docks.length <= 1) return 11;
  const lngs = docks.map((dock) => dock.lng);
  const lats = docks.map((dock) => dock.lat);
  const spanLng = Math.max(...lngs) - Math.min(...lngs);
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const span = Math.max(spanLng, spanLat);
  if (span > 12) return 5;
  if (span > 6) return 6;
  if (span > 3) return 7;
  if (span > 1.4) return 8;
  if (span > 0.6) return 9;
  if (span > 0.25) return 10;
  return 11;
}

export function viewForBoard(docks: Dock[], query: BoardQuery): MapView {
  const selected = query.dock ? docks.find((dock) => dock.id === query.dock) : null;
  if (selected) {
    return { center: [selected.lng, selected.lat], zoom: 12 };
  }
  if (query.state && docks.length > 0) {
    return { center: STATE_VIEWS[query.state].center, zoom: zoomForSpread(docks) };
  }
  if (query.region && docks.length > 0) {
    return { center: REGIONS[query.region].center, zoom: zoomForSpread(docks) };
  }
  if (query.corridor) {
    return {
      center: CORRIDORS[query.corridor].center,
      zoom: CORRIDORS[query.corridor].zoom,
    };
  }
  if (docks.length > 0) {
    const lng = docks.reduce((sum, dock) => sum + dock.lng, 0) / docks.length;
    const lat = docks.reduce((sum, dock) => sum + dock.lat, 0) / docks.length;
    return { center: [lng, lat], zoom: zoomForSpread(docks) };
  }
  return { center: CORRIDORS["galveston-bay"].center, zoom: CORRIDORS["galveston-bay"].zoom };
}

export function tileGridForZoom(zoom: number): { cols: number; rows: number } {
  if (zoom <= 6) return { cols: 6, rows: 4 };
  if (zoom <= 8) return { cols: 5, rows: 4 };
  return { cols: 4, rows: 3 };
}
