
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

    // Lista de providers que queremos consultar
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
          return [];
        }

        const data = await response.json();
        console.log(`Received ${data?.length || 0} tokens from ${provider}`);
        
        // Asegurar que devuelve un array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn(`Failed to fetch tokens for ${provider}:`, error);
        return [];
      }
    });

    // Espera todas las peticiones
    const results = await Promise.all(promises);
    
    // Combina arrays y filtra elementos válidos
    const combined = results.flat().filter(token => 
      token && 
      typeof token === 'object' && 
      (token.identifier || token.symbol || token.ticker)
    );
    
    console.log(`Combined ${combined.length} tokens before deduplication`);

    // Elimina duplicados por identifier (o symbol si no hay identifier)
    const tokenMap = new Map();
    combined.forEach(token => {
      const key = token.identifier || token.symbol || token.ticker;
      if (key && !tokenMap.has(key)) {
        // Normalizar estructura del token
        tokenMap.set(key, {
          symbol: token.symbol || token.ticker,
          chain: token.chain,
          decimals: token.decimals || 18,
          name: token.name || token.symbol || token.ticker,
          logoURI: token.logoURI,
          identifier: token.identifier || `${token.chain}.${token.symbol}`,
          ticker: token.ticker || token.symbol,
          coingeckoId: token.coingeckoId,
          address: token.address
        });
      }
    });

    const assets = Array.from(tokenMap.values());
    console.log(`Successfully processed ${assets.length} unique tokens`);

    return new Response(
      JSON.stringify({ assets }),
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
