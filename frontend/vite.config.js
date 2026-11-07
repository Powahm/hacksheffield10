import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev only: /api goes to the local Flask server. Production builds call VITE_API_URL.
const API_TARGET = process.env.API_TARGET || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
    },
  },
});
