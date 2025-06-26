
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();

  const wallets = [
    {
      name: 'MetaMask',
      icon: '🦊',
      type: 'metamask',
      description: 'Conectar usando MetaMask'
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      type: 'walletconnect',
      description: 'Escanear con WalletConnect'
    },
    {
      name: 'XDEFI',
      icon: '🛡️',
      type: 'xdefi',
      description: 'Conectar con XDEFI Wallet'
    }
  ];

  const handleConnect = async (walletType: string) => {
    await connect(walletType);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Conectar Wallet</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.type}
                  onClick={() => handleConnect(wallet.type)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{wallet.name}</div>
                      <div className="text-sm text-muted-foreground">{wallet.description}</div>
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Al conectar, aceptas nuestros términos de servicio
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
