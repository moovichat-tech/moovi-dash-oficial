import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 5 attempts per 15 minutes per IP
const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// Input validation schemas
const phoneSchema = z.string()
  .regex(/^55[1-9]{2}9?[6-9]\d{7,8}$/, 'Formato de telefone inválido');

const codeSchema = z.string()
  .length(6, 'Código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'Código deve conter apenas números');

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
          error: `Muitas tentativas de verificação. Tente novamente em ${resetIn} minutos.`,
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

    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: "Telefone e código são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side input validation
    try {
      phoneSchema.parse(phoneNumber);
      codeSchema.parse(code);
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

    console.info(`Calling N8N verify endpoint for phone: ${phoneNumber.substring(0, 4)}****`);

    // Verify code with n8n
    const response = await fetch(`${webhookUrl}/webhook/auth/verify-code`, {
      method: "POST",
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telefone: phoneNumber, code }),
    });

    console.info(`N8N verify response status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.error("N8N returned 401 - Invalid or expired code");
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("N8N error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`N8N webhook failed (${response.status}): ${response.statusText}. ${errorBody}`);
    }

    const data = await response.json();

    console.info(`[SECURITY] Phone verification successful for: ${phoneNumber.substring(0, 4)}****`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create or sign in user using phone as email with cryptographically random password
    const email = `${phoneNumber}@moovi.app`;
    
    // Generate secure random password
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const password = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.info(`[SECURITY] Attempting user operation for email: ${email}`);
    
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        phone_number: phoneNumber,
        jid: data.jid,
      },
    });

    // If user already exists, update metadata and password
    if (authError) {
      if (authError.message.includes("already registered") || authError.code === "email_exists") {
        console.info(`[SECURITY] User already exists for email: ${email}, updating metadata...`);
        
        // Get user by email
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        
        if (listError) {
          console.error("Error listing users:", listError);
          throw listError;
        }
        
        const existingUser = users.find((u) => u.email === email);
        
        if (!existingUser) {
          console.error(`User not found for email: ${email} despite email_exists error`);
          throw new Error("User authentication failed");
        }
        
        console.info(`[SECURITY] UPDATE operation - User ID: ${existingUser.id}, Phone: ${phoneNumber.substring(0, 4)}****`);
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(existingUser.id, {
          password, // Update password
          user_metadata: {
            phone_number: phoneNumber,
            jid: data.jid,
          },
        });
        
        if (updateError) {
          console.error("[SECURITY] Error updating user:", updateError);
          throw updateError;
        }
        
        console.info(`[SECURITY] UPDATE completed successfully for user: ${existingUser.id}`);
        
        // Sign in the user and return session
        const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("[SECURITY] Error signing in user after update:", signInError);
          throw signInError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            jid: data.jid,
            access_token: sessionData.session?.access_token,
            refresh_token: sessionData.session?.refresh_token,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      // If it's a different error, throw it
      console.error("Error creating user:", authError);
      throw authError;
    }

    console.info(`[SECURITY] CREATE operation completed - User ID: ${authData.user.id}, Phone: ${phoneNumber.substring(0, 4)}****`);

    // Sign in the new user and return session
    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("[SECURITY] Error signing in new user:", signInError);
      throw signInError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        jid: data.jid,
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in verify-code:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar verificação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
