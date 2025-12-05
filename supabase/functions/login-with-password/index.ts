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

// Accepts international phone numbers
const phoneSchema = z.string()
  .min(8, 'Phone number too short')
  .max(15, 'Phone number too long')
  .regex(/^\d+$/, 'Phone number must contain only digits');

const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres');

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

    const { phoneNumber, password } = await req.json();

    if (!phoneNumber || !password) {
      return new Response(
        JSON.stringify({ error: "Telefone e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    try {
      phoneSchema.parse(phoneNumber);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: "Credenciais inválidas" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get password hash from secure credentials table (no SELECT RLS - service role only)
    const { data: credentials, error: credError } = await supabaseClient
      .from('user_credentials')
      .select('user_id, password_hash')
      .eq('phone_number', phoneNumber)
      .single();

    // Generic error message to prevent enumeration
    const genericError = "Credenciais inválidas";

    if (credError || !credentials) {
      console.warn(`[SECURITY] req:${requestId} Login attempt failed - user not found`);
      return new Response(
        JSON.stringify({ error: genericError, needsWhatsApp: true }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!credentials.password_hash) {
      console.warn(`[SECURITY] req:${requestId} Login attempt failed - no password set`);
      return new Response(
        JSON.stringify({ error: "Você ainda não cadastrou uma senha. Use o código WhatsApp primeiro.", needsWhatsApp: true }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password with bcrypt (use sync version - async uses Workers not available in Deno)
    const isValidPassword = bcrypt.compareSync(password, credentials.password_hash);

    if (!isValidPassword) {
      console.warn(`[SECURITY] req:${requestId} Login attempt failed - invalid password`);
      return new Response(
        JSON.stringify({ error: genericError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth user to retrieve email and generate session
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    if (listError) {
      console.error(`req:${requestId} Error listing users:`, listError);
      throw listError;
    }

    const email = `${phoneNumber}@moovi.app`;
    const existingUser = users.find((u) => u.email === email);

    if (!existingUser) {
      console.error(`req:${requestId} User not found`);
      return new Response(
        JSON.stringify({ error: genericError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new random password for Supabase Auth (we use our own password validation)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const tempPassword = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Update user password in Supabase Auth to allow sign in
    await supabaseClient.auth.admin.updateUserById(existingUser.id, {
      password: tempPassword,
    });

    // Sign in with updated password
    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (signInError) {
      console.error(`req:${requestId} Error signing in user:`, signInError);
      throw signInError;
    }

    const jid = existingUser.user_metadata?.jid || `${phoneNumber}@s.whatsapp.net`;

    console.info(`[SECURITY] req:${requestId} Password login successful`);

    return new Response(
      JSON.stringify({
        success: true,
        jid,
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`req:${requestId} Error in login-with-password:`, error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar login" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
