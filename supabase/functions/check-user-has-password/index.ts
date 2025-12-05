import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.22.4";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 10 requests per 15 minutes per IP
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
};

const phoneSchema = z.string()
  .regex(/^55[1-9]{2}9?[6-9]\d{7,8}$/, 'Formato de telefone inválido');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check rate limit
  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP, RATE_LIMIT);
  
  if (!rateCheck.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}***`);
    return new Response(
      JSON.stringify({ 
        error: "Muitas tentativas. Aguarde alguns minutos.",
        retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
        } 
      }
    );
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Telefone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone format
    try {
      phoneSchema.parse(phoneNumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: error.errors[0].message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Check if user profile exists and has password
    const { data: profile, error } = await supabaseClient
      .from('user_profiles')
      .select('has_password')
      .eq('phone_number', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking user profile:", error);
      throw error;
    }

    // Return generic response to prevent phone enumeration
    return new Response(
      JSON.stringify({
        exists: !!profile,
        hasPassword: profile?.has_password ?? false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-user-has-password:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao verificar usuário" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
