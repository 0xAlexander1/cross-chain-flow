
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  balance: string;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');

  const connect = async (type: string) => {
    try {
      console.log(`Connecting to ${type} wallet...`);
      
      if (type === 'metamask') {
        // Verificar si MetaMask está disponible
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });
            if (accounts.length > 0) {
              setIsConnected(true);
              setWalletType(type);
              setWalletAddress(accounts[0]);
              setBalance('1.25'); // Balance mock por ahora
              console.log('MetaMask connected successfully');
              return;
            }
          } catch (error) {
            console.error('MetaMask connection failed:', error);
          }
        } else {
          console.warn('MetaMask not detected');
        }
      }
      
      // Para otros tipos de wallet o si MetaMask falla, usar mock por ahora
      setIsConnected(true);
      setWalletType(type);
      setWalletAddress('0x1234...5678'); // Dirección mock
      setBalance('1.25'); // Balance mock
      console.log(`${type} wallet connected (mock)`);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setBalance('0.00');
    console.log('Wallet disconnected');
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletAddress,
      walletType,
      balance,
      connect,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Extender el tipo Window para incluir ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
