import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dock Posted. The price they posted.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#0B1F33",
          color: "#FBF8F3",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#E23B3B",
            fontWeight: 700,
          }}
        >
          Marina fuel
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 72,
            lineHeight: 1.05,
            fontFamily: "Georgia, serif",
          }}
        >
          Dock Posted
        </div>
        <div style={{ marginTop: 28, width: 420, height: 3, background: "#E23B3B" }} />
        <div style={{ marginTop: 6, width: 420, height: 3, background: "#2F8FD6" }} />
        <div style={{ marginTop: 28, fontSize: 28, color: "rgba(251,248,243,0.7)" }}>
          The price they posted.
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(251,248,243,0.45)",
          }}
        >
          Sabine to Key West
        </div>
      </div>
    ),
    { ...size },
  );
}
