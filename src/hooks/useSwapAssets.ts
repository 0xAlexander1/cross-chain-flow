
import { useState, useEffect } from 'react';

interface SwapAsset {
  chain: string;
  chainId: string;
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

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        
        // Fetch tokens from SwapKit API
        const response = await fetch('https://api.swapkit.dev/tokens?provider=CHAINFLIP', {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.tokens && Array.isArray(data.tokens)) {
          setAssets(data.tokens);
          console.log(`Loaded ${data.tokens.length} tokens from SwapKit API`);
        } else {
          throw new Error('Invalid response format from SwapKit API');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching swap assets:', err);
        
        // Fallback to mock data if API fails
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
        setError('Failed to load tokens from API, using fallback data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return { assets, loading, error };
};
