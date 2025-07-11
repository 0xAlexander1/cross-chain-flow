
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const swapkitApiKey = Deno.env.get('SWAPKIT_API_KEY');
    if (!swapkitApiKey) {
      console.error('SWAPKIT_API_KEY not found in environment variables');
      throw new Error('SWAPKIT_API_KEY not configured');
    }

    // Lista de providers en orden de preferencia
    const providers = ['MAYACHAIN', 'THORCHAIN', 'CHAINFLIP'];
    
    if (Deno.env.get('DEBUG')) {
      console.log(`Fetching tokens from providers: ${providers.join(', ')}`);
    }

    // Para cada provider, consulta /tokens?provider=...
    const promises = providers.map(async (provider) => {
      try {
        const url = `https://api.swapkit.dev/tokens?provider=${provider}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': swapkitApiKey
          }
        });

        if (Deno.env.get('DEBUG')) {
          console.log(`Response status for ${provider}: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response for ${provider}:`, errorText);
          return { provider, tokens: [], error: `${response.status}: ${errorText}` };
        }

        const data = await response.json();
        
        // Verificar el formato de la respuesta
        let tokens = [];
        if (Array.isArray(data)) {
          tokens = data;
        } else if (data && Array.isArray(data.tokens)) {
          tokens = data.tokens;
        } else if (data && Array.isArray(data.data)) {
          tokens = data.data;
        } else {
          console.warn(`Unexpected response format for ${provider}:`, typeof data);
          return { provider, tokens: [], error: 'Unexpected response format' };
        }
        
        if (Deno.env.get('DEBUG')) {
          console.log(`Successfully received ${tokens.length} tokens from ${provider}`);
        }
        
        return { provider, tokens, error: null };
      } catch (error) {
        console.error(`Failed to fetch tokens for ${provider}:`, error.message);
        return { provider, tokens: [], error: error.message };
      }
    });

    // Espera todas las peticiones
    const results = await Promise.all(promises);
    
    // Analizar resultados y estadísticas
    const providerStats = {};
    const providerErrors = {};
    let totalTokensReceived = 0;

    results.forEach(({ provider, tokens, error }) => {
      if (error) {
        providerStats[provider] = 'error';
        providerErrors[provider] = error;
      } else {
        providerStats[provider] = tokens.length;
        totalTokensReceived += tokens.length;
      }
    });

    // Si todos los providers fallan, devolver error
    const successfulProviders = results.filter(r => !r.error && r.tokens.length > 0);
    if (successfulProviders.length === 0) {
      console.error('All providers failed or returned empty results');
      return new Response(
        JSON.stringify({ 
          error: 'All providers failed',
          providerStats,
          providerErrors,
          debug: 'Check API key and provider endpoints'
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 500
        }
      );
    }

    // Combina tokens de todos los providers y los normaliza
    const allTokens = [];
    results.forEach(({ provider, tokens, error }) => {
      if (error) return;
      
      tokens.forEach(token => {
        if (token && typeof token === 'object') {
          // Normalizar la estructura del token
          const normalizedToken = {
            symbol: token.symbol || token.ticker || 'UNKNOWN',
            chain: token.chain || 'UNKNOWN',
            decimals: token.decimals || 18,
            name: token.name || token.symbol || token.ticker || 'Unknown Token',
            logoURI: token.logoURI || token.logo || null,
            identifier: token.identifier || `${token.chain}.${token.symbol || token.ticker}`,
            ticker: token.ticker || token.symbol || 'UNKNOWN',
            coingeckoId: token.coingeckoId || null,
            address: token.address || null,
            supportedProviders: [provider],
            preferredProvider: provider
          };
          
          allTokens.push(normalizedToken);
        }
      });
    });

    // Elimina duplicados por identifier y combina providers
    const tokenMap = new Map();
    allTokens.forEach(token => {
      const key = token.identifier;
      
      if (tokenMap.has(key)) {
        // Token ya existe, añadir provider a la lista
        const existing = tokenMap.get(key);
        if (!existing.supportedProviders.includes(token.preferredProvider)) {
          existing.supportedProviders.push(token.preferredProvider);
        }
      } else {
        tokenMap.set(key, token);
      }
    });

    const assets = Array.from(tokenMap.values());
    
    const response = {
      assets,
      providerStats,
      providerErrors: Object.keys(providerErrors).length > 0 ? providerErrors : undefined,
      totalProviders: providers.length,
      debug: {
        totalTokensReceived,
        uniqueTokensAfterDedup: assets.length,
        successfulProviders: successfulProviders.length
      }
    };

    if (Deno.env.get('DEBUG')) {
      console.log('Final response summary:', {
        totalAssets: assets.length,
        providerStats,
        hasErrors: Object.keys(providerErrors).length > 0
      });
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-supported-assets:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch supported assets',
        message: error.message,
        debug: 'Check function logs for detailed error information'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
