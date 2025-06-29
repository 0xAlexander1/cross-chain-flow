
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
    console.log('Fetching supported tokens from SwapKit API...');
    
    const swapkitApiKey = Deno.env.get('SWAPKIT_API_KEY');
    if (!swapkitApiKey) {
      throw new Error('SWAPKIT_API_KEY not found in environment variables');
    }

    // Lista de providers en orden de preferencia
    const providers = ['MAYACHAIN', 'THORCHAIN', 'CHAINFLIP'];
    
    console.log(`Fetching tokens from providers: ${providers.join(', ')}`);

    // Para cada provider, consulta /tokens?provider=...
    const promises = providers.map(async (provider) => {
      try {
        console.log(`Fetching tokens for provider: ${provider}`);
        const response = await fetch(`https://api.swapkit.dev/tokens?provider=${provider}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': swapkitApiKey
          }
        });

        if (!response.ok) {
          console.warn(`Error fetching tokens for ${provider}: ${response.status} ${response.statusText}`);
          return { provider, tokens: [] };
        }

        const data = await response.json();
        const tokens = Array.isArray(data) ? data : [];
        console.log(`Received ${tokens.length} tokens from ${provider}`);
        
        return { provider, tokens };
      } catch (error) {
        console.warn(`Failed to fetch tokens for ${provider}:`, error);
        return { provider, tokens: [] };
      }
    });

    // Espera todas las peticiones
    const results = await Promise.all(promises);
    
    // Combina tokens de todos los providers y los normaliza
    const allTokens = [];
    const providerStats = {};

    results.forEach(({ provider, tokens }) => {
      providerStats[provider] = tokens.length;
      
      tokens.forEach(token => {
        if (token && typeof token === 'object' && (token.identifier || token.symbol || token.ticker)) {
          allTokens.push({
            ...token,
            supportedProviders: [provider], // Track which provider supports this token
            preferredProvider: provider
          });
        }
      });
    });

    console.log('Provider stats:', providerStats);
    console.log(`Combined ${allTokens.length} tokens before deduplication`);

    // Elimina duplicados por identifier y combina providers
    const tokenMap = new Map();
    allTokens.forEach(token => {
      const key = token.identifier || `${token.chain}.${token.symbol || token.ticker}`;
      
      if (tokenMap.has(key)) {
        // Token ya existe, añadir provider a la lista
        const existing = tokenMap.get(key);
        if (!existing.supportedProviders.includes(token.preferredProvider)) {
          existing.supportedProviders.push(token.preferredProvider);
        }
      } else {
        // Normalizar estructura del token
        tokenMap.set(key, {
          symbol: token.symbol || token.ticker,
          chain: token.chain,
          decimals: token.decimals || 18,
          name: token.name || token.symbol || token.ticker,
          logoURI: token.logoURI,
          identifier: token.identifier || `${token.chain}.${token.symbol || token.ticker}`,
          ticker: token.ticker || token.symbol,
          coingeckoId: token.coingeckoId,
          address: token.address,
          supportedProviders: [token.preferredProvider],
          preferredProvider: token.preferredProvider // El primer provider encontrado
        });
      }
    });

    const assets = Array.from(tokenMap.values());
    console.log(`Successfully processed ${assets.length} unique tokens`);

    return new Response(
      JSON.stringify({ 
        assets,
        providerStats,
        totalProviders: providers.length 
      }),
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
        message: error.message 
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
