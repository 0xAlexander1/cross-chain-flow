
import { useState, useEffect } from 'react';
import { useSwapKitClient } from './useSwapKitClient';
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
  const { ready, getSupportedAssets: getSwapKitAssets } = useSwapKitClient();
  const { getSupportedAssets: getBackendAssets } = useSwapKit();

  useEffect(() => {
    fetchAssets();
  }, [ready]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching assets...');
      
      // Try backend first (Supabase functions)
      try {
        console.log('Trying backend assets...');
        const backendAssets = await getBackendAssets();
        
        if (backendAssets && Array.isArray(backendAssets) && backendAssets.length > 0) {
          setAssets(backendAssets);
          console.log(`Loaded ${backendAssets.length} tokens from backend`);
          return;
        }
      } catch (backendError) {
        console.warn('Backend assets failed, trying SwapKit client:', backendError);
      }
      
      // Try SwapKit client if ready
      if (ready) {
        try {
          console.log('Trying SwapKit client assets...');
          const swapKitAssets = await getSwapKitAssets();
          
          if (swapKitAssets && Array.isArray(swapKitAssets) && swapKitAssets.length > 0) {
            setAssets(swapKitAssets);
            console.log(`Loaded ${swapKitAssets.length} tokens from SwapKit client`);
            return;
          }
        } catch (swapKitError) {
          console.warn('SwapKit client assets failed:', swapKitError);
        }
      }
      
      // Fallback to mock data
      console.log('Using fallback mock data');
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
          chain: 'ETH', 
          chainId: '1',
          ticker: 'USDT',
          identifier: 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
          symbol: 'USDT', 
          name: 'Tether USD', 
          decimals: 6,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/eth.usdt-0xdac17f958d2ee523a2206206994597c13d831ec7.png',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
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
        },
        { 
          chain: 'BSC', 
          chainId: '56',
          ticker: 'BNB',
          identifier: 'BSC.BNB',
          symbol: 'BNB', 
          name: 'BNB Chain', 
          decimals: 18,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/bsc.bnb.png',
          coingeckoId: 'binancecoin'
        }
      ];
      
      setAssets(mockAssets);
      setError('Using fallback data - backend and SwapKit client unavailable');
      
    } catch (err) {
      console.error('Error fetching swap assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAssets = () => {
    fetchAssets();
  };

  return { assets, loading, error, refreshAssets };
};
