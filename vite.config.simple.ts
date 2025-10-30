import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import compression from "vite-plugin-compression";

const isFastHostsScale = process.env.VITE_DEPLOY_TARGET === "fasthosts-scale";
const defaultApiBase = isFastHostsScale ? "https://api.shykeenan.uk" : "http://localhost:3000";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  build: {
    outDir: "dist",
    // Security: Disable source maps in production to prevent code exposure
    sourcemap: process.env.NODE_ENV !== 'production',
    // Let Vite handle automatic chunking optimization
    // Rollup will automatically optimize bundle chunks
  },
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify(defaultApiBase),
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY ?? ""
    ),
    // SECURITY: Ensure no sensitive server-side keys are exposed to client
    "import.meta.env.VITE_SECURE_MODE": JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'true' : 'false'
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@phoenix": path.resolve(__dirname, "./src/phoenix"),
    },
  },
});
