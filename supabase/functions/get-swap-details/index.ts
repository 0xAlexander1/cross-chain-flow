
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createErrorResponse, createSuccessResponse, createNoRoutesResponse } from './utils/responseHelpers.ts';
import { validateSwapRequest, validateApiKey } from './utils/validation.ts';
import { fetchSwapQuote } from './utils/swapkitApi.ts';
import { processRoutes } from './utils/routeFormatter.ts';
import { runIntegrationTests, validateProviderIntegration } from './utils/integrationTests.ts';

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
    
    // Special endpoint for running integration tests
    if (body.action === 'test-integrations') {
      const swapkitApiKey = validateApiKey();
      const testReport = await runIntegrationTests(swapkitApiKey);
      return createSuccessResponse({
        action: 'integration-test',
        report: testReport
      });
    }

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

    // Enhanced debugging for development
    if (Deno.env.get('DEBUG') === 'true') {
      console.log('🔍 FULL QUOTE DATA DUMP:', JSON.stringify(quoteData, null, 2));
    }

    // Enhanced routes validation and logging
    if (quoteData.routes && Array.isArray(quoteData.routes)) {
      console.log(`🔍 Found ${quoteData.routes.length} raw routes from SwapKit`);
      
      // Log each route structure for debugging ChainFlip and MayaChain issues
      quoteData.routes.forEach((route: any, index: number) => {
        const provider = route.providers?.[0] || route.provider || route.meta?.provider || 'Unknown';
        console.log(`\n📋 Raw route ${index + 1} (${provider}) summary:`, {
          provider: provider,
          hasTransaction: !!route.transaction,
          hasDepositAddress: !!(route.targetAddress || route.inboundAddress || route.depositAddress || route.transaction?.from || route.meta?.chainflip?.depositAddress),
          hasMemo: !!(route.memo || route.transaction?.memo || route.meta?.memo || route.meta?.mayachain?.memo),
          hasExpectedOutput: !!(route.expectedBuyAmount || route.expectedOutput),
          metaKeys: route.meta ? Object.keys(route.meta) : [],
          transactionKeys: route.transaction ? Object.keys(route.transaction) : []
        });
      });
    } else {
      console.warn('⚠️ No routes array found in quote data');
    }

    // Handle provider errors gracefully
    if (quoteData.providerErrors && Array.isArray(quoteData.providerErrors)) {
      console.log('⚠️ Provider errors received:');
      quoteData.providerErrors.forEach((error: any) => {
        console.log(`  • ${error.provider}: ${error.message}`);
      });
    }

    // Check if we have routes to process
    if (!quoteData.routes || !Array.isArray(quoteData.routes) || quoteData.routes.length === 0) {
      console.warn('⚠️ No routes available from any provider');
      return createNoRoutesResponse();
    }

    // Process all available routes with enhanced error handling
    console.log('🔄 Processing routes with enhanced validation...');
    const processedRoutes = processRoutes(quoteData.routes, recipient);

    console.log(`✅ Successfully processed ${processedRoutes.length} routes:`, 
      processedRoutes.map(r => ({
        provider: r.provider,
        hasDepositAddress: !!r.depositAddress,
        depositAddressLength: r.depositAddress?.length || 0,
        hasMemo: !!r.memo,
        memoLength: r.memo?.length || 0,
        expectedOutput: r.expectedOutput,
        warningsCount: r.warnings?.length || 0
      }))
    );

    if (processedRoutes.length === 0) {
      console.warn('⚠️ No valid routes after processing and validation');
      return createNoRoutesResponse();
    }

    // Validate provider integrations
    const integrationStatus = validateProviderIntegration(processedRoutes);
    console.log('🔧 Provider integration status:', integrationStatus);

    // Sort routes by expected output (descending) to put best route first
    const sortedRoutes = processedRoutes.sort((a, b) => {
      const outputA = parseFloat(a.expectedOutput) || 0;
      const outputB = parseFloat(b.expectedOutput) || 0;
      return outputB - outputA;
    });

    const response = {
      routes: sortedRoutes,
      expiresIn: quoteData.ttl || 900, // Use API provided TTL or default to 15 minutes
      bestRoute: sortedRoutes[0] || null,
      integrationStatus: integrationStatus // Include integration status in response
    };

    console.log('🎉 Final response prepared:', {
      routeCount: response.routes.length,
      bestProvider: response.bestRoute?.provider || 'None',
      providers: response.routes.map(r => r.provider),
      hasDepositAddresses: response.routes.every(r => !!r.depositAddress),
      hasMemos: response.routes.filter(r => !!r.memo).length,
      integrationHealth: {
        thorchain: integrationStatus.thorchain.functional,
        mayachain: integrationStatus.mayachain.functional,
        chainflip: integrationStatus.chainflip.functional
      }
    });

    return createSuccessResponse(response);

  } catch (error) {
    console.error('💥 Error in get-swap-details:', error);
    
    return createErrorResponse(
      `Failed to get swap details: ${error.message}`
    );
  }
});
