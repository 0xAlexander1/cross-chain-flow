import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, DollarSign, TrendingDown, AlertTriangle, Zap, Waves, RotateCcw } from 'lucide-react';
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
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'MAYACHAIN':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'CHAINFLIP':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'THORCHAIN':
        return <Zap className="w-6 h-6 text-green-600" />;
      case 'MAYACHAIN':
        return <Waves className="w-6 h-6 text-blue-600" />;
      case 'CHAINFLIP':
        return <RotateCcw className="w-6 h-6 text-purple-600" />;
      default:
        return <div className="w-6 h-6 bg-gray-400 rounded-full" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'THORCHAIN':
        return 'Red descentralizada multi-cadena con alta liquidez';
      case 'MAYACHAIN':
        return 'Fork de THORChain optimizado para privacidad';
      case 'CHAINFLIP':
        return 'Protocolo de swaps nativos sin wrapped tokens';
      default:
        return 'Proveedor de intercambio descentralizado';
    }
  };

  const formatFees = (fees: any[]) => {
    if (!fees || fees.length === 0) return 'N/A';
    
    // Buscar fees en USD primero
    const usdFees = fees.filter(fee => 
      fee.asset && (fee.asset.includes('USDC') || fee.asset.includes('USDT'))
    );
    
    if (usdFees.length > 0) {
      const totalUSD = usdFees.reduce((sum, fee) => sum + parseFloat(fee.amount || '0'), 0);
      return `$${totalUSD.toFixed(2)}`;
    }
    
    // Si no hay fees en USD, mostrar el primer fee significativo
    const significantFee = fees.find(fee => parseFloat(fee.amount || '0') > 0);
    if (significantFee) {
      return `${parseFloat(significantFee.amount).toFixed(6)} ${significantFee.asset?.split('.')[1] || significantFee.asset}`;
    }
    
    return `${fees.length} fees`;
  };

  const getBestRouteIndex = () => {
    if (routes.length <= 1) return 0;
    
    // Ordenar por mejor salida esperada (mayor cantidad recibida)
    const sortedByOutput = [...routes].sort((a, b) => 
      parseFloat(b.expectedOutput) - parseFloat(a.expectedOutput)
    );
    
    return routes.findIndex(route => route === sortedByOutput[0]);
  };

  const bestRouteIndex = getBestRouteIndex();

  // Handle empty routes case
  if (!routes || routes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-lg"
      >
        <div className="text-center py-8">
          <div className="mb-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sin rutas disponibles
          </h2>
          <p className="text-muted-foreground mb-6">
            No se encontraron proveedores para el swap de {amount} {fromAsset?.ticker} → {toAsset?.ticker}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Verifica que los tokens sean compatibles</p>
            <p>• Intenta con una cantidad diferente</p>
            <p>• Algunos proveedores pueden estar temporalmente no disponibles</p>
          </div>
          <Button onClick={onBack} className="mt-6">
            Volver al formulario
          </Button>
        </div>
      </motion.div>
    );
  }

  if (selectedRoute) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getProviderIcon(selectedRoute.provider)}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {selectedRoute.provider}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getProviderDescription(selectedRoute.provider)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSelectedRoute(null)}>
            Cambiar Proveedor
          </Button>
        </div>

        <div className="space-y-6">
          {/* Provider Performance Card */}
          <Card className={getProviderColor(selectedRoute.provider)}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getProviderIcon(selectedRoute.provider)}
                <span>Detalles del Proveedor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tiempo estimado:</span>
                  <p className="font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedRoute.estimatedTime}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Impacto en precio:</span>
                  <p className="font-semibold flex items-center">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {Math.abs(selectedRoute.priceImpact).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Comisiones totales:</span>
                  <p className="font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatFees(selectedRoute.fees)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Salida esperada:</span>
                  <p className="font-semibold text-green-600">
                    {parseFloat(selectedRoute.expectedOutput).toFixed(6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <div className="bg-background rounded-lg p-4 border border-border space-y-4">
            <h3 className="font-semibold text-foreground mb-3">Resumen de la transacción</h3>
            
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
            </div>
          </div>

          {/* Deposit Address */}
          {selectedRoute.depositAddress && (
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">Dirección de depósito</h3>
              <p className="font-mono text-sm bg-background p-3 rounded border break-all">
                {selectedRoute.depositAddress}
              </p>
            </div>
          )}

          {/* Memo */}
          {selectedRoute.memo && (
            <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
              <h3 className="font-semibold text-secondary-foreground mb-2">Memo/Nota</h3>
              <p className="font-mono text-sm bg-background p-3 rounded border break-all">
                {selectedRoute.memo}
              </p>
            </div>
          )}

          {/* Warnings */}
          {selectedRoute.warnings && selectedRoute.warnings.length > 0 && (
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
              Confirmar Swap con {selectedRoute.provider}
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
            className={`cursor-pointer transition-all hover:shadow-md ${getProviderColor(route.provider)} ${
              index === bestRouteIndex ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setSelectedRoute(route)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getProviderIcon(route.provider)}
                  <div>
                    <h3 className="font-semibold text-lg">{route.provider}</h3>
                    <p className="text-xs text-muted-foreground">
                      {getProviderDescription(route.provider)}
                    </p>
                    {index === bestRouteIndex && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mt-1">
                        <Check className="w-3 h-3 mr-1" />
                        Mejor opción
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">
                    {parseFloat(route.expectedOutput).toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {toAsset?.ticker}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
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
                    <span>{Math.abs(route.priceImpact).toFixed(2)}%</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  Ver detalles
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
