// supabase/functions/notify-doctor/index.ts

// Імпорти:
// serve з Deno standard library для запуску HTTP-сервера.
// type Request з Deno standard library для явного типування вхідного запиту.
// createClient з Supabase JS library для взаємодії з Supabase.
import { serve, type ConnInfo } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Використовуємо esm.sh для сумісності Deno

// Отримання змінних оточення Supabase.
// Ці змінні повинні бути налаштовані в конфігурації вашої Edge Function у Supabase.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Перевірка, чи змінні оточення встановлені перед ініціалізацією клієнта.
// Це допоможе діагностувати проблеми, якщо ключі не завантажуються належним чином.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENVIRONMENT_ERROR: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не встановлені. Переконайтеся, що змінні оточення правильно налаштовані для цієї Edge Function.");
  // У реальному продакшн-середовищі варто було б викинути помилку або не запускати сервіс,
  // але для Edge Function, яка запускається Deno, це просто буде лог.
}

// Ініціалізація Supabase Admin клієнта.
// Використовується service_role_key для обходу RLS та виконання операцій з повними правами.
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false // Важливо для серверних функцій, щоб не зберігати сесії
    }
  }
);

// Основна функція, яка обробляє HTTP-запити.
// Додано явний тип 'Request' для 'req' для кращої перевірки TypeScript.
serve(async (req: Request) => {
  // Заголовки CORS для дозволу запитів з будь-якого джерела.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Обробка OPTIONS-запитів для CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Парсинг тіла запиту JSON.
    // *** ВИПРАВЛЕННЯ: ДОДАНО booking_id ТА patient_id ДО ДЕСТРУКТУРИЗАЦІЇ ***
    const { doctor_id, patient_name, booking_date, booking_time_slot, booking_id, patient_id } = await req.json();

    console.log('Edge Function: Received full request body:', { doctor_id, patient_name, booking_date, booking_time_slot, booking_id, patient_id });
    console.log('Edge Function: Parsed doctor_id from request:', doctor_id);

    // Валідація вхідних даних.
    // *** ВИПРАВЛЕННЯ: ДОДАНО ПЕРЕВІРКУ booking_id ТА patient_id ***
    if (!doctor_id || !patient_name || !booking_date || !booking_time_slot || !booking_id || !patient_id) {
      console.error('Edge Function: Missing required fields in request body. Ensure doctor_id, patient_name, booking_date, booking_time_slot, booking_id, and patient_id are provided.');
      return new Response(JSON.stringify({ error: 'Missing required fields: doctor_id, patient_name, booking_date, booking_time_slot, booking_id, patient_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request
      });
    }

    // Запит до таблиці 'profile_doctor' для отримання 'notification_token'.
    // Використовуємо 'user_id' як стовпець для фільтрації, що відповідає вашій схемі.
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('profile_doctor')
      .select('notification_token')
      .eq('user_id', doctor_id) // ВИПРАВЛЕНО: Використання user_id для коректного співставлення
      .single(); // Очікуємо один результат

    console.log('Edge Function: Result of profile_doctor query - data:', doctorData);
    console.log('Edge Function: Result of profile_doctor query - error:', doctorError?.message);

    // Детальні логі для діагностики відсутності доктора або токену.
    if (doctorError) {
        console.error("Edge Function: Supabase query error for doctor ID " + doctor_id + ":", doctorError.message);
    }
    if (!doctorData) {
        console.error("Edge Function: No doctor data found for ID " + doctor_id + " in profile_doctor table.");
    }
    if (doctorData && !doctorData.notification_token) {
        console.error("Edge Function: Notification token is NULL or empty for doctor ID " + doctor_id + ". Cannot send push notification.");
    }

    // Обробка випадків, коли доктора не знайдено або токен відсутній.
    if (doctorError || !doctorData || !doctorData.notification_token) {
      return new Response(JSON.stringify({ error: 'Doctor or notification token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404, // Not Found
      });
    }

    const pushToken = doctorData.notification_token;
    console.log('Edge Function: Found pushToken for doctor:', pushToken);

    // Формування деталей сповіщення.
    const notificationTitle = `Нове бронювання від ${patient_name}`;
    const notificationBody = `Пацієнт ${patient_name} забронював консультацію на ${booking_date} о ${booking_time_slot}.`;

    // *** ВИПРАВЛЕННЯ: ДОДАНО booking_id ТА patient_id ДО notificationData ***
    const notificationData = {
      type: 'new_booking',
      // 'doctorId' - це поле для клієнта, не плутати з 'doctor_id' з бази даних
      // Залишаємо його, як було, але пам'ятаємо, що doctor_id з БД краще
      // використовувати для FK та логіки на бекенді
      doctorId: doctor_id, // Залишаємо як було для сумісності з попереднім кодом клієнта
      patientName: patient_name,
      date: booking_date, // Це booking_date
      time: booking_time_slot, // Це booking_time_slot
      booking_id: booking_id,   // <-- ДОДАНО!
      patient_id: patient_id,    // <-- ДОДАНО!
      status: 'pending' // Додаємо початковий статус бронювання
    };

    // Зберігаємо сповіщення в таблиці 'doctor_notifications'.
    const { data: notificationRecord, error: insertError } = await supabaseAdmin
      .from('doctor_notifications')
      .insert([
        {
          doctor_id: doctor_id, // Це FK до auth.users.id лікаря
          title: notificationTitle,
          body: notificationBody,
          data: notificationData, // Тепер містить booking_id та patient_id
          is_read: false // За замовчуванням нове сповіщення є непрочитаним
        }
      ])
      .select() // Повертаємо вставлений запис
      .single();

    if (insertError) {
      console.error("Edge Function: Error inserting notification record into doctor_notifications:", insertError.message);
      return new Response(JSON.stringify({ error: `Failed to save notification record: ${insertError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error, якщо запис у БД не вдався
      });
    } else {
      console.log("Edge Function: Notification record inserted successfully with ID:", notificationRecord?.id);
    }

    // Надсилання пуш-сповіщення через Expo Push API.
    const message = {
      to: pushToken,
      sound: 'default', // Звук за замовчуванням
      title: notificationTitle,
      body: notificationBody,
      // *** ВИПРАВЛЕННЯ: ПЕРЕДАЄМО ПОВНИЙ notificationData ДО EXPO ***
      // Важливо: Expo Push Notification data стає доступною на клієнті через `notification.request.content.data`
      data: { ...notificationData, db_id: notificationRecord?.id }, // Додаємо ID запису з БД
    };

    console.log("Edge Function: Sending push notification to Expo API...", message); // Логуємо повне повідомлення
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    // Отримання та логування відповіді від Expo API.
    // Важливо перевірити response.ok перед парсингом JSON,
    // оскільки Expo може повернути не-JSON відповідь у разі певних помилок.
    let responseData;
    if (!response.ok) {
        const errorText = await response.text(); // Читаємо сирий текст помилки
        console.error(`Edge Function: Expo Push API returned non-OK status ${response.status}:`, errorText);
        // Спробуємо розпарсити як JSON, якщо це можливо, але не критично
        try {
            responseData = JSON.parse(errorText);
        } catch (e) {
            responseData = { message: errorText, originalStatus: response.status };
        }
        return new Response(JSON.stringify({ error: 'Failed to send push notification via Expo API', details: responseData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    responseData = await response.json(); // Парсинг успішної відповіді
    console.log("Edge Function: Expo Push API successful response:", responseData);

    // Перевірка на помилки, повернені самим Expo API у тілі відповіді.
    if (responseData.errors && responseData.errors.length > 0) {
        console.error("Edge Function: Expo Push API reported errors in response data:", responseData.errors);
        return new Response(JSON.stringify({ error: 'Failed to send push notification (Expo API errors)', details: responseData.errors }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // Успішний результат.
    return new Response(JSON.stringify({ success: true, response: responseData, notificationRecordId: notificationRecord?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // OK
    });

  } catch (error: unknown) { // Явно вказуємо тип 'unknown' для перехопленої помилки
    let errorMessage = "An unknown error occurred in the Edge Function.";
    // Безпечна перевірка типу 'error' перед доступом до його властивостей.
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }

    console.error("Edge Function: Uncaught error in try-catch block:", errorMessage, error); // Логуємо повний об'єкт помилки для діагностики
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error
    });
  }
});