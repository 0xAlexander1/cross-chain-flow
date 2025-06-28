import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapAssets } from '../hooks/useSwapAssets';
import { useSwapKit } from '../hooks/useSwapKit';
import { SwapConfirmation } from '../components/SwapConfirmation';
import { SwapProgress } from '../components/SwapProgress';
import TokenSelector from '../components/TokenSelector';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const ManualSwap = () => {
  const { assets, loading: assetsLoading, error: assetsError, refreshAssets } = useSwapAssets();
  const { getSwapDetails, getSwapStatus, loading: swapLoading, error: swapError } = useSwapKit();
  const { toast } = useToast();
  
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [swapDetails, setSwapDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState('form');
  const [txHash, setTxHash] = useState('');

  const handleGetSwapDetails = async () => {
    if (!amount || !destinationAddress) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (fromToken === toToken) {
      toast({
        title: "Tokens iguales",
        description: "Selecciona tokens diferentes para el intercambio",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Getting swap details for:', { fromToken, toToken, amount, destinationAddress });
      
      const details = await getSwapDetails(fromToken, toToken, amount, destinationAddress);
      
      console.log('Swap details received:', details);
      
      if (details) {
        const fromAsset = assets.find(asset => asset.identifier === fromToken);
        const toAsset = assets.find(asset => asset.identifier === toToken);
        
        setSwapDetails({
          ...details,
          fromAsset,
          toAsset,
          exactAmount: amount,
          recipient: destinationAddress
        });
        setCurrentStep('confirmation');
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

  const handleConfirmSwap = (transactionHash: string) => {
    setTxHash(transactionHash);
    setCurrentStep('progress');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setSwapDetails(null);
    setTxHash('');
  };

  const handleNewSwap = () => {
    setCurrentStep('form');
    setSwapDetails(null);
    setTxHash('');
    setAmount('');
    setDestinationAddress('');
  };

  // Loading state
  if (assetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mb-4 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando tokens disponibles...</p>
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
          <Button onClick={refreshAssets}>
            Reintentar
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
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground"
                    step="any"
                    min="0"
                  />
                </div>

                {/* Destination Address */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dirección de destino ({assets.find(a => a.identifier === toToken)?.ticker})
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder={`Tu dirección de ${assets.find(a => a.identifier === toToken)?.ticker}`}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground font-mono text-sm"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGetSwapDetails}
                  disabled={!amount || !destinationAddress || swapLoading}
                  className="w-full"
                  size="lg"
                >
                  {swapLoading ? 'Obteniendo cotización...' : 'Obtener Cotización'}
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
                {assets.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {assets.length} tokens cargados
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'confirmation' && swapDetails && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SwapConfirmation 
                swapDetails={swapDetails}
                onConfirm={handleConfirmSwap}
                onBack={handleBackToForm}
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
                swapDetails={swapDetails}
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
