
// Address validation functions for different blockchain networks
export const validateAddress = (address: string, chain: string): boolean => {
  if (!address || address.length < 10) return false;
  
  switch (chain.toUpperCase()) {
    case 'BTC':
      // Bitcoin addresses (Legacy P2PKH, P2SH, Bech32)
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    
    case 'ETH':
    case 'AVAX':
    case 'BSC':
      // Ethereum-style addresses (40 hex characters with 0x prefix)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'ATOM':
    case 'GAIA':
      // Cosmos addresses
      return /^cosmos[a-z0-9]{39}$/.test(address);
    
    case 'THOR':
      // THORChain addresses
      return /^thor[a-z0-9]{39}$/.test(address);
    
    case 'MAYA':
      // Maya addresses
      return /^maya[a-z0-9]{39}$/.test(address);
    
    case 'SOL':
      // Solana addresses (base58 encoded, 32-44 characters)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    
    case 'DOGE':
      // Dogecoin addresses
      return /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
    
    case 'LTC':
      // Litecoin addresses (Legacy and Bech32)
      return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/.test(address);
    
    default:
      // For unknown chains, allow anything that looks like an address
      return true;
  }
};

export const validateSwapInputs = (
  fromToken: string,
  toToken: string,
  amount: string,
  destinationAddress: string
): string | null => {
  // Check if amount is valid
  const numAmount = parseFloat(amount);
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return 'La cantidad debe ser un número mayor a 0';
  }

  // Check if tokens are different
  if (fromToken === toToken) {
    return 'Los tokens de origen y destino deben ser diferentes';
  }

  // Check destination address format
  const toChain = toToken.split('.')[0];
  if (!validateAddress(destinationAddress, toChain)) {
    return `El formato de la dirección no es válido para ${toChain}`;
  }

  return null; // No errors
};
