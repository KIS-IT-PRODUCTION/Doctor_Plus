import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  Expo,
  ExpoPushMessage,
  ExpoPushTicket,
} from 'https://esm.sh/expo-server-sdk@3.7.0';

// Ініціалізація Expo SDK
const expo = new Expo();

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Використовуйте SERVICE_ROLE_KEY для бекенд-операцій
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const { booking_id, meet_link, patient_id, doctor_name, booking_date, booking_time_slot } = await req.json();

    if (!booking_id || !meet_link || !patient_id || !doctor_name || !booking_date || !booking_time_slot) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: booking_id, meet_link, patient_id, doctor_name, booking_date, booking_time_slot',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    // 1. Оновлюємо meet_link у таблиці patient_bookings
    const { error: updateBookingError } = await supabaseClient
      .from('patient_bookings')
      .update({ meet_link: meet_link })
      .eq('id', booking_id);

    if (updateBookingError) {
      console.error('Error updating meet_link in patient_bookings:', updateBookingError);
      return new Response(
        JSON.stringify({ error: `Failed to update meet_link in patient_bookings: ${updateBookingError.message}` }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }
    console.log(`Successfully updated meet_link for booking ${booking_id}`);

    // 2. Отримуємо notification_token пацієнта
    const { data: patientProfile, error: patientError } = await supabaseClient
      .from('profiles')
      .select('notification_token')
      .eq('user_id', patient_id)
      .single();

    if (patientError) {
      console.error('Error fetching patient profile:', patientError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch patient profile: ${patientError.message}` }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    const patientPushToken = patientProfile?.notification_token;

    if (!patientPushToken) {
      console.warn(`Patient ${patient_id} does not have a notification_token.`);
      // Все одно створюємо запис у patient_notifications, навіть якщо немає токену для push
      // Це гарантує, що повідомлення з'явиться в історії повідомлень пацієнта в додатку.
    }

    // 3. Створюємо запис у таблиці patient_notifications
    const notificationTitle = 'Оновлення посилання на консультацію'; // або t('meet_link_update_notification_title')
    const notificationBody = `Лікар ${doctor_name} оновив посилання на Meet для вашої консультації ${booking_date} о ${booking_time_slot}.`; // або t('meet_link_updated_body')

    const notificationData = {
      type: 'meet_link_update', // Новий тип сповіщення
      booking_id: booking_id,
      meet_link: meet_link,
      patient_id: patient_id,
      doctor_name: doctor_name,
      booking_date: booking_date,
      booking_time_slot: booking_time_slot,
      // Додайте інші дані, які можуть бути корисними
    };

    const { data: notificationEntry, error: notificationError } = await supabaseClient
      .from('patient_notifications')
      .insert({
        patient_id: patient_id,
        title: notificationTitle,
        body: notificationBody,
        notification_type: 'meet_link_update', // Встановлюємо новий тип для БД
        data: notificationData, // Зберігаємо всі дані як JSONB
        is_read: false,
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error inserting patient notification:', notificationError);
      return new Response(
        JSON.stringify({ error: `Failed to insert patient notification: ${notificationError.message}` }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }
    console.log(`Notification entry created in patient_notifications with ID: ${notificationEntry.id}`);

    // 4. Надсилаємо Push-сповіщення (якщо токен є)
    if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
      const messages: ExpoPushMessage[] = [
        {
          to: patientPushToken,
          sound: 'default',
          title: notificationTitle,
          body: notificationBody,
          data: {
            ...notificationData, // Передаємо всі дані в push-сповіщення
            // id: notificationEntry.id, // Додаємо ID запису з БД для подальшої ідентифікації
          },
          _displayInForeground: true,
        },
      ];

      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log('Expo Push Tickets:', ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
          // Обробка помилок надсилання, наприклад, InvalidPushToken
        }
      }

      // Обробка квитків для перевірки статусу надсилання
      // (Ви можете зберегти tickets у БД або обробляти їх асинхронно)
      console.log('Successfully sent push notifications to patient.');
    } else {
      console.log('No valid push token found for patient or token is invalid. Skipping push notification.');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Meet link updated and notification sent.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('send-meet-link-notification general error:', error);
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});