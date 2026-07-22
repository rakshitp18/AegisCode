import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Touch to trigger config reload and pick up new framer-motion dependency
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});