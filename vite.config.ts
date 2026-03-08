import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Merge tiny shared components into the main chunk to reduce chain depth
          if (
            id.includes("src/components/SEOHead") ||
            id.includes("src/components/ThemeToggle") ||
            id.includes("src/components/ErrorBoundary") ||
            id.includes("lucide-react/dist/esm/icons/loader-circle") ||
            id.includes("src/components/ui/input.tsx")
          ) {
            return undefined;
          }
          // Split heavy vendor libs into separate chunks loaded on demand
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack/react-query")) return "vendor-query";
          if (id.includes("node_modules/sonner")) return "vendor-sonner";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
