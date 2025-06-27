
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

  try {
    console.log('Fetching supported assets from SwapKit API...');
    
    const swapkitApiKey = Deno.env.get('SWAPKIT_API_KEY');
    if (!swapkitApiKey) {
      throw new Error('SWAPKIT_API_KEY not found in environment variables');
    }

    // Fetch tokens from SwapKit API
    const response = await fetch('https://api.swapkit.dev/tokens?provider=CHAINFLIP', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': swapkitApiKey
      }
    });

    if (!response.ok) {
      throw new Error(`SwapKit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.tokens?.length || 0} tokens`);

    // Transform the data to match expected format
    const assets = data.tokens?.map((token: any) => ({
      symbol: token.identifier || token.ticker,
      chain: token.chain,
      decimals: token.decimals,
      name: token.name,
      logoURI: token.logoURI
    })) || [];

    return new Response(
      JSON.stringify({ assets }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-supported-assets:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch supported assets',
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
