import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const GITHUB_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
      repositories(first: 100, isFork: false, privacy: PUBLIC) {
        nodes {
          stargazers { totalCount }
          forks { totalCount }
        }
      }
      pullRequests { totalCount }
      issues { totalCount }
      followers { totalCount }
      following { totalCount }
    }
  }
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth (Clerk)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub;

    const { username, community_id } = await req.json();
    if (!username) {
      return new Response(JSON.stringify({ error: "GitHub username required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GITHUB_TOKEN) {
      throw new Error("GitHub token not configured");
    }

    // Call GitHub GraphQL
    const graphqlRes = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GITHUB_QUERY,
        variables: { username },
      }),
    });

    if (!graphqlRes.ok) {
      const errText = await graphqlRes.text();
      throw new Error(`GitHub GraphQL error: ${graphqlRes.status} - ${errText}`);
    }

    const json = await graphqlRes.json();
    
    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const user = json.data.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "GitHub user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total stars and forks from repositories
    const repos = user.repositories?.nodes || [];
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers?.totalCount || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks?.totalCount || 0), 0);

    const stats = {
      user_id: userId,
      github_username: username,
      // community_id: community_id,
      public_repos: repos.length,
      followers: user.followers?.totalCount || 0,
      following: user.following?.totalCount || 0,
      total_stars: totalStars,
      total_forks: totalForks,
      contributions: user.contributionsCollection?.contributionCalendar?.totalContributions || 0,
      pull_requests: user.pullRequests?.totalCount || 0,
      issues: user.issues?.totalCount || 0,
      last_fetched: new Date(),
    };

    // Upsert into github_stats
    const { error } = await supabase
      .from("github_stats")
      .upsert(stats, { onConflict: "user_id" });

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: `Failed to save stats ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally update profile with github_username
    await supabase.from("users").update({ github_username: username }).eq("clerk_id", userId);

    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});