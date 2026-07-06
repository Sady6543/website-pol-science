import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Fallback dummy URL to prevent NextJS build errors when environment variables contain non-URL placeholder strings
if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  supabaseUrl = "https://placeholder-project.supabase.co";
}

// Fallback dummy JWT to prevent NextJS build errors when environment variables are missing during compile/build time
if (!supabaseAnonKey) {
  supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4Mzg0MDAsImV4cCI6MTkwNDQwOTYwMH0.dummy";
}

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
