
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    const body = await req.json();
    const { fromAsset, toAsset, amount, recipient } = body;

    console.log('Getting swap details for:', { fromAsset, toAsset, amount, recipient });

    // Validate required fields
    if (!fromAsset || !toAsset || !amount || !recipient) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: fromAsset, toAsset, amount, recipient' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const swapkitApiKey = Deno.env.get('SWAPKIT_API_KEY');
    if (!swapkitApiKey) {
      throw new Error('SWAPKIT_API_KEY not found in environment variables');
    }

    // Get swap quote from SwapKit API
    const quoteResponse = await fetch('https://api.swapkit.dev/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': swapkitApiKey
      },
      body: JSON.stringify({
        sellAsset: fromAsset,
        buyAsset: toAsset,
        sellAmount: amount,
        recipientAddress: recipient,
        providers: ['CHAINFLIP']
      })
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('SwapKit quote error:', errorText);
      throw new Error(`SwapKit quote API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    console.log('Quote data received:', quoteData);

    // Extract swap details from the quote response
    const route = quoteData.routes?.[0];
    if (!route) {
      throw new Error('No swap route found');
    }

    const swapDetails = {
      depositAddress: route.transaction?.from || route.inboundAddress,
      memo: route.transaction?.memo || route.memo || '',
      expectedOutput: route.expectedOutput || route.expectedOutputUSD,
      expiresIn: 900, // 15 minutes standard TTL
      provider: route.provider,
      estimatedTime: route.estimatedTime || '5-10 minutes'
    };

    console.log('Swap details prepared:', swapDetails);

    return new Response(
      JSON.stringify(swapDetails),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-swap-details:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get swap details',
        message: error.message 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
