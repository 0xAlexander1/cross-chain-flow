
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

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    const url = new URL(req.url);
    const txHash = url.pathname.split('/').pop();

    console.log('Checking swap status for transaction:', txHash);

    if (!txHash) {
      return new Response(
        JSON.stringify({ error: 'Transaction hash is required' }),
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

    // Check transaction status with SwapKit API
    const statusResponse = await fetch(`https://api.swapkit.dev/status/${txHash}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': swapkitApiKey
      }
    });

    if (!statusResponse.ok) {
      if (statusResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            status: 'not_found',
            message: 'Transaction not found or not yet processed'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
      throw new Error(`SwapKit status API error: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('Status data received:', statusData);

    // Format the response to match expected structure
    const swapStatus = {
      status: statusData.status || 'unknown',
      observedIn: statusData.observedIn || statusData.chain,
      txHash: txHash,
      finalTxHash: statusData.outTxHash || statusData.finalTxHash || null,
      finalTxExplorerUrl: statusData.outTxUrl || statusData.explorerUrl || null,
      inAmount: statusData.inAmount,
      outAmount: statusData.outAmount,
      provider: statusData.provider || 'CHAINFLIP',
      timestamp: statusData.timestamp || statusData.createdAt
    };

    return new Response(
      JSON.stringify(swapStatus),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in swap-status:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get swap status',
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
