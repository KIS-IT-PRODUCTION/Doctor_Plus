// supabase/functions/liqpay-callback/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Buffer } from 'https://esm.sh/buffer';
import sha1 from 'https://esm.sh/js-sha1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LIQPAY_PRIVATE_KEY = "sandbox_zMI6cVf79SuNsn4nPIWkoFFWBwZ96Bm7Gikt9H1t"; // Private LiqPay key for backend

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
  console.error("ENVIRONMENT_ERROR: Supabase або LiqPay ключі не встановлені.");
  throw new Error("Missing environment variables.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const data = formData.get('data');
    const signature = formData.get('signature');

    console.log('LiqPay Callback: Received data:', data);
    console.log('LiqPay Callback: Received signature:', signature);

    if (!data || !signature) {
      console.error('LiqPay Callback: Missing data or signature in callback.');
      return new Response(JSON.stringify({ error: 'Missing data or signature' }), { status: 400, headers: corsHeaders });
    }

    // 1. Декодуємо Base64 дані
    const decodedData = Buffer.from(data as string, 'base64').toString('utf8');
    const paymentInfo = JSON.parse(decodedData);
    console.log('LiqPay Callback: Decoded payment info:', paymentInfo);

    // 2. Перевіряємо підпис (КРИТИЧНО ВАЖЛИВО ДЛЯ БЕЗПЕКИ!)
    const expectedSignatureRaw = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const expectedSignature = Buffer.from(sha1(expectedSignatureRaw)).toString('base64');

    if (signature !== expectedSignature) {
      console.error('LiqPay Callback: Invalid signature received!', { received: signature, expected: expectedSignature });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 403, headers: corsHeaders });
    }
    console.log('LiqPay Callback: Signature verified successfully.');

    // 3. Обробляємо статус платежу
    const { order_id, status: paymentStatus, amount, currency } = paymentInfo;
    const bookingId = order_id.split('_')[1];

    console.log('LiqPay Callback: Processing payment for bookingId:', bookingId, 'Status:', paymentStatus);

    let finalPaymentStatusForDb = 'failed';
    let notificationTitle = "Оновлення оплати бронювання";
    let notificationBody = `Статус оплати вашого бронювання №${bookingId} оновлено.`;
    let pushDataStatus = 'failed';
    let pushDataStatusMessage = '';

    if (paymentStatus === 'success' || paymentStatus === 'sandbox') {
      finalPaymentStatusForDb = 'paid';
      notificationTitle = "Оплата успішна!";
      notificationBody = `Ваше бронювання №${bookingId} на суму ${amount} ${currency} успішно оплачено.`;
      pushDataStatus = 'paid';
      pushDataStatusMessage = 'успішно оплачено';
    } else if (paymentStatus === 'failure' || paymentStatus === 'error' || paymentStatus === 'reversed') {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitle = "Помилка оплати!";
      notificationBody = `Оплата вашого бронювання №${bookingId} не пройшла. Статус: ${paymentStatus}.`;
      pushDataStatus = 'failed';
      pushDataStatusMessage = `не пройшла (${paymentStatus})`;
    } else {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitle = "Оновлення статусу оплати";
      notificationBody = `Оплата вашого бронювання №${bookingId} в статусі: ${paymentStatus}.`;
      pushDataStatus = 'processing';
      pushDataStatusMessage = `в обробці (${paymentStatus})`;
    }

    // Оновлюємо статус платежу в таблиці patient_bookings
    // Також отримуємо patient_id та doctor_id для надсилання сповіщень
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('patient_bookings')
      .update({ payment_status: finalPaymentStatusForDb })
      .eq('id', bookingId)
      .select('patient_id, doctor_id')
      .single();

    if (updateError) {
      console.error('LiqPay Callback: Error updating booking status in DB:', updateError.message);
      return new Response(JSON.stringify({ error: 'Failed to update booking status' }), { status: 500, headers: corsHeaders });
    }
    console.log(`LiqPay Callback: Booking ${bookingId} marked as ${finalPaymentStatusForDb}.`);

    // 4. Викликаємо функцію send-payment-notification
    if (updatedBooking && updatedBooking.patient_id && updatedBooking.doctor_id) {
        console.log(`LiqPay Callback: Invoking send-payment-notification for booking ${bookingId}`);
        const { data: invokeData, error: invokeError } = await supabaseAdmin.functions.invoke('send-payment-notification', {
            body: {
                bookingId: bookingId,
                patientId: updatedBooking.patient_id,
                doctorId: updatedBooking.doctor_id,
                paymentStatus: finalPaymentStatusForDb,
                amount: amount,
                currency: currency,
                notificationTitle: notificationTitle,
                notificationBody: notificationBody,
                pushDataStatus: pushDataStatus,
                pushDataStatusMessage: pushDataStatusMessage,
            },
        });

        if (invokeError) {
            console.error('LiqPay Callback: Error invoking send-payment-notification:', invokeError);
        } else {
            console.log('LiqPay Callback: Successfully invoked send-payment-notification:', invokeData);
        }
    } else {
        console.warn('LiqPay Callback: Missing patient_id or doctor_id from updated booking, skipping notification invocation.');
    }

    return new Response(JSON.stringify({ success: true, paymentStatus: finalPaymentStatusForDb }), { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred in the LiqPay Callback.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error("LiqPay Callback: Uncaught error:", errorMessage, error);
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500, headers: corsHeaders });
  }
});

LIQPAY_PRIVATE_KEY_SERVER