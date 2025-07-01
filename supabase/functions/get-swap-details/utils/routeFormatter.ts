
import { 
  getDepositAddress, 
  getMemo, 
  getProviderName, 
  formatEstimatedTime, 
  calculateTotalFees 
} from './routeProcessors.ts';

export const processRoutes = (routes: any[], recipient: string) => {
  return routes.map((route: any) => {
    const processedRoute = {
      provider: getProviderName(route),
      depositAddress: getDepositAddress(route),
      memo: getMemo(route, recipient),
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
      expectedOutput: processedRoute.expectedOutput
    });

    return processedRoute;
  });
};
