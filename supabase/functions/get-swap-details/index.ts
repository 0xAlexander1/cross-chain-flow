
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
      console.log('🧪 Running integration tests...');
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
    console.log('🔧 API Key available:', !!swapkitApiKey);

    let quoteData;
    try {
      console.log('📞 Calling SwapKit API...');
      quoteData = await fetchSwapQuote(
        { fromAsset, toAsset, amount, recipient }, 
        swapkitApiKey
      );
      console.log('✅ SwapKit API call completed');
    } catch (error) {
      console.error('❌ SwapKit API error:', error);
      return createErrorResponse(`SwapKit API error: ${error.message}`);
    }

    console.log('📥 Quote data received from SwapKit');

    // Always enable enhanced debugging for provider issues
    console.log('🔍 QUOTE DATA ANALYSIS:', {
      hasRoutes: !!(quoteData.routes),
      routesCount: quoteData.routes?.length || 0,
      hasProviderErrors: !!(quoteData.providerErrors),
      providerErrorsCount: quoteData.providerErrors?.length || 0,
      ttl: quoteData.ttl,
      topLevelKeys: Object.keys(quoteData || {})
    });

    // Enhanced debugging for development and provider troubleshooting
    if (Deno.env.get('DEBUG') === 'true') {
      console.log('🔍 FULL QUOTE DATA DUMP:', JSON.stringify(quoteData, null, 2));
    }

    // Detailed route analysis for provider debugging
    if (quoteData.routes && Array.isArray(quoteData.routes)) {
      console.log(`🔍 Found ${quoteData.routes.length} raw routes from SwapKit`);
      
      // Log each route structure for debugging all providers
      quoteData.routes.forEach((route: any, index: number) => {
        const provider = route.providers?.[0] || route.provider || route.meta?.provider || 'Unknown';
        console.log(`\n📋 Raw route ${index + 1} (${provider}) detailed analysis:`, {
          provider: provider,
          hasTransaction: !!route.transaction,
          hasDepositAddress: !!(
            route.targetAddress || 
            route.inboundAddress || 
            route.depositAddress || 
            route.transaction?.from || 
            route.meta?.chainflip?.depositAddress ||
            route.meta?.mayachain?.inboundAddress ||
            route.meta?.thorchain?.inboundAddress
          ),
          hasMemo: !!(
            route.memo || 
            route.transaction?.memo || 
            route.meta?.memo || 
            route.meta?.mayachain?.memo ||
            route.meta?.thorchain?.memo ||
            route.meta?.chainflip?.memo
          ),
          hasExpectedOutput: !!(
            route.expectedBuyAmount || 
            route.expectedOutput ||
            route.buyAmount ||
            route.outputAmount
          ),
          metaKeys: route.meta ? Object.keys(route.meta) : [],
          transactionKeys: route.transaction ? Object.keys(route.transaction) : [],
          topLevelKeys: Object.keys(route),
          // Provider specific debugging
          chainflipMeta: route.meta?.chainflip ? Object.keys(route.meta.chainflip) : null,
          mayachainMeta: route.meta?.mayachain ? Object.keys(route.meta.mayachain) : null,
          thorchainMeta: route.meta?.thorchain ? Object.keys(route.meta.thorchain) : null
        });
      });
    } else {
      console.warn('⚠️ No routes array found in quote data');
    }

    // Enhanced provider error logging
    if (quoteData.providerErrors && Array.isArray(quoteData.providerErrors)) {
      console.log('⚠️ Provider errors received:');
      quoteData.providerErrors.forEach((error: any) => {
        console.log(`  • ${error.provider || 'Unknown'}: ${error.message || error.error || JSON.stringify(error)}`);
      });
    }

    // Check if we have routes to process
    if (!quoteData.routes || !Array.isArray(quoteData.routes) || quoteData.routes.length === 0) {
      console.warn('⚠️ No routes available from any provider');
      
      // If we have provider errors, include them in the response
      const errorDetails = quoteData.providerErrors || [];
      return createNoRoutesResponse({
        providerErrors: errorDetails,
        message: errorDetails.length > 0 ? 
          'No routes available. Provider errors: ' + errorDetails.map((e: any) => `${e.provider}: ${e.message}`).join(', ') :
          'No routes available from any provider'
      });
    }

    // Process all available routes with enhanced error handling and debugging
    console.log('🔄 Processing routes with comprehensive validation...');
    const processedRoutes = processRoutes(quoteData.routes, recipient);

    console.log(`✅ Successfully processed ${processedRoutes.length} routes:`, 
      processedRoutes.map(r => ({
        provider: r.provider,
        hasDepositAddress: !!r.depositAddress,
        depositAddressLength: r.depositAddress?.length || 0,
        depositAddressPreview: r.depositAddress ? 
          `${r.depositAddress.slice(0, 8)}...${r.depositAddress.slice(-6)}` : 'N/A',
        hasMemo: !!r.memo,
        memoLength: r.memo?.length || 0,
        memoPreview: r.memo ? 
          `${r.memo.slice(0, 20)}${r.memo.length > 20 ? '...' : ''}` : 'N/A',
        expectedOutput: r.expectedOutput,
        warningsCount: r.warnings?.length || 0,
        hasWarnings: r.warnings && r.warnings.length > 0
      }))
    );

    if (processedRoutes.length === 0) {
      console.warn('⚠️ No valid routes after processing and validation');
      
      // Provide detailed feedback about why routes were filtered out
      console.log('🔍 Route filtering analysis:');
      quoteData.routes.forEach((route: any, index: number) => {
        const provider = route.providers?.[0] || route.provider || route.meta?.provider || 'Unknown';
        console.log(`Route ${index + 1} (${provider}) filtered because:`, {
          provider: provider,
          hasValidProvider: provider !== 'Unknown',
          hasDepositAddress: !!(route.depositAddress || route.inboundAddress || route.targetAddress),
          hasValidOutput: !!(route.expectedBuyAmount || route.expectedOutput)
        });
      });
      
      return createNoRoutesResponse({
        message: 'Routes were found but none passed validation. Check logs for details.',
        debug: {
          rawRoutesCount: quoteData.routes.length,
          processedRoutesCount: processedRoutes.length
        }
      });
    }

    // Validate provider integrations with enhanced analysis
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
      integrationStatus: integrationStatus, // Include integration status in response
      debug: {
        rawRoutesReceived: quoteData.routes?.length || 0,
        routesProcessed: processedRoutes.length,
        providerErrorsReceived: quoteData.providerErrors?.length || 0
      }
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
      },
      totalWarnings: response.routes.reduce((sum, r) => sum + (r.warnings?.length || 0), 0)
    });

    return createSuccessResponse(response);

  } catch (error) {
    console.error('💥 Error in get-swap-details:', error);
    console.error('💥 Error stack:', error.stack);
    
    return createErrorResponse(
      `Failed to get swap details: ${error.message}`
    );
  }
});
