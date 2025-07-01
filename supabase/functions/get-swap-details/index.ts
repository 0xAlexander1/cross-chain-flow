
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createErrorResponse, createSuccessResponse, createNoRoutesResponse } from './utils/responseHelpers.ts';
import { validateSwapRequest, validateApiKey } from './utils/validation.ts';
import { fetchSwapQuote } from './utils/swapkitApi.ts';
import { processRoutes } from './utils/routeFormatter.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body = await req.json();
    const { fromAsset, toAsset, amount, recipient } = validateSwapRequest(body);
    const swapkitApiKey = validateApiKey();

    console.log('🚀 Getting swap details for:', { fromAsset, toAsset, amount, recipient });

    let quoteData;
    try {
      quoteData = await fetchSwapQuote(
        { fromAsset, toAsset, amount, recipient }, 
        swapkitApiKey
      );
    } catch (error) {
      console.error('❌ SwapKit API error:', error);
      return createErrorResponse(`SwapKit API error: ${error.message}`);
    }

    console.log('📥 Quote data received from SwapKit');

    // Enhanced debugging - log raw routes data structure
    if (quoteData.routes && Array.isArray(quoteData.routes)) {
      console.log(`🔍 Found ${quoteData.routes.length} raw routes from SwapKit`);
      
      quoteData.routes.forEach((route: any, index: number) => {
        console.log(`\n📋 Raw route ${index + 1} structure:`, {
          provider: route.providers?.[0] || route.provider || route.meta?.provider || 'Unknown',
          hasDepositAddress: !!(route.targetAddress || route.inboundAddress || route.depositAddress || route.meta?.chainflip?.depositAddress),
          hasMemo: !!(route.memo || route.transaction?.memo || route.meta?.memo),
          expectedOutput: route.expectedBuyAmount || route.expectedOutput || 'N/A'
        });
      });
    } else {
      console.warn('⚠️ No routes array found in quote data:', quoteData);
    }

    // Handle provider errors gracefully
    if (quoteData.providerErrors && Array.isArray(quoteData.providerErrors)) {
      console.log('⚠️ Provider errors received:');
      quoteData.providerErrors.forEach((error: any) => {
        console.log(`  • ${error.provider}: ${error.message}`);
      });
    }

    // Check if we have routes
    if (!quoteData.routes || !Array.isArray(quoteData.routes) || quoteData.routes.length === 0) {
      console.warn('⚠️ No routes available from any provider');
      return createNoRoutesResponse();
    }

    // Process all available routes
    console.log('🔄 Processing routes...');
    const processedRoutes = processRoutes(quoteData.routes, recipient);

    console.log(`✅ Successfully processed ${processedRoutes.length} routes:`, 
      processedRoutes.map(r => ({
        provider: r.provider,
        hasDepositAddress: !!r.depositAddress,
        hasMemo: !!r.memo,
        expectedOutput: r.expectedOutput
      }))
    );

    if (processedRoutes.length === 0) {
      console.warn('⚠️ No valid routes after processing');
      return createNoRoutesResponse();
    }

    // Sort routes by expected output (descending) to put best route first
    const sortedRoutes = processedRoutes.sort((a, b) => {
      const outputA = parseFloat(a.expectedOutput) || 0;
      const outputB = parseFloat(b.expectedOutput) || 0;
      return outputB - outputA;
    });

    const response = {
      routes: sortedRoutes,
      expiresIn: 900, // 15 minutes standard TTL
      bestRoute: sortedRoutes[0] || null
    };

    console.log('🎉 Final response prepared:', {
      routeCount: response.routes.length,
      bestProvider: response.bestRoute?.provider || 'None',
      providers: response.routes.map(r => r.provider)
    });

    return createSuccessResponse(response);

  } catch (error) {
    console.error('💥 Error in get-swap-details:', error);
    
    return createErrorResponse(
      `Failed to get swap details: ${error.message}`
    );
  }
});
