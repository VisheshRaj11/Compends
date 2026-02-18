import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, apikey, x-client-info",
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build YouTube API request
    const url = new URL(YOUTUBE_API_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API error');
    }

    // Map response to simpler format
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    }));

    // Optional: Save search to Supabase
    // await supabase.from('searches').insert([{ query }]);

    return new Response(JSON.stringify({ videos }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});