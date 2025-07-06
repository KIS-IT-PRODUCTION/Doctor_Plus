// supabase/functions/init-liqpay-payment/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Buffer } from 'https://esm.sh/buffer';
import sha1 from 'https://esm.sh/js-sha1';

// Отримуємо з Supabase Secrets - ЦЕ КРИТИЧНО!
// Переконайтеся, що ці змінні оточення (Secrets) налаштовані у вашому проекті Supabase.
const LIQPAY_PUBLIC_KEY = Deno.env.get('LIQPAY_PUBLIC_KEY') || '';
const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY') || ''; // Той самий, що і для callback

// URL вашої liqpay-callback функції (куди LiqPay надішле POST-запит про статус)
// Цей URL має бути актуальним для вашого проекту.
const LIQPAY_CALLBACK_SERVER_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Обробка OPTIONS-запитів для CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 204
    });
  }

  // Перевірка методу запиту
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Перевірка наявності секретних ключів LiqPay
    if (!LIQPAY_PUBLIC_KEY || !LIQPAY_PRIVATE_KEY) {
      console.error("ENVIRONMENT_ERROR: LiqPay keys not configured for init-liqpay-payment.");
      return new Response(JSON.stringify({
        error: 'LiqPay keys not configured on server. Please check Supabase Secrets.'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Парсинг вхідних даних від мобільного додатка або клієнта
    const { amount, bookingId, description, patientId, doctorName } = await req.json();

    // Валідація вхідних даних
    if (typeof amount !== 'number' || amount <= 0 || !bookingId || !description || !patientId) {
      console.error('InitLiqPayPayment: Missing or invalid required fields in payload:', {
        amount,
        bookingId,
        description,
        patientId
      });
      return new Response(JSON.stringify({
        error: 'Missing or invalid required payment parameters: amount, bookingId, description, or patientId.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Формування order_id. Це унікальний ID вашого замовлення/бронювання.
    // Переконайтеся, що liqpay-callback функція може його коректно розпізнати.
    const orderId = `booking_${bookingId}`; // Рекомендований формат для узгодження з `split('_')[1]` в callback

    // Параметри платежу для LiqPay
    const params = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      amount: String(amount),
      currency: 'USD', // <--- ЗМІНЕНО: Тепер оплата буде зніматися в доларах США
      description: description,
      order_id: orderId,
      server_url: LIQPAY_CALLBACK_SERVER_URL,
      // language: 'uk', // Можете додати, якщо потрібна українська мова на сторінці оплати LiqPay
      // result_url: 'https://your-app.com/payment-status' // URL, куди користувач повернеться після оплати
    };

    // Перетворення параметрів в Base64 для data-поля LiqPay
    const dataToSign = Buffer.from(JSON.stringify(params)).toString('base64');

    // Генерування підпису
    // Формула: sha1(private_key + data + private_key)
    const signature = Buffer.from(sha1(LIQPAY_PRIVATE_KEY + dataToSign + LIQPAY_PRIVATE_KEY), 'hex').toString('base64');

    console.log('InitLiqPayPayment: Successfully generated LiqPay parameters for booking:', bookingId);
    // console.log('Generated Data:', dataToSign); // Для дебагу - розкоментуйте, якщо потрібно
    // console.log('Generated Signature:', signature); // Для дебагу - розкоментуйте, якщо потрібно

    // Відповідь мобільному додатку/клієнту з даними для LiqPay Checkout
    return new Response(JSON.stringify({
      success: true,
      data: dataToSign,
      signature: signature
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    let errorMessage = "An unknown error occurred in init-liqpay-payment.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error("InitLiqPayPayment: Uncaught error:", errorMessage, error);
    return new Response(JSON.stringify({
      error: `Server error: ${errorMessage}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});