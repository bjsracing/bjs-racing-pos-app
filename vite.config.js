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
    // --- TAMBAH BARIS INI ---
    hmr: {
      clientPort: 443, // Penting untuk Replit HMR (Hot Module Replacement)
    },
    // --- DAN TAMBAH BARIS INI ---
    cors: true, // Mengizinkan CORS
    origin:
      "https://16e0e749-44e3-4d31-8d7d-ccb147a91ae8-00-2z73n1x9d1bgb.pike.replit.dev", // Ganti dengan URL Replit Anda
    // --- ATAU JIKA INGIN LEBIH GENERAL UNTUK ALLOWEDHOSTS ---
    fs: {
      // Tambahkan domain Replit Anda ke allow
      allow: [
        "./",
        "16e0e749-44e3-4d31-8d7d-ccb147a91ae8-00-2z73n1x9d1bgb.pike.replit.dev",
      ], // Ganti dengan URL Replit Anda
    },
  },
  build: {
    outDir: "dist",
  },
  base: "/",
});
