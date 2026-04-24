import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers – adjust the origin in production
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, apikey, x-client-info",
};


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const LEETCODE_API_URL = "https://leetcode.com/graphql";

const USER_STATS_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      userCalendar {
        streak
      }
    }
  }
`;

serve(async (req) => {
  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {status:200, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 🔐 AUTHENTICATION (CLERK JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub; // Clerk userId (trusted)

    const { username, community_id } = await req.json();
    if (!username) {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔗 Fetch LeetCode stats
    const graphqlRes = await fetch(LEETCODE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: USER_STATS_QUERY,
        variables: { username },
      }),
    });

    if (!graphqlRes.ok) {
       const errorText = await graphqlRes.text();
      console.error("LeetCode API error response:", errorText);
      throw new Error(`LeetCode API error: ${graphqlRes.status} - ${errorText}`);
    }

    const leetData = await graphqlRes.json();
    const matchedUser = leetData.data?.matchedUser;

    if (!matchedUser) {
      return new Response(
        JSON.stringify({ error: "LeetCode user not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending GraphQL query:", USER_STATS_QUERY);
    console.log("With variables:", { username });

    const submissions = matchedUser.submitStatsGlobal.acSubmissionNum;

    const stats = {
      user_id: userId,
      leetcode_username: username,
      community_id: community_id,
      total_solved: submissions.find((s: any) => s.difficulty === "All")?.count || 0,
      easy_solved: submissions.find((s: any) => s.difficulty === "Easy")?.count || 0,
      medium_solved: submissions.find((s: any) => s.difficulty === "Medium")?.count || 0,
      hard_solved: submissions.find((s: any) => s.difficulty === "Hard")?.count || 0,
      streak: matchedUser.userCalendar?.streak || 0,
      // contest_rating: matchedUser.userContestRanking?.rating || null,
      last_fetched: new Date(),
    };

    // ✅ Update ONLY this user's row
    const { error } = await supabase
      .from("leetcode_stats")
      .upsert(stats, { onConflict: "user_id" });

    if (error) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: "Failed to save stats" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    // Optional: update profile
    await supabase
      .from("users")
      .update({ leetcode_username: username })
      .eq("id", userId);

    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

