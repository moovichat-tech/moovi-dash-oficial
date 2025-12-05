import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.22.4";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 5 attempts per 15 minutes per IP
const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
};

// Strong password validation
const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos 1 símbolo especial')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate opaque request ID for logging (privacy-preserving)
  const requestId = crypto.randomUUID().substring(0, 8);

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP, RATE_LIMIT);

    if (!rateCheck.allowed) {
      const resetIn = Math.ceil((rateCheck.resetAt - Date.now()) / 1000 / 60);
      return new Response(
        JSON.stringify({
          error: `Muitas tentativas. Tente novamente em ${resetIn} minutos.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get JWT from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { password } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Senha é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    try {
      passwordSchema.parse(password);
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

    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error(`req:${requestId} Invalid token`);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phoneNumber = user.user_metadata?.phone_number;
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Usuário sem telefone associado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash password with bcrypt (use sync version - async uses Workers not available in Deno)
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Store password hash in separate credentials table (no SELECT access)
    const { error: credError } = await supabaseClient
      .from('user_credentials')
      .upsert({
        user_id: user.id,
        phone_number: phoneNumber,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'phone_number',
      });

    if (credError) {
      console.error(`req:${requestId} Error saving credentials:`, credError);
      throw credError;
    }

    // Update user_profiles to mark has_password = true (without storing hash)
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        phone_number: phoneNumber,
        has_password: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'phone_number',
      });

    if (profileError) {
      console.error(`req:${requestId} Error updating profile:`, profileError);
      // Non-critical, continue
    }

    console.info(`req:${requestId} Password set successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "Senha cadastrada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`req:${requestId} Error in set-user-password:`, error);
    return new Response(
      JSON.stringify({ error: "Erro ao cadastrar senha" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
