import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Buffer } from 'https://esm.sh/buffer';
import sha1 from 'https://esm.sh/js-sha1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY') || ''; // Ключ з Supabase Secrets

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
  console.error("ENVIRONMENT_ERROR: Supabase або LiqPay ключі не встановлені.");
  throw new Error("Missing environment variables.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

// Допоміжна функція для надсилання push-сповіщень Expo
async function sendPushNotification(expoPushToken: string, title: string, body: string, data: Record<string, any> = {}) {
    if (!expoPushToken) {
        console.warn("sendPushNotification: No Expo push token provided.");
        return;
    }
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        console.log(`sendPushNotification: Attempting to send to ${expoPushToken.substring(0, 20)}...`);
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        if (result.errors) {
            console.error("sendPushNotification: Error sending Expo push notification:", JSON.stringify(result.errors));
        } else {
            console.log("sendPushNotification: Expo push notification sent successfully:", JSON.stringify(result.data));
        }
    } catch (error) {
        console.error("sendPushNotification: Failed to send Expo push notification:", error);
    }
}


serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    console.log('LiqPay Callback: OPTIONS request received.');
    return new Response('ok', {
      headers: corsHeaders,
      status: 204
    });
  }

  if (req.method !== 'POST') {
    console.warn('LiqPay Callback: Method Not Allowed. Received:', req.method);
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const formData = await req.formData();
    const data = formData.get('data');
    const signature = formData.get('signature');

    console.log('LiqPay Callback: Received data (truncated):', data ? (data as string).substring(0, 100) + '...' : 'null');
    console.log('LiqPay Callback: Received signature:', signature);

    if (!data || !signature) {
      console.error('LiqPay Callback: Missing data or signature in callback.');
      return new Response(JSON.stringify({
        error: 'Missing data or signature'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 1. Декодуємо Base64 дані
    const decodedData = Buffer.from(data as string, 'base64').toString('utf8');
    let paymentInfo: any;
    try {
        paymentInfo = JSON.parse(decodedData);
        console.log('LiqPay Callback: Decoded payment info:', JSON.stringify(paymentInfo));
    } catch (jsonError) {
        console.error('LiqPay Callback: Failed to parse decoded data as JSON:', jsonError);
        return new Response(JSON.stringify({
            error: 'Invalid data format from LiqPay'
        }), {
            status: 400,
            headers: corsHeaders
        });
    }


    // 2. Перевіряємо підпис (КРИТИЧНО ВАЖЛИВО ДЛЯ БЕЗПЕКИ!)
    const expectedSignatureRaw = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const expectedSignature = Buffer.from(sha1(expectedSignatureRaw), 'hex').toString('base64');

    if (signature !== expectedSignature) {
      console.error('LiqPay Callback: Invalid signature received!', {
        received: signature,
        expected: expectedSignature
      });
      return new Response(JSON.stringify({
        error: 'Invalid signature'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    console.log('LiqPay Callback: Signature verified successfully.');

    // 3. Обробляємо статус платежу
    const { order_id, status: paymentStatus, amount, currency } = paymentInfo;

    // Універсальна обробка order_id: якщо він починається з "booking_", розбиваємо, інакше використовуємо як є.
    const bookingId = order_id.startsWith('booking_') ? order_id.split('_')[1] : order_id;

    console.log(`LiqPay Callback: Processing payment for order_id: ${order_id}, BookingId: ${bookingId}, Status: ${paymentStatus}`);

    let finalPaymentStatusForDb = 'failed';
    let notificationTitlePatient = "Оновлення оплати бронювання";
    let notificationBodyPatient = `Статус оплати вашого бронювання №${bookingId} оновлено.`;
    let notificationTitleDoctor = "Оновлення оплати бронювання";
    let notificationBodyDoctor = `Статус оплати бронювання №${bookingId} оновлено.`;

    let isBookingPaid = false; // Прапор, який буде використовуватися для is_paid

    if (paymentStatus === 'success' || paymentStatus === 'sandbox_success') {
      finalPaymentStatusForDb = 'paid';
      notificationTitlePatient = "Оплата успішна!";
      notificationBodyPatient = `Ваше бронювання №${bookingId} на суму ${amount} ${currency} успішно оплачено.`;
      notificationTitleDoctor = "Оплату отримано!";
      notificationBodyDoctor = `Бронювання №${bookingId} на суму ${amount} ${currency} успішно оплачено пацієнтом.`;
      isBookingPaid = true; // Встановлюємо в true при успішній оплаті
    } else if (paymentStatus === 'failure' || paymentStatus === 'error' || paymentStatus === 'reversed' || paymentStatus === 'declined') {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitlePatient = "Помилка оплати!";
      notificationBodyPatient = `Оплата вашого бронювання №${bookingId} не пройшла. Статус: ${paymentStatus}.`;
      notificationTitleDoctor = "Помилка оплати бронювання!";
      notificationBodyDoctor = `Оплата бронювання №${bookingId} не пройшла. Статус: ${paymentStatus}.`;
      isBookingPaid = false; // Встановлюємо в false при невдалій оплаті
    } else {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitlePatient = "Оновлення статусу оплати";
      notificationBodyPatient = `Оплата вашого бронювання №${bookingId} в статусі: ${paymentStatus}.`;
      notificationTitleDoctor = "Оновлення статусу оплати бронювання";
      notificationBodyDoctor = `Оплата бронювання №${bookingId} в статусі: ${paymentStatus}.`;
      isBookingPaid = false; // Встановлюємо в false для інших статусів
    }

    // 4. Оновлюємо статус платежу та `is_paid` у таблиці `patient_bookings`
    const { data: updatedBooking, error: updateBookingError } = await supabaseAdmin
      .from('patient_bookings')
      .update({
        payment_status: finalPaymentStatusForDb,
        is_paid: isBookingPaid,
        liqpay_data: paymentInfo // Зберігаємо повні дані LiqPay для історії
      })
      .eq('id', bookingId)
      .select(`
        id,
        patient_id,
        doctor_id,
        booking_date,
        booking_time_slot,
        profile_doctor(full_name),
        profiles(full_name)
      `)
      .single();

    if (updateBookingError) {
      console.error('LiqPay Callback: Error updating booking status in patient_bookings:', updateBookingError.message);
      // Важливо: Повертаємо 200 OK для LiqPay, навіть якщо оновлення БД не вдалося,
      // щоб LiqPay не відправляв повторні сповіщення. Логуємо помилку для подальшого розслідування.
      return new Response(JSON.stringify({
        error: 'Failed to update booking status in DB, but LiqPay callback received.',
        details: updateBookingError.message
      }), {
        status: 200, // Still return 200 to LiqPay
        headers: corsHeaders
      });
    }
    console.log(`LiqPay Callback: Booking ${bookingId} successfully updated to status: ${finalPaymentStatusForDb}, is_paid: ${isBookingPaid}.`);
    console.log(`LiqPay Callback: Fetched updatedBooking data: ${JSON.stringify(updatedBooking)}`); // Log the fetched data for debugging

    // --- Оновлюємо patient_notifications для відображення статусу оплати ---
    // Це оновлює існуюче повідомлення, щоб фронтенд міг відреагувати на зміну `is_paid`
    const { data: existingPatientNotification, error: fetchPatientNotificationError } = await supabaseAdmin
      .from('patient_notifications')
      .select('id, data')
      .eq('data->>booking_id', bookingId)
      .eq('patient_id', updatedBooking.patient_id) // Add patient_id to filter to avoid cross-user issues
      .single();

    if (fetchPatientNotificationError && fetchPatientNotificationError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.warn('LiqPay Callback: Error fetching existing patient_notification for booking_id:', bookingId, fetchPatientNotificationError.message);
    } else if (existingPatientNotification) {
      const updatedNotificationData = {
        ...existingPatientNotification.data,
        is_paid: isBookingPaid,
        payment_status: finalPaymentStatusForDb,
        amount: amount,
        currency: currency,
        payment_date: new Date().toISOString(),
      };

      const { error: updateNotificationError } = await supabaseAdmin
        .from('patient_notifications')
        .update({
          data: updatedNotificationData,
          is_read: false, // Mark as unread to notify patient of update
          title: notificationTitlePatient,
          body: notificationBodyPatient
        })
        .eq('id', existingPatientNotification.id);

      if (updateNotificationError) {
        console.error('LiqPay Callback: Помилка оновлення patient_notifications data:', updateNotificationError.message);
      } else {
        console.log(`LiqPay Callback: patient_notification для бронювання ${bookingId} оновлено з is_paid: ${isBookingPaid}.`);
      }
    } else {
        // Якщо сповіщення не знайдено, створити нове.
        console.log(`LiqPay Callback: Existing patient_notification for booking ${bookingId} not found. Creating a new one.`);
        const { error: insertNewPatientNotificationError } = await supabaseAdmin
            .from('patient_notifications')
            .insert({
                patient_id: updatedBooking.patient_id,
                title: notificationTitlePatient,
                body: notificationBodyPatient,
                notification_type: isBookingPaid ? 'payment_success' : 'payment_update', // Use specific type
                data: {
                    booking_id: bookingId,
                    amount: amount,
                    currency: currency,
                    is_paid: isBookingPaid,
                    payment_status: finalPaymentStatusForDb,
                    doctor_name: updatedBooking.profile_doctor.full_name,
                    booking_date: updatedBooking.booking_date,
                    booking_booking_time_slot: updatedBooking.booking_time_slot,
                    payment_date: new Date().toISOString(),
                },
                is_read: false,
            });
        if (insertNewPatientNotificationError) {
            console.error('LiqPay Callback: Помилка створення нового patient_notification:', insertNewPatientNotificationError.message);
        } else {
            console.log('LiqPay Callback: Нове patient_notification успішно створено.');
        }
    }
    // --- КІНЕЦЬ БЛОКУ ОНОВЛЕННЯ СПОВІЩЕНЬ ПАЦІЄНТА ---


    // 5. Надсилаємо Push-сповіщення та оновлюємо doctor_notifications
    if (updatedBooking) {
      console.log(`LiqPay Callback: Sending push notifications for booking ${bookingId}`);

      // Отримуємо Expo push token пацієнта
      const { data: patientProfile, error: patientTokenError } = await supabaseAdmin
        .from('profiles')
        .select('notification_token')
        .eq('user_id', updatedBooking.patient_id)
        .single();

      if (patientTokenError) {
        console.error('LiqPay Callback: Error fetching patient Expo token:', patientTokenError.message);
      } else if (patientProfile?.notification_token) {
        console.log(`LiqPay Callback: Patient token found for user ${updatedBooking.patient_id}. Sending patient notification.`);
        await sendPushNotification(
          patientProfile.notification_token,
          notificationTitlePatient,
          notificationBodyPatient,
          {
            type: isBookingPaid ? 'payment_success' : 'payment_update',
            booking_id: bookingId,
            amount: amount,
            currency: currency,
            is_paid: isBookingPaid,
            payment_status: finalPaymentStatusForDb,
            doctor_name: updatedBooking.profile_doctor.full_name,
            booking_date: updatedBooking.booking_date,
            booking_booking_time_slot: updatedBooking.booking_time_slot,
          }
        );
      } else {
        console.warn('LiqPay Callback: Patient Expo token not found for patient_id:', updatedBooking.patient_id);
      }

      // Отримуємо Expo push token лікаря
      const { data: doctorProfile, error: doctorTokenError } = await supabaseAdmin
        .from('profile_doctor')
        .select('notification_token')
        .eq('user_id', updatedBooking.doctor_id)
        .single();

      if (doctorTokenError) {
        console.error('LiqPay Callback: Error fetching doctor Expo token:', doctorTokenError.message);
      } else if (doctorProfile?.notification_token) {
        console.log(`LiqPay Callback: Doctor token found for user ${updatedBooking.doctor_id}. Sending doctor notification.`);
        await sendPushNotification(
          doctorProfile.notification_token,
          notificationTitleDoctor,
          notificationBodyDoctor,
          {
            type: isBookingPaid ? 'payment_received' : 'payment_update_doctor', // Use 'payment_received' for success
            booking_id: bookingId,
            amount: amount,
            currency: currency,
            is_paid: isBookingPaid,
            payment_status: finalPaymentStatusForDb,
            patient_name: updatedBooking.profiles.full_name, // <-- тут ім'я пацієнта
            booking_date: updatedBooking.booking_date,
            booking_booking_time_slot: updatedBooking.booking_time_slot,
          }
        );
      } else {
        console.warn('LiqPay Callback: Doctor Expo token not found for doctor_id:', updatedBooking.doctor_id);
      }

       // Додаємо запис у таблицю сповіщень лікаря (або оновлюємо існуючий)
       const { data: existingDoctorNotification, error: fetchDoctorNotificationError } = await supabaseAdmin
        .from('doctor_notifications')
        .select('id, data')
        .eq('data->>booking_id', bookingId)
        .eq('doctor_id', updatedBooking.doctor_id) // Додаємо doctor_id для фільтрації
        .single();

    if (fetchDoctorNotificationError && fetchDoctorNotificationError.code !== 'PGRST116') {
        console.warn('LiqPay Callback: Error fetching existing doctor_notification for booking_id:', bookingId, fetchDoctorNotificationError.message);
    } else if (existingDoctorNotification) {
        const updatedDoctorNotificationData = {
            ...existingDoctorNotification.data,
            is_paid: isBookingPaid,
            payment_status: finalPaymentStatusForDb,
            amount: amount,
            currency: currency,
            payment_date: new Date().toISOString(),
        };
        const { error: updateDoctorNotificationError } = await supabaseAdmin
            .from('doctor_notifications')
            .update({
                data: updatedDoctorNotificationData,
                is_read: false, // Позначаємо як непрочитане
                title: notificationTitleDoctor,
                body: notificationBodyDoctor
            })
            .eq('id', existingDoctorNotification.id);
        if (updateDoctorNotificationError) {
            console.error('LiqPay Callback: Помилка оновлення doctor_notifications data:', updateDoctorNotificationError.message);
        } else {
            console.log(`LiqPay Callback: doctor_notification для бронювання ${bookingId} оновлено з is_paid: ${isBookingPaid}.`);
        }
    } else {
        console.log(`LiqPay Callback: Existing doctor_notification for booking ${bookingId} not found. Creating a new one.`);
        const { error: insertNewDoctorNotificationError } = await supabaseAdmin.from('doctor_notifications').insert({
            doctor_id: updatedBooking.doctor_id,
            title: notificationTitleDoctor,
            body: notificationBodyDoctor,
            notification_type: isBookingPaid ? 'payment_received' : 'payment_update_doctor', // Specific type
            data: {
                booking_id: bookingId,
                amount: amount,
                currency: currency,
                is_paid: isBookingPaid,
                payment_status: finalPaymentStatusForDb,
                patient_name: updatedBooking.profiles.full_name,
                booking_date: updatedBooking.booking_date,
                booking_booking_time_slot: updatedBooking.booking_time_slot,
                payment_date: new Date().toISOString(),
            },
            is_read: false,
        });
        if (insertNewDoctorNotificationError) {
            console.error('LiqPay Callback: Помилка створення нового doctor_notification:', insertNewDoctorNotificationError.message);
        } else {
            console.log('LiqPay Callback: Нове doctor_notification успішно створено.');
        }
    }

    } else {
      console.warn('LiqPay Callback: Missing updated booking data (patient_id/doctor_id), skipping push notifications and DB operations for notifications.');
    }

    // LiqPay очікує HTTP 200 OK відповідь, зазвичай без тіла або з порожнім тілом.
    return new Response(JSON.stringify({
      success: true,
      paymentStatus: finalPaymentStatusForDb
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    let errorMessage = "An unknown error occurred in the LiqPay Callback.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error("LiqPay Callback: Uncaught error (global catch block):", errorMessage, error);
    // Важливо: При будь-якій помилці тут все одно повертаємо 200 OK для LiqPay
    // щоб запобігти повторним надсиланням callback. Логуємо помилку.
    return new Response(JSON.stringify({
      error: `Server error: ${errorMessage}`
    }), {
      status: 200, // Still return 200 to LiqPay
      headers: corsHeaders
    });
  }
});