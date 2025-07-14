import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Expo } from 'expo-server-sdk';
import { sha1 } from 'https://deno.land/x/sha1@v1.0.1/mod.ts'; // Перевірте https://deno.land/x/sha1 для останньої версії
import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4';
const expo = new Expo();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
  throw new Error("Змінні середовища Supabase/LiqPay не налаштовані.");
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// --- Допоміжні функції для отримання даних користувачів ---
async function getPatientData(patientId) {
  if (!patientId) return {
    token: null,
    language: 'uk',
    timezone: 'UTC',
    fullName: 'Пацієнт'
  };
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('notification_token, language, country_timezone, full_name').eq('user_id', patientId).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 for "No rows found"
    return {
      token: data?.notification_token || null,
      language: data?.language || 'uk',
      timezone: data?.country_timezone || 'UTC',
      fullName: data?.full_name || 'Пацієнт'
    };
  } catch (e) {
    console.error(`Помилка отримання даних пацієнта ${patientId}:`, e.message);
    return {
      token: null,
      language: 'uk',
      timezone: 'UTC',
      fullName: 'Пацієнт'
    };
  }
}
async function getDoctorData(doctorId) {
  if (!doctorId) return {
    token: null,
    language: 'uk',
    timezone: 'UTC',
    fullName: 'Лікар'
  };
  try {
    const profilePromise = supabaseAdmin.from('profile_doctor').select('notification_token, language, full_name').eq('user_id', doctorId).single();
    const anketaPromise = supabaseAdmin.from('anketa_doctor').select('country_timezone').eq('user_id', doctorId).single();
    const [profileResult, anketaResult] = await Promise.all([
      profilePromise,
      anketaPromise
    ]);
    // Перевірка помилок для обох результатів
    if (profileResult.error && profileResult.error.code !== 'PGRST116') throw profileResult.error;
    if (anketaResult.error && anketaResult.error.code !== 'PGRST116') throw anketaResult.error;
    return {
      token: profileResult.data?.notification_token || null,
      language: profileResult.data?.language || 'uk',
      timezone: anketaResult.data?.country_timezone || 'UTC',
      fullName: profileResult.data?.full_name || 'Лікар'
    };
  } catch (e) {
    console.error(`Помилка отримання даних лікаря ${doctorId}:`, e.message);
    return {
      token: null,
      language: 'uk',
      timezone: 'UTC',
      fullName: 'Лікар'
    };
  }
}
// --- Переклади ---
const translations = {
  uk: {
    payment_success_title: "Оплата підтверджена!",
    payment_success_patient_body: (doctorName, date, time, amount, currency)=>`Ваша консультація з ${doctorName} на ${date} о ${time} (ваш час) успішно оплачена. Сума: ${amount} ${currency}.`,
    payment_success_doctor_body: (patientName, date, time, amount, currency)=>`Пацієнт ${patientName} оплатив консультацію на ${date} о ${time} (ваш час). Сума: ${amount} ${currency}.`
  },
  en: {
    payment_success_title: "Payment Confirmed!",
    payment_success_patient_body: (doctorName, date, time, amount, currency)=>`Your consultation with ${doctorName} on ${date} at ${time} (your time) has been successfully paid. Amount: ${amount} ${currency}.`,
    payment_success_doctor_body: (patientName, date, time, amount, currency)=>`Patient ${patientName} has paid for the consultation on ${date} at ${time} (your time). Amount: ${amount} ${currency}.`
  }
};
function getTranslation(lang, key, ...args) {
  const selectedLangSet = translations[lang] || translations.uk;
  const messageTemplate = selectedLangSet[key];
  return typeof messageTemplate === 'function' ? messageTemplate(...args) : messageTemplate;
}
serve(async (req)=>{
  // Створюємо заголовки так, як це працює у вашому середовищі
  const corsHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  });
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const formData = await req.formData();
    // formData.get() може повертати `string | File | null`. Для LiqPay `data` це завжди string.
    const data = formData.get('data')?.toString();
    const signature = formData.get('signature')?.toString();
    if (!data || !signature) throw new Error('Відсутні дані або підпис від LiqPay');
    // Deno-native спосіб декодування base64 до рядка
    // Використовуємо atob та TextDecoder
    const decodedData = new TextDecoder().decode(Uint8Array.from(atob(data), (c)=>c.charCodeAt(0)));
    const paymentInfo = JSON.parse(decodedData);
    // Deno-native спосіб обчислення SHA-1 та кодування в base64
    const dataToHash = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const rawHashBytes = sha1(new TextEncoder().encode(dataToHash)); // sha1 повертає Uint8Array
    const binaryString = String.fromCharCode(...rawHashBytes); // Конвертуємо Uint8Array в бінарний рядок
    const expectedSignature = btoa(binaryString); // Base64 кодуємо бінарний рядок
    if (signature !== expectedSignature) throw new Error('Неправильний підпис від LiqPay');
    const { order_id, status: paymentStatus, amount, currency } = paymentInfo;
    const bookingId = order_id.startsWith('booking_') ? order_id.split('_')[1] : order_id;
    const { data: booking, error: bookingError } = await supabaseAdmin.from('patient_bookings').select('doctor_id, patient_id, booking_date, booking_time_slot').eq('id', bookingId).single();
    if (bookingError) throw new Error(`Бронювання з ID ${bookingId} не знайдено.`);
    const { doctor_id, patient_id, booking_date, booking_time_slot } = booking;
    const isBookingPaid = paymentStatus === 'success' || paymentStatus === 'sandbox_success';
    await supabaseAdmin.from('patient_bookings').update({
      payment_status: paymentStatus,
      is_paid: isBookingPaid,
      liqpay_data: paymentInfo
    }).eq('id', bookingId);
    if (isBookingPaid) {
      const messagesToSend = [];
      const [patientData, doctorData] = await Promise.all([
        getPatientData(patient_id),
        getDoctorData(doctor_id)
      ]);
      const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, {
        zone: 'utc'
      });
      if (!utcDateTime.isValid) throw new Error('Неправильний формат дати/часу.');
      // --- Сповіщення для ПАЦІЄНТА з його локальним часом ---
      if (patientData.token) {
        const localDateTime = utcDateTime.setZone(patientData.timezone);
        const formattedDate = localDateTime.toLocaleString(DateTime.DATE_FULL, {
          locale: patientData.language
        });
        const formattedTime = localDateTime.toFormat('HH:mm');
        const title = getTranslation(patientData.language, 'payment_success_title');
        const body = getTranslation(patientData.language, 'payment_success_patient_body', doctorData.fullName, formattedDate, formattedTime, amount, currency);
        messagesToSend.push({
          to: patientData.token,
          title,
          body,
          sound: 'default',
          data: {
            type: 'payment_update',
            booking_id: bookingId
          }
        });
      }
      // --- Сповіщення для ЛІКАРЯ з його локальним часом ---
      if (doctorData.token) {
        const localDateTime = utcDateTime.setZone(doctorData.timezone);
        const formattedDate = localDateTime.toLocaleString(DateTime.DATE_FULL, {
          locale: doctorData.language
        });
        const formattedTime = localDateTime.toFormat('HH:mm');
        const title = getTranslation(doctorData.language, 'payment_success_title');
        const body = getTranslation(doctorData.language, 'payment_success_doctor_body', patientData.fullName, formattedDate, formattedTime, amount, currency);
        messagesToSend.push({
          to: doctorData.token,
          title,
          body,
          sound: 'default',
          data: {
            type: 'payment_update',
            booking_id: bookingId
          }
        });
      }
      if (messagesToSend.length > 0) {
        await expo.sendPushNotificationsAsync(messagesToSend);
        console.log(`Успішно надіслано ${messagesToSend.length} сповіщення.`);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      paymentStatus
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Помилка в liqpay-callback:", error.message);
    return new Response(JSON.stringify({
      error: `Server error: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
