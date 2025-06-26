
import { useState, useEffect } from 'react';

interface SwapAsset {
  symbol: string;
  name: string;
  network: string;
  decimal?: number;
}

export const useSwapAssets = () => {
  const [assets, setAssets] = useState<SwapAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        
        // Por ahora usamos una lista mock mientras implementamos SwapKit completamente
        // TODO: Reemplazar con swapKit.getSupportedAssets() o swapKit.thorchain.getPools()
        const mockAssets: SwapAsset[] = [
          { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
          { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum' },
          { symbol: 'BNB', name: 'BNB', network: 'BSC' },
          { symbol: 'ATOM', name: 'Cosmos', network: 'Cosmos' },
          { symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche' },
          { symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin' },
          { symbol: 'LTC', name: 'Litecoin', network: 'Litecoin' },
          { symbol: 'BCH', name: 'Bitcoin Cash', network: 'Bitcoin Cash' },
          { symbol: 'RUNE', name: 'THORChain', network: 'THORChain' },
          { symbol: 'CACAO', name: 'Maya Protocol', network: 'Maya' },
        ];

        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setAssets(mockAssets);
        setError(null);
      } catch (err) {
        console.error('Error fetching swap assets:', err);
        setError('Failed to load available tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return { assets, loading, error };
};
