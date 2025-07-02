
export interface SwapRequest {
  fromAsset: string;
  toAsset: string;
  amount: string;
  recipient: string;
}

export const fetchSwapQuote = async (request: SwapRequest, apiKey: string) => {
  console.log('🚀 Requesting swap quote with providers: MAYACHAIN, THORCHAIN, CHAINFLIP');
  console.log('📋 Request details:', request);
  
  const requestBody = {
    sellAsset: request.fromAsset,
    buyAsset: request.toAsset,
    sellAmount: request.amount,
    recipientAddress: request.recipient,
    providers: ['MAYACHAIN', 'THORCHAIN', 'CHAINFLIP'] // MayaChain first for priority
  };

  console.log('📤 SwapKit API request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.swapkit.dev/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(requestBody)
  });

  console.log('📥 SwapKit API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ SwapKit quote error:', errorText);
    
    // Enhanced error parsing to handle partial responses
    try {
      const errorData = JSON.parse(errorText);
      console.log('🔍 Parsed error response structure:', errorData);
      
      // If we have routes despite errors, continue with available data
      if (errorData.routes && Array.isArray(errorData.routes) && errorData.routes.length > 0) {
        console.log('⚠️ API returned errors but has usable routes:', errorData.routes.length);
        return errorData;
      }
      
      // If we have provider errors but some providers succeeded, continue
      if (errorData.providerErrors && Array.isArray(errorData.providerErrors)) {
        console.log('⚠️ Provider-specific errors detected:');
        errorData.providerErrors.forEach((err: any) => {
          console.log(`  • ${err.provider || 'Unknown'}: ${err.message || err.error}`);
        });
        
        // Check if there's any successful data alongside errors
        if (errorData.routes || errorData.data) {
          console.log('✅ Found partial success data alongside errors');
          return errorData;
        }
      }
      
      // If we have any data structure that might contain routes, try to extract it
      if (errorData.data || errorData.result) {
        console.log('🔍 Checking nested data structures for routes');
        const nestedData = errorData.data || errorData.result;
        if (nestedData.routes && Array.isArray(nestedData.routes)) {
          return nestedData;
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse error response as JSON:', parseError);
    }
    
    throw new Error(`SwapKit quote API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ SwapKit API response received successfully');
  
  // Debug log for development
  if (Deno.env.get('DEBUG') === 'true') {
    console.log('🔍 FULL API RESPONSE:', JSON.stringify(data, null, 2));
  }
  
  return data;
};
