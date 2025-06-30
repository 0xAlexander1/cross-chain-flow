
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useSwapAssets } from '../hooks/useSwapAssets';

interface TokenSelectorProps {
  value: string;
  onChange: (token: string) => void;
  label: string;
  excludeToken?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  value, 
  onChange, 
  label, 
  excludeToken 
}) => {
  const { assets, loading, error, debugInfo, usingFallback, refetch } = useSwapAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const selectedAsset = assets.find(asset => 
    asset.identifier === value || 
    asset.ticker === value ||
    asset.symbol === value
  );
  
  const filteredAssets = assets.filter(asset => 
    asset.identifier !== excludeToken &&
    asset.ticker !== excludeToken &&
    asset.symbol !== excludeToken &&
    (asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
     asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     asset.chain.toLowerCase().includes(searchTerm.toLowerCase()) ||
     asset.identifier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-background rounded-lg p-4 border border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-24 mb-2"></div>
          <div className="h-8 bg-muted rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        
        {/* Debug/Status indicators */}
        <div className="flex items-center space-x-2">
          {usingFallback && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-600">Fallback data</span>
            </div>
          )}
          
          {error && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700"
            >
              <Info className="w-4 h-4" />
              <span>Debug</span>
            </button>
          )}
          
          <button
            onClick={refetch}
            className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh tokens"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Debug info panel */}
      {showDebug && (error || debugInfo) && (
        <div className="mb-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs">
          <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Debug Info:</div>
          {error && (
            <div className="text-red-700 dark:text-red-300 mb-1">Error: {error}</div>
          )}
          {debugInfo && (
            <pre className="text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background rounded-lg p-4 border border-border flex justify-between items-center hover:border-primary/50 transition-colors group"
      >
        <div className="flex items-center space-x-3">
          {selectedAsset?.logoURI ? (
            <img 
              src={selectedAsset.logoURI} 
              alt={selectedAsset.name || selectedAsset.ticker}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm ${selectedAsset?.logoURI ? 'hidden' : ''}`}>
            {selectedAsset?.ticker?.charAt(0) || '?'}
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {selectedAsset?.ticker || 'Seleccionar Token'}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedAsset?.name || selectedAsset?.chain || 'Selecciona un token'}
              {selectedAsset?.supportedProviders && (
                <span className="ml-2 text-xs text-blue-600">
                  ({selectedAsset.supportedProviders.join(', ')})
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform text-muted-foreground group-hover:text-primary ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <button
                    key={asset.identifier}
                    onClick={() => {
                      onChange(asset.identifier);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full p-3 hover:bg-accent flex items-center space-x-3 transition-colors group"
                  >
                    {asset.logoURI ? (
                      <img 
                        src={asset.logoURI} 
                        alt={asset.name || asset.ticker}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm ${asset.logoURI ? 'hidden' : ''}`}>
                      {asset.ticker?.charAt(0) || '?'}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {asset.ticker}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.name} • {asset.chain}
                        {asset.supportedProviders && (
                          <span className="ml-1 text-xs text-blue-600">
                            ({asset.supportedProviders.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {asset.decimals} dec
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No se encontraron tokens
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Prueba con otro término de búsqueda
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

export default TokenSelector;
