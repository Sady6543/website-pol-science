// Follows Deno Runtime for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dynamic price drift simulator
    const drift = () => (Math.random() - 0.5) * 10;

    // Ingest Stocks
    await supabase.from("live_data_cache").upsert([
      { key: "stocks:SPX", payload: { ticker: "SPX", price: 5840 + drift(), change: "+0.34%", changeType: "positive" }, updated_at: new Date().toISOString() },
      { key: "stocks:COMP", payload: { ticker: "COMP", price: 18510 + drift() * 5, change: "+0.78%", changeType: "positive" }, updated_at: new Date().toISOString() }
    ]);

    // Ingest Crypto
    await supabase.from("live_data_cache").upsert([
      { key: "crypto:BTC", payload: { symbol: "BTC", price: 96400 + drift() * 10, change: "-1.2%", changeType: "negative" }, updated_at: new Date().toISOString() },
      { key: "crypto:ETH", payload: { symbol: "ETH", price: 2750 + drift(), change: "+0.45%", changeType: "positive" }, updated_at: new Date().toISOString() }
    ]);

    return new Response(
      JSON.stringify({ status: "success", message: "Edge Function Ingestion Sync Complete" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ status: "error", message: errMsg }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
