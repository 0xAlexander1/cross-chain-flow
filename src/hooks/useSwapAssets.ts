
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

// Fallback mock data - solo se usa si el backend falla
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
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching supported assets from Supabase...');
        const response = await getSupportedAssets();
        
        console.log('Supabase response:', response);
        
        if (response && response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
          console.log(`Successfully loaded ${response.assets.length} assets from backend`);
          setAssets(response.assets);
          setDebugInfo(response.debug || response.providerStats);
          setUsingFallback(false);
        } else {
          console.warn('Backend returned empty or invalid assets, using fallback data');
          console.log('Backend response debug:', response);
          setAssets(mockAssets);
          setDebugInfo(response);
          setUsingFallback(true);
          setError('Backend returned no assets - using fallback data');
        }
      } catch (err) {
        console.error('Error fetching assets from backend:', err);
        console.log('Using fallback mock data due to error');
        setAssets(mockAssets);
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [getSupportedAssets]);

  return { 
    assets, 
    loading, 
    error, 
    debugInfo, 
    usingFallback,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect
      window.location.reload();
    }
  };
};
