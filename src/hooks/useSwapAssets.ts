
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
  logoURI?: string;
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
          // Transform backend assets to match our interface
          const transformedAssets = backendAssets.map((asset: any) => ({
            chain: asset.chain || 'Unknown',
            chainId: asset.chainId || asset.chain,
            ticker: asset.symbol || asset.ticker,
            identifier: asset.identifier || asset.symbol || `${asset.chain}.${asset.symbol}`,
            symbol: asset.symbol || asset.ticker,
            name: asset.name || asset.symbol,
            decimals: asset.decimals || 18,
            logoURI: asset.logoURI,
            coingeckoId: asset.coingeckoId,
            address: asset.address
          }));
          
          setAssets(transformedAssets);
          console.log(`Loaded ${transformedAssets.length} tokens from backend`);
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
      
      // Enhanced fallback with comprehensive and correct token list
      console.log('Using enhanced fallback mock data');
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
          chain: 'ETH', 
          chainId: '1',
          ticker: 'USDC',
          identifier: 'ETH.USDC-0XA0B86A33E6441E6C8D089D6C22013C4B8D6F4F6A',
          symbol: 'USDC', 
          name: 'USD Coin', 
          decimals: 6,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/eth.usdc-0xa0b86a33e6441e6c8d089d6c22013c4b8d6f4f6a.png',
          address: '0xA0b86a33E6441E6C8D089D6C22013C4B8D6F4F6A'
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
        },
        { 
          chain: 'DOGE', 
          chainId: 'dogecoin',
          ticker: 'DOGE',
          identifier: 'DOGE.DOGE',
          symbol: 'DOGE', 
          name: 'Dogecoin', 
          decimals: 8,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/doge.doge.png',
          coingeckoId: 'dogecoin'
        },
        { 
          chain: 'LTC', 
          chainId: 'litecoin',
          ticker: 'LTC',
          identifier: 'LTC.LTC',
          symbol: 'LTC', 
          name: 'Litecoin', 
          decimals: 8,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/ltc.ltc.png',
          coingeckoId: 'litecoin'
        },
        { 
          chain: 'SOL', 
          chainId: 'solana',
          ticker: 'SOL',
          identifier: 'SOL.SOL',
          symbol: 'SOL', 
          name: 'Solana', 
          decimals: 9,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/sol.sol.png',
          coingeckoId: 'solana'
        },
        { 
          chain: 'THOR', 
          chainId: 'thorchain',
          ticker: 'RUNE',
          identifier: 'THOR.RUNE',
          symbol: 'RUNE', 
          name: 'THORChain', 
          decimals: 8,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/thor.rune.png',
          coingeckoId: 'thorchain'
        },
        { 
          chain: 'MAYA', 
          chainId: 'mayachain',
          ticker: 'CACAO',
          identifier: 'MAYA.CACAO',
          symbol: 'CACAO', 
          name: 'Cacao', 
          decimals: 10,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/maya.cacao.png',
          coingeckoId: 'cacao'
        },
        { 
          chain: 'ATOM', 
          chainId: 'cosmoshub-4',
          ticker: 'ATOM',
          identifier: 'GAIA.ATOM',
          symbol: 'ATOM', 
          name: 'Cosmos Hub', 
          decimals: 6,
          logoURI: 'https://storage.googleapis.com/token-list-swapkit/images/gaia.atom.png',
          coingeckoId: 'cosmos'
        }
      ];
      
      setAssets(mockAssets);
      setError('Usando datos de prueba - backend y SwapKit client no disponibles');
      
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
