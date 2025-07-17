// supabase/functions/liqpay-callback/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sha1 } from 'https://deno.land/x/sha1@v1.0.1/mod.ts';
import { DateTime } from 'npm:luxon@3.4.4';
// --- Змінні середовища ---
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
  console.error("Критична помилка: відсутні одна або декілька змінних середовища.");
  throw new Error("Необхідні змінні середовища не налаштовані.");
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// --- Допоміжні функції ---
async function sendExpoPushNotifications(messages) {
  if (!messages || messages.length === 0) return;
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      body: JSON.stringify(messages)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Помилка надсилання push-сповіщень Expo:", JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.error("Не вдалося надіслати push-сповіщення:", error.message);
  }
}
async function createAndSendNotifications(notificationsToProcess) {
  const messagesToSend = [];
  for (const notif of notificationsToProcess){
    if (!notif.userId) continue;
    try {
      const { data: newNotification, error: insertError } = await supabaseAdmin.from(notif.tableName).insert({
        [notif.userColumnName]: notif.userId,
        booking_id: notif.bookingId,
        title: notif.title,
        body: notif.body,
        data: notif.dataPayload,
        is_read: false,
        notification_type: notif.dataPayload.type
      }).select('id').single();
      if (insertError) throw insertError;
      if (notif.pushToken && newNotification) {
        messagesToSend.push({
          to: notif.pushToken,
          title: notif.title,
          body: notif.body,
          sound: 'default',
          data: {
            ...notif.dataPayload,
            db_id: newNotification.id
          }
        });
      }
    } catch (error) {
      console.error(`Помилка створення сповіщення для ${notif.tableName} (користувач: ${notif.userId}):`, error.message);
    }
  }
  if (messagesToSend.length > 0) {
    await sendExpoPushNotifications(messagesToSend);
    console.log(`Успішно надіслано ${messagesToSend.length} сповіщення.`);
  }
}
// *** FIX: Повернуто дві окремі функції для отримання даних, як було раніше ***
async function getPatientData(patientId) {
  const defaultUserData = {
    token: null,
    language: 'uk',
    timezone: 'UTC',
    fullName: 'Пацієнт'
  };
  if (!patientId) {
    console.warn(`getPatientData отримав порожній patientId`);
    return defaultUserData;
  }
  try {
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('notification_token, language, full_name, country_timezone').eq('user_id', patientId).single();
    if (profileError && profileError.code !== 'PGRST116') throw profileError;
    if (!profile) {
      console.error(`Профіль пацієнта не знайдено для ID: ${patientId}.`);
      return defaultUserData;
    }
    return {
      token: profile.notification_token || null,
      language: profile.language || 'uk',
      timezone: profile.country_timezone || 'UTC',
      fullName: profile.full_name || 'Пацієнт'
    };
  } catch (e) {
    console.error(`Критична помилка отримання даних для пацієнта ${patientId}:`, e.message);
    return defaultUserData;
  }
}
async function getDoctorData(doctorId) {
  const defaultUserData = {
    token: null,
    language: 'uk',
    timezone: 'UTC',
    fullName: 'Лікар'
  };
  if (!doctorId) {
    console.warn(`getDoctorData отримав порожній doctorId`);
    return defaultUserData;
  }
  try {
    const [profileResult, anketaResult] = await Promise.all([
      supabaseAdmin.from('profile_doctor').select('notification_token, language, full_name').eq('user_id', doctorId).single(),
      supabaseAdmin.from('anketa_doctor').select('country_timezone').eq('user_id', doctorId).single()
    ]);
    const { data: profile, error: profileError } = profileResult;
    const { data: anketa, error: anketaError } = anketaResult;
    if (profileError && profileError.code !== 'PGRST116') throw profileError;
    if (anketaError && anketaError.code !== 'PGRST116') throw anketaError;
    if (!profile) console.warn(`Профіль для лікаря ${doctorId} не знайдено.`);
    if (!anketa) console.warn(`Анкета для лікаря ${doctorId} не знайдена.`);
    return {
      token: profile?.notification_token || null,
      language: profile?.language || 'uk',
      timezone: anketa?.country_timezone || 'UTC',
      fullName: profile?.full_name || 'Лікар'
    };
  } catch (e) {
    console.error(`Критична помилка отримання даних для лікаря ${doctorId}:`, e.message);
    return defaultUserData;
  }
}
const translations = {
  uk: {
    payment_success_title: "Оплата підтверджена!",
    payment_success_patient_body: (doctorName, date, time, amount, currency, meetLink)=>`Ваша консультація з ${doctorName} на ${date} о ${time} (ваш час) успішно оплачена. Сума: ${amount} ${currency}.${meetLink ? ` Посилання на зустріч: ${meetLink}` : ''}`,
    payment_success_doctor_body: (patientName, date, time, amount, currency, meetLink)=>`Пацієнт ${patientName} оплатив консультацію на ${date} о ${time} (ваш час). Сума: ${amount} ${currency}.${meetLink ? ` Посилання на зустріч: ${meetLink}` : ''}`
  },
  en: {
    payment_success_title: "Payment confirmed!",
payment_success_patient_body: (doctorName, date, time, amount, currency, meetLink)=>`Your consultation with ${doctorName} on ${date} at ${time} (your time) has been successfully paid. Amount: ${amount} ${currency}.${meetLink ?  `Meeting link: ${meetLink}` : ''}`,
payment_success_doctor_body: (patientName, date, time, amount, currency, meetLink)=>`Patient ${patientName} has paid for the consultation on ${date} at ${time} (your time). Amount: ${amount} ${currency}.${meetLink ?  `Meeting link: ${meetLink}` : ''}`
  }
};
function getTranslation(lang, key, ...args) {
  const selectedLangSet = translations[lang] || translations.uk;
  const messageTemplate = selectedLangSet[key];
  if (typeof messageTemplate === 'function') {
    return messageTemplate(...args);
  }
  return messageTemplate || key;
}
// --- Головний обробник запитів ---
serve(async (req)=>{
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const formData = await req.formData();
    const data = formData.get('data')?.toString();
    const signature = formData.get('signature')?.toString();
    if (!data || !signature) throw new Error('Відсутні дані або підпис від LiqPay');
    const decodedData = new TextDecoder().decode(Uint8Array.from(atob(data), (c)=>c.charCodeAt(0)));
    const paymentInfo = JSON.parse(decodedData);
    const dataToHash = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const rawHashBytes = sha1(new TextEncoder().encode(dataToHash), "bytes");
    const expectedSignature = btoa(String.fromCharCode(...rawHashBytes));
    if (signature !== expectedSignature) throw new Error('Неправильний підпис від LiqPay');
    const { order_id, status: paymentStatus, amount, currency } = paymentInfo;
    const bookingId = order_id.startsWith('booking_') ? order_id.split('_')[1] : order_id;
    const { data: booking, error: bookingError } = await supabaseAdmin.from('patient_bookings').select('doctor_id, patient_id, booking_date, booking_time_slot').eq('id', bookingId).single();
    if (bookingError) throw new Error(`Бронювання з ID ${bookingId} не знайдено: ${bookingError.message}`);
    const { doctor_id, patient_id, booking_date, booking_time_slot } = booking;
    const isBookingPaid = paymentStatus === 'success' || paymentStatus === 'sandbox';
    const roomName = `DoctorPlus-Consultation-${bookingId.replace(/-/g, '')}`;
    const generatedMeetLink = `https://meet.jit.si/${roomName}`;
    await supabaseAdmin.from('patient_bookings').update({
      payment_status: paymentStatus,
      is_paid: isBookingPaid,
      liqpay_data: paymentInfo,
      meet_link: generatedMeetLink
    }).eq('id', bookingId);
    if (isBookingPaid) {
      const [patientData, doctorData] = await Promise.all([
        getPatientData(patient_id),
        getDoctorData(doctor_id)
      ]);
      const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, {
        zone: 'utc'
      });
      if (!utcDateTime.isValid) throw new Error('Неправильний формат дати/часу бронювання.');
      const notificationsToProcess = [];
      const patientLocalDateTime = utcDateTime.setZone(patientData.timezone);
      notificationsToProcess.push({
        tableName: 'patient_notifications',
        userColumnName: 'patient_id',
        userId: patient_id,
        bookingId: bookingId,
        title: getTranslation(patientData.language, 'payment_success_title'),
        body: getTranslation(patientData.language, 'payment_success_patient_body', doctorData.fullName, patientLocalDateTime.toLocaleString(DateTime.DATE_FULL, {
          locale: patientData.language
        }), patientLocalDateTime.toFormat('HH:mm'), amount, currency, generatedMeetLink),
        pushToken: patientData.token,
        dataPayload: {
          type: 'payment_update',
          booking_id: bookingId,
          is_paid: true,
          meet_link: generatedMeetLink,
          doctor_name: doctorData.fullName
        }
      });
      const doctorLocalDateTime = utcDateTime.setZone(doctorData.timezone);
      notificationsToProcess.push({
        tableName: 'doctor_notifications',
        userColumnName: 'doctor_id',
        userId: doctor_id,
        bookingId: bookingId,
        title: getTranslation(doctorData.language, 'payment_success_title'),
        body: getTranslation(doctorData.language, 'payment_success_doctor_body', patientData.fullName, doctorLocalDateTime.toLocaleString(DateTime.DATE_FULL, {
          locale: doctorData.language
        }), doctorLocalDateTime.toFormat('HH:mm'), amount, currency, generatedMeetLink),
        pushToken: doctorData.token,
        dataPayload: {
          type: 'payment_update',
          booking_id: bookingId,
          is_paid: true,
          meet_link: generatedMeetLink,
          patient_id: patient_id,
          patient_name: patientData.fullName,
          booking_date: booking_date,
          booking_time_slot: booking_time_slot
        }
      });
      await createAndSendNotifications(notificationsToProcess);
    }
    return new Response(JSON.stringify({
      success: true,
      paymentStatus
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Помилка в liqpay-callback:", error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
