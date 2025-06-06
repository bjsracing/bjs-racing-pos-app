import { createClient } from "@supabase/supabase-js";

// Variabel lingkungan untuk Supabase (akan diambil dari Vercel/Replit Secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan variabel ada sebelum inisialisasi
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL atau Anon Key tidak ditemukan. Pastikan variabel lingkungan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY telah diatur.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
