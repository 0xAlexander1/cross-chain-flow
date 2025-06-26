import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import TokenSelector from '../components/TokenSelector';
import { Input } from '../components/ui/input';

const Swap = () => {
  const { isConnected, walletAddress } = useWallet();
  const [fromToken, setFromToken] = useState('BTC.BTC');
  const [toToken, setToToken] = useState('ETH.ETH');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setEstimatedOutput(''); // Clear estimate when swapping
  };

  const handleEstimate = () => {
    // Simulación de estimación
    if (amount) {
      const rate = 15.5; // Rate simulado
      setEstimatedOutput((parseFloat(amount) * rate).toFixed(6));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Conecta tu wallet para continuar
          </h2>
          <p className="text-muted-foreground mb-8">
            Necesitas conectar una wallet para usar la función de swap
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Conectar Wallet
          </button>
        </motion.div>
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

        <motion.div
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
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Balance: 1.25 {getTickerFromIdentifier(fromToken)}</span>
                <span>≈ ${(parseFloat(amount || '0') * 45000).toFixed(2)}</span>
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
                value={estimatedOutput}
                placeholder="0.0"
                readOnly
                className="text-right text-xl font-bold bg-muted"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Estimado</span>
                <span>≈ ${(parseFloat(estimatedOutput || '0') * 2500).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEstimate}
              disabled={!amount}
              className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Estimar Swap
            </button>
            
            {estimatedOutput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comisión de red:</span>
                      <span className="text-foreground">~$2.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage:</span>
                      <span className="text-foreground">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo estimado:</span>
                      <span className="text-foreground">2-5 min</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Confirmar Swap
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Swap;
