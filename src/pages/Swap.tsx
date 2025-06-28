import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapKitClient } from '../hooks/useSwapKitClient';
import { useSwapKit } from '../hooks/useSwapKit';
import { WalletConnectionModal } from '../components/WalletConnectionModal';
import { SwapConfirmation } from '../components/SwapConfirmation';
import { SwapProgress } from '../components/SwapProgress';
import ProviderComparison from '../components/ProviderComparison';
import TokenSelector from '../components/TokenSelector';
import { Input } from '../components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSwapAssets } from '../hooks/useSwapAssets';

const Swap = () => {
  const { 
    ready, 
    connectedWallet, 
    addresses, 
    disconnectWallet,
    loading,
    error 
  } = useSwapKitClient();
  
  const { getSwapDetails, getSwapStatus } = useSwapKit();
  const { assets } = useSwapAssets();
  const { toast } = useToast();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [swapRoutes, setSwapRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentStep, setCurrentStep] = useState('form');
  const [txHash, setTxHash] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleEstimate = async () => {
    if (!amount || !ready) {
      toast({
        title: "Error",
        description: "Ingresa una cantidad válida",
        variant: "destructive"
      });
      return;
    }

    if (!connectedWallet) {
      toast({
        title: "Wallet requerida",
        description: "Conecta tu wallet para obtener estimaciones",
        variant: "destructive"
      });
      return;
    }

    try {
      setSwapLoading(true);
      
      // Get destination address from connected wallet
      const toChain = toToken.split('.')[0];
      const destinationAddress = addresses[toChain];
      
      if (!destinationAddress) {
        throw new Error(`No se encontró dirección para ${toChain}`);
      }

      const details = await getSwapDetails(fromToken, toToken, amount, destinationAddress);

      if (details && details.routes && details.routes.length > 0) {
        setSwapRoutes(details);
        
        // If multiple routes, show comparison, otherwise go directly to confirmation
        if (details.routes.length > 1) {
          setCurrentStep('comparison');
          toast({
            title: "Múltiples proveedores disponibles",
            description: `Encontramos ${details.routes.length} opciones para tu swap`,
          });
        } else {
          // Single route, show details
          const fromAsset = assets.find(asset => asset.identifier === fromToken);
          const toAsset = assets.find(asset => asset.identifier === toToken);
          
          setSelectedRoute({
            ...details.routes[0],
            fromAsset,
            toAsset,
            exactAmount: amount,
            recipient: destinationAddress
          });
          setCurrentStep('confirmation');
          
          toast({
            title: "Estimación obtenida",
            description: `Recibirás aproximadamente ${details.routes[0].expectedOutput} ${toAsset?.ticker}`,
          });
        }
      }
      
    } catch (error) {
      console.error('Error getting estimate:', error);
      toast({
        title: "Error en estimación",
        description: error instanceof Error ? error.message : "No se pudo obtener la estimación",
        variant: "destructive"
      });
    } finally {
      setSwapLoading(false);
    }
  };

  const handleSelectProvider = (route: any) => {
    const fromAsset = assets.find(asset => asset.identifier === fromToken);
    const toAsset = assets.find(asset => asset.identifier === toToken);
    
    setSelectedRoute({
      ...route,
      fromAsset,
      toAsset,
      exactAmount: amount,
      recipient: addresses[toToken.split('.')[0]]
    });
    setCurrentStep('confirmation');
    
    toast({
      title: "Proveedor seleccionado",
      description: `Usando ${route.provider} para el swap`,
    });
  };

  const handleConfirmSwap = (transactionHash: string) => {
    setTxHash(transactionHash);
    setCurrentStep('progress');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setSwapRoutes(null);
    setSelectedRoute(null);
    setTxHash('');
  };

  const handleBackToComparison = () => {
    setCurrentStep('comparison');
    setSelectedRoute(null);
  };

  const handleNewSwap = () => {
    setCurrentStep('form');
    setSwapRoutes(null);
    setSelectedRoute(null);
    setTxHash('');
    setAmount('');
  };

  // Show loading if SwapKit is not ready
  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mb-4 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Inicializando SwapKit...</p>
        </div>
      </div>
    );
  }

  // Show error if SwapKit failed to initialize
  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Error de inicialización
          </h2>
          <p className="text-muted-foreground mb-8">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show connect wallet screen if not connected
  if (!connectedWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Conecta tu wallet para continuar
          </h2>
          <p className="text-muted-foreground mb-8">
            Necesitas conectar una wallet compatible con SwapKit para usar la función de swap automático
          </p>
          <Button
            onClick={() => setShowWalletModal(true)}
            size="lg"
          >
            Conectar Wallet
          </Button>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>¿Prefieres no conectar tu wallet?</p>
            <Button 
              variant="link" 
              onClick={() => window.location.href = '/manual-swap'}
              className="mt-2"
            >
              Usar modo manual →
            </Button>
          </div>
        </motion.div>

        <WalletConnectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => {
            toast({
              title: "¡Wallet conectada!",
              description: "Ahora puedes realizar swaps automáticos",
            });
          }}
        />
      </div>
    );
  }

  // Get ticker from identifier for display
  const getTickerFromIdentifier = (identifier: string) => {
    return identifier.split('.')[1] || identifier;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Intercambio Cross-Chain
          </h1>
          <p className="text-muted-foreground">
            Intercambia tokens entre diferentes blockchains de forma segura
          </p>
        </motion.div>

        {/* Wallet Info */}
        {connectedWallet && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">Wallet Conectada: {connectedWallet}</p>
                <div className="text-sm text-muted-foreground mt-1">
                  {Object.entries(addresses).map(([chain, address]) => (
                    <div key={chain} className="flex items-center space-x-2">
                      <span className="font-medium">{chain}:</span>
                      <span className="font-mono text-xs">
                        {address.slice(0, 8)}...{address.slice(-8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectWallet}
              >
                Desconectar
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-lg"
            >
              {/* From Token */}
              <div className="mb-4">
                <TokenSelector
                  value={fromToken}
                  onChange={setFromToken}
                  label="Desde"
                  excludeToken={toToken}
                />
                <div className="mt-3">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="text-right text-xl font-bold"
                    step="any"
                    min="0"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>Balance: -- {getTickerFromIdentifier(fromToken)}</span>
                    <span>≈ $--</span>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-6">
                <button
                  onClick={handleSwapTokens}
                  className="p-3 rounded-full border border-border hover:bg-accent transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* To Token */}
              <div className="mb-6">
                <TokenSelector
                  value={toToken}
                  onChange={setToToken}
                  label="Hacia"
                  excludeToken={fromToken}
                />
                <div className="mt-3">
                  <Input
                    type="text"
                    value={swapRoutes?.bestRoute?.expectedOutput || ''}
                    placeholder="0.0"
                    readOnly
                    className="text-right text-xl font-bold bg-muted"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>Estimado</span>
                    <span>≈ $--</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleEstimate}
                  disabled={!amount || swapLoading || loading || !connectedWallet}
                  className="w-full"
                  variant="secondary"
                >
                  {swapLoading ? 'Estimando...' : 'Estimar Swap'}
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 'comparison' && swapRoutes && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProviderComparison
                routes={swapRoutes.routes}
                fromAsset={assets.find(asset => asset.identifier === fromToken)}
                toAsset={assets.find(asset => asset.identifier === toToken)}
                amount={amount}
                onSelectProvider={handleSelectProvider}
                onBack={handleBackToForm}
              />
            </motion.div>
          )}

          {currentStep === 'confirmation' && selectedRoute && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SwapConfirmation 
                swapDetails={selectedRoute}
                onConfirm={handleConfirmSwap}
                onBack={swapRoutes && swapRoutes.routes.length > 1 ? handleBackToComparison : handleBackToForm}
              />
            </motion.div>
          )}

          {currentStep === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SwapProgress 
                txHash={txHash}
                swapDetails={selectedRoute}
                onNewSwap={handleNewSwap}
                getSwapStatus={getSwapStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!connectedWallet && (
          <WalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onSuccess={() => {
              toast({
                title: "¡Wallet conectada!",
                description: "Ahora puedes realizar swaps automáticos",
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Swap;
