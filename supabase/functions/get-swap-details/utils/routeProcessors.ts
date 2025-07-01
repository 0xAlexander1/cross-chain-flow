
export const getDepositAddress = (route: any) => {
  console.log('🔍 Extracting deposit address from route:', JSON.stringify(route, null, 2));
  
  // Try multiple possible locations for deposit address in order of priority
  const depositAddress = (
    // ChainFlip specific fields
    route.meta?.chainflip?.depositAddress ||
    route.meta?.depositAddress ||
    
    // MayaChain specific fields
    route.meta?.mayachain?.inboundAddress ||
    route.meta?.mayachain?.depositAddress ||
    
    // THORChain specific fields
    route.meta?.thorchain?.inboundAddress ||
    route.meta?.thorchain?.depositAddress ||
    
    // Generic fields
    route.transaction?.from ||
    route.transaction?.depositAddress ||
    route.inboundAddress ||
    route.targetAddress ||
    route.depositAddress ||
    route.vault ||
    route.router ||
    
    // Nested in transaction or swap objects
    route.swap?.depositAddress ||
    route.swap?.inboundAddress ||
    
    // Check if it's in steps array
    route.steps?.[0]?.depositAddress ||
    route.steps?.[0]?.inboundAddress ||
    
    // Check legs array for multi-step swaps
    route.legs?.[0]?.depositAddress ||
    route.legs?.[0]?.inboundAddress ||
    
    ''
  );

  console.log('✅ Extracted deposit address:', depositAddress);
  return depositAddress;
};

export const getMemo = (route: any, recipient: string) => {
  console.log('🔍 Extracting memo from route for recipient:', recipient);
  console.log('🔍 Route memo data:', {
    transactionMemo: route.transaction?.memo,
    directMemo: route.memo,
    metaMemo: route.meta?.memo,
    mayachainMemo: route.meta?.mayachain?.memo,
    thorchainMemo: route.meta?.thorchain?.memo,
    chainflipMemo: route.meta?.chainflip?.memo
  });
  
  let memo = (
    route.transaction?.memo ||
    route.memo ||
    route.meta?.memo ||
    route.meta?.mayachain?.memo ||
    route.meta?.thorchain?.memo ||
    route.meta?.chainflip?.memo ||
    route.swap?.memo ||
    route.steps?.[0]?.memo ||
    route.legs?.[0]?.memo ||
    ''
  );
  
  // Replace common placeholder patterns with actual recipient address
  if (memo && typeof memo === 'string') {
    memo = memo
      .replace(/\{destinationAddress\}/g, recipient)
      .replace(/\{recipientAddress\}/g, recipient)
      .replace(/\{recipient\}/g, recipient)
      .replace(/\{destination\}/g, recipient)
      .replace(/\{address\}/g, recipient);
  }
  
  console.log('✅ Extracted and processed memo:', memo);
  return memo;
};

export const getProviderName = (route: any) => {
  console.log('🔍 Extracting provider from route:', {
    providers: route.providers,
    provider: route.provider,
    metaProvider: route.meta?.provider,
    protocol: route.protocol,
    legs: route.legs?.[0]?.provider
  });
  
  // Check multiple possible locations for provider name
  const rawProvider = (
    route.providers?.[0] || 
    route.provider || 
    route.meta?.provider || 
    route.protocol ||
    route.legs?.[0]?.provider ||
    route.steps?.[0]?.provider
  );
  
  // Normalize provider names more aggressively
  if (typeof rawProvider === 'string') {
    const upperProvider = rawProvider.toUpperCase();
    
    // MayaChain variations
    if (upperProvider.includes('MAYA') || upperProvider.includes('CACAO') || upperProvider === 'MAYA') {
      console.log('✅ Identified as MAYACHAIN');
      return 'MAYACHAIN';
    }
    
    // THORChain variations
    if (upperProvider.includes('THOR') || upperProvider.includes('RUNE') || upperProvider === 'THOR') {
      console.log('✅ Identified as THORCHAIN');
      return 'THORCHAIN';
    }
    
    // ChainFlip variations
    if (upperProvider.includes('CHAINFLIP') || upperProvider.includes('FLIP') || upperProvider === 'CHAINFLIP') {
      console.log('✅ Identified as CHAINFLIP');
      return 'CHAINFLIP';
    }
    
    console.log('✅ Normalized provider name:', upperProvider);
    return upperProvider;
  }
  
  // If provider is an object, try to extract the name
  if (typeof rawProvider === 'object' && rawProvider !== null) {
    const name = rawProvider.name || rawProvider.protocol || rawProvider.type || rawProvider.provider;
    if (name && typeof name === 'string') {
      const upperName = name.toUpperCase();
      if (upperName.includes('MAYA')) return 'MAYACHAIN';
      if (upperName.includes('THOR')) return 'THORCHAIN';
      if (upperName.includes('CHAINFLIP')) return 'CHAINFLIP';
      return upperName;
    }
  }
  
  console.warn('⚠️ Could not determine provider for route:', { rawProvider, route: JSON.stringify(route, null, 2) });
  return 'Unknown';
};

export const formatEstimatedTime = (estimatedTime: any): string => {
  if (typeof estimatedTime === 'object' && estimatedTime !== null) {
    if (estimatedTime.total) {
      return `${Math.round(estimatedTime.total / 60)} min`;
    } else {
      const total = (estimatedTime.inbound || 0) + (estimatedTime.swap || 0) + (estimatedTime.outbound || 0);
      return total > 0 ? `${Math.round(total / 60)} min` : '5-10 min';
    }
  } else if (typeof estimatedTime === 'number') {
    return `${Math.round(estimatedTime / 60)} min`;
  } else if (typeof estimatedTime === 'string') {
    return estimatedTime;
  } else {
    return '5-10 min';
  }
};

export const calculateTotalFees = (fees: any[]): number => {
  if (!fees || !Array.isArray(fees)) return 0;
  return fees.reduce((sum: number, fee: any) => {
    const feeAmount = parseFloat(fee.amount || '0');
    return sum + (isNaN(feeAmount) ? 0 : feeAmount);
  }, 0);
};
