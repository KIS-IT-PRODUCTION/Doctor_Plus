// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Дозволяє будь-якому домену доступ
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Можна додати, якщо потрібно
};