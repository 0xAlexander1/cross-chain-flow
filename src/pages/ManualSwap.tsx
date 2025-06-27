
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwapAssets } from '../hooks/useSwapAssets';
import { useSwapKit } from '../hooks/useSwapKit';
import { SwapConfirmation } from '../components/SwapConfirmation';
import { SwapProgress } from '../components/SwapProgress';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const ManualSwap = () => {
  const { assets, loading } = useSwapAssets();
  const { getSwapDetails, getSwapStatus, loading: swapLoading } = useSwapKit();
  const { toast } = useToast();
  
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [swapDetails, setSwapDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'confirmation', 'progress'
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

    try {
      console.log('Getting swap details for:', { fromToken, toToken, amount, destinationAddress });
      
      const details = await getSwapDetails(fromToken, toToken, amount, destinationAddress);
      
      console.log('Swap details received:', details);
      
      if (details) {
        setSwapDetails({
          ...details,
          fromAsset: assets.find(asset => asset.identifier === fromToken),
          toAsset: assets.find(asset => asset.identifier === toToken),
          exactAmount: amount,
          recipient: destinationAddress
        });
        setCurrentStep('confirmation');
      }
    } catch (error) {
      console.error('Error getting swap details:', error);
      toast({
        title: "Error al obtener detalles",
        description: error.message || "No se pudieron obtener los detalles del swap",
        variant: "destructive"
      });
    }
  };

  const handleConfirmSwap = (transactionHash) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mb-4 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
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

              {/* Form */}
              <div className="space-y-4">
                {/* From Token */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Token de origen
                  </label>
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  >
                    {assets.map((asset) => (
                      <option key={asset.identifier} value={asset.identifier}>
                        {asset.ticker} - {asset.chain}
                      </option>
                    ))}
                  </select>
                  {assets.find(a => a.identifier === fromToken)?.logoURI && (
                    <div className="flex items-center space-x-2 mt-2">
                      <img 
                        src={assets.find(a => a.identifier === fromToken)?.logoURI} 
                        alt={assets.find(a => a.identifier === fromToken)?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {assets.find(a => a.identifier === fromToken)?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* To Token */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Token de destino
                  </label>
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                  >
                    {assets.map((asset) => (
                      <option key={asset.identifier} value={asset.identifier}>
                        {asset.ticker} - {asset.chain}
                      </option>
                    ))}
                  </select>
                  {assets.find(a => a.identifier === toToken)?.logoURI && (
                    <div className="flex items-center space-x-2 mt-2">
                      <img 
                        src={assets.find(a => a.identifier === toToken)?.logoURI} 
                        alt={assets.find(a => a.identifier === toToken)?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {assets.find(a => a.identifier === toToken)?.name}
                      </span>
                    </div>
                  )}
                </div>

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
