
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
    
    // Try to parse error response to see if we have partial data
    try {
      const errorData = JSON.parse(errorText);
      console.log('🔍 Parsed error response:', errorData);
      
      // If we have routes despite errors, continue
      if (errorData.routes && Array.isArray(errorData.routes) && errorData.routes.length > 0) {
        console.log('⚠️ API returned errors but has routes:', errorData.routes.length);
        return errorData;
      }
      
      // If we have provider errors but some succeeded, continue
      if (errorData.providerErrors && Array.isArray(errorData.providerErrors)) {
        console.log('⚠️ Provider errors detected:', errorData.providerErrors);
        // Still return the data as some providers might have succeeded
        return errorData;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse error response:', parseError);
    }
    
    throw new Error(`SwapKit quote API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ SwapKit API response received:', JSON.stringify(data, null, 2));
  
  return data;
};
