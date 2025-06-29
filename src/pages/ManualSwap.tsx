import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapAssets } from '../hooks/useSwapAssets';
import { useSwapKit } from '../hooks/useSwapKit';
import { SwapConfirmation } from '../components/SwapConfirmation';
import { SwapProgress } from '../components/SwapProgress';
import ProviderComparison from '../components/ProviderComparison';
import TokenSelector from '../components/TokenSelector';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Address validation functions
const validateAddress = (address: string, chain: string): boolean => {
  if (!address || address.length < 10) return false;
  
  switch (chain.toUpperCase()) {
    case 'BTC':
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    case 'ETH':
    case 'AVAX':
    case 'BSC':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'ATOM':
    case 'GAIA':
      return /^cosmos[a-z0-9]{39}$/.test(address);
    case 'THOR':
      return /^thor[a-z0-9]{39}$/.test(address);
    case 'MAYA':
      return /^maya[a-z0-9]{39}$/.test(address);
    case 'SOL':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    case 'DOGE':
      return /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
    case 'LTC':
      return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/.test(address);
    default:
      return true; // Allow unknown chains
  }
};

const ManualSwap = () => {
  const { assets, loading: assetsLoading, error: assetsError, refreshAssets } = useSwapAssets();
  const { getSwapDetails, getSwapStatus, loading: swapLoading, error: swapError } = useSwapKit();
  const { toast } = useToast();
  
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [swapRoutes, setSwapRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentStep, setCurrentStep] = useState('form');
  const [txHash, setTxHash] = useState('');

  const handleGetSwapDetails = async () => {
    // Enhanced validations
    if (!amount || !destinationAddress) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un número mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (fromToken === toToken) {
      toast({
        title: "Tokens iguales",
        description: "Los tokens de origen y destino deben ser diferentes",
        variant: "destructive"
      });
      return;
    }

    // Validate destination address format
    const toChain = toToken.split('.')[0];
    if (!validateAddress(destinationAddress, toChain)) {
      toast({
        title: "Dirección inválida",
        description: `El formato de la dirección no es válido para ${toChain}`,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Getting swap details for:', { fromToken, toToken, amount, destinationAddress });
      
      const details = await getSwapDetails(fromToken, toToken, amount, destinationAddress);
      
      console.log('Swap details received:', details);
      
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
          // Single route, go directly to confirmation
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
            title: "Cotización obtenida",
            description: `Recibirás aproximadamente ${details.routes[0].expectedOutput} ${toAsset?.ticker}`,
          });
        }
      } else {
        toast({
          title: "Sin rutas disponibles",
          description: "No se encontraron proveedores para este intercambio",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting swap details:', error);
      toast({
        title: "Error al obtener detalles",
        description: error instanceof Error ? error.message : "No se pudieron obtener los detalles del swap",
        variant: "destructive"
      });
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
      recipient: destinationAddress
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
    setDestinationAddress('');
  };

  const getToChain = () => {
    return toToken.split('.')[0];
  };

  // Loading state
  if (assetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-foreground mb-2">Cargando tokens...</h2>
          <p className="text-muted-foreground">Obteniendo lista de tokens disponibles</p>
        </div>
      </div>
    );
  }

  // Error state
  if (assetsError && assets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error al cargar tokens</h2>
          <p className="text-muted-foreground mb-4">{assetsError}</p>
          <Button onClick={refreshAssets} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Swap Manual
          </h1>
          <p className="text-muted-foreground">
            Intercambia desde cualquier wallet sin conectarla a la web
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-lg"
            >
              {/* Alert Info */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="text-primary text-xl">ℹ️</div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Modo Manual</h3>
                    <p className="text-sm text-foreground">
                      Perfecto para wallets de hardware (Ledger, Trezor) o móviles. 
                      No necesitas conectar tu wallet a esta web.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assets Error Warning */}
              {assetsError && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <h3 className="font-semibold text-yellow-600 mb-1">Aviso</h3>
                      <p className="text-sm text-foreground">
                        {assetsError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-6">
                {/* From Token */}
                <TokenSelector
                  value={fromToken}
                  onChange={setFromToken}
                  label="Token de origen"
                  excludeToken={toToken}
                />

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const temp = fromToken;
                      setFromToken(toToken);
                      setToToken(temp);
                    }}
                    className="rounded-full p-2"
                  >
                    ↕️
                  </Button>
                </div>

                {/* To Token */}
                <TokenSelector
                  value={toToken}
                  onChange={setToToken}
                  label="Token de destino"
                  excludeToken={fromToken}
                />

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cantidad a enviar
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`0.0 ${assets.find(a => a.identifier === fromToken)?.ticker || ''}`}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground text-lg font-mono"
                    step="any"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Debe ser mayor a 0
                  </p>
                </div>

                {/* Destination Address */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dirección de destino ({getToChain()})
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder={`Tu dirección de ${getToChain()}`}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Asegúrate de que la dirección sea correcta y válida para {getToChain()}. Las transacciones son irreversibles.
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGetSwapDetails}
                  disabled={!amount || !destinationAddress || swapLoading}
                  className="w-full"
                  size="lg"
                >
                  {swapLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Obteniendo cotización...</span>
                    </div>
                  ) : (
                    'Obtener Cotización'
                  )}
                </Button>

                {/* Swap Error */}
                {swapError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-600 mb-1">Error</h4>
                        <p className="text-sm text-foreground">{swapError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug info */}
                <div className="text-xs text-muted-foreground text-center">
                  {assets.length} tokens disponibles
                  {assetsError && (
                    <span className="ml-2 text-yellow-600">
                      (usando datos de prueba)
                    </span>
                  )}
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
