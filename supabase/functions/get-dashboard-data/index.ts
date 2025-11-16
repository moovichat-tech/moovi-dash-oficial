import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 30 requests per minute per user
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};

// Input validation schema
const phoneSchema = z.string()
  .regex(/^55[1-9]{2}9?[6-9]\d{7,8}$/, 'Formato de telefone inválido');

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

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user session by passing token explicitly
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
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
      return new Response(
        JSON.stringify({ error: "Telefone não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side input validation
    try {
      phoneSchema.parse(phoneNumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`[SECURITY] Validation failed for user phone: ${error.errors[0].message}`);
        return new Response(
          JSON.stringify({ error: "Telefone inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
    return new Response(JSON.stringify({ error: "Erro ao buscar dados do dashboard" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
