
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

    const quoteData = await fetchSwapQuote(
      { fromAsset, toAsset, amount, recipient }, 
      swapkitApiKey
    );

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
      return createNoRoutesResponse();
    }

    // Process all available routes for comparison
    const processedRoutes = processRoutes(quoteData.routes, recipient);

    console.log('Processed routes:', processedRoutes);

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
