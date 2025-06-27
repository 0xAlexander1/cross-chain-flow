
import { useState, useEffect } from 'react';
import { useSwapKit } from './useSwapKit';

interface SwapAsset {
  chain: string;
  chainId?: string;
  ticker: string;
  identifier: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  coingeckoId?: string;
  address?: string;
}

export const useSwapAssets = () => {
  const [assets, setAssets] = useState<SwapAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSupportedAssets } = useSwapKit();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching assets from SwapKit backend...');
        const supportedAssets = await getSupportedAssets();
        
        if (supportedAssets && Array.isArray(supportedAssets)) {
          setAssets(supportedAssets);
          console.log(`Loaded ${supportedAssets.length} tokens from SwapKit backend`);
          setError(null);
        } else {
          throw new Error('Invalid response format from SwapKit backend');
        }
        
      } catch (err) {
        console.error('Error fetching swap assets from backend:', err);
        
        // Fallback to mock data if backend fails
        const mockAssets: SwapAsset[] = [
          { 
            chain: 'BTC', 
            chainId: 'bitcoin',
            ticker: 'BTC',
            identifier: 'BTC.BTC',
            symbol: 'BTC', 
            name: 'Bitcoin', 
            decimals: 8,
            logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/btc.btc.png',
            coingeckoId: 'bitcoin'
          },
          { 
            chain: 'ETH', 
            chainId: '1',
            ticker: 'ETH',
            identifier: 'ETH.ETH',
            symbol: 'ETH', 
            name: 'Ethereum', 
            decimals: 18,
            logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/eth.eth.png',
            coingeckoId: 'ethereum'
          },
          { 
            chain: 'AVAX', 
            chainId: '43114',
            ticker: 'AVAX',
            identifier: 'AVAX.AVAX',
            symbol: 'AVAX', 
            name: 'Avalanche', 
            decimals: 18,
            logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/avax.avax.png',
            coingeckoId: 'avalanche-2'
          }
        ];
        
        setAssets(mockAssets);
        setError('Failed to load tokens from backend, using fallback data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return { assets, loading, error };
};
