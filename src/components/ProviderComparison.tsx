
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SwapRoute {
  provider: string;
  depositAddress: string;
  memo: string;
  expectedOutput: string;
  expectedOutputMaxSlippage: string;
  fees: any[];
  estimatedTime: string;
  priceImpact: number;
  warnings: string[];
  totalFees: number;
}

interface ProviderComparisonProps {
  routes: SwapRoute[];
  fromAsset: any;
  toAsset: any;
  amount: string;
  onSelectProvider: (route: SwapRoute) => void;
  onBack: () => void;
}

const ProviderComparison: React.FC<ProviderComparisonProps> = ({
  routes,
  fromAsset,
  toAsset,
  amount,
  onSelectProvider,
  onBack
}) => {
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);

  const getProviderColor = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'THORCHAIN':
        return 'border-green-500 bg-green-50';
      case 'MAYACHAIN':
        return 'border-blue-500 bg-blue-50';
      case 'CHAINFLIP':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'THORCHAIN':
        return '⚡';
      case 'MAYACHAIN':
        return '🌊';
      case 'CHAINFLIP':
        return '🔄';
      default:
        return '🔗';
    }
  };

  const formatFees = (fees: any[]) => {
    if (!fees || fees.length === 0) return 'N/A';
    
    const totalUSD = fees
      .filter(fee => fee.asset && fee.asset.includes('USDC'))
      .reduce((sum, fee) => sum + parseFloat(fee.amount || '0'), 0);
    
    if (totalUSD > 0) {
      return `$${totalUSD.toFixed(2)}`;
    }
    
    return `${fees.length} fees`;
  };

  if (selectedRoute) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Detalles del Swap - {selectedRoute.provider}
          </h2>
          <Button variant="outline" onClick={() => setSelectedRoute(null)}>
            Cambiar Proveedor
          </Button>
        </div>

        <div className="space-y-6">
          {/* Provider Info */}
          <Card className={getProviderColor(selectedRoute.provider)}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">{getProviderIcon(selectedRoute.provider)}</span>
                <span>{selectedRoute.provider}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tiempo estimado:</span>
                  <p className="font-semibold">{selectedRoute.estimatedTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Impacto en precio:</span>
                  <p className="font-semibold">{selectedRoute.priceImpact}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <div className="bg-background rounded-lg p-4 border border-border space-y-4">
            <h3 className="font-semibold text-foreground mb-3">Detalles de la transacción</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envías:</span>
                <span className="font-semibold">{amount} {fromAsset?.ticker}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recibes (estimado):</span>
                <span className="font-semibold text-green-600">
                  {parseFloat(selectedRoute.expectedOutput).toFixed(6)} {toAsset?.ticker}
                </span>
              </div>
              
              {selectedRoute.expectedOutputMaxSlippage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mínimo garantizado:</span>
                  <span className="font-semibold text-orange-600">
                    {parseFloat(selectedRoute.expectedOutputMaxSlippage).toFixed(6)} {toAsset?.ticker}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisiones totales:</span>
                <span className="font-semibold">{formatFees(selectedRoute.fees)}</span>
              </div>
            </div>
          </div>

          {/* Deposit Address */}
          {selectedRoute.depositAddress && (
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">Dirección de depósito</h3>
              <p className="font-mono text-sm bg-background p-2 rounded break-all">
                {selectedRoute.depositAddress}
              </p>
            </div>
          )}

          {/* Memo */}
          {selectedRoute.memo && (
            <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
              <h3 className="font-semibold text-secondary-foreground mb-2">Memo/Nota</h3>
              <p className="font-mono text-sm bg-background p-2 rounded break-all">
                {selectedRoute.memo}
              </p>
            </div>
          )}

          {/* Warnings */}
          {selectedRoute.warnings.length > 0 && (
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-1">Advertencias</h3>
                  {selectedRoute.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-700">{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={() => onSelectProvider(selectedRoute)}
              className="flex-1"
            >
              Confirmar Swap
            </Button>
            <Button variant="outline" onClick={onBack}>
              Volver
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Comparar Proveedores
        </h2>
        <p className="text-muted-foreground">
          Elige el mejor proveedor para tu swap de {amount} {fromAsset?.ticker} → {toAsset?.ticker}
        </p>
      </div>

      <div className="space-y-4">
        {routes.map((route, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-md ${getProviderColor(route.provider)}`}
            onClick={() => setSelectedRoute(route)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getProviderIcon(route.provider)}</span>
                  <div>
                    <h3 className="font-semibold">{route.provider}</h3>
                    {index === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Recomendado
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {parseFloat(route.expectedOutput).toFixed(6)} {toAsset?.ticker}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {route.estimatedTime}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{route.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatFees(route.fees)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>{route.priceImpact}%</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  Seleccionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6">
        <Button variant="outline" onClick={onBack} className="w-full">
          Volver al formulario
        </Button>
      </div>
    </motion.div>
  );
};

export default ProviderComparison;
