import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        app: "#050A13",
        appPanel: "#0B1220",
        appCard: "#111A2B",
        appCardSoft: "#17223A",
        appLine: "#22304A",
        appLineStrong: "#33415F",
        appText: "#F8FAFC",
        appTextSoft: "#B6C1D5",
        appMuted: "#7E8AA3",
        lime: "#D7FF5C",
        cobalt: "#4F63FF",
        surface: "#FFFFFF",
        surfaceAlt: "#F2F4F6",
        line: "#E5E8EB",
        lineStrong: "#D1D6DB",
        ink: "#191F28",
        secondary: "#4E5968",
        muted: "#8B95A1",
        disabled: "#B0B8C1",
        primary: "#16A34A",
        strategy: "#2563EB",
        navy: "#0F172A",
        success: "#03B26C",
        warning: "#FE9800",
        danger: "#F04452",
        tactical: "#7C3AED"
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        soft: "0 1px 3px rgba(0, 0, 0, 0.06)",
        raised: "0 6px 20px rgba(0, 0, 0, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
