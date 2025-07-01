
import { 
  getDepositAddress, 
  getMemo, 
  getProviderName, 
  formatEstimatedTime, 
  calculateTotalFees 
} from './routeProcessors.ts';

export const processRoutes = (routes: any[], recipient: string) => {
  if (!routes || !Array.isArray(routes)) {
    console.warn('⚠️ Invalid routes data:', routes);
    return [];
  }

  console.log(`🔍 Processing ${routes.length} routes for recipient: ${recipient}`);

  return routes.map((route: any, index: number) => {
    console.log(`\n📋 Processing route ${index + 1}:`, JSON.stringify(route, null, 2));
    
    const provider = getProviderName(route);
    const depositAddress = getDepositAddress(route);
    const memo = getMemo(route, recipient);
    
    // Extract expected output with multiple fallbacks
    const expectedOutput = (
      route.expectedBuyAmount || 
      route.expectedOutput || 
      route.expectedOutputUSD ||
      route.buyAmount ||
      route.outAmount ||
      route.toAmount ||
      '0'
    );
    
    // Extract fees with multiple fallbacks
    const fees = route.fees || route.totalFees || route.networkFees || [];
    
    const processedRoute = {
      provider,
      depositAddress,
      memo,
      expectedOutput: expectedOutput.toString(),
      expectedOutputMaxSlippage: route.expectedBuyAmountMaxSlippage || route.expectedOutputMaxSlippage || expectedOutput.toString(),
      fees: Array.isArray(fees) ? fees : [],
      estimatedTime: formatEstimatedTime(route.estimatedTime || route.timeEstimate || route.duration),
      priceImpact: route.meta?.priceImpact || route.priceImpact || (route.totalSlippageBps ? route.totalSlippageBps / 100 : 0),
      warnings: route.warnings || route.alerts || [],
      totalFees: calculateTotalFees(Array.isArray(fees) ? fees : [])
    };

    console.log(`✅ Processed route ${index + 1} result:`, {
      provider: processedRoute.provider,
      hasDepositAddress: !!processedRoute.depositAddress,
      depositAddressLength: processedRoute.depositAddress?.length || 0,
      hasMemo: !!processedRoute.memo,
      memoLength: processedRoute.memo?.length || 0,
      expectedOutput: processedRoute.expectedOutput,
      feesCount: processedRoute.fees.length
    });

    // Log warning if critical data is missing
    if (!processedRoute.depositAddress) {
      console.warn(`⚠️ Route ${index + 1} (${provider}) missing deposit address`);
    }
    
    if (provider === 'MAYACHAIN' && !processedRoute.memo) {
      console.warn(`⚠️ MayaChain route ${index + 1} missing memo - this may cause transaction failure`);
    }

    return processedRoute;
  }).filter(route => {
    // Only filter out routes that we genuinely couldn't identify
    const isValid = route.provider !== 'Unknown' && route.depositAddress;
    if (!isValid) {
      console.warn('🚫 Filtering out invalid route:', {
        provider: route.provider,
        hasDepositAddress: !!route.depositAddress
      });
    }
    return isValid;
  });
};
