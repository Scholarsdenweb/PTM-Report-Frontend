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
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("pdfjs-dist") || id.includes("react-pdf-highlighter")) {
            return "pdf";
          }
          if (id.includes("xlsx") || id.includes("papaparse")) {
            return "spreadsheet";
          }
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },

  worker: {
    format: "es", // Ensure worker is bundled as ES module
  },
});
