
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

    // Get swap quote from SwapKit API with multiple providers
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
        providers: ['CHAINFLIP', 'THORCHAIN', 'MAYACHAIN'] // Multiple providers in order of preference
      })
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('SwapKit quote error:', errorText);
      throw new Error(`SwapKit quote API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    console.log('Quote data received:', quoteData);

    // Check if we have routes
    if (!quoteData.routes || quoteData.routes.length === 0) {
      throw new Error('No swap routes found');
    }

    // Process all available routes for comparison
    const processedRoutes = quoteData.routes.map((route: any) => {
      // Process memo correctly - replace placeholder with actual destination address
      let processedMemo = route.memo || '';
      if (processedMemo.includes('{destinationAddress}')) {
        processedMemo = processedMemo.replace('{destinationAddress}', recipient);
      }

      // Get deposit address - handle Chainflip specific fields
      let depositAddress = route.targetAddress || route.inboundAddress || route.depositAddress;
      
      // For Chainflip, sometimes the address is in meta
      if (!depositAddress && route.meta?.chainflip?.depositAddress) {
        depositAddress = route.meta.chainflip.depositAddress;
      }

      // Extract time estimation
      let estimatedTime = route.estimatedTime;
      if (typeof estimatedTime === 'object' && estimatedTime !== null) {
        if (estimatedTime.total) {
          estimatedTime = `${Math.round(estimatedTime.total / 60)} min`;
        } else {
          const total = (estimatedTime.inbound || 0) + (estimatedTime.swap || 0) + (estimatedTime.outbound || 0);
          estimatedTime = total > 0 ? `${Math.round(total / 60)} min` : '5-10 min';
        }
      } else if (typeof estimatedTime === 'number') {
        estimatedTime = `${Math.round(estimatedTime / 60)} min`;
      } else {
        estimatedTime = '5-10 min';
      }

      return {
        provider: route.providers?.[0] || route.provider || 'Unknown',
        depositAddress,
        memo: processedMemo,
        expectedOutput: route.expectedBuyAmount || route.expectedOutput || route.expectedOutputUSD,
        expectedOutputMaxSlippage: route.expectedBuyAmountMaxSlippage,
        fees: route.fees || [],
        estimatedTime,
        priceImpact: route.meta?.priceImpact || route.totalSlippageBps / 100 || 0,
        warnings: route.warnings || [],
        totalFees: route.fees ? route.fees.reduce((sum: number, fee: any) => {
          const feeAmount = parseFloat(fee.amount || '0');
          return sum + (isNaN(feeAmount) ? 0 : feeAmount);
        }, 0) : 0
      };
    });

    console.log('Processed routes:', processedRoutes);

    // Return all routes for comparison
    const response = {
      routes: processedRoutes,
      expiresIn: 900, // 15 minutes standard TTL
      bestRoute: processedRoutes[0] // First route is usually the best
    };

    console.log('Final response:', response);

    return new Response(
      JSON.stringify(response),
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
