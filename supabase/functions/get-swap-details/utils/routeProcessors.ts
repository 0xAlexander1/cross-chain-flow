
export const getDepositAddress = (route: any) => {
  return (
    route.transaction?.from ||
    route.transaction?.depositAddress ||
    route.inboundAddress ||
    route.targetAddress ||
    route.depositAddress ||
    route.meta?.chainflip?.depositAddress ||
    route.meta?.mayachain?.depositAddress ||
    ''
  );
};

export const getMemo = (route: any, recipient: string) => {
  let memo = route.transaction?.memo || route.memo || route.meta?.memo || '';
  if (memo.includes('{destinationAddress}')) {
    memo = memo.replace('{destinationAddress}', recipient);
  }
  return memo;
};

export const getProviderName = (route: any) => {
  // Check multiple possible locations for provider name
  const provider = route.providers?.[0] || route.provider || route.meta?.provider;
  
  // Normalize provider names
  if (typeof provider === 'string') {
    const upperProvider = provider.toUpperCase();
    if (upperProvider.includes('MAYA')) return 'MAYACHAIN';
    if (upperProvider.includes('THOR')) return 'THORCHAIN';
    if (upperProvider.includes('CHAINFLIP') || upperProvider.includes('FLIP')) return 'CHAINFLIP';
    return provider;
  }
  
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
  if (!fees) return 0;
  return fees.reduce((sum: number, fee: any) => {
    const feeAmount = parseFloat(fee.amount || '0');
    return sum + (isNaN(feeAmount) ? 0 : feeAmount);
  }, 0);
};
