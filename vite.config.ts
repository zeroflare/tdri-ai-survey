import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 專案頁：https://zeroflare.github.io/tdri-ai-survey/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
});
