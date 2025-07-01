
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

  return routes.map((route: any) => {
    const provider = getProviderName(route);
    const depositAddress = getDepositAddress(route);
    const memo = getMemo(route, recipient);
    
    const processedRoute = {
      provider,
      depositAddress,
      memo,
      expectedOutput: route.expectedBuyAmount || route.expectedOutput || route.expectedOutputUSD,
      expectedOutputMaxSlippage: route.expectedBuyAmountMaxSlippage,
      fees: route.fees || [],
      estimatedTime: formatEstimatedTime(route.estimatedTime),
      priceImpact: route.meta?.priceImpact || route.totalSlippageBps / 100 || 0,
      warnings: route.warnings || [],
      totalFees: calculateTotalFees(route.fees)
    };

    console.log('🔍 Processed route:', {
      provider: processedRoute.provider,
      hasDepositAddress: !!processedRoute.depositAddress,
      hasMemo: !!processedRoute.memo,
      expectedOutput: processedRoute.expectedOutput,
      rawRoute: JSON.stringify(route, null, 2)
    });

    return processedRoute;
  }).filter(route => route.provider !== 'Unknown'); // Filter out routes we couldn't identify
};
