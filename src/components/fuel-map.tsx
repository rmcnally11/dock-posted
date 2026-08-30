import { boardHref, type BoardQuery } from "@/lib/board-query";
import { latToTileY, lngToTileX } from "@/lib/geo";
import { pinTrust } from "@/lib/freshness";
import { tileGridForZoom, viewForBoard } from "@/lib/map-view";
import type { Dock } from "@/lib/types";
import type { CSSProperties } from "react";

const TILE = 256;

function pinColor(dock: Dock): string {
  const trust = pinTrust(dock);
  if (trust === "verified") return "#1d7ec4";
  if (trust === "last-seen") return "#e3b01c";
  return "#e23b3b";
}

export function FuelMap({ docks, query }: { docks: Dock[]; query: BoardQuery }) {
  const view = viewForBoard(docks, query);
  const zoom = Math.max(5, Math.min(14, Math.round(view.zoom)));
  const { cols: COLS, rows: ROWS } = tileGridForZoom(zoom);
  const centerX = lngToTileX(view.center[0], zoom);
  const centerY = latToTileY(view.center[1], zoom);
  const startX = Math.floor(centerX - COLS / 2);
  const startY = Math.floor(centerY - ROWS / 2);
  const tiles: { x: number; y: number }[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      tiles.push({ x: startX + col, y: startY + row });
    }
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-[#e8f2f8] ring-1 ring-[color:var(--line)]"
      data-testid="fuel-map"
    >
      <div
        className="fuel-map-board"
        data-testid="fuel-map-board"
        style={
          {
            "--map-cols": COLS,
            "--map-rows": ROWS,
          } as CSSProperties
        }
      >
        <div className="fuel-map-tiles">
          {tiles.map((tile) => (
            <img
              key={`${tile.x}-${tile.y}`}
              alt=""
              width={TILE}
              height={TILE}
              src={`/api/tiles/${zoom}/${tile.x}/${tile.y}.png?v=2`}
              className="block"
            />
          ))}
        </div>
        {docks.map((dock) => {
          const left = ((lngToTileX(dock.lng, zoom) - startX) / COLS) * 100;
          const top = ((latToTileY(dock.lat, zoom) - startY) / ROWS) * 100;
          if (left < -2 || left > 102 || top < -2 || top > 102) return null;
          const selected = dock.id === query.dock;
          return (
            <a
              key={dock.id}
              href={boardHref({ ...query, dock: dock.id })}
              aria-label={dock.name}
              aria-current={selected ? "true" : undefined}
              className="dock-pin"
              data-selected={selected ? "true" : "false"}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                transform: "translate(-50%, -100%)",
                zIndex: selected ? 3 : 2,
              }}
            >
              <span className="dock-pin-dot" style={{ background: pinColor(dock) }} />
            </a>
          );
        })}
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 z-[2] rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--cream)]/55">
        {view.center[1].toFixed(2)}N {Math.abs(view.center[0]).toFixed(2)}W · z{zoom} · © OpenStreetMap
      </p>
    </div>
  );
}
