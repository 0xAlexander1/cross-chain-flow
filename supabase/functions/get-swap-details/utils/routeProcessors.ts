
export const getDepositAddress = (route: any) => {
  console.log('🔍 Extracting deposit address from route structure:', {
    hasTransaction: !!route.transaction,
    hasMeta: !!route.meta,
    hasInboundAddress: !!route.inboundAddress,
    hasTargetAddress: !!route.targetAddress,
    hasDepositAddress: !!route.depositAddress,
    routeKeys: Object.keys(route)
  });
  
  // Enhanced deposit address extraction with more comprehensive fallbacks
  const depositAddress = (
    // Transaction level fields (most common)
    route.transaction?.from ||
    route.transaction?.depositAddress ||
    route.transaction?.to ||
    route.transaction?.inboundAddress ||
    
    // Direct route fields
    route.inboundAddress ||
    route.targetAddress ||
    route.depositAddress ||
    route.vault ||
    route.router ||
    route.poolAddress ||
    route.address ||
    
    // Provider-specific nested fields - ChainFlip
    route.meta?.chainflip?.depositAddress ||
    route.meta?.chainflip?.inboundAddress ||
    route.meta?.chainflip?.poolAddress ||
    route.meta?.chainflip?.vaultAddress ||
    
    // Provider-specific nested fields - MayaChain
    route.meta?.mayachain?.inboundAddress ||
    route.meta?.mayachain?.depositAddress ||
    route.meta?.mayachain?.poolAddress ||
    route.meta?.mayachain?.vaultAddress ||
    
    // Provider-specific nested fields - THORChain
    route.meta?.thorchain?.inboundAddress ||
    route.meta?.thorchain?.depositAddress ||
    route.meta?.thorchain?.poolAddress ||
    route.meta?.thorchain?.vaultAddress ||
    
    // Generic meta fields
    route.meta?.depositAddress ||
    route.meta?.inboundAddress ||
    route.meta?.address ||
    route.meta?.poolAddress ||
    
    // Swap/execution specific fields
    route.swap?.depositAddress ||
    route.swap?.inboundAddress ||
    route.swap?.targetAddress ||
    route.swap?.address ||
    
    // Steps/legs arrays for multi-step swaps
    route.steps?.[0]?.depositAddress ||
    route.steps?.[0]?.inboundAddress ||
    route.steps?.[0]?.targetAddress ||
    route.steps?.[0]?.address ||
    route.legs?.[0]?.depositAddress ||
    route.legs?.[0]?.inboundAddress ||
    route.legs?.[0]?.targetAddress ||
    route.legs?.[0]?.address ||
    
    // Alternative nested structures
    route.quote?.depositAddress ||
    route.quote?.inboundAddress ||
    route.quote?.address ||
    route.route?.depositAddress ||
    route.route?.inboundAddress ||
    route.route?.address ||
    route.path?.[0]?.depositAddress ||
    route.path?.[0]?.inboundAddress ||
    route.path?.[0]?.address ||
    
    // Additional fallbacks for new API formats
    route.calldata?.target ||
    route.calldata?.to ||
    route.txData?.to ||
    route.txData?.target ||
    route.contract?.address ||
    route.pool?.address ||
    
    ''
  );

  console.log('✅ Extracted deposit address:', {
    address: depositAddress,
    length: depositAddress?.length || 0,
    source: depositAddress ? 'found' : 'not found',
    preview: depositAddress ? `${depositAddress.slice(0, 10)}...${depositAddress.slice(-6)}` : 'N/A'
  });
  
  return depositAddress;
};

export const getMemo = (route: any, recipient: string) => {
  console.log('🔍 Extracting memo from route structure:', {
    hasTransaction: !!route.transaction,
    hasMeta: !!route.meta,
    directMemo: !!route.memo,
    provider: route.providers?.[0] || route.provider || 'unknown',
    routeKeys: Object.keys(route)
  });
  
  // Extract memo from multiple possible locations with enhanced fallbacks
  let memo = (
    // Transaction level memo (most reliable)
    route.transaction?.memo ||
    route.transaction?.data ||
    route.transaction?.calldata ||
    
    // Direct memo field
    route.memo ||
    route.data ||
    
    // Provider-specific memo locations - ChainFlip
    route.meta?.chainflip?.memo ||
    route.meta?.chainflip?.tag ||
    route.meta?.chainflip?.data ||
    route.meta?.chainflip?.calldata ||
    
    // Provider-specific memo locations - MayaChain
    route.meta?.mayachain?.memo ||
    route.meta?.mayachain?.tag ||
    route.meta?.mayachain?.data ||
    
    // Provider-specific memo locations - THORChain
    route.meta?.thorchain?.memo ||
    route.meta?.thorchain?.tag ||
    route.meta?.thorchain?.data ||
    
    // Generic meta memo
    route.meta?.memo ||
    route.meta?.tag ||
    route.meta?.data ||
    route.meta?.calldata ||
    
    // Alternative memo locations
    route.swap?.memo ||
    route.swap?.data ||
    route.steps?.[0]?.memo ||
    route.steps?.[0]?.data ||
    route.legs?.[0]?.memo ||
    route.legs?.[0]?.data ||
    route.quote?.memo ||
    route.quote?.data ||
    route.route?.memo ||
    route.route?.data ||
    
    // Tag variations (especially for ChainFlip)
    route.tag ||
    route.calldata ||
    route.txData?.data ||
    route.txData?.input ||
    
    ''
  );
  
  // Process memo to replace placeholders with actual recipient address
  if (memo && typeof memo === 'string') {
    const originalMemo = memo;
    memo = memo
      .replace(/\{destinationAddress\}/g, recipient)
      .replace(/\{recipientAddress\}/g, recipient)
      .replace(/\{recipient\}/g, recipient)
      .replace(/\{destination\}/g, recipient)
      .replace(/\{address\}/g, recipient)
      .replace(/\{to\}/g, recipient)
      .replace(/\{target\}/g, recipient)
      .replace(/\{output\}/g, recipient);
      
    if (originalMemo !== memo) {
      console.log('📝 Processed memo placeholders:', {
        original: originalMemo,
        processed: memo
      });
    }
  }
  
  console.log('✅ Extracted memo result:', {
    memo: memo,
    length: memo?.length || 0,
    hasContent: !!memo,
    preview: memo ? memo.slice(0, 50) + (memo.length > 50 ? '...' : '') : 'N/A'
  });
  
  return memo;
};

export const getProviderName = (route: any) => {
  console.log('🔍 Extracting provider name from route:', {
    providers: route.providers,
    provider: route.provider,
    metaProvider: route.meta?.provider,
    protocol: route.protocol,
    routeKeys: Object.keys(route)
  });
  
  // Check multiple possible locations for provider name with enhanced detection
  const rawProvider = (
    route.providers?.[0] || 
    route.provider || 
    route.meta?.provider || 
    route.protocol ||
    route.dex ||
    route.exchange ||
    route.bridge ||
    route.legs?.[0]?.provider ||
    route.steps?.[0]?.provider ||
    route.source ||
    route.platform ||
    route.name ||
    route.type
  );
  
  // Enhanced provider name normalization with better detection
  if (typeof rawProvider === 'string') {
    const upperProvider = rawProvider.toUpperCase();
    
    // MayaChain variations (include all possible names)
    if (upperProvider.includes('MAYA') || 
        upperProvider.includes('CACAO') || 
        upperProvider === 'MAYA' ||
        upperProvider.includes('MAYAPROTOCOL') ||
        upperProvider.includes('MAYA_CHAIN') ||
        upperProvider.includes('MAYACHAIN')) {
      console.log('✅ Identified as MAYACHAIN');
      return 'MAYACHAIN';
    }
    
    // THORChain variations (include all possible names)
    if (upperProvider.includes('THOR') || 
        upperProvider.includes('RUNE') || 
        upperProvider === 'THOR' ||
        upperProvider.includes('THORSWAP') ||
        upperProvider.includes('THOR_CHAIN') ||
        upperProvider.includes('THORCHAIN')) {
      console.log('✅ Identified as THORCHAIN');
      return 'THORCHAIN';
    }
    
    // ChainFlip variations (include all possible names)
    if (upperProvider.includes('CHAINFLIP') || 
        upperProvider.includes('FLIP') || 
        upperProvider === 'CHAINFLIP' ||
        upperProvider.includes('CHAIN_FLIP') ||
        upperProvider.includes('CF') ||
        upperProvider.includes('CHAINFLIP_DEX')) {
      console.log('✅ Identified as CHAINFLIP');
      return 'CHAINFLIP';
    }
    
    console.log('✅ Using normalized provider name:', upperProvider);
    return upperProvider;
  }
  
  // Handle object-type provider data with enhanced extraction
  if (typeof rawProvider === 'object' && rawProvider !== null) {
    const providerName = (
      rawProvider.name || 
      rawProvider.protocol || 
      rawProvider.type || 
      rawProvider.provider ||
      rawProvider.platform ||
      rawProvider.exchange ||
      rawProvider.dex
    );
    
    if (providerName && typeof providerName === 'string') {
      const upperName = providerName.toUpperCase();
      if (upperName.includes('MAYA')) return 'MAYACHAIN';
      if (upperName.includes('THOR')) return 'THORCHAIN';
      if (upperName.includes('CHAINFLIP') || upperName.includes('FLIP')) return 'CHAINFLIP';
      return upperName;
    }
  }
  
  console.warn('⚠️ Could not determine provider, defaulting to Unknown');
  return 'Unknown';
};

export const formatEstimatedTime = (estimatedTime: any): string => {
  if (typeof estimatedTime === 'object' && estimatedTime !== null) {
    // Handle detailed time breakdown
    if (estimatedTime.total) {
      return `${Math.round(estimatedTime.total / 60)} min`;
    } else {
      // Sum individual components
      const total = (estimatedTime.inbound || 0) + (estimatedTime.swap || 0) + (estimatedTime.outbound || 0);
      return total > 0 ? `${Math.round(total / 60)} min` : '5-10 min';
    }
  } else if (typeof estimatedTime === 'number') {
    // Handle direct number (assume seconds)
    return `${Math.round(estimatedTime / 60)} min`;
  } else if (typeof estimatedTime === 'string') {
    // Return as-is if already formatted
    return estimatedTime;
  } else {
    // Default fallback
    return '5-10 min';
  }
};

export const calculateTotalFees = (fees: any[]): number => {
  if (!fees || !Array.isArray(fees)) {
    console.log('📊 No fees array provided');
    return 0;
  }
  
  const total = fees.reduce((sum: number, fee: any) => {
    const feeAmount = parseFloat(fee.amount || fee.value || fee.fee || '0');
    if (!isNaN(feeAmount)) {
      console.log(`📊 Adding fee: ${feeAmount} ${fee.asset || fee.token || fee.currency || 'unknown'}`);
      return sum + feeAmount;
    }
    return sum;
  }, 0);
  
  console.log(`📊 Total calculated fees: ${total}`);
  return total;
};
