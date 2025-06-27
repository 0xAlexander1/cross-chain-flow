
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface SwapProgressProps {
  txHash: string;
  swapDetails: any;
  onNewSwap: () => void;
  getSwapStatus: (txHash: string) => Promise<any>;
}

export const SwapProgress: React.FC<SwapProgressProps> = ({
  txHash,
  swapDetails,
  onNewSwap,
  getSwapStatus
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkSwapStatus();
    const interval = setInterval(checkSwapStatus, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [txHash]);

  const checkSwapStatus = async () => {
    try {
      setLoading(true);
      const statusData = await getSwapStatus(txHash);
      console.log('Swap status:', statusData);
      
      setStatus(statusData);
      
      // Update progress based on status
      switch (statusData.status?.toLowerCase()) {
        case 'pending':
          setProgress(25);
          break;
        case 'observed':
        case 'processing':
          setProgress(50);
          break;
        case 'confirming':
          setProgress(75);
          break;
        case 'completed':
        case 'success':
          setProgress(100);
          break;
        default:
          setProgress(10);
      }
      
    } catch (error) {
      console.error('Error checking swap status:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del swap",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) {
      return <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    }

    switch (status?.status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-primary" />;
    }
  };

  const getStatusText = () => {
    if (loading) return 'Verificando estado...';
    
    switch (status?.status?.toLowerCase()) {
      case 'pending':
        return 'Transacción pendiente';
      case 'observed':
        return 'Transacción detectada';
      case 'processing':
        return 'Procesando swap';
      case 'confirming':
        return 'Confirmando transacción';
      case 'completed':
      case 'success':
        return 'Swap completado exitosamente';
      case 'failed':
      case 'error':
        return 'Swap falló';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusColor = () => {
    switch (status?.status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-primary';
    }
  };

  const isCompleted = status?.status?.toLowerCase() === 'completed' || status?.status?.toLowerCase() === 'success';
  const isFailed = status?.status?.toLowerCase() === 'failed' || status?.status?.toLowerCase() === 'error';

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Estado del Swap
          </h2>
          <p className="text-muted-foreground">
            Seguimiento en tiempo real de tu intercambio
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Status Card */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon()}
            <div>
              <div className={`font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {status?.observedIn && (
                <div className="text-sm text-muted-foreground">
                  Red: {status.observedIn}
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hash de entrada:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm">
                  {txHash.slice(0, 8)}...{txHash.slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => window.open(`https://blockchair.com/search?q=${txHash}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {status?.finalTxHash && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hash de salida:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">
                    {status.finalTxHash.slice(0, 8)}...{status.finalTxHash.slice(-8)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => window.open(status.finalTxExplorerUrl || `https://blockchair.com/search?q=${status.finalTxHash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {status?.inAmount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cantidad enviada:</span>
                <span className="font-mono text-sm">
                  {status.inAmount} {swapDetails?.fromAsset?.ticker}
                </span>
              </div>
            )}

            {status?.outAmount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cantidad recibida:</span>
                <span className="font-mono text-sm">
                  {status.outAmount} {swapDetails?.toAsset?.ticker}
                </span>
              </div>
            )}

            {status?.provider && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Proveedor:</span>
                <span className="text-sm font-medium">{status.provider}</span>
              </div>
            )}

            {status?.timestamp && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última actualización:</span>
                <span className="text-sm">
                  {new Date(status.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {isCompleted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-600 mb-1">¡Swap Completado!</h4>
                <p className="text-sm text-foreground">
                  Tu intercambio se ha completado exitosamente. Los fondos han sido enviados a tu dirección de destino.
                </p>
              </div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-600 mb-1">Swap Falló</h4>
                <p className="text-sm text-foreground">
                  Hubo un problema con tu swap. Los fondos deberían ser devueltos automáticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isCompleted && !isFailed && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-600 mb-1">Procesando</h4>
                <p className="text-sm text-foreground">
                  Tu swap está siendo procesado. Esto puede tomar algunos minutos dependiendo de la red.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={checkSwapStatus}
            disabled={loading}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Actualizar Estado
          </Button>
          
          <Button
            onClick={onNewSwap}
            className="flex-1"
          >
            Nuevo Swap
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
