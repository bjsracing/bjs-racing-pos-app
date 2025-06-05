import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  // TAMBAH BARIS INI:
  base: '/', // Ini memberitahu Vite bahwa aplikasi di-deploy di root path
});