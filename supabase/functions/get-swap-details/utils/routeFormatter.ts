
import { 
  getDepositAddress, 
  getMemo, 
  getProviderName, 
  formatEstimatedTime, 
  calculateTotalFees 
} from './routeProcessors.ts';

export const processRoutes = (routes: any[], recipient: string) => {
  if (!routes || !Array.isArray(routes)) {
    console.warn('⚠️ Invalid routes data provided:', routes);
    return [];
  }

  console.log(`🔍 Processing ${routes.length} routes for recipient: ${recipient}`);

  const processedRoutes = routes.map((route: any, index: number) => {
    console.log(`\n📋 Processing route ${index + 1}:`);
    
    // Enhanced debugging for ChainFlip and MayaChain specifically
    if (Deno.env.get('DEBUG') === 'true') {
      console.log('🔍 RAW ROUTE DATA:', JSON.stringify(route, null, 2));
    }
    
    const provider = getProviderName(route);
    const depositAddress = getDepositAddress(route);
    const memo = getMemo(route, recipient);
    
    // Enhanced output extraction with multiple fallbacks
    const expectedOutput = (
      route.expectedBuyAmount || 
      route.expectedOutput || 
      route.expectedOutputUSD ||
      route.buyAmount ||
      route.outAmount ||
      route.toAmount ||
      route.outputAmount ||
      route.quote?.expectedOutput ||
      route.quote?.buyAmount ||
      '0'
    );
    
    // Enhanced fees extraction
    const fees = route.fees || route.totalFees || route.networkFees || route.quote?.fees || [];
    
    const processedRoute = {
      provider,
      depositAddress,
      memo,
      expectedOutput: expectedOutput.toString(),
      expectedOutputMaxSlippage: route.expectedBuyAmountMaxSlippage || route.expectedOutputMaxSlippage || route.minOutput || expectedOutput.toString(),
      fees: Array.isArray(fees) ? fees : [],
      estimatedTime: formatEstimatedTime(route.estimatedTime || route.timeEstimate || route.duration || route.quote?.estimatedTime),
      priceImpact: route.meta?.priceImpact || route.priceImpact || (route.totalSlippageBps ? route.totalSlippageBps / 100 : 0),
      warnings: route.warnings || route.alerts || route.errors || [],
      totalFees: calculateTotalFees(Array.isArray(fees) ? fees : [])
    };

    // Enhanced logging for debugging
    console.log(`✅ Route ${index + 1} processed:`, {
      provider: processedRoute.provider,
      hasDepositAddress: !!processedRoute.depositAddress,
      depositAddressLength: processedRoute.depositAddress?.length || 0,
      depositAddressPreview: processedRoute.depositAddress ? 
        `${processedRoute.depositAddress.slice(0, 10)}...${processedRoute.depositAddress.slice(-10)}` : 
        'N/A',
      hasMemo: !!processedRoute.memo,
      memoLength: processedRoute.memo?.length || 0,
      memoPreview: processedRoute.memo?.slice(0, 50) || 'N/A',
      expectedOutput: processedRoute.expectedOutput,
      feesCount: processedRoute.fees.length
    });

    // Enhanced validation warnings
    if (!processedRoute.depositAddress) {
      console.warn(`⚠️ Route ${index + 1} (${provider}) missing deposit address - this will cause transaction failure`);
    }
    
    if ((provider === 'MAYACHAIN' || provider === 'THORCHAIN') && !processedRoute.memo) {
      console.warn(`⚠️ ${provider} route ${index + 1} missing memo - this may cause transaction failure`);
    }

    if (provider === 'CHAINFLIP' && !processedRoute.memo) {
      console.log(`ℹ️ ChainFlip route ${index + 1} has no memo (may be optional for this swap)`);
    }

    return processedRoute;
  }).filter(route => {
    // Enhanced filtering logic
    const isValid = route.provider !== 'Unknown' && route.depositAddress && route.depositAddress.length > 10;
    
    if (!isValid) {
      console.warn('🚫 Filtering out invalid route:', {
        provider: route.provider,
        hasDepositAddress: !!route.depositAddress,
        depositAddressLength: route.depositAddress?.length || 0,
        reason: !route.depositAddress ? 'No deposit address' : 
                route.depositAddress.length <= 10 ? 'Invalid deposit address length' : 
                'Unknown provider'
      });
    }
    
    return isValid;
  });

  console.log(`✅ Successfully processed ${processedRoutes.length} valid routes out of ${routes.length} total`);
  
  return processedRoutes;
};
