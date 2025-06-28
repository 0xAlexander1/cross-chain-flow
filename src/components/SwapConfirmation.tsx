
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Send, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SwapConfirmationProps {
  swapDetails: {
    depositAddress: string;
    memo: string;
    expectedOutput: string;
    expiresIn: number;
    provider?: string;
    estimatedTime?: string | object;
    fromAsset: any;
    toAsset: any;
    exactAmount: string;
    recipient: string;
    fees?: any[];
    priceImpact?: number;
  };
  onConfirm: (txHash: string) => void;
  onBack: () => void;
}

export const SwapConfirmation: React.FC<SwapConfirmationProps> = ({
  swapDetails,
  onConfirm,
  onBack
}) => {
  const { toast } = useToast();
  const [txHash, setTxHash] = useState('');
  const [showTxInput, setShowTxInput] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive"
      });
    }
  };

  const handleConfirmSent = () => {
    if (!txHash.trim()) {
      toast({
        title: "Hash requerido",
        description: "Por favor ingresa el hash de la transacción",
        variant: "destructive"
      });
      return;
    }
    onConfirm(txHash.trim());
  };

  const expiryMinutes = Math.floor(swapDetails.expiresIn / 60);

  // Format estimated time - handle both string and object formats
  const formatEstimatedTime = (estimatedTime: string | object | undefined) => {
    if (!estimatedTime) return '5-10 minutos';
    
    if (typeof estimatedTime === 'string') {
      return estimatedTime;
    }
    
    if (typeof estimatedTime === 'object' && estimatedTime !== null) {
      const timeObj = estimatedTime as any;
      if (timeObj.total) {
        const totalMinutes = Math.ceil(timeObj.total / 60);
        return `~${totalMinutes} minutos`;
      }
    }
    
    return '5-10 minutos';
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Button>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Expira en {expiryMinutes} min</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Confirmar Swap
          </h2>
          <p className="text-muted-foreground">
            Revisa los detalles antes de enviar los fondos
          </p>
        </div>

        {/* Swap Overview */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {swapDetails.fromAsset?.logoURI && (
                <img 
                  src={swapDetails.fromAsset.logoURI} 
                  alt={swapDetails.fromAsset.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-semibold">
                  {swapDetails.exactAmount} {swapDetails.fromAsset?.ticker}
                </div>
                <div className="text-sm text-muted-foreground">
                  {swapDetails.fromAsset?.name}
                </div>
              </div>
            </div>
            
            <div className="text-muted-foreground">→</div>
            
            <div className="flex items-center space-x-3">
              {swapDetails.toAsset?.logoURI && (
                <img 
                  src={swapDetails.toAsset.logoURI} 
                  alt={swapDetails.toAsset.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-right">
                <div className="font-semibold">
                  ~{swapDetails.expectedOutput} {swapDetails.toAsset?.ticker}
                </div>
                <div className="text-sm text-muted-foreground">
                  {swapDetails.toAsset?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider and Time Info */}
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          {swapDetails.provider && (
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Proveedor: {swapDetails.provider}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Tiempo estimado: {formatEstimatedTime(swapDetails.estimatedTime)}</span>
          </div>
        </div>

        {/* Price Impact Warning */}
        {swapDetails.priceImpact && Math.abs(swapDetails.priceImpact) > 1 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-600 mb-1">Impacto en el precio</h4>
                <p className="text-sm text-foreground">
                  Este swap tiene un impacto del {Math.abs(swapDetails.priceImpact).toFixed(2)}% en el precio. 
                  Considera dividir la operación en partes más pequeñas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Instrucciones de Envío
          </h3>
          
          {/* Step 1: Amount */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">
                1. Envía exactamente:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(swapDetails.exactAmount, 'Cantidad')}
                className="h-auto p-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="font-mono text-lg font-bold text-foreground">
              {swapDetails.exactAmount} {swapDetails.fromAsset?.ticker}
            </div>
          </div>

          {/* Step 2: Address */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-600">
                2. A esta dirección:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(swapDetails.depositAddress, 'Dirección')}
                className="h-auto p-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="font-mono text-sm text-foreground break-all bg-background rounded px-3 py-2">
              {swapDetails.depositAddress}
            </div>
          </div>

          {/* Step 3: Memo */}
          {swapDetails.memo && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-600">
                  3. Con este memo/tag:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(swapDetails.memo, 'Memo')}
                  className="h-auto p-1"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="font-mono text-sm text-foreground break-all bg-background rounded px-3 py-2">
                {swapDetails.memo}
              </div>
            </div>
          )}
        </div>

        {/* Fees Information */}
        {swapDetails.fees && swapDetails.fees.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Comisiones estimadas:</h4>
            <div className="space-y-1">
              {swapDetails.fees.slice(0, 3).map((fee: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{fee.type}:</span>
                  <span className="font-mono">{fee.amount} {fee.asset?.split('.')[1] || fee.asset}</span>
                </div>
              ))}
              {swapDetails.fees.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{swapDetails.fees.length - 3} comisiones más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">
            Los fondos se enviarán a:
          </div>
          <div className="font-mono text-sm text-foreground break-all">
            {swapDetails.recipient}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-600 mb-1">Importante</h4>
              <ul className="text-sm text-foreground space-y-1">
                <li>• Envía exactamente la cantidad especificada</li>
                <li>• No olvides incluir el memo/tag si es requerido</li>
                <li>• Verifica que la dirección sea correcta</li>
                <li>• El proceso es irreversible</li>
                <li>• Tienes {expiryMinutes} minutos para completar el envío</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!showTxInput ? (
            <Button
              onClick={() => setShowTxInput(true)}
              className="w-full"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              He enviado los fondos
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hash de la transacción:
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Pega aquí el hash de tu transacción..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground font-mono text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTxInput(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSent}
                  className="flex-1"
                >
                  Confirmar Envío
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
