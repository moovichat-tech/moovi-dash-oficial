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

// Input validation schemas - accepts international phone numbers
const phoneSchema = z.string()
  .min(8, 'Phone number too short')
  .max(15, 'Phone number too long')
  .regex(/^\d+$/, 'Phone number must contain only digits');

const codeSchema = z.string()
  .length(6, 'Código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'Código deve conter apenas números');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate opaque request ID for logging (privacy-preserving)
  const requestId = crypto.randomUUID().substring(0, 8);

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
        console.warn(`req:${requestId} Validation failed: ${error.errors[0].message}`);
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

    console.info(`req:${requestId} Calling N8N verify endpoint`);

    // Verify code with n8n
    const response = await fetch(`${webhookUrl}/webhook/auth/verify-code`, {
      method: "POST",
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telefone: phoneNumber, code }),
    });

    console.info(`req:${requestId} N8N verify response status: ${response.status}`);

    if (response.status === 401) {
      console.error(`req:${requestId} Invalid or expired code`);
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`req:${requestId} N8N error:`, { status: response.status });
      throw new Error(`N8N webhook failed (${response.status})`);
    }

    const data = await response.json();

    console.info(`req:${requestId} Phone verification successful`);

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
    
    console.info(`req:${requestId} Creating/updating user`);
    
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
        console.info(`req:${requestId} User exists, updating metadata`);
        
        // Get user by email
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        
        if (listError) {
          console.error(`req:${requestId} Error listing users:`, listError);
          throw listError;
        }
        
        const existingUser = users.find((u) => u.email === email);
        
        if (!existingUser) {
          console.error(`req:${requestId} User not found despite email_exists error`);
          throw new Error("User authentication failed");
        }
        
        console.info(`req:${requestId} Updating user`);
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(existingUser.id, {
          password, // Update password
          user_metadata: {
            phone_number: phoneNumber,
            jid: data.jid,
          },
        });
        
        if (updateError) {
          console.error(`req:${requestId} Error updating user:`, updateError);
          throw updateError;
        }
        
        console.info(`req:${requestId} Update completed`);
        
        // Update user_profiles entry
        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .upsert({
            user_id: existingUser.id,
            phone_number: phoneNumber,
          }, {
            onConflict: 'phone_number',
          });

        if (profileError) {
          console.error(`req:${requestId} Error updating user profile:`, profileError);
        }

        // Sign in the user and return session
        const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error(`req:${requestId} Error signing in user:`, signInError);
          throw signInError;
        }

        // Check if user has password set
        const { data: profileData } = await supabaseClient
          .from('user_profiles')
          .select('has_password')
          .eq('phone_number', phoneNumber)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            jid: data.jid,
            access_token: sessionData.session?.access_token,
            refresh_token: sessionData.session?.refresh_token,
            needsPasswordSetup: !(profileData?.has_password ?? false),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      // If it's a different error, throw it
      console.error(`req:${requestId} Error creating user:`, authError);
      throw authError;
    }

    console.info(`req:${requestId} User created successfully`);

    // Create user_profiles entry for new user
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .upsert({
        user_id: authData.user.id,
        phone_number: phoneNumber,
        has_password: false,
      }, {
        onConflict: 'phone_number',
      });

    if (profileError) {
      console.error(`req:${requestId} Error creating user profile:`, profileError);
      // Don't throw - profile creation is not critical for login
    }

    // Sign in the new user and return session
    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error(`req:${requestId} Error signing in new user:`, signInError);
      throw signInError;
    }

    // Check if user has password set
    const { data: profileData } = await supabaseClient
      .from('user_profiles')
      .select('has_password')
      .eq('phone_number', phoneNumber)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        jid: data.jid,
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
        needsPasswordSetup: !(profileData?.has_password ?? false),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`req:${requestId} Error in verify-code:`, error);
    return new Response(JSON.stringify({ error: "Erro ao processar verificação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
