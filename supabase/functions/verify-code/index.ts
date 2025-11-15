import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      throw new Error('Phone number and code are required')
    }

    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    const apiKey = Deno.env.get('N8N_DASHBOARD_API_KEY')

    // Verify code with n8n
    const response = await fetch(
      `${webhookUrl}/auth/verify-code`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone: phoneNumber, code }),
      }
    )

    if (response.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      throw new Error(`Failed to verify code: ${response.statusText}`)
    }

    const data = await response.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create or sign in user using phone as email
    const email = `${phoneNumber}@moovi.app`
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        phone_number: phoneNumber,
        jid: data.jid,
      },
    })

    if (authError && !authError.message.includes('already registered')) {
      throw authError
    }

    // Generate session for user
    const userId = authData?.user?.id || (await supabaseClient.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id
    
    if (!userId) {
      throw new Error('Failed to create or find user')
    }

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (sessionError) {
      throw sessionError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        jid: data.jid,
        session: sessionData,
        userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in verify-code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
