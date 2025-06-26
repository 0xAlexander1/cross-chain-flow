
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
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
  const { assets, loading } = useSwapAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedAsset = assets.find(asset => asset.symbol === value);
  
  const filteredAssets = assets.filter(asset => 
    asset.symbol !== excludeToken &&
    (asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     asset.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background rounded-lg p-4 border border-border flex justify-between items-center hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
            {selectedAsset?.symbol.charAt(0) || '?'}
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground">{selectedAsset?.symbol || 'Select'}</div>
            <div className="text-sm text-muted-foreground">{selectedAsset?.network}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    onChange(asset.symbol);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full p-3 hover:bg-accent flex items-center space-x-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {asset.symbol.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">{asset.name} • {asset.network}</div>
                  </div>
                </button>
              ))}
              
              {filteredAssets.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No tokens found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TokenSelector;
