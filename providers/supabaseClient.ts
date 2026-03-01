import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration in app.config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
// // https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback
// // https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback
// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// import { createClient } from '@supabase/supabase-js';
// import { Expo } from 'expo-server-sdk';
// import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4'; // 1. ІМПОРТОВАНО LUXON

// const expo = new Expo();

// // --- Словник перекладів для сповіщень ---
// const translations = {
//   meetLinkUpdateTitle: {
//     uk: 'Посилання на зустріч оновлено 🔗',
//     en: 'Meet Link Updated 🔗'
//   },
//   meetLinkUpdateBody: {
//     uk: (doctorName, date, time) => `Лікар ${doctorName} оновив посилання на вашу консультацію ${date} о ${time} (ваш час). Будь ласка, перевірте!`,
//     en: (doctorName, date, time) => `Doctor ${doctorName} has updated the meet link for your consultation on ${date} at ${time} (your time). Please check!`
//   },
//   consultationCompletedTitle: {
//     uk: 'Консультація завершена ✅',
//     en: 'Consultation Completed ✅'
//   },
//   consultationCompletedBody: {
//     uk: (doctorName, date, time) => `Лікар ${doctorName} позначив вашу консультацію ${date} о ${time} (ваш час) як завершену. Будь ласка, залиште відгук!`,
//     en: (doctorName, date, time) => `Doctor ${doctorName} has marked your consultation on ${date} at ${time} (your time) as completed. Please leave a feedback!`
//   },
// };

// // --- Допоміжна функція для отримання перекладу ---
// const getTranslation = (key, lang, ...args) => {
//   const defaultLang = 'uk';
//   const selectedLang = lang === 'en' || lang === 'uk' ? lang : defaultLang;
//   const translation = translations[key]?.[selectedLang];
//   if (typeof translation === 'function') {
//     return translation(...args);
//   }
//   return translation || translations[key]?.[defaultLang] || `Translation missing for ${key}`;
// };

// serve(async (req) => {
//   if (req.method !== 'POST') {
//     return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { headers: { 'Content-Type': 'application/json' }, status: 405 });
//   }

//   const supabaseClient = createClient(
//     Deno.env.get('SUPABASE_URL') ?? '',
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
//     { auth: { autoRefreshToken: false, persistSession: false } }
//   );

//   try {
//     const {
//       type, booking_id, patient_id, doctor_name, booking_date, booking_time_slot,
//       meet_link, consultation_conducted, consultation_started_on_time, doctor_feedback
//     } = await req.json();

//     if (!type || !booking_id || !patient_id || !doctor_name || !booking_date || !booking_time_slot) {
//       return new Response(JSON.stringify({ error: 'Missing required fields' }), { headers: { 'Content-Type': 'application/json' }, status: 400 });
//     }

//     let updateBookingError;

//     switch (type) {
//       case 'meet_link_update':
//         if (!meet_link) {
//           return new Response(JSON.stringify({ error: 'Missing meet_link' }), { headers: { 'Content-Type': 'application/json' }, status: 400 });
//         }
//         ({ error: updateBookingError } = await supabaseClient.from('patient_bookings').update({ meet_link }).eq('id', booking_id));
//         if (updateBookingError) throw new Error(`Failed to update meet_link: ${updateBookingError.message}`);
//         break;

//       case 'consultation_completed':
//         ({ error: updateBookingError } = await supabaseClient.from('patient_bookings').update({
//           status_meet: true,
//           consultation_ended_at: new Date().toISOString(),
//           consultation_conducted,
//           consultation_started_on_time,
//           doctor_feedback,
//         }).eq('id', booking_id));
//         if (updateBookingError) throw new Error(`Failed to update booking status: ${updateBookingError.message}`);
        
//         try {
//           const { data: doctorNotification, error: fetchNotifError } = await supabaseClient
//             .from('doctor_notifications').select('id, data').eq('booking_id', booking_id).single();
//           if (fetchNotifError && fetchNotifError.code !== 'PGRST116') {
//             console.warn('Could not find existing doctor_notification for booking_id:', booking_id, fetchNotifError.message);
//           } else if (doctorNotification) {
//             const updatedData = { ...doctorNotification.data, status_meet: true, consultation_conducted, consultation_started_on_time, doctor_feedback };
//             await supabaseClient.from('doctor_notifications').update({ data: updatedData, is_read: true }).eq('id', doctorNotification.id);
//           }
//         } catch (e) {
//           console.error('Error during doctor_notifications update:', e.message);
//         }
//         break;

//       default:
//         return new Response(JSON.stringify({ error: 'Invalid notification type' }), { headers: { 'Content-Type': 'application/json' }, status: 400 });
//     }

//     // 1. Отримуємо дані пацієнта, включаючи часовий пояс
//     const { data: patientProfile, error: patientError } = await supabaseClient
//       .from('profiles')
//       .select('notification_token, language, country_timezone') // 2. ДОДАНО country_timezone
//       .eq('user_id', patient_id)
//       .single();

//     if (patientError) {
//       console.warn(`Failed to fetch patient profile: ${patientError.message}. Notification will be saved to DB only.`);
//     }

//     const patientPushToken = patientProfile?.notification_token;
//     const patientEffectiveLanguage = patientProfile?.language === 'en' ? 'en' : 'uk';
//     const patientTimezone = patientProfile?.country_timezone || 'UTC'; // За замовчуванням UTC

//     // 3. КОНВЕРТАЦІЯ ТА ФОРМАТУВАННЯ ЧАСУ
//     const utcDateTime = DateTime.fromISO(`${booking_date}T${booking_time_slot}`, { zone: 'utc' });
//     let formattedDate = booking_date;
//     let formattedTime = booking_time_slot;

//     if (utcDateTime.isValid) {
//       const patientLocalDateTime = utcDateTime.setZone(patientTimezone);
//       formattedDate = patientLocalDateTime.toLocaleString(DateTime.DATE_FULL, { locale: patientEffectiveLanguage });
//       formattedTime = patientLocalDateTime.toFormat('HH:mm');
//     }

//     // 4. Оновлюємо заголовок та тіло сповіщення з локалізованим часом
//     const notificationTitleKey = type === 'meet_link_update' ? 'meetLinkUpdateTitle' : 'consultationCompletedTitle';
//     const notificationBodyKey = type === 'meet_link_update' ? 'meetLinkUpdateBody' : 'consultationCompletedBody';
    
//     const notificationTitle = getTranslation(notificationTitleKey, patientEffectiveLanguage);
//     const notificationBody = getTranslation(notificationBodyKey, patientEffectiveLanguage, doctor_name, formattedDate, formattedTime);
    
//     const notificationData = { type, booking_id, patient_id, doctor_name, booking_date, booking_time_slot, meet_link, consultation_conducted, consultation_started_on_time, doctor_feedback };

//     // 5. Створюємо запис у таблиці patient_notifications
//     const { data: notificationEntry, error: notificationError } = await supabaseClient.from('patient_notifications')
//       .insert({ patient_id, title: notificationTitle, body: notificationBody, data: notificationData, is_read: false })
//       .select().single();
      
//     if (notificationError) throw new Error(`Failed to insert patient notification: ${notificationError.message}`);

//     // 6. Надсилаємо Push-сповіщення (якщо токен є)
//     if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
//       const { count: unreadCount } = await supabaseClient.from('patient_notifications').select('*', { count: 'exact', head: true }).eq('patient_id', patient_id).eq('is_read', false);
      
//       const messages = [{
//         to: patientPushToken,
//         sound: 'default',
//         title: notificationTitle,
//         body: notificationBody,
//         data: { ...notificationData, db_notification_id: notificationEntry.id },
//         badge: unreadCount ?? 1,
//       }];

//       await expo.sendPushNotificationsAsync(expo.chunkPushNotifications(messages)[0]);
//     }

//     return new Response(JSON.stringify({ success: true, notification_id: notificationEntry.id }), { headers: { 'Content-Type': 'application/json' }, status: 200 });

//   } catch (error) {
//     console.error('General error in Edge Function:', error.message);
//     return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
//   }
// });




// import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// import { createClient } from 'npm:@supabase/supabase-js@2';
// import { sha1 } from 'https://deno.land/x/sha1@v1.0.1/mod.ts';

// const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY');

// if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
//   throw new Error("Необхідні змінні середовища не налаштовані.");
// }

// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// serve(async (req) => {
//   try {
//     const formData = await req.formData();
//     const data = formData.get('data')?.toString();
//     const signature = formData.get('signature')?.toString();
//     if (!data || !signature) throw new Error('Відсутні дані або підпис від LiqPay');

//     const expectedSignature = btoa(String.fromCharCode(...sha1(new TextEncoder().encode(LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY), "bytes")));
//     if (signature !== expectedSignature) throw new Error('Неправильний підпис від LiqPay');

//     const paymentInfo = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data), (c) => c.charCodeAt(0))));
//     const { order_id, status: paymentStatus } = paymentInfo;

//     const { data: booking, error: findError } = await supabaseAdmin
//       .from('patient_bookings')
//       .select('id, liqpay_data')
//       .filter('liqpay_data->>order_id', 'eq', order_id)
//       .single();
      
//     if (findError || !booking) throw new Error(`Бронювання для order_id ${order_id} не знайдено.`);
    
//     const bookingId = booking.id;
//     console.log(`Callback для booking ${bookingId} зі статусом: ${paymentStatus}`);
    
//     if (paymentStatus === 'hold_wait') {
//       const roomName = `DoctorPlus-Consultation-${bookingId.replace(/-/g, '')}`;
//       const generatedMeetLink = `https://meet.jit.si/${roomName}`;

//       const newLiqpayData = { ...(booking.liqpay_data || {}), ...paymentInfo };

//       await supabaseAdmin
//         .from('patient_bookings')
//         .update({
//           payment_status: 'hold_wait',
//           liqpay_data: newLiqpayData, 
//           meet_link: generatedMeetLink,
//         })
//         .eq('id', bookingId);

//     } else if (paymentStatus === 'success') {
//       await supabaseAdmin
//         .from('patient_bookings')
//         .update({
//           payment_status: 'success',
//           is_paid: true,
//           payout_status: 'completed', // Весь цикл успішно завершено
//         })
//         .eq('id', bookingId);
//     } else {
//       await supabaseAdmin.from('patient_bookings').update({ payment_status: paymentStatus }).eq('id', bookingId);
//     }
    
//     return new Response(JSON.stringify({ success: true }), { status: 200 });
//   } catch (error) {
//     console.error("Помилка в liqpay-callback:", error.stack);
//     return new Response(JSON.stringify({ error: error.message }), { status: 500 });
//   }
// });