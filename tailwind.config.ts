import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        field: "#f4f8f1",
        ink: "#152018",
        line: "#d9e3d3",
        grass: "#2f7d42",
        lime: "#c9f24a",
        coral: "#ff6b57",
        sky: "#3a8dde"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(21, 32, 24, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
