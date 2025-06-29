
import { useState, useCallback } from 'react';

// Import SwapKitApi instead of SwapKitCore
import { SwapKitApi } from '@swapkit/core';

// Individual wallet imports
import { keystoreWallet } from '@swapkit/wallet-keystore';
import { xdefiWallet } from '@swapkit/wallet-xdefi';
import { keplrWallet } from '@swapkit/wallet-keplr';

export const useSwapKitClient = () => {
  const [client, setClient] = useState<SwapKitApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  // Supported wallets that we have packages for
  const supportedWallets = ['KEYSTORE', 'XDEFI', 'KEPLR', 'METAMASK'];

  const connectWallet = useCallback(async (walletType: string, options?: any) => {
    setLoading(true);
    
    try {
      console.log(`Attempting to connect ${walletType} wallet...`);
      
      let walletClient;
      
      switch (walletType) {
        case 'KEYSTORE':
          if (!options?.phrase) {
            throw new Error('Seed phrase is required for Keystore wallet');
          }
          walletClient = keystoreWallet({
            phrase: options.phrase,
            chains: ['BTC', 'ETH', 'THORCHAIN']
          });
          break;
          
        case 'XDEFI':
          // @ts-expect-error - XDEFI wallet may not be available
          if (typeof window !== 'undefined' && window.xfi) {
            walletClient = xdefiWallet();
          } else {
            throw new Error('XDEFI wallet not found. Please install XDEFI extension.');
          }
          break;
          
        case 'KEPLR':
          // @ts-expect-error - Keplr wallet may not be available
          if (typeof window !== 'undefined' && window.keplr) {
            walletClient = keplrWallet();
          } else {
            throw new Error('Keplr wallet not found. Please install Keplr extension.');
          }
          break;
          
        case 'METAMASK':
          // @ts-expect-error - MetaMask may not be available
          if (typeof window !== 'undefined' && window.ethereum) {
            // For MetaMask, we'll use a basic connection approach
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
      return client.getWalletAddress(chain) || null;
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
    loading,
    connectedWallets,
    supportedWallets,
    isConnected: connectedWallets.length > 0
  };
};
