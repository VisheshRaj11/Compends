import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scrapeEventbrite } from "./eventbrite.ts";
import { scrapeDevPost } from "./devpost.ts";
import { scrapeUnstop } from "./unstop.ts";
import { scrapeDevfolio } from "./devfolio.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, apikey, x-client-info",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Run scrapers concurrently with Promise.allSettled to avoid one failing the whole batch
    const scrapers = [
      scrapeEventbrite(),
      scrapeDevPost(),
      scrapeUnstop(),
      scrapeDevfolio(),
      // Add more here
    ];

    const results = await Promise.allSettled(scrapers);
    const allEvents = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const validEvents = allEvents.filter((e) => e.title && e.url);

    if (validEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No hackathons found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("hackathons")
      .upsert(validEvents, { onConflict: "url" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ inserted: validEvents.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});