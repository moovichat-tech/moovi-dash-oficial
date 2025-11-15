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
    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      throw new Error('Phone number is required')
    }

    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    const apiKey = Deno.env.get('N8N_DASHBOARD_API_KEY')

    const response = await fetch(
      `${webhookUrl}/auth/send-code`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone: phoneNumber }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to send verification code: ${response.statusText}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-verification-code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
