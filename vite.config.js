import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
  plugins: [react(), tailwindcss()],

  optimizeDeps: {
    include: ["xlsx"],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  worker: {
    format: "es", // Ensure worker is bundled as ES module
  },
});
