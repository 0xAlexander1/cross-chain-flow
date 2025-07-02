
export const getDepositAddress = (route: any) => {
  console.log('🔍 Extracting deposit address from route structure:', {
    hasTransaction: !!route.transaction,
    hasMeta: !!route.meta,
    hasInboundAddress: !!route.inboundAddress,
    hasTargetAddress: !!route.targetAddress,
    hasDepositAddress: !!route.depositAddress
  });
  
  // Try multiple possible locations for deposit address with comprehensive coverage
  const depositAddress = (
    // Transaction level fields (most common)
    route.transaction?.from ||
    route.transaction?.depositAddress ||
    route.transaction?.to ||
    
    // Direct route fields
    route.inboundAddress ||
    route.targetAddress ||
    route.depositAddress ||
    route.vault ||
    route.router ||
    
    // Provider-specific nested fields
    route.meta?.chainflip?.depositAddress ||
    route.meta?.chainflip?.inboundAddress ||
    route.meta?.mayachain?.inboundAddress ||
    route.meta?.mayachain?.depositAddress ||
    route.meta?.thorchain?.inboundAddress ||
    route.meta?.thorchain?.depositAddress ||
    route.meta?.depositAddress ||
    route.meta?.inboundAddress ||
    
    // Swap/execution specific fields
    route.swap?.depositAddress ||
    route.swap?.inboundAddress ||
    route.swap?.targetAddress ||
    
    // Steps/legs arrays for multi-step swaps
    route.steps?.[0]?.depositAddress ||
    route.steps?.[0]?.inboundAddress ||
    route.steps?.[0]?.targetAddress ||
    route.legs?.[0]?.depositAddress ||
    route.legs?.[0]?.inboundAddress ||
    route.legs?.[0]?.targetAddress ||
    
    // Alternative nested structures
    route.quote?.depositAddress ||
    route.route?.depositAddress ||
    route.path?.[0]?.depositAddress ||
    
    ''
  );

  console.log('✅ Extracted deposit address:', {
    address: depositAddress,
    length: depositAddress?.length || 0,
    source: depositAddress ? 'found' : 'not found'
  });
  
  return depositAddress;
};

export const getMemo = (route: any, recipient: string) => {
  console.log('🔍 Extracting memo from route structure:', {
    hasTransaction: !!route.transaction,
    hasMeta: !!route.meta,
    directMemo: !!route.memo,
    provider: route.providers?.[0] || route.provider || 'unknown'
  });
  
  // Extract memo from multiple possible locations
  let memo = (
    // Transaction level memo (most reliable)
    route.transaction?.memo ||
    route.transaction?.data ||
    
    // Direct memo field
    route.memo ||
    
    // Provider-specific memo locations
    route.meta?.memo ||
    route.meta?.mayachain?.memo ||
    route.meta?.thorchain?.memo ||
    route.meta?.chainflip?.memo ||
    route.meta?.chainflip?.tag ||
    
    // Alternative memo locations
    route.swap?.memo ||
    route.steps?.[0]?.memo ||
    route.legs?.[0]?.memo ||
    route.quote?.memo ||
    route.route?.memo ||
    
    // Tag variations (especially for ChainFlip)
    route.tag ||
    route.meta?.tag ||
    route.transaction?.tag ||
    
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
      .replace(/\{to\}/g, recipient);
      
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
    hasContent: !!memo
  });
  
  return memo;
};

export const getProviderName = (route: any) => {
  console.log('🔍 Extracting provider name from route:', {
    providers: route.providers,
    provider: route.provider,
    metaProvider: route.meta?.provider,
    protocol: route.protocol
  });
  
  // Check multiple possible locations for provider name
  const rawProvider = (
    route.providers?.[0] || 
    route.provider || 
    route.meta?.provider || 
    route.protocol ||
    route.legs?.[0]?.provider ||
    route.steps?.[0]?.provider ||
    route.source ||
    route.dex
  );
  
  // Comprehensive provider name normalization
  if (typeof rawProvider === 'string') {
    const upperProvider = rawProvider.toUpperCase();
    
    // MayaChain variations (include CACAO token references)
    if (upperProvider.includes('MAYA') || 
        upperProvider.includes('CACAO') || 
        upperProvider === 'MAYA' ||
        upperProvider.includes('MAYAPROTOCOL')) {
      console.log('✅ Identified as MAYACHAIN');
      return 'MAYACHAIN';
    }
    
    // THORChain variations (include RUNE token references)
    if (upperProvider.includes('THOR') || 
        upperProvider.includes('RUNE') || 
        upperProvider === 'THOR' ||
        upperProvider.includes('THORSWAP')) {
      console.log('✅ Identified as THORCHAIN');
      return 'THORCHAIN';
    }
    
    // ChainFlip variations (include FLIP token references)
    if (upperProvider.includes('CHAINFLIP') || 
        upperProvider.includes('FLIP') || 
        upperProvider === 'CHAINFLIP' ||
        upperProvider.includes('CHAIN_FLIP')) {
      console.log('✅ Identified as CHAINFLIP');
      return 'CHAINFLIP';
    }
    
    console.log('✅ Using normalized provider name:', upperProvider);
    return upperProvider;
  }
  
  // Handle object-type provider data
  if (typeof rawProvider === 'object' && rawProvider !== null) {
    const providerName = rawProvider.name || rawProvider.protocol || rawProvider.type || rawProvider.provider;
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
    const feeAmount = parseFloat(fee.amount || fee.value || '0');
    if (!isNaN(feeAmount)) {
      console.log(`📊 Adding fee: ${feeAmount} ${fee.asset || fee.token || 'unknown'}`);
      return sum + feeAmount;
    }
    return sum;
  }, 0);
  
  console.log(`📊 Total calculated fees: ${total}`);
  return total;
};
