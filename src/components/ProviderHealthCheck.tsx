
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProviderStatus {
  available: boolean;
  functional: boolean;
  issues: string[];
}

interface IntegrationStatus {
  thorchain: ProviderStatus;
  mayachain: ProviderStatus;
  chainflip: ProviderStatus;
}

const ProviderHealthCheck: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [testReport, setTestReport] = useState<any>(null);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    setTesting(true);
    
    try {
      // Test with a standard BTC to ETH swap
      const { data, error } = await supabase.functions.invoke('get-swap-details', {
        body: {
          fromAsset: 'BTC.BTC',
          toAsset: 'ETH.ETH',
          amount: '0.001',
          recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.integrationStatus) {
        setIntegrationStatus(data.integrationStatus);
      }

      toast({
        title: "Health Check Completado",
        description: `Se encontraron ${data.routes?.length || 0} rutas disponibles`,
      });

    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Error en Health Check",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const runIntegrationTests = async () => {
    setTesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-swap-details', {
        body: {
          action: 'test-integrations'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setTestReport(data.report);
      
      toast({
        title: "Tests de Integración Completados",
        description: `${data.report.summary.passed}/${data.report.summary.totalTests} tests pasaron (${data.report.summary.successRate}%)`,
      });

    } catch (error) {
      console.error('Integration tests failed:', error);
      toast({
        title: "Error en Tests de Integración",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: ProviderStatus) => {
    if (!status.available) return <XCircle className="w-5 h-5 text-red-500" />;
    if (!status.functional) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = (status: ProviderStatus) => {
    if (!status.available) return 'No disponible';
    if (!status.functional) return 'Disponible con problemas';
    return 'Funcional';
  };

  const getStatusColor = (status: ProviderStatus) => {
    if (!status.available) return 'border-red-200 bg-red-50';
    if (!status.functional) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Health Check de Proveedores</h2>
        <div className="flex space-x-2">
          <Button
            onClick={runHealthCheck}
            disabled={testing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>Health Check</span>
          </Button>
          
          <Button
            onClick={runIntegrationTests}
            disabled={testing}
            className="flex items-center space-x-2"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>Tests Completos</span>
          </Button>
        </div>
      </div>

      {integrationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(integrationStatus).map(([provider, status]) => (
            <Card key={provider} className={getStatusColor(status)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <span className="capitalize">{provider}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{getStatusText(status)}</p>
                  
                  {status.issues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-600">Problemas:</p>
                      {status.issues.map((issue, index) => (
                        <p key={index} className="text-xs text-red-600">• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {testReport && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Tests de Integración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{testReport.summary.passed}</p>
                <p className="text-sm text-muted-foreground">Pasaron</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{testReport.summary.failed}</p>
                <p className="text-sm text-muted-foreground">Fallaron</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{testReport.summary.totalTests}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{testReport.summary.successRate}%</p>
                <p className="text-sm text-muted-foreground">Éxito</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Detalles por Proveedor:</h4>
              {Object.entries(testReport.providers).map(([provider, data]: [string, any]) => (
                <div key={provider} className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="capitalize font-medium">{provider}</span>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">✓ {data.passed}</span>
                    <span className="text-red-600">✗ {data.failed}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-muted rounded">
              <p className="text-xs text-muted-foreground">
                Última prueba: {new Date(testReport.timestamp).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!integrationStatus && !testReport && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ejecuta un health check para verificar el estado de los proveedores
            </p>
            <Button onClick={runHealthCheck} disabled={testing}>
              {testing ? 'Ejecutando...' : 'Ejecutar Health Check'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderHealthCheck;
