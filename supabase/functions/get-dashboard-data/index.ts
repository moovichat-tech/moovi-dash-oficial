import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 30 requests per minute per user
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side rate limiting by user ID
    const rateCheck = checkRateLimit(user.id, RATE_LIMIT);

    if (!rateCheck.allowed) {
      const resetIn = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: `Muitas requisições. Aguarde ${resetIn} segundos.`,
          resetAt: rateCheck.resetAt,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": rateCheck.remaining.toString(),
            "X-RateLimit-Reset": rateCheck.resetAt.toString(),
          },
        },
      );
    }

    const phoneNumber = user.user_metadata?.phone_number;
    if (!phoneNumber) {
      throw new Error("Phone number not found in user metadata");
    }

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const apiKey = Deno.env.get("N8N_DASHBOARD_API_KEY");

    const response = await fetch(`${webhookUrl}/webhook/dashboard-data?telefone=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return new Response(JSON.stringify({ error: "Data not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in get-dashboard-data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
