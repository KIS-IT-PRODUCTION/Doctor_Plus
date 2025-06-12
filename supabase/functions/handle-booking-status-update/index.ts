// supabase/functions/handle-booking-status-update/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Expo } from 'https://esm.sh/expo-server-sdk@3.7.0';

// Якщо у вас є файл з типізацією бази даних, розкоментуйте та вкажіть правильний шлях:
// import { Database } from '../_shared/database.types.ts'; 
// Якщо ні, залиште createClient без generic типу (<Database>).

const expo = new Expo();

// Отримання змінних оточення Supabase.
// Важливо: ці змінні повинні бути налаштовані в Supabase Dashboard -> Edge Functions -> Secrets
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Перевірка, чи змінні оточення встановлені перед ініціалізацією клієнта.
// Ця перевірка спрацює при розгортанні або першому запуску функції.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не встановлені. Переконайтеся, що змінні оточення правильно налаштовані для цієї Edge Function.");
  // Кидаємо помилку, щоб функція не запускалася у неконфігурованому стані
  throw new Error("Supabase environment variables (URL or Service Role Key) are not set.");
}

// Функція для отримання Expo Push Token з таблиці profiles
// Використовує клієнт Supabase, ініціалізований Service Role Key,
// що дозволяє обходити RLS, якщо це необхідно для доступу до push_token.
async function getPatientExpoPushToken(supabaseClient: any, patientId: string): Promise<string | null> {
    if (!patientId) {
        console.warn("getPatientExpoPushToken: patientId is null or undefined.");
        return null;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles') // Переконайтеся, що це правильна таблиця, де зберігається push_token пацієнта
            .select('push_token') // Переконайтеся, що це правильний стовпець для push-токену
            .eq('id', patientId) // Припускаємо, що 'id' в 'profiles' відповідає user_id пацієнта з auth.users
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // PGRST116 - No rows found for single() query
                console.warn(`getPatientExpoPushToken: No profile found for patient ${patientId}.`);
            } else {
                console.error(`getPatientExpoPushToken: Error fetching Expo Push Token for patient ${patientId}:`, error.message);
            }
            return null;
        }

        // Перевірка на profile та profile.push_token
        if (profile && profile.push_token) {
            return profile.push_token;
        }

        console.warn(`getPatientExpoPushToken: Patient ${patientId} has a profile but no push_token found.`);
        return null;
    } catch (e: any) {
        console.error(`getPatientExpoPushToken: Unexpected error for patient ${patientId}:`, e.message || e);
        return null;
    }
}

// Основний обробник Edge Function
serve(async (req) => {
    // Заголовки CORS для дозволу запитів з вашого React Native додатка
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // В продакшені краще вказати конкретний домен
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json', // Завжди повертаємо JSON
    };

    // Обробка OPTIONS-запитів (CORS preflight)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 204 }); // 204 No Content for preflight
    }

    // Перевірка, що метод запиту є POST
    if (req.method !== 'POST') {
        console.warn(`Invalid request method: ${req.method}. Only POST is allowed.`);
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' }), { status: 405, headers: corsHeaders });
    }

    // Ініціалізація Supabase Admin клієнта.
    // Це дозволить виконувати операції з базою даних, ігноруючи Row Level Security (RLS).
    // Це є стандартною та безпечною практикою для бекенд-функцій.
    const supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false, // Важливо для серверних функцій, щоб не зберігати сесію
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    );

    try {
        // Отримання тіла запиту
        let requestBody: any;
        try {
            requestBody = await req.json();
        } catch (jsonError: any) {
            console.error('Failed to parse request body as JSON:', jsonError.message);
            return new Response(JSON.stringify({ error: `Invalid JSON in request body: ${jsonError.message}` }), { status: 400, headers: corsHeaders });
        }

        console.log('Edge Function received request body:', JSON.stringify(requestBody, null, 2));

        const booking = requestBody.booking;
        const doctor_name_from_client = requestBody.doctor_name;

        // **Детальна валідація вхідних даних**
        if (
            !booking ||
            typeof booking !== 'object' || // Перевірка, чи booking є об'єктом
            !('id' in booking) || typeof booking.id !== 'string' || booking.id.trim() === '' || // booking_id
            !('patient_id' in booking) || typeof booking.patient_id !== 'string' || booking.patient_id.trim() === '' || // patient_id
            !('doctor_id' in booking) || typeof booking.doctor_id !== 'string' || booking.doctor_id.trim() === '' || // doctor_id
            !('status' in booking) || typeof booking.status !== 'string' || !['confirmed', 'rejected'].includes(booking.status.toLowerCase()) || // status
            !('booking_date' in booking) || typeof booking.booking_date !== 'string' || booking.booking_date.trim() === '' || // booking_date
            !('booking_time_slot' in booking) || typeof booking.booking_time_slot !== 'string' || booking.booking_time_slot.trim() === '' // booking_time_slot
        ) {
            const missingFields: string[] = [];
            if (!booking || typeof booking !== 'object') missingFields.push('booking object');
            if (!('id' in booking) || typeof booking.id !== 'string' || booking.id.trim() === '') missingFields.push('booking.id (string, non-empty)');
            if (!('patient_id' in booking) || typeof booking.patient_id !== 'string' || booking.patient_id.trim() === '') missingFields.push('booking.patient_id (string, non-empty)');
            if (!('doctor_id' in booking) || typeof booking.doctor_id !== 'string' || booking.doctor_id.trim() === '') missingFields.push('booking.doctor_id (string, non-empty)');
            if (!('status' in booking) || typeof booking.status !== 'string' || !['confirmed', 'rejected'].includes(booking.status.toLowerCase())) missingFields.push('booking.status (string, "confirmed" or "rejected")');
            if (!('booking_date' in booking) || typeof booking.booking_date !== 'string' || booking.booking_date.trim() === '') missingFields.push('booking.booking_date (string, non-empty)');
            if (!('booking_time_slot' in booking) || typeof booking.booking_time_slot !== 'string' || booking.booking_time_slot.trim() === '') missingFields.push('booking.booking_time_slot (string, non-empty)');

            console.warn(`Invalid booking data received. Missing or invalid fields: ${missingFields.join(', ')}`);
            return new Response(
                JSON.stringify({ error: `Invalid booking data: Missing or invalid fields: ${missingFields.join(', ')}` }),
                { status: 400, headers: corsHeaders }
            );
        }

        const { id: booking_id, patient_id, doctor_id, status, booking_date, booking_time_slot } = booking;

        // Перевірка на дійсність UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(booking_id) || !uuidRegex.test(patient_id) || !uuidRegex.test(doctor_id)) {
            console.warn(`Invalid UUID format for one of the IDs: booking_id(${booking_id}), patient_id(${patient_id}), doctor_id(${doctor_id})`);
            return new Response(
                JSON.stringify({ error: 'Invalid UUID format for booking_id, patient_id, or doctor_id.' }),
                { status: 400, headers: corsHeaders }
            );
        }

        let doctor_full_name = doctor_name_from_client;

        // Якщо ім'я лікаря не було передано з клієнта або воно є дефолтним/пустим, спробувати отримати з БД
        if (!doctor_full_name || doctor_full_name.trim() === '' || doctor_full_name === 'Doctor' || doctor_full_name === 'Лікар') {
            console.log(`Doctor name not provided or invalid from client. Attempting to fetch from DB for doctor_id: ${doctor_id}`);
            const { data: doctorProfile, error: doctorProfileError } = await supabaseAdmin
                .from('profile_doctor') // Припускаємо, що таблиця називається 'profile_doctor'
                .select('full_name')
                .eq('user_id', doctor_id) // Переконайтеся, що це правильний стовпець, який зберігає user_id лікаря
                .single();

            if (doctorProfileError) {
                if (doctorProfileError.code === 'PGRST116') {
                    console.warn(`No doctor profile found for ID: ${doctor_id}.`);
                } else {
                    console.error(`Error fetching doctor profile for ${doctor_id}:`, doctorProfileError?.message || 'Unknown error');
                }
                doctor_full_name = 'Невідомий лікар'; // Запасне значення
            } else if (doctorProfile?.full_name) {
                doctor_full_name = doctorProfile.full_name;
                console.log(`Doctor name fetched from DB: ${doctor_full_name}`);
            } else {
                console.warn(`Doctor profile found for ${doctor_id}, but full_name is null/empty.`);
                doctor_full_name = 'Невідомий лікар';
            }
        } else {
            console.log(`Doctor name received from client: ${doctor_full_name}`);
        }

        let title: string;
        let body: string;
        let notification_type: string;
        let patientAlertBody: string; // Коротший текст для Alert

        // Визначення вмісту сповіщення залежно від статусу
        switch (status.toLowerCase()) {
            case 'confirmed':
                title = `Ваше бронювання підтверджено! ✅`;
                body = `Лікар ${doctor_full_name} підтвердив вашу консультацію на ${booking_date} о ${booking_time_slot}. Чекаємо на вас!`;
                notification_type = 'booking_confirmed';
                patientAlertBody = `Ваш запис до лікаря ${doctor_full_name} на ${booking_date} о ${booking_time_slot} підтверджено.`;
                break;
            case 'rejected':
                title = `Ваше бронювання відхилено ❌`;
                body = `На жаль, лікар ${doctor_full_name} відхилив вашу консультацію на ${booking_date} о ${booking_time_slot}. Будь ласка, оберіть інший час або зверніться до лікаря.`;
                notification_type = 'booking_rejected';
                patientAlertBody = `Ваш запис до лікаря ${doctor_full_name} на ${booking_date} о ${booking_time_slot} відхилено.`;
                break;
            default:
                console.warn(`Невідомий статус бронювання: ${status}. Сповіщення не буде відправлено.`);
                return new Response(JSON.stringify({ message: 'No patient notification required for this status.' }), {
                    status: 200, headers: corsHeaders
                });
        }

        // 1. Збереження сповіщення в таблиці `patient_notifications`
        console.log(`Saving notification to patient_notifications for patient ${patient_id}...`);
        const { data: notification, error: insertError } = await supabaseAdmin
            .from('patient_notifications')
            .insert({
                patient_id: patient_id,
                title: title,
                body: body,
                notification_type: notification_type,
                data: { // Зберігаємо додаткові дані як jsonb
                    booking_id: booking_id,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    status: status,
                },
                is_read: false, // Встановлюємо як непрочитане за замовчуванням
            })
            .select() // Важливо для повернення вставлених даних
            .single();

        if (insertError) {
            console.error('Error saving patient notification:', insertError.message, insertError.details);
            if (insertError.code === '23503') { // PostgreSQL Foreign Key Violation
                return new Response(
                    JSON.stringify({ error: `Patient profile (ID: ${patient_id}) does not exist in public.profiles. Cannot save notification.` }),
                    { status: 404, headers: corsHeaders }
                );
            }
            return new Response(
                JSON.stringify({ error: `Failed to save patient notification: ${insertError.message}` }),
                { status: 500, headers: corsHeaders }
            );
        }
        console.log(`Notification saved successfully with ID: ${notification.id}`);


        // 2. Отримання Expo Push Token пацієнта
        const patientPushToken = await getPatientExpoPushToken(supabaseAdmin, patient_id);

        if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
            console.log(`Found valid Expo Push Token for patient ${patient_id}. Attempting to send push notification.`);
            // 3. Формування та відправка push-сповіщення через Expo
            const messages = [];
            messages.push({
                to: patientPushToken,
                sound: 'default',
                title: title,
                body: patientAlertBody, // Використовуємо коротший текст для тіла сповіщення
                data: {
                    db_id: notification.id, // ID сповіщення в базі даних, може бути корисним для відстеження
                    type: notification_type,
                    booking_id: booking_id,
                    status: status,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    patient_id: patient_id,
                },
            });

            // Відправка за допомогою Expo chunkPushNotifications для обробки великої кількості токенів
            const chunks = expo.chunkPushNotifications(messages);
            const tickets = [];
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log('Expo Push Ticket Chunk:', ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (pushError: any) {
                    console.error('Error sending push notification chunk via Expo:', pushError?.message || pushError);
                    // Продовжуємо навіть при помилці відправки, оскільки бронювання оновлено і сповіщення в БД збережено.
                }
            }

            // Можна додати логіку для обробки квитанцій Expo (наприклад, видалення недійсних токенів)
            // if (tickets.length > 0) {
            //     // Логіка для expo.getPushNotificationReceiptsAsync(ticketIds);
            // }

        } else {
            console.warn(`Invalid or missing Expo Push Token for patient ${patient_id}. Push notification will not be sent.`);
            // Це не помилка, яка зупиняє процес, оскільки бронювання вже оновлено і сповіщення в БД збережено.
        }

        // Успішна відповідь, якщо все оброблено.
        return new Response(
            JSON.stringify({ success: true, message: 'Booking status updated and patient notification processed.' }),
            { status: 200, headers: corsHeaders }
        );

    } catch (err: any) {
        console.error('General error in Edge Function handle-booking-status-update:', err?.message || 'An unknown error occurred.', err);
        return new Response(
            JSON.stringify({ error: `Server error: ${err?.message || 'An unknown error occurred.'}` }),
            { status: 500, headers: corsHeaders }
        );
    }
});