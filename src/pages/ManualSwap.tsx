
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ManualSwap = () => {
  const [fromToken, setFromToken] = useState('BTC');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [swapDetails, setSwapDetails] = useState(null);

  const tokens = [
    { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum' },
    { symbol: 'BNB', name: 'BNB', network: 'BSC' },
    { symbol: 'ATOM', name: 'Cosmos', network: 'Cosmos' },
    { symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche' },
  ];

  const generateSwapAddress = () => {
    if (!amount || !destinationAddress) return;

    // Simulación de generación de dirección de swap
    const mockSwapDetails = {
      depositAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      memo: 'SWAP:ETH.ETH:' + destinationAddress,
      exactAmount: amount,
      estimatedOutput: (parseFloat(amount) * 15.2).toFixed(6),
      estimatedTime: '3-7 minutos',
      rate: '1 BTC = 15.2 ETH'
    };

    setSwapDetails(mockSwapDetails);
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
            Swap Manual
          </h1>
          <p className="text-muted-foreground">
            Intercambia desde cualquier wallet sin conectarla a la web
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.network}
                  </option>
                ))}
              </select>
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
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.network}
                  </option>
                ))}
              </select>
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
                placeholder={`0.0 ${fromToken}`}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Destination Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dirección de destino ({toToken})
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder={`Tu dirección de ${toToken}`}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground font-mono text-sm"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSwapAddress}
              disabled={!amount || !destinationAddress}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar Dirección de Swap
            </button>
          </div>

          {/* Swap Details */}
          {swapDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 space-y-4"
            >
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Instrucciones de Swap
                </h3>
                
                <div className="bg-background border border-border rounded-lg p-4 space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-primary mb-2">
                      1. Envía exactamente esta cantidad:
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground">
                      {swapDetails.exactAmount} {fromToken}
                    </div>
                  </div>

                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-orange-600 mb-2">
                      2. A esta dirección:
                    </div>
                    <div className="font-mono text-sm text-foreground break-all bg-background rounded px-3 py-2">
                      {swapDetails.depositAddress}
                    </div>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600 mb-2">
                      3. Con este memo/tag:
                    </div>
                    <div className="font-mono text-sm text-foreground break-all bg-background rounded px-3 py-2">
                      {swapDetails.memo}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-sm text-muted-foreground">Recibirás aproximadamente:</div>
                      <div className="font-semibold text-foreground">
                        {swapDetails.estimatedOutput} {toToken}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tiempo estimado:</div>
                      <div className="font-semibold text-foreground">
                        {swapDetails.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-1">Importante</h4>
                      <ul className="text-sm text-foreground space-y-1">
                        <li>• Envía exactamente la cantidad especificada</li>
                        <li>• No olvides incluir el memo/tag</li>
                        <li>• Verifica que la dirección sea correcta</li>
                        <li>• El proceso es irreversible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ManualSwap;
