
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createErrorResponse = (message: string, statusCode: number = 500) => {
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    }
  );
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    }
  );
};

export const createNoRoutesResponse = () => {
  return new Response(
    JSON.stringify({ 
      routes: [], 
      expiresIn: 0, 
      bestRoute: null,
      debug: 'No routes found from providers'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
};
