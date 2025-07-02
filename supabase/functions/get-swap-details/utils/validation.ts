
export const validateSwapRequest = (body: any) => {
  const { fromAsset, toAsset, amount, recipient } = body;

  if (!fromAsset || !toAsset || !amount || !recipient) {
    throw new Error('Missing required fields: fromAsset, toAsset, amount, recipient');
  }

  // Validate amount is a positive number
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Basic address validation for common chains
  if (toAsset.includes('ETH') && !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    throw new Error('Invalid Ethereum address format');
  }

  if (toAsset.includes('BTC') && !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(recipient)) {
    console.warn('Bitcoin address format validation failed, but proceeding');
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
