
export interface SwapRequest {
  fromAsset: string;
  toAsset: string;
  amount: string;
  recipient: string;
}

export const fetchSwapQuote = async (request: SwapRequest, apiKey: string) => {
  console.log('🔍 Requesting providers: MAYACHAIN, THORCHAIN, CHAINFLIP');
  
  const response = await fetch('https://api.swapkit.dev/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      sellAsset: request.fromAsset,
      buyAsset: request.toAsset,
      sellAmount: request.amount,
      recipientAddress: request.recipient,
      providers: ['MAYACHAIN', 'THORCHAIN', 'CHAINFLIP'] // MAYACHAIN first
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SwapKit quote error:', errorText);
    
    // Don't throw immediately - let's see if we got partial data
    try {
      const errorData = JSON.parse(errorText);
      // If we have routes despite errors, continue
      if (errorData.routes && errorData.routes.length > 0) {
        console.log('⚠️ API returned errors but has routes:', errorData.routes.length);
        return errorData;
      }
      // If we have provider errors but some succeeded, continue
      if (errorData.providerErrors) {
        console.log('⚠️ Provider errors:', errorData.providerErrors);
        return errorData;
      }
    } catch (parseError) {
      // If we can't parse, throw the original error
    }
    
    throw new Error(`SwapKit quote API error: ${response.status}`);
  }

  return response.json();
};
