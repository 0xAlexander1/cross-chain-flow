
// Provider-specific validation and processing utilities

export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredFields: string[];
}

export const validateThorChainRoute = (route: any): ProviderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFields: string[] = ['depositAddress', 'memo'];

  // THORChain specific validations
  if (!route.depositAddress || route.depositAddress.length < 20) {
    errors.push('THORChain requires valid inbound address');
  }

  if (!route.memo || route.memo.length < 10) {
    errors.push('THORChain requires memo for cross-chain swaps');
  }

  // Check for THORChain specific patterns
  if (route.memo && !route.memo.includes(':')) {
    warnings.push('THORChain memo should contain destination chain and address');
  }

  // Validate expected output
  if (!route.expectedOutput || parseFloat(route.expectedOutput) <= 0) {
    errors.push('Invalid expected output amount');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredFields
  };
};

export const validateMayaChainRoute = (route: any): ProviderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFields: string[] = ['depositAddress', 'memo'];

  // MayaChain specific validations
  if (!route.depositAddress || route.depositAddress.length < 20) {
    errors.push('MayaChain requires valid inbound address');
  }

  if (!route.memo || route.memo.length < 10) {
    errors.push('MayaChain requires memo for cross-chain swaps');
  }

  // Check for MayaChain specific patterns (similar to THORChain but with CACAO)
  if (route.memo && !route.memo.includes(':')) {
    warnings.push('MayaChain memo should contain destination chain and address');
  }

  // Validate CACAO-specific rules
  if (route.fees && route.fees.some((fee: any) => fee.asset?.includes('CACAO'))) {
    // Additional CACAO validation if needed
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredFields
  };
};

export const validateChainFlipRoute = (route: any): ProviderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFields: string[] = ['depositAddress'];

  // ChainFlip specific validations
  if (!route.depositAddress || route.depositAddress.length < 20) {
    errors.push('ChainFlip requires valid deposit address');
  }

  // ChainFlip may or may not require memo depending on the swap
  if (!route.memo) {
    warnings.push('ChainFlip route has no memo - this may be normal for native swaps');
  }

  // ChainFlip specific checks
  if (route.meta?.chainflip) {
    const chainflipMeta = route.meta.chainflip;
    
    if (chainflipMeta.brokerCommission && parseFloat(chainflipMeta.brokerCommission) > 0.05) {
      warnings.push('High broker commission detected');
    }

    if (chainflipMeta.depositChannel && !chainflipMeta.depositChannel.includes('0x')) {
      warnings.push('Unexpected deposit channel format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredFields
  };
};

export const validateProviderRoute = (provider: string, route: any): ProviderValidationResult => {
  switch (provider.toUpperCase()) {
    case 'THORCHAIN':
      return validateThorChainRoute(route);
    case 'MAYACHAIN':
      return validateMayaChainRoute(route);
    case 'CHAINFLIP':
      return validateChainFlipRoute(route);
    default:
      return {
        isValid: false,
        errors: [`Unknown provider: ${provider}`],
        warnings: [],
        requiredFields: []
      };
  }
};

// Network-specific address validators
export const validateNetworkAddress = (address: string, network: string): boolean => {
  const validators = {
    BTC: (addr: string) => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(addr),
    ETH: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
    THOR: (addr: string) => /^thor[a-z0-9]{39}$/.test(addr),
    MAYA: (addr: string) => /^maya[a-z0-9]{39}$/.test(addr),
    ATOM: (addr: string) => /^cosmos[a-z0-9]{39}$/.test(addr),
    DOGE: (addr: string) => /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(addr)
  };

  const validator = validators[network as keyof typeof validators];
  return validator ? validator(address) : true; // Default to true for unknown networks
};

export const getProviderSpecificWarnings = (provider: string, fromAsset: string, toAsset: string): string[] => {
  const warnings: string[] = [];

  switch (provider.toUpperCase()) {
    case 'THORCHAIN':
      if (fromAsset.includes('BTC') && toAsset.includes('ETH')) {
        warnings.push('BTC to ETH swaps on THORChain typically take 10-20 minutes');
      }
      break;
    
    case 'MAYACHAIN':
      warnings.push('MayaChain is a fork of THORChain - ensure you understand the differences');
      if (fromAsset.includes('BTC')) {
        warnings.push('Bitcoin swaps on MayaChain may have different fee structures');
      }
      break;
    
    case 'CHAINFLIP':
      warnings.push('ChainFlip uses native assets without wrapped tokens');
      if (fromAsset.includes('BTC') || toAsset.includes('BTC')) {
        warnings.push('ChainFlip Bitcoin integration is newer - monitor for any issues');
      }
      break;
  }

  return warnings;
};
