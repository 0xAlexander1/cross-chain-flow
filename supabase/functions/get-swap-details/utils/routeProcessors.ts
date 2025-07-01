
export const getDepositAddress = (route: any) => {
  // Try multiple possible locations for deposit address
  return (
    route.transaction?.from ||
    route.transaction?.depositAddress ||
    route.inboundAddress ||
    route.targetAddress ||
    route.depositAddress ||
    route.meta?.chainflip?.depositAddress ||
    route.meta?.mayachain?.depositAddress ||
    route.meta?.mayachain?.inboundAddress ||
    route.meta?.thorchain?.inboundAddress ||
    ''
  );
};

export const getMemo = (route: any, recipient: string) => {
  let memo = route.transaction?.memo || route.memo || route.meta?.memo || route.meta?.mayachain?.memo || route.meta?.thorchain?.memo || '';
  
  // Replace placeholders with actual recipient address
  if (memo.includes('{destinationAddress}')) {
    memo = memo.replace('{destinationAddress}', recipient);
  }
  if (memo.includes('{recipientAddress}')) {
    memo = memo.replace('{recipientAddress}', recipient);
  }
  
  return memo;
};

export const getProviderName = (route: any) => {
  // Check multiple possible locations for provider name
  const provider = route.providers?.[0] || route.provider || route.meta?.provider || route.legs?.[0]?.provider;
  
  // Normalize provider names more aggressively
  if (typeof provider === 'string') {
    const upperProvider = provider.toUpperCase();
    if (upperProvider.includes('MAYA') || upperProvider.includes('CACAO')) return 'MAYACHAIN';
    if (upperProvider.includes('THOR') || upperProvider.includes('RUNE')) return 'THORCHAIN';
    if (upperProvider.includes('CHAINFLIP') || upperProvider.includes('FLIP')) return 'CHAINFLIP';
    return upperProvider;
  }
  
  // If provider is an object, try to extract the name
  if (typeof provider === 'object' && provider !== null) {
    const name = provider.name || provider.protocol || provider.type;
    if (name && typeof name === 'string') {
      const upperName = name.toUpperCase();
      if (upperName.includes('MAYA')) return 'MAYACHAIN';
      if (upperName.includes('THOR')) return 'THORCHAIN';
      if (upperName.includes('CHAINFLIP')) return 'CHAINFLIP';
      return upperName;
    }
  }
  
  console.warn('⚠️ Could not determine provider for route:', { provider, route: JSON.stringify(route, null, 2) });
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
