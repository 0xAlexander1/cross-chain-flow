
import { useState, useEffect } from 'react';
import { SwapKitApi } from '@swapkit/api';
import { WalletOption, RequestClientConfig } from '@swapkit/core';
import { keystoreWallet } from '@swapkit/wallet-keystore';
import { xdefiWallet } from '@swapkit/wallet-xdefi';
import { keepkeyWallet } from '@swapkit/wallet-keepkey';
import { ledgerWallet } from '@swapkit/wallet-ledger';
import { trezorWallet } from '@swapkit/wallet-trezor';
import { walletconnectWallet } from '@swapkit/wallet-walletconnect';

interface SwapKitClient {
  ready: boolean;
  client: SwapKitApi | null;
  supportedWallets: WalletOption[];
  connectWallet: (walletType: WalletOption, options?: any) => Promise<void>;
  disconnectWallet: () => void;
  connectedWallet: string | null;
  addresses: Record<string, string>;
  getSupportedAssets: () => Promise<any[]>;
  getSwapDetails: (params: any) => Promise<any>;
  error: string | null;
  loading: boolean;
}

export const useSwapKitClient = (): SwapKitClient => {
  const [client, setClient] = useState<SwapKitApi | null>(null);
  const [ready, setReady] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supportedWallets: WalletOption[] = [
    WalletOption.KEYSTORE,
    WalletOption.XDEFI,
    WalletOption.WALLETCONNECT,
    WalletOption.KEEPKEY,
    WalletOption.LEDGER,
    WalletOption.TREZOR
  ];

  useEffect(() => {
    initializeSwapKit();
  }, []);

  const initializeSwapKit = async () => {
    try {
      setLoading(true);
      setError(null);

      const config: RequestClientConfig = {
        rpcUrls: {
          BTC: "https://btc-rpc.publicnode.com",
          ETH: "https://rpc.ankr.com/eth",
          AVAX: "https://rpc.ankr.com/avalanche",
          BSC: "https://rpc.ankr.com/bsc",
          THOR: "https://rpc.thorchain.info",
          MAYA: "https://mayanode.mayachain.info",
        },
        covalentApiKey: undefined, // Optional
        ethplorerApiKey: undefined, // Optional
        blockchairApiKey: undefined, // Optional
        stagenet: false,
      };

      const swapKitClient = new SwapKitApi(config);
      
      setClient(swapKitClient);
      setReady(true);
      
      console.log('SwapKit client initialized successfully');
      
    } catch (err) {
      console.error('Error initializing SwapKit:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize SwapKit');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (walletType: WalletOption, options?: any) => {
    if (!client || !ready) {
      throw new Error('SwapKit client not ready');
    }

    try {
      setLoading(true);
      setError(null);

      let wallet;
      
      switch (walletType) {
        case WalletOption.KEYSTORE:
          if (!options?.phrase) {
            throw new Error('Seed phrase required for Keystore wallet');
          }
          wallet = keystoreWallet({ ...options, stagenet: false });
          break;
          
        case WalletOption.XDEFI:
          wallet = xdefiWallet();
          break;
          
        case WalletOption.WALLETCONNECT:
          wallet = walletconnectWallet({
            projectId: options?.projectId || 'your-project-id', // You'll need to set this
          });
          break;
          
        case WalletOption.KEEPKEY:
          wallet = keepkeyWallet();
          break;
          
        case WalletOption.LEDGER:
          wallet = ledgerWallet();
          break;
          
        case WalletOption.TREZOR:
          wallet = trezorWallet();
          break;
          
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      const connectedClient = await SwapKitApi.connectWallet(wallet, config);
      
      setClient(connectedClient);
      setConnectedWallet(walletType);
      
      // Get addresses for all supported chains
      const walletAddresses: Record<string, string> = {};
      const chains = ['BTC', 'ETH', 'AVAX', 'BSC', 'THOR'];
      
      for (const chain of chains) {
        try {
          const address = await connectedClient.getAddress(chain);
          if (address) {
            walletAddresses[chain] = address;
          }
        } catch (e) {
          console.warn(`Could not get ${chain} address:`, e);
        }
      }
      
      setAddresses(walletAddresses);
      
      console.log('Wallet connected successfully:', walletType);
      console.log('Addresses:', walletAddresses);
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setAddresses({});
    // Reinitialize client without wallet
    initializeSwapKit();
  };

  const getSupportedAssets = async () => {
    if (!client || !ready) {
      throw new Error('SwapKit client not ready');
    }

    try {
      const assets = await client.getSupportedAssets();
      return assets;
    } catch (err) {
      console.error('Error getting supported assets:', err);
      throw err;
    }
  };

  const getSwapDetails = async (params: {
    fromAsset: string;
    toAsset: string;
    amount: string;
    destinationAddress: string;
  }) => {
    if (!client || !ready) {
      throw new Error('SwapKit client not ready');
    }

    try {
      const { fromAsset, toAsset, amount, destinationAddress } = params;
      
      // Parse asset identifiers (e.g., "BTC.BTC" -> chain: "BTC", symbol: "BTC")
      const [fromChain, fromSymbol] = fromAsset.split('.');
      const [toChain, toSymbol] = toAsset.split('.');
      
      const swapParams = {
        fromChain,
        fromSymbol,
        toChain,
        toSymbol,
        amount,
        destinationAddress,
        slippage: "3", // 3% slippage tolerance
      };
      
      console.log('Getting swap details with params:', swapParams);
      
      const details = await client.getSwapQuote(swapParams);
      
      console.log('Swap details received:', details);
      
      return details;
    } catch (err) {
      console.error('Error getting swap details:', err);
      throw err;
    }
  };

  return {
    ready,
    client,
    supportedWallets,
    connectWallet,
    disconnectWallet,
    connectedWallet,
    addresses,
    getSupportedAssets,
    getSwapDetails,
    error,
    loading
  };
};
