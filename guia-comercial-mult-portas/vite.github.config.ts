import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/guia-comercial-mult-portas/",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    sourcemap: false,
  },
});
