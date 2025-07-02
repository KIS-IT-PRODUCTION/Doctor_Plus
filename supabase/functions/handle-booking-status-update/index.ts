import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Expo } from 'https://esm.sh/expo-server-sdk@3.7.0';

// Якщо у вас є файл з типізацією бази даних, розкоментуйте та вкажіть правильний шлях:
// import { Database } from '../_shared/database.types.ts'; 

const expo = new Expo();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не встановлені. Переконайтеся, що змінні оточення правильно налаштовані для цієї Edge Function.");
  throw new Error("Supabase environment variables (URL or Service Role Key) are not set.");
}

async function getPatientExpoPushToken(supabaseClient: any, patientId: string): Promise<string | null> {
    if (!patientId) {
        console.warn("getPatientExpoPushToken: patientId is null or undefined.");
        return null;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('notification_token')
            .eq('user_id', patientId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`getPatientExpoPushToken: No profile found for patient ${patientId}.`);
            } else {
                console.error(`getPatientExpoPushToken: Error fetching Expo Push Token for patient ${patientId}:`, error.message);
            }
            return null;
        }

        if (profile && profile.notification_token) {
            return profile.notification_token;
        }

        console.warn(`getPatientExpoPushToken: Patient ${patientId} has a profile but no notification_token found.`);
        return null;
    } catch (e: any) {
        console.error(`getPatientExpoPushToken: Unexpected error for patient ${patientId}:`, e.message || e);
        return null;
    }
}

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
        // ДОДАНО: Перевірка на наявність 'amount' у запиті для підтверджених бронювань
        if (
            !booking ||
            typeof booking !== 'object' ||
            !('id' in booking) || typeof booking.id !== 'string' || booking.id.trim() === '' ||
            !('patient_id' in booking) || typeof booking.patient_id !== 'string' || booking.patient_id.trim() === '' ||
            !('doctor_id' in booking) || typeof booking.doctor_id !== 'string' || booking.doctor_id.trim() === '' ||
            !('status' in booking) || typeof booking.status !== 'string' || !['confirmed', 'rejected'].includes(booking.status.toLowerCase()) ||
            !('booking_date' in booking) || typeof booking.booking_date !== 'string' || booking.booking_date.trim() === '' ||
            !('booking_time_slot' in booking) || typeof booking.booking_time_slot !== 'string' || booking.booking_time_slot.trim() === '' ||
            // Якщо статус 'confirmed', amount має бути присутнім і бути числом
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

        const { id: booking_id, patient_id, doctor_id, status, booking_date, booking_time_slot, amount } = booking; // ДОДАНО: amount


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

        let title: string;
        let body: string;
        let notification_type: string;
        let patientAlertBody: string;

        switch (status.toLowerCase()) {
            case 'confirmed':
                title = `Ваше бронювання підтверджено! ✅`;
                body = `Лікар ${doctor_full_name} підтвердив вашу консультацію на ${booking_date} о ${booking_time_slot}. Сума до сплати: ${amount} UAH. Чекаємо на вас!`; // ДОДАНО: сума в тексті
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
                booking_id: booking_id, // **ВАЖЛИВО: Нове поле booking_id**
                title: title,
                body: body,
                notification_type: notification_type,
                data: { // Зберігаємо додаткові дані як jsonb
                    booking_id: booking_id,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    status: status,
                    // ДОДАНО: amount для сповіщень про підтвердження
                    ...(notification_type === 'booking_confirmed' && { amount: amount }),
                },
                // is_read: false, // ВИДАЛЕНО: Якщо поле is_read видалено з таблиці БД
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

        // 2. Отримання Expo Push Token пацієнта
        const patientPushToken = await getPatientExpoPushToken(supabaseAdmin, patient_id);

        if (patientPushToken && Expo.isExpoPushToken(patientPushToken)) {
            console.log(`Found valid Expo Push Token for patient ${patient_id}. Attempting to send push notification.`);
            const messages = [];
            messages.push({
                to: patientPushToken,
                sound: 'default', 
                title: title,
                body: patientAlertBody,
                data: {
                    db_id: notification.id,
                    type: notification_type,
                    booking_id: booking_id,
                    status: status,
                    doctor_name: doctor_full_name,
                    booking_date: booking_date,
                    booking_time_slot: booking_time_slot,
                    patient_id: patient_id,
                    // ДОДАНО: amount для push-сповіщень про підтвердження
                    ...(notification_type === 'booking_confirmed' && { amount: amount }),
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
