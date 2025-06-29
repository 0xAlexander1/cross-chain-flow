
import { useState, useCallback } from 'react';

// Add error boundary for SwapKit imports
let SwapKitApi: any = null;
let keystoreWallet: any = null;
let xdefiWallet: any = null;
let keplrWallet: any = null;

try {
  // Import SwapKitApi instead of SwapKitCore
  const swapKitCore = require('@swapkit/core');
  SwapKitApi = swapKitCore.SwapKitApi;
  
  // Individual wallet imports with error handling
  const keystoreModule = require('@swapkit/wallet-keystore');
  keystoreWallet = keystoreModule.keystoreWallet;
  
  const xdefiModule = require('@swapkit/wallet-xdefi');
  xdefiWallet = xdefiModule.xdefiWallet;
  
  const keplrModule = require('@swapkit/wallet-keplr');
  keplrWallet = keplrModule.keplrWallet;
} catch (error) {
  console.warn('SwapKit modules not available:', error);
}

export const useSwapKitClient = () => {
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [ready, setReady] = useState(!!SwapKitApi);

  // Supported wallets that we have packages for
  const supportedWallets = ['KEYSTORE', 'XDEFI', 'KEPLR', 'METAMASK'];

  const getSupportedAssets = useCallback(async () => {
    if (!client) {
      throw new Error('SwapKit client not initialized');
    }
    
    try {
      // Try to get supported assets from client
      const assets = await client.getSupportedAssets?.();
      return assets || [];
    } catch (error) {
      console.warn('Failed to get assets from SwapKit client:', error);
      return [];
    }
  }, [client]);

  const connectWallet = useCallback(async (walletType: string, options?: any) => {
    if (!SwapKitApi) {
      throw new Error('SwapKit not available - using fallback mode');
    }

    setLoading(true);
    
    try {
      console.log(`Attempting to connect ${walletType} wallet...`);
      
      let walletClient;
      
      switch (walletType) {
        case 'KEYSTORE':
          if (!keystoreWallet) {
            throw new Error('Keystore wallet package not available');
          }
          if (!options?.phrase) {
            throw new Error('Seed phrase is required for Keystore wallet');
          }
          walletClient = keystoreWallet({
            phrase: options.phrase,
            chains: ['BTC', 'ETH', 'THORCHAIN']
          });
          break;
          
        case 'XDEFI':
          if (!xdefiWallet) {
            throw new Error('XDEFI wallet package not available');
          }
          // @ts-ignore - XDEFI wallet may not be available
          if (typeof window !== 'undefined' && window.xfi) {
            walletClient = xdefiWallet();
          } else {
            throw new Error('XDEFI wallet not found. Please install XDEFI extension.');
          }
          break;
          
        case 'KEPLR':
          if (!keplrWallet) {
            throw new Error('Keplr wallet package not available');
          }
          // @ts-ignore - Keplr wallet may not be available
          if (typeof window !== 'undefined' && window.keplr) {
            walletClient = keplrWallet();
          } else {
            throw new Error('Keplr wallet not found. Please install Keplr extension.');
          }
          break;
          
        case 'METAMASK':
          // @ts-ignore - MetaMask may not be available
          if (typeof window !== 'undefined' && window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('MetaMask connected successfully');
            setConnectedWallets(prev => [...prev, walletType]);
            return;
          } else {
            throw new Error('MetaMask not found. Please install MetaMask extension.');
          }
          
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Initialize SwapKit client if we have a wallet
      if (walletClient) {
        const swapKitClient = SwapKitApi({
          config: {
            stagenet: false, // Use mainnet
            blockchairApiKey: '', // Add if needed
            covalentApiKey: '', // Add if needed
            ethplorerApiKey: '', // Add if needed
          }
        });

        // Connect the wallet to SwapKit
        const connectedClient = await swapKitClient.connectWallet(walletClient);
        
        setClient(connectedClient);
        setConnectedWallets(prev => [...prev, walletType]);
        
        console.log(`${walletType} wallet connected successfully`);
      }
      
    } catch (error) {
      console.error(`Failed to connect ${walletType} wallet:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async (walletType: string) => {
    try {
      // Remove from connected wallets
      setConnectedWallets(prev => prev.filter(w => w !== walletType));
      
      // If no wallets left, clear the client
      if (connectedWallets.length <= 1) {
        setClient(null);
      }
      
      console.log(`${walletType} wallet disconnected`);
    } catch (error) {
      console.error(`Failed to disconnect ${walletType} wallet:`, error);
      throw error;
    }
  }, [connectedWallets]);

  const getWalletAddress = useCallback((chain: string) => {
    if (!client) return null;
    
    try {
      // Try to get address for the specified chain
      return client.getWalletAddress?.(chain) || null;
    } catch (error) {
      console.warn(`Failed to get address for chain ${chain}:`, error);
      return null;
    }
  }, [client]);

  return {
    client,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
    getSupportedAssets,
    loading,
    connectedWallets,
    supportedWallets,
    isConnected: connectedWallets.length > 0,
    ready
  };
};
