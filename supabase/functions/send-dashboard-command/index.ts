import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 10 commands per minute per user
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

// Input validation schema
const commandSchema = z.string()
  .min(1, 'Comando não pode estar vazio')
  .max(500, 'Comando muito longo')
  .regex(/^[a-zA-Z0-9\s\$\.,!?áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ\-]+$/, 'Comando contém caracteres inválidos');

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
          error: `Muitos comandos. Aguarde ${resetIn} segundos.`,
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

    const { command } = await req.json();

    if (!command) {
      return new Response(
        JSON.stringify({ error: "Comando é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side input validation
    try {
      commandSchema.parse(command);
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

    const response = await fetch(
      `${webhookUrl}/webhook/dashboard-command?telefone=${encodeURIComponent(phoneNumber)}`,
      {
        method: "POST",
        headers: {
          Authorization: apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      },
    );

    if (response.status === 409) {
      return new Response(JSON.stringify({ error: "Assistant is busy" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("N8N webhook failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error("Serviço temporariamente indisponível");
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in send-dashboard-command:", error);
    const userMessage = error instanceof Error && error.message.includes("indisponível")
      ? error.message
      : "Erro ao enviar comando";
    
    return new Response(JSON.stringify({ error: userMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
