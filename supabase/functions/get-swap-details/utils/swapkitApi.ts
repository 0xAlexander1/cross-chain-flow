
export interface SwapRequest {
  fromAsset: string;
  toAsset: string;
  amount: string;
  recipient: string;
}

export const fetchSwapQuote = async (request: SwapRequest, apiKey: string) => {
  console.log('🚀 Requesting swap quote with ALL providers prioritizing MayaChain and ChainFlip');
  console.log('📋 Request details:', request);
  
  const requestBody = {
    sellAsset: request.fromAsset,
    buyAsset: request.toAsset,
    sellAmount: request.amount,
    recipientAddress: request.recipient,
    // Explicitly request all three providers with MayaChain and ChainFlip first
    providers: ['MAYACHAIN', 'CHAINFLIP', 'THORCHAIN'],
    // Add additional parameters that might help with provider detection
    slippageTolerance: '3', // 3% slippage tolerance
    affiliateAddress: '', // Empty affiliate for now
    affiliateBasisPoints: '0'
  };

  console.log('📤 SwapKit API request body:', JSON.stringify(requestBody, null, 2));

  let response;
  try {
    response = await fetch('https://api.swapkit.dev/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey,
        'User-Agent': 'Lovable-CrossChain-Swap/1.0'
      },
      body: JSON.stringify(requestBody)
    });
  } catch (fetchError) {
    console.error('❌ Network error calling SwapKit API:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('📥 SwapKit API response status:', response.status);
  console.log('📥 SwapKit API response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ SwapKit quote error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    
    // Enhanced error parsing to handle partial responses and extract useful data
    try {
      const errorData = JSON.parse(errorText);
      console.log('🔍 Parsed error response structure:', {
        hasRoutes: !!(errorData.routes),
        routesCount: errorData.routes?.length || 0,
        hasProviderErrors: !!(errorData.providerErrors),
        providerErrorsCount: errorData.providerErrors?.length || 0,
        hasData: !!(errorData.data),
        topLevelKeys: Object.keys(errorData)
      });
      
      // If we have routes despite errors, continue with available data
      if (errorData.routes && Array.isArray(errorData.routes) && errorData.routes.length > 0) {
        console.log('⚠️ API returned errors but has usable routes:', errorData.routes.length);
        console.log('🔍 Route providers found:', errorData.routes.map((r: any) => 
          r.providers?.[0] || r.provider || r.meta?.provider || 'Unknown'
        ));
        return errorData;
      }
      
      // If we have provider errors but some providers succeeded, continue
      if (errorData.providerErrors && Array.isArray(errorData.providerErrors)) {
        console.log('⚠️ Provider-specific errors detected:');
        errorData.providerErrors.forEach((err: any) => {
          console.log(`  • ${err.provider || 'Unknown'}: ${err.message || err.error || JSON.stringify(err)}`);
        });
        
        // Check if there's any successful data alongside errors
        if (errorData.routes || errorData.data || errorData.result) {
          console.log('✅ Found partial success data alongside errors');
          return errorData;
        }
      }
      
      // If we have any data structure that might contain routes, try to extract it
      if (errorData.data || errorData.result) {
        console.log('🔍 Checking nested data structures for routes');
        const nestedData = errorData.data || errorData.result;
        if (nestedData.routes && Array.isArray(nestedData.routes)) {
          console.log('✅ Found routes in nested data structure');
          return nestedData;
        }
      }
      
      // Log the full error for debugging
      console.error('❌ Full error data:', JSON.stringify(errorData, null, 2));
      
    } catch (parseError) {
      console.error('❌ Failed to parse error response as JSON:', parseError);
      console.error('❌ Raw error text:', errorText);
    }
    
    throw new Error(`SwapKit API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ SwapKit API response received successfully');
  console.log('📊 Response summary:', {
    hasRoutes: !!(data.routes),
    routesCount: data.routes?.length || 0,
    hasProviderErrors: !!(data.providerErrors),
    providerErrorsCount: data.providerErrors?.length || 0,
    ttl: data.ttl,
    topLevelKeys: Object.keys(data)
  });
  
  // Enhanced logging for route providers
  if (data.routes && Array.isArray(data.routes)) {
    console.log('🔍 Providers in response:', data.routes.map((route: any, index: number) => ({
      index,
      provider: route.providers?.[0] || route.provider || route.meta?.provider || 'Unknown',
      hasDepositAddress: !!(route.depositAddress || route.inboundAddress || route.targetAddress || route.transaction?.from),
      hasMemo: !!(route.memo || route.transaction?.memo || route.meta?.memo)
    })));
  }
  
  // Debug log for development
  if (Deno.env.get('DEBUG') === 'true') {
    console.log('🔍 FULL API RESPONSE:', JSON.stringify(data, null, 2));
  }
  
  return data;
};
