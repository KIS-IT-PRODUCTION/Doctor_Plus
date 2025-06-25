// supabase/functions/notify-doctor/index.ts

// Імпорти:
// serve з Deno standard library для запуску HTTP-сервера.
// type Request з Deno standard library для явного типування вхідного запиту.
// createClient з Supabase JS library для взаємодії з Supabase.
import { serve, type ConnInfo } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Використовуємо esm.sh для сумісності Deno
import { Expo } from 'https://esm.sh/expo-server-sdk@3.7.0'; // Додано імпорт Expo для кращої явності

const expo = new Expo(); // Ініціалізація Expo SDK

// Отримання змінних оточення Supabase.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL'); // Прибираємо || '' для кращої перевірки в if
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Прибираємо || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не встановлені. Переконайтеся, що змінні оточення правильно налаштовані для цієї Edge Function.");
  throw new Error("Supabase environment variables (URL or Service Role Key) are not set.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json', // Завжди повертаємо JSON
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 }); // 204 No Content for preflight
  }

  if (req.method !== 'POST') {
    console.warn(`Invalid request method: ${req.method}. Only POST is allowed.`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' }), { status: 405, headers: corsHeaders });
  }

  try {
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) {
      console.error('Failed to parse request body as JSON:', jsonError.message);
      return new Response(JSON.stringify({ error: `Invalid JSON in request body: ${jsonError.message}` }), { status: 400, headers: corsHeaders });
    }

    // ДОДАНО: лог повного тіла запиту на початку для діагностики
    console.log('Edge Function: Received raw request body:', JSON.stringify(requestBody, null, 2));

    const { doctor_id, patient_name, booking_date, booking_time_slot, booking_id, patient_id } = requestBody; // Використовуємо requestBody напряму

    console.log('Edge Function: Parsed data from request body:', { doctor_id, patient_name, booking_date, booking_time_slot, booking_id, patient_id });

    // Валідація вхідних даних.
    if (!doctor_id || !patient_name || !booking_date || !booking_time_slot || !booking_id || !patient_id) {
        const missingFields: string[] = [];
        if (!doctor_id) missingFields.push('doctor_id');
        if (!patient_name) missingFields.push('patient_name');
        if (!booking_date) missingFields.push('booking_date');
        if (!booking_time_slot) missingFields.push('booking_time_slot');
        if (!booking_id) missingFields.push('booking_id');
        if (!patient_id) missingFields.push('patient_id');

        console.error(`Edge Function: Missing required fields in request body: ${missingFields.join(', ')}`);
        return new Response(JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Bad Request
        });
    }

    // Перевірка на дійсність UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(doctor_id) || !uuidRegex.test(booking_id) || !uuidRegex.test(patient_id)) {
        console.warn(`Invalid UUID format for one of the IDs: doctor_id(${doctor_id}), booking_id(${booking_id}), patient_id(${patient_id})`);
        return new Response(
            JSON.stringify({ error: 'Invalid UUID format for doctor_id, booking_id, or patient_id.' }),
            { status: 400, headers: corsHeaders }
        );
    }

    // Запит до таблиці 'profile_doctor' для отримання 'notification_token'.
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('profile_doctor')
      .select('notification_token')
      .eq('user_id', doctor_id)
      .single();

    if (doctorError) {
        console.error(`Edge Function: Supabase query error fetching notification_token for doctor ID ${doctor_id}:`, doctorError.message);
        return new Response(JSON.stringify({ error: 'Doctor not found or database error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404, // Not Found
        });
    }
    if (!doctorData || !doctorData.notification_token) {
        console.warn(`Edge Function: Notification token is NULL or empty for doctor ID ${doctor_id}. Cannot send push notification.`);
        // У цьому випадку ми можемо продовжити, оскільки сповіщення буде збережено в БД
        // але push-сповіщення не буде відправлено.
        // Залежно від вашої логіки, це може бути 200 OK або 202 Accepted.
        return new Response(JSON.stringify({ success: true, message: 'Doctor found, but no valid push token. Notification saved to DB only.', notificationRecordId: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const pushToken = doctorData.notification_token;
    console.log('Edge Function: Found pushToken for doctor:', pushToken);

    const notificationTitle = `Нове бронювання від ${patient_name}`;
    const notificationBody = `Пацієнт ${patient_name} забронював консультацію на ${booking_date} о ${booking_time_slot}.`;

    const notificationDataForDB = { // Змінено назву змінної, щоб уникнути плутанини
      type: 'new_booking',
      doctor_id: doctor_id, // Використовуємо doctor_id з БД
      patient_name: patient_name,
      booking_date: booking_date,
      booking_time_slot: booking_time_slot,
      booking_id: booking_id,
      patient_id: patient_id,
      status: 'pending' // Початковий статус бронювання
    };

    // Зберігаємо сповіщення в таблиці 'doctor_notifications'.
    console.log("Edge Function: Inserting notification record into doctor_notifications...");
    const { data: notificationRecord, error: insertError } = await supabaseAdmin
      .from('doctor_notifications')
      .insert([
        {
          doctor_id: doctor_id,
          title: notificationTitle,
          body: notificationBody,
          data: notificationDataForDB, // Використовуємо дані для БД
          is_read: false // Якщо це поле залишається в doctor_notifications
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Edge Function: Error inserting notification record into doctor_notifications:", insertError.message, insertError.details);
      if (insertError.code === '23503') { // Foreign Key Violation (може статися, якщо doctor_id не існує)
        return new Response(
            JSON.stringify({ error: `Doctor (ID: ${doctor_id}) does not exist in public.profile_doctor or FK constraint failed. Cannot save notification.` }),
            { status: 404, headers: corsHeaders }
        );
      }
      return new Response(JSON.stringify({ error: `Failed to save notification record: ${insertError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
      });
    } else {
      console.log("Edge Function: Notification record inserted successfully with ID:", notificationRecord?.id);
    }

    // Надсилання пуш-сповіщення через Expo Push API.
    const messageForExpo = { // Змінено назву змінної
      to: pushToken,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: { ...notificationDataForDB, db_id: notificationRecord?.id }, // Додаємо ID запису з БД
    };

    console.log("Edge Function: Sending push notification to Expo API with payload:", JSON.stringify(messageForExpo, null, 2));
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageForExpo), // Використовуємо дані для Expo
    });

    let responseData;
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Edge Function: Expo Push API returned non-OK status ${response.status}:`, errorText);
        try {
            responseData = JSON.parse(errorText);
        } catch (e) {
            responseData = { message: errorText, originalStatus: response.status };
        }
        return new Response(JSON.stringify({ error: 'Failed to send push notification via Expo API', details: responseData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    responseData = await response.json();
    console.log("Edge Function: Expo Push API successful response:", responseData);

    if (responseData.errors && responseData.errors.length > 0) {
        console.error("Edge Function: Expo Push API reported errors in response data:", responseData.errors);
        return new Response(JSON.stringify({ error: 'Failed to send push notification (Expo API errors)', details: responseData.errors }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(JSON.stringify({ success: true, response: responseData, notificationRecordId: notificationRecord?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred in the Edge Function.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }

    console.error("Edge Function: Uncaught error in try-catch block:", errorMessage, error);
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});