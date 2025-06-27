import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Buffer } from 'https://esm.sh/buffer';
import sha1 from 'https://esm.sh/js-sha1';
// Імпортувати Expo SDK, якщо ви його використовуєте для відправки, але тут використовується `fetch` напряму
// import { Expo } from 'https://esm.sh/expo-server-sdk@3.7.0'; 
// Якщо ви хочете використовувати Expo SDK, то функція sendPushNotification повинна бути змінена
// та імпорт Expo повинен бути тут. Поточна реалізація використовує fetch напряму.

// Важливо: для розгортання на Supabase Edge Functions,
// ці змінні оточення повинні бути встановлені в Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LIQPAY_PRIVATE_KEY = Deno.env.get('LIQPAY_PRIVATE_KEY') || '';

console.log("LOG: DEBUG: ENV VARS Check (LiqPay Callback):");
console.log("LOG: SUPABASE_URL is set:", !!SUPABASE_URL);
console.log("LOG: SUPABASE_SERVICE_ROLE_KEY is set:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("LOG: LIQPAY_PRIVATE_KEY is set:", !!LIQPAY_PRIVATE_KEY);
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LIQPAY_PRIVATE_KEY) {
  console.error("ERROR: ENVIRONMENT_ERROR: Один або кілька необхідних ключів (Supabase/LiqPay) не встановлені. Перевірте Supabase Secrets.");
  throw new Error("Missing environment variables.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

// Загальні CORS заголовки для Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// ЗМІНЕНО: Додано параметр `soundFileName` до функції
async function sendPushNotification(expoPushToken: string, title: string, body: string, data: Record<string, any> = {}, soundFileName: string = 'default') {
  if (!expoPushToken) {
    console.warn("WARN: sendPushNotification: No Expo push token provided.");
    return;
  }
  const message = {
    to: expoPushToken,
    sound: soundFileName, // <-- ВИКОРИСТОВУЄМО ТУТ ПЕРЕДАНЕ ЗНАЧЕННЯ
    title,
    body,
    data,
  };

  try {
    console.log(`LOG: sendPushNotification: Attempting to send to ${expoPushToken.substring(0, 20)}... with sound: ${soundFileName}`); // Логуємо звук
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
      console.error("ERROR: sendPushNotification: Error sending Expo push notification:", JSON.stringify(result.errors));
    } else {
      console.log("LOG: sendPushNotification: Expo push notification sent successfully:", JSON.stringify(result.data));
    }
  } catch (error) {
    console.error("ERROR: sendPushNotification: Failed to send Expo push notification:", error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('LOG: LiqPay Callback: OPTIONS request received.');
    return new Response('ok', {
      headers: corsHeaders,
      status: 204
    });
  }

  if (req.method !== 'POST') {
    console.warn('WARN: LiqPay Callback: Method Not Allowed. Received:', req.method);
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

    console.log('LOG: LiqPay Callback: Received data (truncated):', data ? (data as string).substring(0, 100) + '...' : 'null');
    console.log('LOG: LiqPay Callback: Received signature:', signature);

    if (!data || !signature) {
      console.error('ERROR: LiqPay Callback: Missing data or signature in callback.');
      return new Response(JSON.stringify({
        error: 'Missing data or signature'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const decodedData = Buffer.from(data as string, 'base64').toString('utf8');
    let paymentInfo: any;
    try {
      paymentInfo = JSON.parse(decodedData);
      console.log('LOG: LiqPay Callback: Decoded payment info:', JSON.stringify(paymentInfo));
    } catch (jsonError) {
      console.error('ERROR: LiqPay Callback: Failed to parse decoded data as JSON:', jsonError);
      return new Response(JSON.stringify({
        error: 'Invalid data format from LiqPay'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const expectedSignatureRaw = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const expectedSignature = Buffer.from(sha1(expectedSignatureRaw), 'hex').toString('base64');

    if (signature !== expectedSignature) {
      console.error('ERROR: LiqPay Callback: Invalid signature received!', {
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
    console.log('LOG: LiqPay Callback: Signature verified successfully.');

    const { order_id, status: paymentStatus, amount, currency } = paymentInfo;

    const bookingId = order_id.startsWith('booking_') ? order_id.split('_')[1] : order_id;

    console.log(`LOG: LiqPay Callback: Processing payment for order_id: ${order_id}, BookingId: ${bookingId}, Status: ${paymentStatus}`);

    let finalPaymentStatusForDb = 'failed';
    let notificationTitlePatient = "Оновлення оплати бронювання";
    let notificationBodyPatient = `Статус оплати вашого бронювання №${bookingId} оновлено.`;
    let notificationTitleDoctor = "Оновлення оплати бронювання";
    let notificationBodyDoctor = `Статус оплати бронювання №${bookingId} оновлено.`;

    let isBookingPaid = false;
    // meetLink тут завжди буде null, оскільки він додається лікарем пізніше через іншу функцію
    // let meetLink: string | null = null;

    const { data: booking, error: bookingError } = await supabaseAdmin
        .from('patient_bookings')
        .select(`
            id,
            booking_date,
            booking_time_slot,
            doctor_id,
            patient_id,
            meet_link,
            patient_profile:profiles!inner(full_name, notification_token),
            doctor_profile:profile_doctor!inner(full_name, notification_token)
        `)
        .eq('id', bookingId)
        .single();

    if (bookingError || !booking) {
        console.error('ERROR: LiqPay Callback: Не вдалося знайти бронювання для сповіщень:', bookingError?.message);
        return new Response(JSON.stringify({
            error: `Booking with ID ${bookingId} not found.`,
            details: bookingError?.message
        }), {
            status: 404,
            headers: corsHeaders
        });
    }

    // ЗМІНЕНО: Визначення назви звукового файлу
    const customSoundFileName = 'sms_meow.mp3'; 

    if (paymentStatus === 'success' || paymentStatus === 'sandbox_success') {
      finalPaymentStatusForDb = 'paid';
      isBookingPaid = true;

      notificationTitlePatient = "Оплата підтверджена!";
      notificationBodyPatient = `Ваша консультація з ${booking.doctor_profile?.full_name || 'лікарем'} на ${booking.booking_date} о ${booking.booking_time_slot} успішно оплачена. Очікуйте додаткове сповіщення з посиланням на Meet від лікаря.`;

      notificationTitleDoctor = "Нове підтверджене бронювання!";
      notificationBodyDoctor = `Пацієнт ${booking.patient_profile?.full_name || 'пацієнт'} оплатив консультацію на ${booking.booking_date} о ${booking.booking_time_slot}. Будь ласка, створіть посилання на Google Meet та додайте його у деталі бронювання.`;

    } else if (paymentStatus === 'failure' || paymentStatus === 'error' || paymentStatus === 'reversed' || paymentStatus === 'declined') {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitlePatient = "Помилка оплати!";
      notificationBodyPatient = `Оплата вашого бронювання №${bookingId} не пройшла. Статус: ${paymentStatus}.`;
      notificationTitleDoctor = "Помилка оплати бронювання!";
      notificationBodyDoctor = `Оплата бронювання №${bookingId} не проймати. Статус: ${paymentStatus}.`;
    } else {
      finalPaymentStatusForDb = paymentStatus;
      notificationTitlePatient = "Оновлення статусу оплати";
      notificationBodyPatient = `Оплата вашого бронювання №${bookingId} в статусі: ${paymentStatus}.`;
      notificationTitleDoctor = "Оновлення статусу оплати бронювання";
      notificationBodyDoctor = `Оплата бронювання №${bookingId} в статусі: ${paymentStatus}.`;
    }

    // Оновлення статусу бронювання в patient_bookings
    // meet_link залишаємо як є в базі, якщо він був, або null, якщо його не було.
    // Фронтенд додасть meet_link пізніше.
    const { data: updatedBookingData, error: updateBookingError } = await supabaseAdmin
      .from('patient_bookings')
      .update({
        payment_status: finalPaymentStatusForDb,
        is_paid: isBookingPaid,
        liqpay_data: paymentInfo,
        // meet_link: null, // НЕ ВСТАНОВЛЮЄМО В NULL, щоб зберегти існуюче посилання якщо воно вже було
      })
      .eq('id', bookingId)
      .select(`
        id,
        patient_id,
        doctor_id,
        booking_date,
        booking_time_slot,
        meet_link
      `)
      .single();

    if (updateBookingError) {
      console.error('ERROR: LiqPay Callback: Error updating booking status in patient_bookings:', updateBookingError.message);
      return new Response(JSON.stringify({
        error: 'Failed to update booking status in DB, but LiqPay callback received.',
        details: updateBookingError.message
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    console.log(`LOG: LiqPay Callback: Booking ${bookingId} successfully updated to status: ${finalPaymentStatusForDb}, is_paid: ${isBookingPaid}, meet_link: ${updatedBookingData?.meet_link}.`);

    // --- Логіка сповіщень ---

    const notificationDataCommon = {
      booking_id: bookingId,
      amount: amount,
      currency: currency,
      is_paid: isBookingPaid,
      payment_status: finalPaymentStatusForDb,
      doctor_name: booking.doctor_profile.full_name,
      patient_name: booking.patient_profile.full_name,
      booking_date: booking.booking_date,
      booking_time_slot: booking.booking_time_slot,
      payment_date: new Date().toISOString(),
      meet_link: updatedBookingData?.meet_link, // Це поле буде містити поточне посилання з БД (або null)
    };

    // Оновлення/створення сповіщення пацієнта
    const { data: existingPatientNotification, error: fetchPatientNotificationError } = await supabaseAdmin
      .from('patient_notifications')
      .select('id, data')
      .eq('data->>booking_id', bookingId)
      .eq('patient_id', booking.patient_id)
      .single();

    if (fetchPatientNotificationError && fetchPatientNotificationError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn('WARN: LiqPay Callback: Error fetching existing patient_notification for booking_id:', bookingId, fetchPatientNotificationError.message);
    } else {
      if (existingPatientNotification) {
        const updatedNotificationData = {
          ...existingPatientNotification.data,
          ...notificationDataCommon,
        };
        const { error: updateNotificationError } = await supabaseAdmin
          .from('patient_notifications')
          .update({
            data: updatedNotificationData,
            is_read: false,
            title: notificationTitlePatient,
            body: notificationBodyPatient
          })
          .eq('id', existingPatientNotification.id);

        if (updateNotificationError) {
          console.error('ERROR: LiqPay Callback: Помилка оновлення patient_notifications data:', updateNotificationError.message);
        } else {
          console.log(`LOG: LiqPay Callback: patient_notification для бронювання ${bookingId} оновлено.`);
        }
      } else {
        console.log(`LOG: LiqPay Callback: Existing patient_notification for booking ${bookingId} not found. Creating a new one.`);
        const { error: insertNewPatientNotificationError } = await supabaseAdmin
          .from('patient_notifications')
          .insert({
            patient_id: booking.patient_id,
            title: notificationTitlePatient,
            body: notificationBodyPatient,
            notification_type: isBookingPaid ? 'payment_success' : 'payment_update', // Використовуємо 'payment_success' для успішної оплати
            data: { ...notificationDataCommon, type: isBookingPaid ? 'payment_success' : 'payment_update' }, // ДОДАНО type до data для пацієнта
            is_read: false,
          });
        if (insertNewPatientNotificationError) {
          console.error('ERROR: LiqPay Callback: Помилка створення нового patient_notification:', insertNewPatientNotificationError.message);
        } else {
          console.log('LOG: LiqPay Callback: Нове patient_notification успішно створено.');
        }
      }
    }

    // Надсилання push-сповіщення пацієнту
    if (booking.patient_profile?.notification_token) {
        console.log(`LOG: LiqPay Callback: Patient token found for user ${booking.patient_id}. Sending patient notification.`);
        await sendPushNotification(
            booking.patient_profile.notification_token,
            notificationTitlePatient,
            notificationBodyPatient,
            {
                type: isBookingPaid ? 'payment_success' : 'payment_update', // ДОДАНО type до push-сповіщення для пацієнта
                booking_id: bookingId,
                amount: amount,
                currency: currency,
                is_paid: isBookingPaid,
                payment_status: finalPaymentStatusForDb,
                doctor_name: booking.doctor_profile.full_name,
                booking_date: booking.booking_date,
                booking_time_slot: booking.booking_time_slot,
                meet_link: updatedBookingData?.meet_link,
            },
            customSoundFileName // <-- ПЕРЕДАЄМО ЗМІННУ З ІМЕНЕМ ФАЙЛУ СЮДИ
        );
    } else {
        console.warn('WARN: LiqPay Callback: Patient Expo token not found for patient_id:', booking.patient_id);
    }

    // Оновлення/створення сповіщення лікаря
    const { data: existingDoctorNotification, error: fetchDoctorNotificationError } = await supabaseAdmin
      .from('doctor_notifications')
      .select('id, data')
      .eq('data->>booking_id', bookingId)
      .eq('doctor_id', booking.doctor_id)
      .single();

    if (fetchDoctorNotificationError && fetchDoctorNotificationError.code !== 'PGRST116') {
      console.warn('WARN: LiqPay Callback: Error fetching existing doctor_notification for booking_id:', bookingId, fetchDoctorNotificationError.message);
    } else {
      // **ОНОВЛЕННЯ ТУТ: Додаємо 'type' до об'єкта data для лікаря**
      const doctorNotificationDataCommonWithExplicitType = {
        type: isBookingPaid ? 'payment_received' : 'payment_update_doctor', // ЦЕЙ РЯДОК ДОДАНО/ЗМІНЕНО
        booking_id: bookingId,
        amount: amount,
        currency: currency,
        is_paid: isBookingPaid,
        payment_status: finalPaymentStatusForDb,
        patient_name: booking.patient_profile.full_name,
        booking_date: booking.booking_date,
        booking_time_slot: booking.booking_time_slot,
        payment_date: new Date().toISOString(),
        meet_link: updatedBookingData?.meet_link, // Посилання з БД, якщо є
      };

      if (existingDoctorNotification) {
        const updatedDoctorNotificationData = {
          ...existingDoctorNotification.data,
          ...doctorNotificationDataCommonWithExplicitType, // ВИКОРИСТОВУЄМО ОНОВЛЕНИЙ ОБ'ЄКТ
        };
        const { error: updateDoctorNotificationError } = await supabaseAdmin
          .from('doctor_notifications')
          .update({
            data: updatedDoctorNotificationData,
            is_read: false,
            title: notificationTitleDoctor,
            body: notificationBodyDoctor
          })
          .eq('id', existingDoctorNotification.id);

        if (updateDoctorNotificationError) {
          console.error('ERROR: LiqPay Callback: Помилка оновлення doctor_notifications data:', updateDoctorNotificationError.message); // Змінено updateNotificationError на updateDoctorNotificationError
        } else {
          console.log(`LOG: LiqPay Callback: doctor_notification для бронювання ${bookingId} оновлено.`);
        }
      } else {
        console.log(`LOG: LiqPay Callback: Existing doctor_notification for booking ${bookingId} not found. Creating a new one.`);
        const { error: insertNewDoctorNotificationError } = await supabaseAdmin.from('doctor_notifications').insert({
          doctor_id: booking.doctor_id,
          title: notificationTitleDoctor,
          body: notificationBodyDoctor,
          notification_type: isBookingPaid ? 'payment_received' : 'payment_update_doctor', // ЦЕЙ РЯДОК ЗАЛИШАЄТЬСЯ
          data: doctorNotificationDataCommonWithExplicitType, // ВИКОРИСТОВУЄМО ОНОВЛЕНИЙ ОБ'ЄКТ
          is_read: false,
        });
        if (insertNewDoctorNotificationError) {
          console.error('ERROR: LiqPay Callback: Помилка створення нового doctor_notification:', insertNewDoctorNotificationError.message);
        } else {
          console.log('LOG: LiqPay Callback: Нове doctor_notification успішно створено.');
        }
      }
    }

    // Надсилання push-сповіщення лікарю
    if (booking.doctor_profile?.notification_token) {
        console.log(`LOG: LiqPay Callback: Doctor token found for user ${booking.doctor_id}. Sending doctor notification.`);
        await sendPushNotification(
            booking.doctor_profile.notification_token,
            notificationTitleDoctor,
            notificationBodyDoctor,
            // **ОНОВЛЕННЯ ТУТ: Додаємо 'type' до push-сповіщення для лікаря**
            {
                type: isBookingPaid ? 'payment_received' : 'payment_update_doctor', // ЦЕЙ РЯДОК ДОДАНО/ЗМІНЕНО
                booking_id: bookingId,
                amount: amount,
                currency: currency,
                is_paid: isBookingPaid,
                payment_status: finalPaymentStatusForDb,
                patient_name: booking.patient_profile.full_name,
                booking_date: booking.booking_date,
                booking_time_slot: booking.booking_time_slot,
                meet_link: updatedBookingData?.meet_link, // Посилання з БД, якщо є
            },
            customSoundFileName // <-- ПЕРЕДАЄМО ЗМІННУ З ІМЕНЕМ ФАЙЛУ СЮДИ
        );
    } else {
        console.warn('WARN: LiqPay Callback: Doctor Expo token not found for doctor_id:', booking.doctor_id);
    }

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
    console.error("ERROR: LiqPay Callback: Uncaught error (global catch block):", errorMessage, error);
    return new Response(JSON.stringify({
      error: `Server error: ${errorMessage}`
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
});