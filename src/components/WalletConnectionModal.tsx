import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapKitClient } from '../hooks/useSwapKitClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { connectWallet, supportedWallets, loading } = useSwapKitClient();
  const { toast } = useToast();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showSeedInput, setShowSeedInput] = useState(false);

  const walletInfo: Record<string, {
    name: string;
    icon: string;
    description: string;
    requiresSeed: boolean;
  }> = {
    'XDEFI': {
      name: 'XDEFI Wallet',
      icon: '🛡️',
      description: 'Multi-chain web3 wallet',
      requiresSeed: false
    },
    'KEYSTORE': {
      name: 'Keystore',
      icon: '🔐',
      description: 'Connect with seed phrase',
      requiresSeed: true
    },
    'METAMASK': {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Ethereum wallet',
      requiresSeed: false
    },
    'WALLETCONNECT': {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect any wallet via WalletConnect',
      requiresSeed: false
    },
    'KEPLR': {
      name: 'Keplr',
      icon: '🌌',
      description: 'Cosmos ecosystem wallet',
      requiresSeed: false
    }
  };

  const handleWalletSelect = (walletType: string) => {
    const wallet = walletInfo[walletType];
    if (wallet?.requiresSeed) {
      setSelectedWallet(walletType);
      setShowSeedInput(true);
    } else {
      handleConnect(walletType);
    }
  };

  const handleConnect = async (walletType: string, options?: any) => {
    try {
      await connectWallet(walletType, options);
      
      toast({
        title: "Wallet conectada",
        description: `${walletInfo[walletType]?.name} conectada exitosamente`,
      });
      
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar la wallet",
        variant: "destructive"
      });
    }
  };

  const handleKeystoreConnect = () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Frase requerida",
        description: "Por favor ingresa tu frase de recuperación",
        variant: "destructive"
      });
      return;
    }

    handleConnect('KEYSTORE', { phrase: seedPhrase.trim() });
  };

  const resetModal = () => {
    setSelectedWallet(null);
    setShowSeedInput(false);
    setSeedPhrase('');
  };

  const handleClose = () => {
    resetModal();
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {showSeedInput ? 'Conectar Keystore' : 'Conectar Wallet'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-auto p-1"
              >
                ✕
              </Button>
            </div>

            {!showSeedInput ? (
              <div className="space-y-3">
                {supportedWallets.map((walletType) => {
                  const wallet = walletInfo[walletType];
                  if (!wallet) return null;
                  
                  return (
                    <Button
                      key={walletType}
                      variant="outline"
                      onClick={() => handleWalletSelect(walletType)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-4 h-auto"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-foreground">{wallet.name}</div>
                          <div className="text-sm text-muted-foreground">{wallet.description}</div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">→</div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="text-sm">
                      <p className="font-medium text-yellow-600 mb-1">Importante</p>
                      <p className="text-foreground">
                        Tu frase de recuperación no se almacena en ningún lugar. 
                        Solo se usa para conectar tu wallet temporalmente.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Frase de recuperación (12-24 palabras)
                  </label>
                  <textarea
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    placeholder="word1 word2 word3 ..."
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground resize-none h-20"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSeedInput(false)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleKeystoreConnect}
                    disabled={loading || !seedPhrase.trim()}
                    className="flex-1"
                  >
                    {loading ? 'Conectando...' : 'Conectar'}
                  </Button>
                </div>
              </div>
            )}

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
