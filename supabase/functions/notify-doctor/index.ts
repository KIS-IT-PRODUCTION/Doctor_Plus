import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Expo } from 'https://esm.sh/expo-server-sdk@3.7.0';
import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4';
const expo = new Expo();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Змінні середовища Supabase не налаштовані.");
}
// Допоміжна функція для отримання даних сповіщень лікаря
async function getDoctorNotificationData(supabaseClient, doctorId) {
  if (!doctorId) return {
    token: null,
    language: 'uk',
    timezone: 'UTC'
  };
  try {
    // ВИПРАВЛЕНО: Запит тепер до правильної таблиці 'profile_doctor'
    const { data: profile, error } = await supabaseClient.from('profile_doctor').select('notification_token, language, country_timezone').eq('user_id', doctorId).single();
    if (error) throw error;
    // Повертаємо дані або значення за замовчуванням, якщо щось не знайдено
    return {
      token: profile.notification_token || null,
      language: profile.language || 'uk',
      timezone: profile.country_timezone || 'UTC'
    };
  } catch (e) {
    console.error(`Помилка отримання даних лікаря ${doctorId}:`, e.message);
    return {
      token: null,
      language: 'uk',
      timezone: 'UTC'
    };
  }
}
// Словник для перекладів
const translations = {
  newBookingTitle: {
    uk: `Нове бронювання! 🗓️`,
    en: `New Booking! 🗓️`
  },
  newBookingBody: {
    uk: (patientName, date, time)=>`Пацієнт ${patientName} забронював консультацію на ${date} о ${time} (ваш місцевий час).`,
    en: (patientName, date, time)=>`Patient ${patientName} has booked a consultation on ${date} at ${time} (your local time).`
  }
};
const getTranslation = (key, lang, ...args)=>{
  const selectedLang = lang === 'en' ? 'en' : 'uk';
  const translation = translations[key]?.[selectedLang];
  return typeof translation === 'function' ? translation(...args) : translation;
};
// Основна логіка Edge Function
serve(async (req)=>{
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  });
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: responseHeaders
    });
  }
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { booking, patient_name } = await req.json();
    if (!booking || !booking.id || !booking.doctor_id || !patient_name) {
      return new Response(JSON.stringify({
        error: "Неповні дані для сповіщення."
      }), {
        status: 400,
        headers: responseHeaders
      });
    }
    const { doctor_id, booking_date, booking_time_slot, id: booking_id, consultation_duration_minutes } = booking;
    const duration = consultation_duration_minutes || 45;
    const { token: doctorPushToken, language: doctorLanguage, timezone: doctorTimezone } = await getDoctorNotificationData(supabaseAdmin, doctor_id);
    const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, {
      zone: 'utc'
    });
    const doctorLocalDateTime = utcDateTime.setZone(doctorTimezone);
    let formattedDate = booking_date;
    let formattedTime = booking_time_slot;
    if (doctorLocalDateTime.isValid) {
      formattedDate = doctorLocalDateTime.toLocaleString(DateTime.DATE_FULL, {
        locale: doctorLanguage
      });
      const endTime = doctorLocalDateTime.plus({
        minutes: duration
      });
      formattedTime = `${doctorLocalDateTime.toFormat('HH:mm')} - ${endTime.toFormat('HH:mm')}`;
    }
    const title = getTranslation('newBookingTitle', doctorLanguage);
    const body = getTranslation('newBookingBody', doctorLanguage, patient_name, formattedDate, formattedTime);
    const { data: notification, error: insertError } = await supabaseAdmin.from('doctor_notifications').insert({
      doctor_id: doctor_id,
      booking_id: booking_id,
      title: title,
      body: body,
      notification_type: 'new_booking',
      is_read: false,
      data: {
        ...booking,
        type: 'new_booking',
        status: 'pending',
        patient_name
      }
    }).select().single();
    if (insertError) throw new Error(`Не вдалося зберегти сповіщення: ${insertError.message}`);
    if (doctorPushToken && Expo.isExpoPushToken(doctorPushToken)) {
      const { count: badgeCount } = await supabaseAdmin.from('doctor_notifications').select('*', {
        count: 'exact',
        head: true
      }).eq('doctor_id', doctor_id).eq('is_read', false);
      await expo.sendPushNotificationsAsync([
        {
          to: doctorPushToken,
          sound: 'default',
          title,
          body,
          badge: badgeCount ?? 1,
          data: {
            db_id: notification.id,
            ...notification.data
          }
        }
      ]);
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: responseHeaders
    });
  } catch (err) {
    console.error('Помилка в Edge Function:', err.message);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: responseHeaders
    });
  }
});
