// supabase/functions/handle-booking-status-update/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from '@supabase/supabase-js'; // Імпорт з deno.json
import { Expo } from 'expo-server-sdk'; // Імпорт з deno.json

const expo = new Expo();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не встановлені. Переконайтеся, що змінні оточення правильно налаштовані для цієї Edge Function.");
  throw new Error("Supabase environment variables (URL or Service Role Key) are not set.");
}

/**
 * Допоміжна функція для отримання токена сповіщень та бажаної мови пацієнта.
 * Використовує таблицю 'profiles' та колонку 'language'.
 */
async function getPatientNotificationData(supabaseClient: any, patientId: string): Promise<{ token: string | null; language: string | null }> {
    if (!patientId) {
        console.warn("getPatientNotificationData: patientId is null or undefined.");
        return { token: null, language: null };
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles') // Використовуємо таблицю 'profiles' для пацієнтів
            .select('notification_token, language') // Вибираємо колонку 'language'
            .eq('user_id', patientId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`getPatientNotificationData: No profile found for patient ${patientId}.`);
            } else {
                console.error(`getPatientNotificationData: Error fetching data for patient ${patientId}:`, error.message);
            }
            return { token: null, language: null };
        }

        return {
            token: profile?.notification_token || null,
            language: profile?.language || null, // Використовуємо profile.language
        };
    } catch (e: any) {
        console.error(`getPatientNotificationData: Unexpected error for patient ${patientId}:`, e.message || e);
        return { token: null, language: null };
    }
}

/**
 * Словник перекладів для сповіщень.
 * Ключі - це ідентифікатори текстів, значення - об'єкти з перекладами для кожної мови.
 * Деякі значення є функціями, щоб можна було передавати динамічні дані (наприклад, ім'я лікаря).
 */
const translations = {
    // booking_confirmed
    bookingConfirmedTitle: {
        uk: `Ваше бронювання підтверджено! ✅`,
        en: `Your booking has been confirmed! ✅`,
    },
    bookingConfirmedBody: {
        uk: (doctorName: string, date: string, time: string, amount: number) => `Лікар ${doctorName} підтвердив вашу консультацію на ${date} о ${time}. Сума до сплати: ${amount} UAH. Чекаємо на вас!`,
        en: (doctorName: string, date: string, time: string, amount: number) => `Doctor ${doctorName} has confirmed your consultation on ${date} at ${time}. Amount due: ${amount} UAH. We look forward to seeing you!`,
    },
    bookingConfirmedAlertBody: {
        uk: (doctorName: string, date: string, time: string) => `Ваш запис до лікаря ${doctorName} на ${date} о ${time} підтверджено.`,
        en: (doctorName: string, date: string, time: string) => `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been confirmed.`,
    },

    // booking_rejected
    bookingRejectedTitle: {
        uk: `Ваше бронювання відхилено ❌`,
        en: `Your booking has been rejected ❌`,
    },
    bookingRejectedBody: {
        uk: (doctorName: string, date: string, time: string) => `На жаль, лікар ${doctorName} відхилив вашу консультацію на ${date} о ${time}. Будь ласка, оберіть інший час або зверніться до лікаря.`,
        en: (doctorName: string, date: string, time: string) => `Unfortunately, Dr. ${doctorName} has rejected your consultation on ${date} at ${time}. Please choose another time or contact the doctor.`,
    },
    bookingRejectedAlertBody: {
        uk: (doctorName: string, date: string, time: string) => `Ваш запис до лікаря ${doctorName} на ${date} о ${time} відхилено.`,
        en: (doctorName: string, date: string, time: string) => `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been rejected.`,
    },

    // meet_link_notification (для send-meet-link-notification, але можна додати сюди для повноти)
    // meetLinkTitle: { /* ... */ },
    // meetLinkBody: { /* ... */ },
    // meetLinkAlertBody: { /* ... */ },
};

/**
 * Допоміжна функція для безпечного отримання перекладу.
 * Якщо переклад для обраної мови відсутній, використовується українська (uk) як мова за замовчуванням.
 */
const getTranslation = (key: keyof typeof translations, lang: string, ...args: any[]) => {
    const defaultLang = 'uk'; // Мова за замовчуванням
    // Забезпечуємо, що обрана мова є однією з підтримуваних ('uk' або 'en')
    const selectedLang = (lang === 'en' || lang === 'uk') ? lang : defaultLang;

    const translation = translations[key]?.[selectedLang];

    if (typeof translation === 'function') {
        return translation(...args);
    }
    // Повертаємо переклад, або переклад за замовчуванням, або повідомлення про відсутність
    return translation || translations[key]?.[defaultLang] || `Translation missing for ${key} in ${selectedLang}`;
};


serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 204 });
    }

    if (req.method !== 'POST') {
        console.warn(`Invalid request method: ${req.method}. Only POST is allowed.`);
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' }), { status: 405, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    );

    try {
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
            typeof booking !== 'object' ||
            !('id' in booking) || typeof booking.id !== 'string' || booking.id.trim() === '' ||
            !('patient_id' in booking) || typeof booking.patient_id !== 'string' || booking.patient_id.trim() === '' ||
            !('doctor_id' in booking) || typeof booking.doctor_id !== 'string' || booking.doctor_id.trim() === '' ||
            !('status' in booking) || typeof booking.status !== 'string' || !['confirmed', 'rejected'].includes(booking.status.toLowerCase()) ||
            !('booking_date' in booking) || typeof booking.booking_date !== 'string' || booking.booking_date.trim() === '' ||
            !('booking_time_slot' in booking) || typeof booking.booking_time_slot !== 'string' || booking.booking_time_slot.trim() === '' ||
            (booking.status.toLowerCase() === 'confirmed' && (!('amount' in booking) || typeof booking.amount !== 'number' || booking.amount <= 0))
        ) {
            const missingFields: string[] = [];
            if (!booking || typeof booking !== 'object') missingFields.push('booking object');
            if (!('id' in booking) || typeof booking.id !== 'string' || booking.id.trim() === '') missingFields.push('booking.id (string, non-empty)');
            if (!('patient_id' in booking) || typeof booking.patient_id !== 'string' || booking.patient_id.trim() === '') missingFields.push('booking.patient_id (string, non-empty)');
            if (!('doctor_id' in booking) || typeof booking.doctor_id !== 'string' || booking.doctor_id.trim() === '') missingFields.push('booking.doctor_id (string, non-empty)');
            if (!('status' in booking) || typeof booking.status !== 'string' || !['confirmed', 'rejected'].includes(booking.status.toLowerCase())) missingFields.push('booking.status (string, "confirmed" or "rejected")');
            if (!('booking_date' in booking) || typeof booking.booking_date !== 'string' || booking.booking_date.trim() === '') missingFields.push('booking.booking_date (string, non-empty)');
            if (!('booking_time_slot' in booking) || typeof booking.booking_time_slot !== 'string' || booking.booking_time_slot.trim() === '') missingFields.push('booking.booking_time_slot (string, non-empty)');
            if (booking.status?.toLowerCase() === 'confirmed' && (!('amount' in booking) || typeof booking.amount !== 'number' || booking.amount <= 0)) missingFields.push('booking.amount (number > 0, required for confirmed bookings)');


            console.warn(`Invalid booking data received. Missing or invalid fields: ${missingFields.join(', ')}`);
            return new Response(
                JSON.stringify({ error: `Invalid booking data: Missing or invalid fields: ${missingFields.join(', ')}` }),
                { status: 400, headers: corsHeaders }
            );
        }

        const { id: booking_id, patient_id, doctor_id, status, booking_date, booking_time_slot, amount } = booking;


        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(booking_id) || !uuidRegex.test(patient_id) || !uuidRegex.test(doctor_id)) {
            console.warn(`Invalid UUID format for one of the IDs: booking_id(${booking_id}), patient_id(${patient_id}), doctor_id(${doctor_id})`);
            return new Response(
                JSON.stringify({ error: 'Invalid UUID format for booking_id, patient_id, or doctor_id.' }),
                { status: 400, headers: corsHeaders }
            );
        }

        let doctor_full_name = doctor_name_from_client;

        if (!doctor_full_name || doctor_full_name.trim() === '' || doctor_full_name === 'Doctor' || doctor_full_name === 'Лікар') {
            console.log(`Doctor name not provided or invalid from client. Attempting to fetch from DB for doctor_id: ${doctor_id}`);
            const { data: doctorProfile, error: doctorProfileError } = await supabaseAdmin
                .from('profile_doctor')
                .select('full_name')
                .eq('user_id', doctor_id)
                .single();

            if (doctorProfileError) {
                if (doctorProfileError.code === 'PGRST116') {
                    console.warn(`No doctor profile found for ID: ${doctor_id}.`);
                } else {
                    console.error(`Error fetching doctor profile for ${doctor_id}:`, doctorProfileError?.message || 'Unknown error');
                }
                doctor_full_name = 'Невідомий лікар';
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

        // --- ПОЧАТОК ЛОГІКИ БАГАТОМОВНОСТІ ---

        // 1. Отримання Expo Push Token та preferred_language пацієнта
        const { token: patientPushToken, language: patientPreferredLanguage } = await getPatientNotificationData(supabaseAdmin, patient_id);

        // Визначаємо мову для сповіщення. За замовчуванням - українська.
        const effectiveLanguage = patientPreferredLanguage === 'en' ? 'en' : 'uk';
        console.log(`Sending notification to patient ${patient_id} in language: ${effectiveLanguage}`);

        let title: string;
        let body: string;
        let notification_type: string;
        let patientAlertBody: string;

        switch (status.toLowerCase()) {
            case 'confirmed':
                title = getTranslation('bookingConfirmedTitle', effectiveLanguage);
                body = getTranslation('bookingConfirmedBody', effectiveLanguage, doctor_full_name, booking_date, booking_time_slot, amount);
                notification_type = 'booking_confirmed';
                patientAlertBody = getTranslation('bookingConfirmedAlertBody', effectiveLanguage, doctor_full_name, booking_date, booking_time_slot);
                break;
            case 'rejected':
                title = getTranslation('bookingRejectedTitle', effectiveLanguage);
                body = getTranslation('bookingRejectedBody', effectiveLanguage, doctor_full_name, booking_date, booking_time_slot);
                notification_type = 'booking_rejected';
                patientAlertBody = getTranslation('bookingRejectedAlertBody', effectiveLanguage, doctor_full_name, booking_date, booking_time_slot);
                break;
            default:
                console.warn(`Невідомий статус бронювання: ${status}. Сповіщення не буде відправлено.`);
                return new Response(JSON.stringify({ message: 'No patient notification required for this status.' }), {
                    status: 200, headers: corsHeaders
                });
        }

        // --- КІНЕЦЬ ЛОГІКИ БАГАТОМОВНОСТІ ---


        // 1. Збереження сповіщення в таблиці `patient_notifications`
        console.log(`Saving notification to patient_notifications for patient ${patient_id}...`);
        const { data: notification, error: insertError } = await supabaseAdmin
            .from('patient_notifications')
            .insert({
                patient_id: patient_id,
                booking_id: booking_id,
                title: title, // Використовуємо перекладений заголовок
                body: body,   // Використовуємо перекладений текст
                notification_type: notification_type,
                data: { // Зберігаємо додаткові дані як jsonb
                    booking_id: booking_id,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    status: status,
                    ...(notification_type === 'booking_confirmed' && { amount: amount }),
                    notification_language: effectiveLanguage, // Зберігаємо мову, якою було надіслано сповіщення
                },
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error saving patient notification:', insertError.message, insertError.details);
            if (insertError.code === '23503') {
                return new Response(
                    JSON.stringify({ error: `Patient profile (ID: ${patient_id}) does not exist or Foreign Key constraint failed. Cannot save notification.` }),
                    { status: 404, headers: corsHeaders }
                );
            }
            return new Response(
                JSON.stringify({ error: `Failed to save patient notification: ${insertError.message}` }),
                { status: 500, headers: corsHeaders }
            );
        }
        console.log(`Notification saved successfully with ID: ${notification.id}`);

        // 2. Надсилання Expo Push Notification
        if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
            console.log(`Found valid Expo Push Token for patient ${patient_id}. Attempting to send push notification.`);
            const messages = [];
            messages.push({
                to: patientPushToken,
                sound: 'default', 
                title: title,          // Використовуємо перекладений заголовок
                body: patientAlertBody, // Використовуємо перекладений текст для алерт-сповіщення
                data: {
                    db_id: notification.id,
                    type: notification_type,
                    booking_id: booking_id,
                    status: status,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    patient_id: patient_id,
                    ...(notification_type === 'booking_confirmed' && { amount: amount }),
                    notification_language: effectiveLanguage, // Додаємо мову сповіщення в data payload
                },
            });

            const chunks = expo.chunkPushNotifications(messages);
            const tickets = [];
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log('Expo Push Ticket Chunk:', ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (pushError: any) {
                    console.error('Error sending push notification chunk via Expo:', pushError?.message || pushError);
                }
            }

        } else {
            console.warn(`Invalid or missing Expo Push Token for patient ${patient_id}. Push notification will not be sent.`);
        }

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