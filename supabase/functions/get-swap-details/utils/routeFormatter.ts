
import { 
  getDepositAddress, 
  getMemo, 
  getProviderName, 
  formatEstimatedTime, 
  calculateTotalFees 
} from './routeProcessors.ts';
import { 
  validateProviderRoute, 
  getProviderSpecificWarnings,
  validateNetworkAddress 
} from './providerValidators.ts';

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
      warnings: [...(route.warnings || route.alerts || route.errors || [])],
      totalFees: calculateTotalFees(Array.isArray(fees) ? fees : [])
    };

    // Run provider-specific validation
    const validation = validateProviderRoute(provider, processedRoute);
    
    if (!validation.isValid) {
      console.warn(`⚠️ Route ${index + 1} validation failed:`, validation.errors);
      processedRoute.warnings.push(...validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      processedRoute.warnings.push(...validation.warnings);
    }

    // Add provider-specific warnings
    const fromAsset = route.sellAsset || route.fromAsset || '';
    const toAsset = route.buyAsset || route.toAsset || '';
    const specificWarnings = getProviderSpecificWarnings(provider, fromAsset, toAsset);
    processedRoute.warnings.push(...specificWarnings);

    // Validate recipient address for the target network
    const targetNetwork = toAsset.split('.')[0];
    if (targetNetwork && !validateNetworkAddress(recipient, targetNetwork)) {
      processedRoute.warnings.push(`Recipient address may not be valid for ${targetNetwork} network`);
    }

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
      feesCount: processedRoute.fees.length,
      warningsCount: processedRoute.warnings.length,
      validationPassed: validation.isValid
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
    // Enhanced filtering logic with detailed logging
    const hasValidProvider = route.provider !== 'Unknown' && route.provider !== 'UNKNOWN';
    const hasDepositAddress = !!route.depositAddress;
    const hasValidDepositLength = route.depositAddress && route.depositAddress.length > 10;
    
    // For THORChain and MayaChain, memo is usually required
    const requiresMemo = route.provider === 'THORCHAIN' || route.provider === 'MAYACHAIN';
    const hasMemoWhenRequired = !requiresMemo || !!route.memo;
    
    // ChainFlip memo is optional for native swaps
    const isValidChainFlip = route.provider === 'CHAINFLIP' && hasDepositAddress && hasValidDepositLength;
    
    const isValid = hasValidProvider && hasDepositAddress && hasValidDepositLength && 
                   (hasMemoWhenRequired || isValidChainFlip);
    
    if (!isValid) {
      console.warn('🚫 Filtering out invalid route:', {
        provider: route.provider,
        hasValidProvider,
        hasDepositAddress,
        hasValidDepositLength,
        hasMemoWhenRequired,
        isValidChainFlip,
        reason: !hasValidProvider ? 'Invalid provider' :
                !hasDepositAddress ? 'No deposit address' :
                !hasValidDepositLength ? 'Invalid deposit address length' :
                !hasMemoWhenRequired ? 'Missing required memo' :
                'Unknown validation failure'
      });
    }
    
    return isValid;
  });

  console.log(`✅ Successfully processed ${processedRoutes.length} valid routes out of ${routes.length} total`);
  
  // Log summary by provider
  const providerSummary = processedRoutes.reduce((acc, route) => {
    acc[route.provider] = (acc[route.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Routes by provider:', providerSummary);
  
  return processedRoutes;
};
