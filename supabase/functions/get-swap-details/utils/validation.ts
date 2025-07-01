
export const validateSwapRequest = (body: any) => {
  const { fromAsset, toAsset, amount, recipient } = body;

  if (!fromAsset || !toAsset || !amount || !recipient) {
    throw new Error('Missing required fields: fromAsset, toAsset, amount, recipient');
  }

  return { fromAsset, toAsset, amount, recipient };
};

export const validateApiKey = () => {
  const swapkitApiKey = Deno.env.get('SWAPKIT_API_KEY');
  if (!swapkitApiKey) {
    throw new Error('SWAPKIT_API_KEY not found in environment variables');
  }
  return swapkitApiKey;
};
