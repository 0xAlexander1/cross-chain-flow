
import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';

const History = () => {
  const { isConnected } = useWallet();

  const mockTransactions = [
    {
      id: '1',
      date: '2024-06-26 14:30',
      fromToken: 'BTC',
      toToken: 'ETH',
      amount: '0.5',
      received: '7.8',
      status: 'completado',
      txHash: '0x1234...abcd'
    },
    {
      id: '2',
      date: '2024-06-25 09:15',
      fromToken: 'ETH',
      toToken: 'BNB',
      amount: '2.0',
      received: '15.6',
      status: 'en proceso',
      txHash: '0x5678...efgh'
    },
    {
      id: '3',
      date: '2024-06-24 16:45',
      fromToken: 'ATOM',
      toToken: 'BTC',
      amount: '100',
      received: '0.025',
      status: 'fallido',
      txHash: '0x9012...ijkl'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado': return 'text-green-500 bg-green-500/10';
      case 'en proceso': return 'text-yellow-500 bg-yellow-500/10';
      case 'fallido': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completado': return '✅';
      case 'en proceso': return '⏳';
      case 'fallido': return '❌';
      default: return '⭕';
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
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Conecta tu wallet para ver el historial
          </h2>
          <p className="text-muted-foreground mb-8">
            El historial de transacciones está vinculado a tu wallet conectada
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Conectar Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Historial de Swaps
          </h1>
          <p className="text-muted-foreground">
            Revisa todas tus transacciones cross-chain
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
        >
          {/* Header */}
          <div className="bg-background border-b border-border px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
              <div className="md:col-span-2">Transacción</div>
              <div>Fecha</div>
              <div>Cantidad</div>
              <div>Estado</div>
              <div>Hash</div>
            </div>
          </div>

          {/* Transactions */}
          <div className="divide-y divide-border">
            {mockTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="px-6 py-4 hover:bg-accent/50 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Transaction Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">{tx.fromToken}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">{tx.toToken}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-muted-foreground">
                    {tx.date}
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {tx.amount} {tx.fromToken}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      → {tx.received} {tx.toToken}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      <span>{getStatusIcon(tx.status)}</span>
                      <span className="capitalize">{tx.status}</span>
                    </span>
                  </div>

                  {/* Hash */}
                  <div>
                    <button className="text-sm text-primary hover:text-primary/80 font-mono transition-colors">
                      {tx.txHash}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State (if no transactions) */}
          {mockTransactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No hay transacciones aún
              </h3>
              <p className="text-muted-foreground">
                Tus swaps aparecerán aquí una vez que realices tu primera transacción
              </p>
            </div>
          )}
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        >
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-foreground mb-2">
              {mockTransactions.length}
            </div>
            <div className="text-muted-foreground">Total Swaps</div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-green-500 mb-2">
              {mockTransactions.filter(tx => tx.status === 'completado').length}
            </div>
            <div className="text-muted-foreground">Completados</div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              $12,450
            </div>
            <div className="text-muted-foreground">Volumen Total</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default History;
