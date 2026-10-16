import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Served from the site root, like the original Maya dashboard.
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
  },
});
