import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Expo } from 'expo-server-sdk';
import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4';

// Ініціалізація
const expo = new Expo();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Змінні середовища Supabase не налаштовані.");
}

// Допоміжна функція для отримання даних пацієнта
async function getPatientNotificationData(supabaseClient, patientId) {
  if (!patientId) return { token: null, language: 'uk', timezone: 'UTC' };
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('notification_token, language, country_timezone')
      .eq('user_id', patientId)
      .single();

    if (error) throw error;
    
    return {
      token: profile.notification_token || null,
      language: profile.language || 'uk',
      timezone: profile.country_timezone || 'UTC',
    };
  } catch (e) {
    console.error(`Помилка отримання даних пацієнта ${patientId}:`, e.message);
    return { token: null, language: 'uk', timezone: 'UTC' };
  }
}

// Спрощені переклади
const translations = {
  bookingConfirmedTitle: { uk: `Ваше бронювання підтверджено! ✅`, en: `Your booking has been confirmed! ✅` },
  bookingConfirmedBody: {
    uk: (doctorName, date, time) => `Лікар ${doctorName} підтвердив вашу консультацію на ${date} о ${time} (ваш місцевий час).`,
    en: (doctorName, date, time) => `Doctor ${doctorName} has confirmed your consultation on ${date} at ${time} (your local time).`
  },
  bookingRejectedTitle: { uk: `Ваше бронювання відхилено ❌`, en: `Your booking has been rejected ❌` },
  bookingRejectedBody: {
    uk: (doctorName, date, time) => `На жаль, лікар ${doctorName} відхилив вашу консультацію на ${date} о ${time} (ваш місцевий час).`,
    en: (doctorName, date, time) => `Unfortunately, Dr. ${doctorName} has rejected your consultation on ${date} at ${time} (your local time).`
  },
};

const getTranslation = (key, lang, ...args) => {
  const selectedLang = lang === 'en' ? 'en' : 'uk';
  const translation = translations[key]?.[selectedLang];
  return typeof translation === 'function' ? translation(...args) : translation;
};

// Основний сервер
serve(async (req) => {
  // Явно створюємо об'єкт Headers для уникнення помилок
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { booking, doctor_name } = await req.json();

    if (!booking || !booking.id || !booking.patient_id || !booking.status || !booking.booking_date || !booking.booking_time_slot) {
      return new Response(JSON.stringify({ error: "Неповні дані бронювання." }), { status: 400, headers: responseHeaders });
    }
    
    const { id: booking_id, patient_id, status, booking_date, booking_time_slot } = booking;
    const duration = booking.consultation_duration_minutes || 45;

    const { token: patientPushToken, language: patientLanguage, timezone: patientTimezone } = await getPatientNotificationData(supabaseAdmin, patient_id);
    
    const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, { zone: 'utc' });
    const patientLocalDateTime = utcDateTime.setZone(patientTimezone);

    let formattedDate = booking_date;
    let formattedTime = booking_time_slot;

    if (patientLocalDateTime.isValid) {
      formattedDate = patientLocalDateTime.toLocaleString(DateTime.DATE_FULL, { locale: patientLanguage });
      const endTime = patientLocalDateTime.plus({ minutes: duration });
      formattedTime = `${patientLocalDateTime.toFormat('HH:mm')} - ${endTime.toFormat('HH:mm')}`;
    }

    let title;
    let body;
    const lowerCaseStatus = status.toLowerCase();

    if (lowerCaseStatus === 'confirmed') {
      title = getTranslation('bookingConfirmedTitle', patientLanguage);
      body = getTranslation('bookingConfirmedBody', patientLanguage, doctor_name, formattedDate, formattedTime);
    } else if (lowerCaseStatus === 'rejected') {
      title = getTranslation('bookingRejectedTitle', patientLanguage);
      body = getTranslation('bookingRejectedBody', patientLanguage, doctor_name, formattedDate, formattedTime);
    } else {
      return new Response(JSON.stringify({ message: 'Для цього статусу дія не потрібна.' }), { status: 200, headers: responseHeaders });
    }

    await supabaseAdmin.from('patient_notifications').insert({
      patient_id,
      booking_id,
      title,
      body,
      notification_type: `booking_${lowerCaseStatus}`,
      data: { booking_id, doctor_name, status },
    });

    if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
      const { count: badgeCount } = await supabaseAdmin.from('patient_notifications').select('*', { count: 'exact', head: true }).eq('patient_id', patient_id).eq('is_read', false);
      
      await expo.sendPushNotificationsAsync([{
        to: patientPushToken,
        sound: 'default',
        title,
        body,
        badge: badgeCount ?? 1,
        data: { booking_id, status },
      }]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });

  } catch (err) {
    console.error('Помилка в Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: responseHeaders });
  }
});