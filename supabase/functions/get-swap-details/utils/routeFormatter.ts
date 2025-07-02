
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
    
    // Enhanced debugging for all providers
    if (Deno.env.get('DEBUG') === 'true') {
      console.log('🔍 RAW ROUTE DATA:', JSON.stringify(route, null, 2));
    } else {
      // Always log route structure for debugging provider issues
      console.log('🔍 Route structure summary:', {
        hasProviders: !!route.providers,
        hasProvider: !!route.provider,
        hasMeta: !!route.meta,
        hasTransaction: !!route.transaction,
        topLevelKeys: Object.keys(route),
        metaKeys: route.meta ? Object.keys(route.meta) : [],
        transactionKeys: route.transaction ? Object.keys(route.transaction) : []
      });
    }
    
    const provider = getProviderName(route);
    const depositAddress = getDepositAddress(route);
    const memo = getMemo(route, recipient);
    
    // Enhanced output extraction with multiple fallbacks and better error handling
    const expectedOutput = (
      route.expectedBuyAmount || 
      route.expectedOutput || 
      route.expectedOutputUSD ||
      route.buyAmount ||
      route.outAmount ||
      route.toAmount ||
      route.outputAmount ||
      route.receiveAmount ||
      route.quote?.expectedOutput ||
      route.quote?.buyAmount ||
      route.quote?.outputAmount ||
      route.meta?.expectedOutput ||
      route.meta?.buyAmount ||
      route.transaction?.value ||
      route.legs?.[0]?.outputAmount ||
      route.steps?.[0]?.outputAmount ||
      '0'
    );
    
    // Enhanced fees extraction with better fallbacks
    let fees = route.fees || route.totalFees || route.networkFees || route.quote?.fees || [];
    
    // Try to extract fees from meta or other locations
    if (!fees || !Array.isArray(fees) || fees.length === 0) {
      fees = route.meta?.fees || 
             route.transaction?.fees || 
             route.costs || 
             route.charges || 
             [];
    }
    
    // Ensure fees is always an array
    if (!Array.isArray(fees)) {
      fees = fees ? [fees] : [];
    }
    
    const processedRoute = {
      provider,
      depositAddress,
      memo,
      expectedOutput: expectedOutput.toString(),
      expectedOutputMaxSlippage: route.expectedBuyAmountMaxSlippage || 
                                 route.expectedOutputMaxSlippage || 
                                 route.minOutput || 
                                 route.minimumReceived ||
                                 expectedOutput.toString(),
      fees: fees,
      estimatedTime: formatEstimatedTime(
        route.estimatedTime || 
        route.timeEstimate || 
        route.duration || 
        route.quote?.estimatedTime ||
        route.meta?.estimatedTime
      ),
      priceImpact: route.meta?.priceImpact || 
                   route.priceImpact || 
                   route.slippage ||
                   (route.totalSlippageBps ? route.totalSlippageBps / 100 : 0),
      warnings: [...(route.warnings || route.alerts || route.errors || [])],
      totalFees: calculateTotalFees(fees)
    };

    // Run provider-specific validation
    const validation = validateProviderRoute(provider, processedRoute);
    
    if (!validation.isValid) {
      console.warn(`⚠️ Route ${index + 1} validation failed for ${provider}:`, validation.errors);
      processedRoute.warnings.push(...validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.log(`⚠️ Route ${index + 1} validation warnings for ${provider}:`, validation.warnings);
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

    // Enhanced logging for debugging with provider-specific details
    console.log(`✅ Route ${index + 1} processed (${provider}):`, {
      provider: processedRoute.provider,
      hasDepositAddress: !!processedRoute.depositAddress,
      depositAddressLength: processedRoute.depositAddress?.length || 0,
      depositAddressPreview: processedRoute.depositAddress ? 
        `${processedRoute.depositAddress.slice(0, 10)}...${processedRoute.depositAddress.slice(-10)}` : 
        'N/A',
      hasMemo: !!processedRoute.memo,
      memoLength: processedRoute.memo?.length || 0,
      memoPreview: processedRoute.memo?.slice(0, 50) + (processedRoute.memo?.length > 50 ? '...' : '') || 'N/A',
      expectedOutput: processedRoute.expectedOutput,
      feesCount: processedRoute.fees.length,
      warningsCount: processedRoute.warnings.length,
      validationPassed: validation.isValid,
      validationScore: validation.isValid ? 100 : Math.max(0, 100 - (validation.errors.length * 25))
    });

    // Enhanced validation warnings with provider-specific messages
    if (!processedRoute.depositAddress) {
      const message = `⚠️ ${provider} route ${index + 1} missing deposit address - this WILL cause transaction failure`;
      console.warn(message);
      processedRoute.warnings.push(`Missing deposit address for ${provider}`);
    }
    
    if ((provider === 'MAYACHAIN' || provider === 'THORCHAIN') && !processedRoute.memo) {
      const message = `⚠️ ${provider} route ${index + 1} missing memo - this may cause transaction failure`;
      console.warn(message);
      processedRoute.warnings.push(`Missing required memo for ${provider}`);
    }

    if (provider === 'CHAINFLIP' && !processedRoute.memo) {
      console.log(`ℹ️ ChainFlip route ${index + 1} has no memo (may be optional for this swap type)`);
    }

    // Log potential issues for debugging
    if (parseFloat(processedRoute.expectedOutput) <= 0) {
      console.warn(`⚠️ ${provider} route ${index + 1} has zero or invalid expected output: ${processedRoute.expectedOutput}`);
    }

    return processedRoute;
  }).filter(route => {
    // Enhanced filtering logic with detailed logging and more permissive rules
    const hasValidProvider = route.provider !== 'Unknown' && route.provider !== 'UNKNOWN';
    const hasDepositAddress = !!route.depositAddress;
    const hasValidDepositLength = route.depositAddress && route.depositAddress.length > 5; // More permissive
    const hasValidOutput = parseFloat(route.expectedOutput) > 0;
    
    // For THORChain and MayaChain, memo is usually required but not always
    const requiresMemo = route.provider === 'THORCHAIN' || route.provider === 'MAYACHAIN';
    const hasMemoWhenRequired = !requiresMemo || !!route.memo;
    
    // ChainFlip memo is optional for native swaps
    const isValidChainFlip = route.provider === 'CHAINFLIP' && hasDepositAddress && hasValidDepositLength;
    
    // More permissive validation - allow routes with warnings
    const isValid = hasValidProvider && hasDepositAddress && hasValidDepositLength && hasValidOutput;
    
    if (!isValid) {
      console.warn(`🚫 Filtering out invalid route (${route.provider}):`, {
        provider: route.provider,
        hasValidProvider,
        hasDepositAddress,
        hasValidDepositLength,
        hasValidOutput,
        hasMemoWhenRequired,
        isValidChainFlip,
        depositAddressLength: route.depositAddress?.length || 0,
        expectedOutput: route.expectedOutput,
        reason: !hasValidProvider ? 'Invalid provider' :
                !hasDepositAddress ? 'No deposit address' :
                !hasValidDepositLength ? 'Invalid deposit address length' :
                !hasValidOutput ? 'Invalid expected output' :
                'Unknown validation failure'
      });
    } else {
      console.log(`✅ Route ${route.provider} passed validation`);
    }
    
    return isValid;
  });

  console.log(`✅ Successfully processed ${processedRoutes.length} valid routes out of ${routes.length} total`);
  
  // Log summary by provider
  const providerSummary = processedRoutes.reduce((acc, route) => {
    acc[route.provider] = (acc[route.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Final routes by provider:', providerSummary);
  
  // If we have no valid routes, log detailed debugging info
  if (processedRoutes.length === 0) {
    console.error('❌ NO VALID ROUTES FOUND - Debugging info:');
    routes.forEach((route, index) => {
      console.error(`Route ${index + 1} debug:`, {
        provider: getProviderName(route),
        depositAddress: getDepositAddress(route),
        memo: getMemo(route, recipient),
        rawRoute: JSON.stringify(route, null, 2)
      });
    });
  }
  
  return processedRoutes;
};
