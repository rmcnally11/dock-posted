import { boardHref, type BoardQuery } from "@/lib/board-query";
import { latToTileY, lngToTileX } from "@/lib/geo";
import { freshness } from "@/lib/freshness";
import { CORRIDORS, type Dock } from "@/lib/types";

const COLS = 4;
const ROWS = 3;
const TILE = 256;

function pinColor(dock: Dock): string {
  const state = freshness(dock);
  if (state === "fresh") return "#1f8a5b";
  if (state === "stale") return "#c9891a";
  return "#c45c26";
}

export function FuelMap({ docks, query }: { docks: Dock[]; query: BoardQuery }) {
  const view = CORRIDORS[query.corridor];
  const zoom = Math.max(8, Math.min(14, Math.round(view.zoom)));
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
    <div className="absolute inset-0 overflow-hidden bg-sand" data-testid="fuel-map">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: COLS * TILE,
          height: ROWS * TILE,
          marginLeft: -(COLS * TILE) / 2,
          marginTop: -(ROWS * TILE) / 2,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${TILE}px)`,
            width: COLS * TILE,
            height: ROWS * TILE,
          }}
        >
          {tiles.map((tile) => (
            <img
              key={`${tile.x}-${tile.y}`}
              alt=""
              width={TILE}
              height={TILE}
              src={`/api/tiles/${zoom}/${tile.x}/${tile.y}`}
              className="block"
            />
          ))}
        </div>
        {docks.map((dock) => {
          const left = ((lngToTileX(dock.lng, zoom) - startX) / COLS) * 100;
          const top = ((latToTileY(dock.lat, zoom) - startY) / ROWS) * 100;
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
                background: pinColor(dock),
                transform: "translate(-50%, -100%)",
                zIndex: selected ? 3 : 2,
              }}
            />
          );
        })}
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 z-[2] rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-harbor/55">
        © OpenStreetMap © CARTO
      </p>
    </div>
  );
}
