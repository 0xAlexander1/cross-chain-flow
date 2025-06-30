
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SwapRoute {
  provider: string;
  depositAddress: string;
  memo: string;
  expectedOutput: string;
  expectedOutputMaxSlippage: string;
  fees: any[];
  estimatedTime: string;
  priceImpact: number;
  warnings: string[];
  totalFees: number;
}

interface SwapDetails {
  routes: SwapRoute[];
  expiresIn: number;
  bestRoute: SwapRoute;
}

interface SwapStatus {
  status: string;
  observedIn?: string;
  txHash: string;
  finalTxHash?: string | null;
  finalTxExplorerUrl?: string | null;
  inAmount?: string;
  outAmount?: string;
  provider?: string;
  timestamp?: string;
}

export const useSwapKit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSupportedAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('get-supported-assets');

      if (error) {
        throw new Error(error.message || 'Failed to fetch assets');
      }

      // Return the full response so useSwapAssets can handle different formats
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supported assets';
      setError(errorMessage);
      console.error('Error fetching supported assets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSwapDetails = async (
    fromAsset: string,
    toAsset: string,
    amount: string,
    recipient: string
  ): Promise<SwapDetails> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('get-swap-details', {
        body: {
          fromAsset,
          toAsset,
          amount,
          recipient
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get swap details';
      setError(errorMessage);
      console.error('Error getting swap details:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSwapStatus = async (txHash: string): Promise<SwapStatus> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('swap-status', {
        body: { txHash }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get swap status';
      setError(errorMessage);
      console.error('Error getting swap status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getSupportedAssets,
    getSwapDetails,
    getSwapStatus
  };
};
