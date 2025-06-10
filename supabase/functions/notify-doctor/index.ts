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

    if (!doctor_id || !patient_name || !booking_date || !booking_time_slot) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('profile_doctor')
      .select('notification_token')
      .eq('user_id', doctor_id)
      .single();

    if (doctorError || !doctorData || !doctorData.notification_token) {
      console.error("Error fetching doctor or token:", doctorError?.message || "Token not found");
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
      console.error("Error inserting notification record:", insertError.message);
      // Продовжуємо надсилати пуш, навіть якщо запис у базу не вдався
    } else {
      console.log("Notification record inserted successfully:", notificationRecord);
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
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
    console.log("Expo Push API response:", responseData);

    if (responseData.errors) {
        console.error("Error sending push notification:", responseData.errors);
        return new Response(JSON.stringify({ error: 'Failed to send notification', details: responseData.errors }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(JSON.stringify({ success: true, response: responseData, notificationRecordId: notificationRecord?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});