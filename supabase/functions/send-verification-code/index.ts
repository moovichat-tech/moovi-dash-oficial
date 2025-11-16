import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 3 attempts per hour per IP
const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// Input validation schema
const phoneSchema = z.string()
  .regex(/^55[1-9]{2}9?[6-9]\d{7,8}$/, 'Formato de telefone inválido');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-side rate limiting by IP
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP, RATE_LIMIT);

    if (!rateCheck.allowed) {
      const resetIn = Math.ceil((rateCheck.resetAt - Date.now()) / 1000 / 60);
      return new Response(
        JSON.stringify({
          error: `Muitas tentativas. Tente novamente em ${resetIn} minutos.`,
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

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Telefone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side input validation
    try {
      phoneSchema.parse(phoneNumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`[SECURITY] Validation failed: ${error.errors[0].message}`);
        return new Response(
          JSON.stringify({ error: error.errors[0].message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const apiKey = Deno.env.get("N8N_DASHBOARD_API_KEY");

    if (!webhookUrl || !apiKey) {
      console.error("Missing required environment variables:", {
        hasWebhookUrl: !!webhookUrl,
        hasApiKey: !!apiKey,
      });
      throw new Error("Server configuration error: Missing N8N credentials");
    }

    const endpoint = `${webhookUrl}/webhook/auth/send-code`;
    console.log("Calling N8N endpoint for phone:", phoneNumber.substring(0, 4) + "****");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telefone: phoneNumber }),
    });

    console.log("N8N response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("N8N error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 200),
      });
      throw new Error("Serviço de verificação temporariamente indisponível");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-verification-code:", error);
    const userMessage = error instanceof Error && error.message.includes("indisponível")
      ? error.message
      : "Erro ao enviar código de verificação";
    return new Response(JSON.stringify({ error: userMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
