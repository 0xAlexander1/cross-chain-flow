
import { useState, useEffect } from 'react';
import { useSwapKit } from './useSwapKit';

interface Asset {
  symbol: string;
  chain: string;
  decimals: number;
  name: string;
  logoURI?: string;
  identifier: string;
  ticker: string;
  coingeckoId?: string;
  address?: string;
  supportedProviders: string[];
  preferredProvider: string;
}

// Fallback mock data - only used if backend fails
const mockAssets: Asset[] = [
  {
    symbol: 'BTC',
    chain: 'BTC',
    decimals: 8,
    name: 'Bitcoin',
    logoURI: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    identifier: 'BTC.BTC',
    ticker: 'BTC',
    supportedProviders: ['THORCHAIN', 'MAYACHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'ETH',
    chain: 'ETH',
    decimals: 18,
    name: 'Ethereum',
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    identifier: 'ETH.ETH',
    ticker: 'ETH',
    supportedProviders: ['THORCHAIN', 'CHAINFLIP'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'USDC',
    chain: 'ETH',
    decimals: 6,
    name: 'USD Coin',
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    identifier: 'ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ticker: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    supportedProviders: ['THORCHAIN', 'CHAINFLIP'],
    preferredProvider: 'CHAINFLIP'
  },
  {
    symbol: 'AVAX',
    chain: 'AVAX',
    decimals: 18,
    name: 'Avalanche',
    identifier: 'AVAX.AVAX',
    ticker: 'AVAX',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'DOGE',
    chain: 'DOGE',
    decimals: 8,
    name: 'Dogecoin',
    identifier: 'DOGE.DOGE',
    ticker: 'DOGE',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'LTC',
    chain: 'LTC',
    decimals: 8,
    name: 'Litecoin',
    identifier: 'LTC.LTC',
    ticker: 'LTC',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'BCH',
    chain: 'BCH',
    decimals: 8,
    name: 'Bitcoin Cash',
    identifier: 'BCH.BCH',
    ticker: 'BCH',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'BNB',
    chain: 'BSC',
    decimals: 18,
    name: 'BNB',
    identifier: 'BSC.BNB',
    ticker: 'BNB',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'ATOM',
    chain: 'GAIA',
    decimals: 6,
    name: 'Cosmos',
    identifier: 'GAIA.ATOM',
    ticker: 'ATOM',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'RUNE',
    chain: 'THOR',
    decimals: 8,
    name: 'THORChain',
    identifier: 'THOR.RUNE',
    ticker: 'RUNE',
    supportedProviders: ['THORCHAIN'],
    preferredProvider: 'THORCHAIN'
  },
  {
    symbol: 'CACAO',
    chain: 'MAYA',
    decimals: 10,
    name: 'Maya Protocol',
    identifier: 'MAYA.CACAO',
    ticker: 'CACAO',
    supportedProviders: ['MAYACHAIN'],
    preferredProvider: 'MAYACHAIN'
  },
  {
    symbol: 'FLIP',
    chain: 'ETH',
    decimals: 18,
    name: 'Chainflip',
    identifier: 'ETH.FLIP',
    ticker: 'FLIP',
    supportedProviders: ['CHAINFLIP'],
    preferredProvider: 'CHAINFLIP'
  }
];

export const useSwapAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const { getSupportedAssets } = useSwapKit();

  useEffect(() => {
    let cancelled = false;

    const fetchAssets = async () => {
      if (cancelled) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getSupportedAssets();
        
        if (cancelled) return;
        
        // Handle different response formats
        let assetsData = null;
        
        if (response && typeof response === 'object') {
          // If response has assets property
          if (response.assets && Array.isArray(response.assets)) {
            assetsData = response.assets;
            setDebugInfo(response.debug || response.providerStats);
          }
          // If response is directly an array
          else if (Array.isArray(response)) {
            assetsData = response;
          }
          // If response has data property
          else if (response.data && Array.isArray(response.data)) {
            assetsData = response.data;
          }
        }
        
        if (assetsData && assetsData.length > 0) {
          setAssets(assetsData);
          setUsingFallback(false);
          setError(null);
        } else {
          console.warn('Backend returned empty or invalid assets, using fallback data');
          setAssets(mockAssets);
          setDebugInfo(response);
          setUsingFallback(true);
          setError('Backend returned no assets - using fallback data');
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Falling back to mock assets:', err instanceof Error ? err.message : 'Unknown error');
          setAssets(mockAssets);
          setUsingFallback(true);
          setError(err instanceof Error ? err.message : 'Failed to fetch assets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssets();

    return () => {
      cancelled = true;
    };
  }, []); // Empty dependency array - execute ONLY on mount

  const refetch = () => {
    // Force re-fetch by reloading the page (simple approach)
    window.location.reload();
  };

  return { 
    assets, 
    loading, 
    error, 
    debugInfo, 
    usingFallback,
    refetch
  };
};
