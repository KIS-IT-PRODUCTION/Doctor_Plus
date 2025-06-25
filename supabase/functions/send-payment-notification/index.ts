// supabase/functions/send-payment-notification/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase/dist/index.mjs'; // Updated import for Supabase client

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const EXPO_PUSH_TOKEN_API_URL = 'https://exp.host/--/api/v2/push/send';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: Supabase ключі не встановлені для send-payment-notification.");
  throw new Error("Missing environment variables.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

interface PaymentNotificationPayload {
    bookingId: string;
    patientId: string;
    doctorId: string;
    paymentStatus: string; // e.g., 'paid', 'failed', 'processing'
    amount: number;
    currency: string;
    notificationTitle: string; // Title for the push notification
    notificationBody: string;  // Body for the push notification
    pushDataStatus: string;    // Status to include in push notification data (e.g., 'paid', 'failed')
    pushDataStatusMessage: string; // User-friendly message for push notification data
}

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
    const payload: PaymentNotificationPayload = await req.json();
    const { bookingId, patientId, doctorId, paymentStatus, amount, currency, notificationTitle, notificationBody, pushDataStatus, pushDataStatusMessage } = payload;

    if (!bookingId || !patientId || !doctorId || !paymentStatus || !amount || !currency || !notificationTitle || !notificationBody) {
        console.error('SendPaymentNotification: Missing or invalid fields in payload:', payload);
        return new Response(JSON.stringify({ error: 'Missing or invalid fields in payload' }), { status: 400, headers: corsHeaders });
    }

    console.log('SendPaymentNotification: Received payload:', payload);

    const messagesToSend = [];

    // --- Сповіщення для пацієнта ---
    const { data: patientProfile, error: patientProfileError } = await supabaseAdmin
        .from('profiles')
        // ЗМІНЕНО: Використовуємо notification_token
        .select('notification_token')
        .eq('user_id', patientId)
        .single();

    if (patientProfileError) {
        console.error('SendPaymentNotification: Error fetching patient push token:', patientProfileError.message);
    } else if (patientProfile && patientProfile.notification_token) { // ЗМІНЕНО: Використовуємо notification_token
        messagesToSend.push({
            to: patientProfile.notification_token, // ЗМІНЕНО: Використовуємо notification_token
            title: notificationTitle,
            body: notificationBody,
            data: {
                type: 'payment_status_update',
                booking_id: bookingId,
                status: pushDataStatus,
                status_message: pushDataStatusMessage,
                amount: amount,
                currency: currency,
                recipient_type: 'patient'
            },
        });
        console.log(`SendPaymentNotification: Prepared notification for patient ${patientId}`);
    } else {
        console.warn(`SendPaymentNotification: Patient ${patientId} has no notification_token.`); // ЗМІНЕНО лог
    }

    // --- Сповіщення для лікаря ---
    const { data: doctorProfile, error: doctorProfileError } = await supabaseAdmin
        .from('profile_doctor')
        // ЗМІНЕНО: Використовуємо notification_token
        .select('full_name, notification_token')
        .eq('user_id', doctorId)
        .single();
    
    if (doctorProfileError) {
        console.error('SendPaymentNotification: Error fetching doctor push token:', doctorProfileError.message);
    } else if (doctorProfile && doctorProfile.notification_token) { // ЗМІНЕНО: Використовуємо notification_token
        let doctorNotificationTitle = `Оновлення оплати: ${paymentStatus === 'paid' ? 'Успішно' : 'Помилка'}`;
        let doctorNotificationBody = `Бронювання №${bookingId} на суму ${amount} ${currency}. Статус: ${pushDataStatusMessage}.`;
        
        messagesToSend.push({
            to: doctorProfile.notification_token, // ЗМІНЕНО: Використовуємо notification_token
            title: doctorNotificationTitle,
            body: doctorNotificationBody,
            data: {
                type: 'payment_status_update',
                booking_id: bookingId,
                status: pushDataStatus,
                status_message: pushDataStatusMessage,
                amount: amount,
                currency: currency,
                recipient_type: 'doctor'
            },
        });
        console.log(`SendPaymentNotification: Prepared notification for doctor ${doctorId}`);
    } else {
        console.warn(`SendPaymentNotification: Doctor ${doctorId} has no notification_token.`); // ЗМІНЕНО лог
    }

    if (messagesToSend.length > 0) {
        const pushResponse = await fetch(EXPO_PUSH_TOKEN_API_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messagesToSend),
        });

        const pushResponseData = await pushResponse.json();
        console.log('SendPaymentNotification: Expo Push API response:', pushResponseData);
        if (pushResponseData.errors) {
            console.error('SendPaymentNotification: Errors in Expo Push API response:', pushResponseData.errors);
            return new Response(JSON.stringify({ success: false, message: 'Errors sending some notifications', details: pushResponseData.errors }), { status: 500, headers: corsHeaders });
        }
    } else {
        console.warn('SendPaymentNotification: No push tokens found for patient or doctor. No notifications sent.');
    }

    return new Response(JSON.stringify({ success: true, message: 'Notifications processed' }), { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred in send-payment-notification.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error("SendPaymentNotification: Uncaught error:", errorMessage, error);
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500, headers: corsHeaders });
  }
});
