
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
      // Simulamos la conexión de wallet por ahora
      console.log(`Connecting to ${type} wallet...`);
      setIsConnected(true);
      setWalletType(type);
      setWalletAddress('0x1234...5678'); // Dirección mock
      setBalance('1.25'); // Balance mock
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setBalance('0.00');
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
