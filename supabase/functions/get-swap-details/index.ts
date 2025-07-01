
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

    // Get swap quote from SwapKit API with MAYACHAIN as first priority
    console.log('🔍 Requesting providers: MAYACHAIN, THORCHAIN, CHAINFLIP');
    
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
        providers: ['MAYACHAIN', 'THORCHAIN', 'CHAINFLIP'] // MAYACHAIN first
      })
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('SwapKit quote error:', errorText);
      throw new Error(`SwapKit quote API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    console.log('Quote data received:', quoteData);

    // 🔍 Debug: Log raw routes data for inspection
    console.log('🔍 Raw routes data:', JSON.stringify(quoteData.routes, null, 2));

    // Also log providers specifically
    if (quoteData.routes) {
      console.log('🔍 Providers found:', quoteData.routes.map((r: any) => ({
        provider: r.providers?.[0] || r.provider || 'Unknown',
        hasDepositAddress: !!(r.targetAddress || r.inboundAddress || r.depositAddress),
        hasMemo: !!(r.memo || r.transaction?.memo)
      })));
    }

    // Check if we have routes - handle gracefully instead of throwing
    if (!quoteData.routes || quoteData.routes.length === 0) {
      console.warn('⚠️ No routes from any provider:', quoteData);
      return new Response(
        JSON.stringify({ 
          routes: [], 
          expiresIn: 0, 
          bestRoute: null,
          debug: 'No routes found from providers'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Helper functions to extract data from different route formats
    const getDepositAddress = (route: any) => {
      return (
        route.transaction?.from ||
        route.transaction?.depositAddress ||
        route.inboundAddress ||
        route.targetAddress ||
        route.depositAddress ||
        route.meta?.chainflip?.depositAddress ||
        route.meta?.mayachain?.depositAddress ||
        ''
      );
    };

    const getMemo = (route: any, recipient: string) => {
      let memo = route.transaction?.memo || route.memo || route.meta?.memo || '';
      if (memo.includes('{destinationAddress}')) {
        memo = memo.replace('{destinationAddress}', recipient);
      }
      return memo;
    };

    const getProviderName = (route: any) => {
      // Check multiple possible locations for provider name
      const provider = route.providers?.[0] || route.provider || route.meta?.provider;
      
      // Normalize provider names
      if (typeof provider === 'string') {
        const upperProvider = provider.toUpperCase();
        if (upperProvider.includes('MAYA')) return 'MAYACHAIN';
        if (upperProvider.includes('THOR')) return 'THORCHAIN';
        if (upperProvider.includes('CHAINFLIP') || upperProvider.includes('FLIP')) return 'CHAINFLIP';
        return provider;
      }
      
      return 'Unknown';
    };

    // Process all available routes for comparison
    const processedRoutes = quoteData.routes.map((route: any) => {
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

      const processedRoute = {
        provider: getProviderName(route),
        depositAddress: getDepositAddress(route),
        memo: getMemo(route, recipient),
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

      console.log('🔍 Processed route:', {
        provider: processedRoute.provider,
        hasDepositAddress: !!processedRoute.depositAddress,
        hasMemo: !!processedRoute.memo,
        expectedOutput: processedRoute.expectedOutput
      });

      return processedRoute;
    });

    console.log('Processed routes:', processedRoutes);

    // Return all routes for comparison
    const response = {
      routes: processedRoutes,
      expiresIn: 900, // 15 minutes standard TTL
      bestRoute: processedRoutes[0] || null // First route is usually the best
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
