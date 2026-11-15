import { ImageResponse } from "next/og";

export const alt = "OxfordBeat — Oxford 3000 Rhythm Typing Game";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 55%, #2a1205 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "8px 20px",
            borderRadius: "9999px",
            border: "1px solid rgba(249,115,22,0.5)",
            background: "rgba(249,115,22,0.14)",
            color: "#fdba74",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "4px",
            marginBottom: "24px",
          }}
        >
          OXFORD 3000 • RHYTHM TYPING
        </div>
        <div
          style={{
            fontSize: "92px",
            fontWeight: 900,
            letterSpacing: "-2px",
            color: "#fb923c",
            marginBottom: "18px",
          }}
        >
          OXFORDBEAT
        </div>
        <div
          style={{
            fontSize: "30px",
            color: "#cbd5e1",
            textAlign: "center",
            maxWidth: "880px",
          }}
        >
          3,000 Oxford Words (A1–B2) • Thai Meanings • UK/US Voice • Web Audio Piano
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
