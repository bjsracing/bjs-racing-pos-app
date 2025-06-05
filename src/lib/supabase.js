import { createClient } from "@supabase/supabase-js";

// Get environment variables from Replit Secrets
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fallback to manual configuration if env vars not found
const SUPABASE_URL = supabaseUrl || "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = supabaseAnonKey || "YOUR_SUPABASE_ANON_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Debug log (remove in production)
console.log("Supabase Config:", {
  url: SUPABASE_URL ? "Set" : "Missing",
  key: SUPABASE_ANON_KEY ? "Set" : "Missing",
});
