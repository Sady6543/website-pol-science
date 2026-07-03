import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Fallback dummy URL to prevent NextJS build errors when environment variables contain non-URL placeholder strings
if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  supabaseUrl = "https://placeholder-project.supabase.co";
}

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
