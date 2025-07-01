
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

    console.log('Getting swap details for:', { fromAsset, toAsset, amount, recipient });

    let quoteData;
    try {
      quoteData = await fetchSwapQuote(
        { fromAsset, toAsset, amount, recipient }, 
        swapkitApiKey
      );
    } catch (error) {
      console.error('SwapKit API error:', error);
      // Return a structured error instead of throwing
      return createErrorResponse(`SwapKit API error: ${error.message}`);
    }

    console.log('Quote data received:', quoteData);

    // 🔍 Debug: Log raw routes data for inspection
    console.log('🔍 Raw routes data:', JSON.stringify(quoteData.routes || [], null, 2));

    // Also log providers specifically
    if (quoteData.routes && Array.isArray(quoteData.routes)) {
      console.log('🔍 Raw providers found:', quoteData.routes.map((r: any) => ({
        provider: r.providers?.[0] || r.provider || r.meta?.provider || 'Unknown',
        hasDepositAddress: !!(r.targetAddress || r.inboundAddress || r.depositAddress),
        hasMemo: !!(r.memo || r.transaction?.memo)
      })));
    }

    // Handle provider errors gracefully
    if (quoteData.providerErrors && Array.isArray(quoteData.providerErrors)) {
      console.log('⚠️ Provider errors received:', quoteData.providerErrors);
      quoteData.providerErrors.forEach((error: any) => {
        console.log(`⚠️ ${error.provider} error: ${error.message}`);
      });
    }

    // Check if we have routes - handle gracefully instead of throwing
    if (!quoteData.routes || !Array.isArray(quoteData.routes) || quoteData.routes.length === 0) {
      console.warn('⚠️ No routes from any provider:', quoteData);
      return createNoRoutesResponse();
    }

    // Process all available routes for comparison
    const processedRoutes = processRoutes(quoteData.routes, recipient);

    console.log('Processed routes:', processedRoutes);

    if (processedRoutes.length === 0) {
      console.warn('⚠️ No valid routes after processing');
      return createNoRoutesResponse();
    }

    // Return all routes for comparison
    const response = {
      routes: processedRoutes,
      expiresIn: 900, // 15 minutes standard TTL
      bestRoute: processedRoutes[0] || null // First route is usually the best
    };

    console.log('Final response:', response);

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error in get-swap-details:', error);
    
    return createErrorResponse(
      `Failed to get swap details: ${error.message}`
    );
  }
});
