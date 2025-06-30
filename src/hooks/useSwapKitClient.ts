
import { useState, useEffect, useCallback } from 'react';

// SwapKit imports with error handling
let SwapKitApi: any = null;
let walletModules: any = {};

try {
  // Import SwapKit core
  const swapKitCore = require('@swapkit/core');
  SwapKitApi = swapKitCore.SwapKitApi;
  
  // Import wallet modules
  try {
    const keystoreModule = require('@swapkit/wallet-keystore');
    walletModules.keystore = keystoreModule.keystoreWallet;
  } catch (e) {
    console.warn('Keystore wallet not available:', e);
  }
  
  try {
    const xdefiModule = require('@swapkit/wallet-xdefi');
    walletModules.xdefi = xdefiModule.xdefiWallet;
  } catch (e) {
    console.warn('XDEFI wallet not available:', e);
  }
  
  try {
    const keplrModule = require('@swapkit/wallet-keplr');
    walletModules.keplr = keplrModule.keplrWallet;
  } catch (e) {
    console.warn('Keplr wallet not available:', e);
  }
  
} catch (error) {
  console.warn('SwapKit core not available:', error);
}

export const useSwapKitClient = () => {
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [initError, setInitError] = useState<string | null>(null);

  // Supported wallets based on available modules
  const supportedWallets = ['KEYSTORE', 'XDEFI', 'KEPLR', 'METAMASK'];

  // Get the first connected wallet as the primary one
  const connectedWallet = connectedWallets.length > 0 ? connectedWallets[0] : null;

  // Initialize SwapKit client
  useEffect(() => {
    const initializeClient = async () => {
      if (!SwapKitApi) {
        setInitError('SwapKit no está disponible. Usando modo fallback.');
        setReady(false);
        return;
      }

      try {
        console.log('Initializing SwapKit client...');
        
        // Get API key from environment variables
        const apiKey = import.meta.env.VITE_SWAPKIT_API_KEY;
        
        if (!apiKey) {
          console.warn('VITE_SWAPKIT_API_KEY not found, using fallback mode');
          setInitError('API key no configurada. Funcionalidad limitada.');
          setReady(false);
          return;
        }

        // Initialize SwapKit with configuration
        const swapKitClient = SwapKitApi({
          config: {
            apiKey: apiKey,
            stagenet: false, // Use mainnet
            blockchairApiKey: '', // Optional
            covalentApiKey: '', // Optional
            ethplorerApiKey: '', // Optional
          }
        });

        console.log('SwapKit client initialized successfully');
        setClient(swapKitClient);
        setReady(true);
        setInitError(null);
        
      } catch (error) {
        console.error('Failed to initialize SwapKit client:', error);
        setInitError(error instanceof Error ? error.message : 'Error de inicialización');
        setReady(false);
      }
    };

    initializeClient();
  }, []);

  const getSupportedAssets = useCallback(async () => {
    if (!client) {
      console.warn('SwapKit client not available, using Supabase fallback');
      throw new Error('SwapKit client not initialized');
    }
    
    try {
      console.log('Getting supported assets from SwapKit...');
      const assets = await client.getSupportedAssets?.();
      return assets || [];
    } catch (error) {
      console.warn('Failed to get assets from SwapKit client:', error);
      throw error;
    }
  }, [client]);

  const connectWallet = useCallback(async (walletType: string, options?: any) => {
    if (!SwapKitApi || !client) {
      throw new Error('SwapKit no está disponible');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to connect ${walletType} wallet...`);
      
      let walletClient;
      
      switch (walletType) {
        case 'KEYSTORE':
          if (!walletModules.keystore) {
            throw new Error('Keystore wallet module not available');
          }
          if (!options?.phrase) {
            throw new Error('Seed phrase is required for Keystore wallet');
          }
          walletClient = walletModules.keystore({
            phrase: options.phrase,
            chains: ['BTC', 'ETH', 'THORCHAIN', 'MAYA']
          });
          break;
          
        case 'XDEFI':
          if (!walletModules.xdefi) {
            throw new Error('XDEFI wallet module not available');
          }
          // @ts-ignore - XDEFI wallet may not be available
          if (typeof window !== 'undefined' && window.xfi) {
            walletClient = walletModules.xdefi();
          } else {
            throw new Error('XDEFI wallet not found. Please install XDEFI extension.');
          }
          break;
          
        case 'KEPLR':
          if (!walletModules.keplr) {
            throw new Error('Keplr wallet module not available');
          }
          // @ts-ignore - Keplr wallet may not be available
          if (typeof window !== 'undefined' && window.keplr) {
            walletClient = walletModules.keplr();
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
            
            // Get MetaMask addresses
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
              setAddresses(prev => ({ ...prev, ETH: accounts[0] }));
            }
            return;
          } else {
            throw new Error('MetaMask not found. Please install MetaMask extension.');
          }
          
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Connect the wallet to SwapKit
      if (walletClient) {
        const connectedClient = await client.connectWallet(walletClient);
        
        setClient(connectedClient);
        setConnectedWallets(prev => [...prev, walletType]);
        
        // Get wallet addresses for different chains
        const walletAddresses: Record<string, string> = {};
        const chains = ['BTC', 'ETH', 'THORCHAIN', 'MAYA', 'ATOM', 'DOGE', 'LTC'];
        
        for (const chain of chains) {
          try {
            const address = await connectedClient.getWalletAddress?.(chain);
            if (address) {
              walletAddresses[chain] = address;
            }
          } catch (error) {
            console.warn(`Failed to get ${chain} address:`, error);
          }
        }
        
        setAddresses(walletAddresses);
        console.log(`${walletType} wallet connected successfully`);
      }
      
    } catch (error) {
      console.error(`Failed to connect ${walletType} wallet:`, error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Clear all wallet state
      setConnectedWallets([]);
      setAddresses({});
      setError(null);
      
      // Reinitialize client without wallets
      if (SwapKitApi) {
        const apiKey = import.meta.env.VITE_SWAPKIT_API_KEY;
        if (apiKey) {
          const swapKitClient = SwapKitApi({
            config: {
              apiKey: apiKey,
              stagenet: false,
            }
          });
          setClient(swapKitClient);
        }
      }
      
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet');
      throw error;
    }
  }, []);

  const getWalletAddress = useCallback((chain: string) => {
    return addresses[chain] || null;
  }, [addresses]);

  return {
    client,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
    getSupportedAssets,
    loading,
    connectedWallets,
    connectedWallet,
    addresses,
    error: error || initError,
    supportedWallets,
    isConnected: connectedWallets.length > 0,
    ready: ready && !initError
  };
};
