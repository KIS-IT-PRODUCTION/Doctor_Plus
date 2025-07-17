import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Expo } from 'expo-server-sdk';
import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4';
const expo = new Expo();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Змінні середовища Supabase не налаштовані.");
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Допоміжні функції для отримання даних користувачів
async function getPatientData(patientId) {
  if (!patientId) return {
    token: null,
    language: 'uk',
    timezone: 'UTC'
  };
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('notification_token, language, country_timezone').eq('user_id', patientId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return {
      token: data?.notification_token || null,
      language: data?.language || 'uk',
      timezone: data?.country_timezone || 'UTC'
    };
  } catch (e) {
    console.error(`Помилка отримання даних пацієнта ${patientId}:`, e.message);
    return {
      token: null,
      language: 'uk',
      timezone: 'UTC'
    };
  }
}
async function getDoctorData(doctorId) {
  if (!doctorId) return {
    token: null,
    language: 'uk',
    timezone: 'UTC'
  };
  try {
    const profilePromise = supabaseAdmin.from('profile_doctor').select('notification_token, language').eq('user_id', doctorId).single();
    const anketaPromise = supabaseAdmin.from('anketa_doctor').select('country_timezone').eq('user_id', doctorId).single();
    const [profileResult, anketaResult] = await Promise.all([
      profilePromise,
      anketaPromise
    ]);
    if (profileResult.error && profileResult.error.code !== 'PGRST116') throw profileResult.error;
    if (anketaResult.error && anketaResult.error.code !== 'PGRST116') throw anketaResult.error;
    return {
      token: profileResult.data?.notification_token || null,
      language: profileResult.data?.language || 'uk',
      timezone: anketaResult.data?.country_timezone || 'UTC'
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
// Оновлені переклади
const translations = {
  paymentSuccessTitle: {
    uk: `Оплата успішна! ✅`,
    en: `Payment successful! ✅`
  },
  paymentSuccessBody: {
    uk: (amount, currency, date, time)=>`Оплата ${amount} ${currency} за консультацію ${date} о ${time} (ваш час) пройшла успішно.`,
    en: (amount, currency, date, time)=>`Payment of ${amount} ${currency} for the consultation on ${date} at ${time} (your time) was successful.`
  },
  paymentFailureTitle: {
    uk: `Помилка оплати ❌`,
    en: `Payment error ❌`
  },
  paymentFailureBody: {
    uk: (amount, currency, date, time, status)=>`Оплата ${amount} ${currency} за консультацію ${date} о ${time} (ваш час) не вдалася. Статус: ${status}.`,
    en: (amount, currency, date, time, status)=>`Payment of ${amount} ${currency} for the consultation on ${date} at ${time} (your time) failed. Status: ${status}.`
  }
};
const getTranslation = (key, lang, ...args)=>{
  const selectedLang = lang === 'en' ? 'en' : 'uk';
  const translation = translations[key]?.[selectedLang];
  return typeof translation === 'function' ? translation(...args) : translation;
};
serve(async (req)=>{
  const corsHeaders = new Headers();
  corsHeaders.append('Access-Control-Allow-Origin', '*');
  corsHeaders.append('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  corsHeaders.append('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const payload = await req.json();
    const { bookingId, patientId, doctorId, paymentStatus, amount, currency, statusMessage, booking_date, booking_time_slot } = payload;
    if (!bookingId || !patientId || !doctorId || !paymentStatus || !amount || !currency || !booking_date || !booking_time_slot) {
      return new Response(JSON.stringify({
        error: 'Неповні дані. Потрібні всі поля, включно з booking_date та booking_time_slot.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const messagesToSend = [];
    const [patientData, doctorData] = await Promise.all([
      getPatientData(patientId),
      getDoctorData(doctorId)
    ]);
    const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, {
      zone: 'utc'
    });
    if (!utcDateTime.isValid) throw new Error('Неправильний формат дати або часу.');
    // --- Сповіщення для ПАЦІЄНТА з його локальним часом ---
    if (patientData.token) {
      const patientLocalDateTime = utcDateTime.setZone(patientData.timezone);
      const formattedDate = patientLocalDateTime.toLocaleString(DateTime.DATE_FULL, {
        locale: patientData.language
      });
      const formattedTime = patientLocalDateTime.toFormat('HH:mm');
      const title = getTranslation(paymentStatus === 'paid' ? 'paymentSuccessTitle' : 'paymentFailureTitle', patientData.language);
      const body = getTranslation(paymentStatus === 'paid' ? 'paymentSuccessBody' : 'paymentFailureBody', patientData.language, amount, currency, formattedDate, formattedTime, statusMessage);
      messagesToSend.push({
        to: patientData.token,
        title,
        body,
        sound: 'default',
        data: {
          type: 'payment_status_update',
          booking_id: bookingId,
          status: paymentStatus
        }
      });
    }
    // --- Сповіщення для ЛІКАРЯ з його локальним часом ---
    if (doctorData.token) {
      // ### FIX: Окремий розрахунок часу для лікаря ###
      const doctorLocalDateTime = utcDateTime.setZone(doctorData.timezone);
      const formattedDateForDoctor = doctorLocalDateTime.toLocaleString(DateTime.DATE_FULL, {
        locale: doctorData.language
      });
      const formattedTimeForDoctor = doctorLocalDateTime.toFormat('HH:mm');
      const title = getTranslation(paymentStatus === 'paid' ? 'paymentSuccessTitle' : 'paymentFailureTitle', doctorData.language);
      const body = getTranslation(paymentStatus === 'paid' ? 'paymentSuccessBody' : 'paymentFailureBody', doctorData.language, amount, currency, formattedDateForDoctor, formattedTimeForDoctor, statusMessage);
      messagesToSend.push({
        to: doctorData.token,
        title,
        body,
        sound: 'default',
        data: {
          type: 'payment_status_update',
          booking_id: bookingId,
          status: paymentStatus
        }
      });
    }
    if (messagesToSend.length > 0) {
      await expo.sendPushNotificationsAsync(messagesToSend);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Notifications processed'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Помилка в send-payment-notification:", error.message);
    return new Response(JSON.stringify({
      error: `Server error: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
