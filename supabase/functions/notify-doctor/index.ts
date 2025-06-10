// supabase/functions/notify-doctor/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { doctor_id, patient_name, booking_date, booking_time_slot } = await req.json();

    console.log('Edge Function: Received request body:', { doctor_id, patient_name, booking_date, booking_time_slot });

    if (!doctor_id || !patient_name || !booking_date || !booking_time_slot) {
      console.error('Edge Function: Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- ПОТЕНЦІЙНЕ ВИПРАВЛЕННЯ ТУТ ---
    // Перевірте, чи колонка для ID користувача в таблиці 'profile_doctor' називається 'id' чи 'user_id'.
    // Згідно з попередніми виправленнями, вона, ймовірно, називається 'id'.
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('profile_doctor')
      .select('notification_token')
      .eq('user_id', doctor_id) // <-- ВИПРАВЛЕНО ТУТ: Змінено з 'id' на 'user_id'
//       .single();

    if (doctorError || !doctorData || !doctorData.notification_token) {
      console.error("Edge Function: Error fetching doctor or token:", doctorError?.message || "Token not found");
      return new Response(JSON.stringify({ error: 'Doctor or notification token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const pushToken = doctorData.notification_token;

    const notificationTitle = `Нове бронювання від ${patient_name}`;
    const notificationBody = `Пацієнт ${patient_name} забронював консультацію на ${booking_date} о ${booking_time_slot}.`;
    const notificationData = {
      type: 'new_booking',
      doctorId: doctor_id,
      patientName: patient_name,
      date: booking_date,
      time: booking_time_slot
    };

    // Зберігаємо сповіщення в таблиці doctor_notifications
    const { data: notificationRecord, error: insertError } = await supabaseAdmin
      .from('doctor_notifications')
      .insert([
        {
          doctor_id: doctor_id,
          title: notificationTitle,
          body: notificationBody,
          data: notificationData,
          is_read: false // За замовчуванням нове сповіщення є непрочитаним
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Edge Function: Error inserting notification record:", insertError.message);
      // Якщо збереження в БД є критичним, поверніть помилку тут.
      // Якщо ні, то просто залогуйте і продовжуйте надсилати пуш.
      // Згідно з вашим запитом, дані мають зберігатися, тому рекомендую повернути помилку.
      return new Response(JSON.stringify({ error: `Failed to save notification record: ${insertError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Повертаємо 500, якщо запис у БД не вдався
      });
    } else {
      console.log("Edge Function: Notification record inserted successfully:", notificationRecord);
    }

    // Цей блок коду для надсилання пуш-сповіщень через Expo Push API
    // Він буде працювати, якщо Edge Function успішно записала дані в БД.
    // Якщо ви тестуєте в Expo Go, push-сповіщення все одно не працюватимуть,
    // але запис у БД має бути успішним.
    const message = {
      to: pushToken,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: { ...notificationData, db_id: notificationRecord?.id }, // Додаємо db_id для оновлення на клієнті
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    console.log("Edge Function: Expo Push API response:", responseData);

    if (responseData.errors) {
        console.error("Edge Function: Error sending push notification:", responseData.errors);
        // Тут можна прийняти рішення: чи є це критичною помилкою?
        // Наприклад, якщо пуш не надіслано, але запис у БД є, можливо, це не 500.
        // Залишимо 500 для простоти, якщо пуш також не вдався.
        return new Response(JSON.stringify({ error: 'Failed to send push notification', details: responseData.errors }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(JSON.stringify({ success: true, response: responseData, notificationRecordId: notificationRecord?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function: Error in try-catch block:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
