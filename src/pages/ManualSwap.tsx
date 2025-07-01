import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapKit } from '../hooks/useSwapKit';
import { SwapConfirmation } from '../components/SwapConfirmation';
import { SwapProgress } from '../components/SwapProgress';
import ProviderComparison from '../components/ProviderComparison';
import TokenSelector from '../components/TokenSelector';
import { Input } from '../components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSwapAssets } from '../hooks/useSwapAssets';
import { validateSwapInputs } from '../utils/addressValidation';

const ManualSwap = () => {
  const { getSwapDetails, getSwapStatus } = useSwapKit();
  const { assets, loading: assetsLoading, refetch } = useSwapAssets();
  const { toast } = useToast();
  
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [swapRoutes, setSwapRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentStep, setCurrentStep] = useState('form');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  // Wait for assets to load before rendering the form
  if (assetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tokens disponibles...</p>
        </div>
      </div>
    );
  }

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleEstimate = async () => {
    // Enhanced validations using the utility function
    const validationError = validateSwapInputs(fromToken, toToken, amount, recipient);
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      console.log('Getting swap estimate:', { fromToken, toToken, amount, recipient });

      const details = await getSwapDetails(fromToken, toToken, amount, recipient);

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
            recipient
          });
          setCurrentStep('confirmation');
          
          toast({
            title: "Estimación obtenida",
            description: `Recibirás aproximadamente ${details.routes[0].expectedOutput} ${toAsset?.ticker}`,
          });
        }
      } else {
        // Handle no routes case - show comparison with empty routes
        setSwapRoutes({ routes: [], expiresIn: 0, bestRoute: null });
        setCurrentStep('comparison');
        
        toast({
          title: "Sin rutas disponibles",
          description: "No se encontraron proveedores para este intercambio. Prueba con otros tokens o cantidades.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error getting estimate:', error);
      toast({
        title: "Error en estimación",
        description: error instanceof Error ? error.message : "No se pudo obtener la estimación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      recipient
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
    setRecipient('');
  };

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
            Intercambio Manual Cross-Chain
          </h1>
          <p className="text-muted-foreground">
            Intercambia tokens proporcionando tu propia dirección de destino
          </p>
        </motion.div>

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
                    <span>Cantidad a enviar</span>
                    <span>{getTickerFromIdentifier(fromToken)}</span>
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
              <div className="mb-4">
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
                    <span>Recibirás (estimado)</span>
                    <span>{getTickerFromIdentifier(toToken)}</span>
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dirección de destino ({toToken.split('.')[0]})
                </label>
                <Input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={`Ingresa tu dirección ${toToken.split('.')[0]}`}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Los tokens se enviarán a esta dirección
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleEstimate}
                  disabled={!amount || !recipient || loading}
                  className="w-full"
                  variant="secondary"
                >
                  {loading ? 'Estimando...' : 'Estimar Swap'}
                </Button>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={refetch}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    🔄 Actualizar Tokens
                  </Button>
                </div>
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
      </div>
    </div>
  );
};

export default ManualSwap;
