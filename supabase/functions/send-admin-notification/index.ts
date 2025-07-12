// supabase/functions/send-admin-notification/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // Використовуйте актуальну версію std
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'; // Використовуйте актуальну версію
// Отримання змінних середовища. Їх потрібно буде встановити в Supabase Secrets.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // ВИКОРИСТОВУЙТЕ Service Role Key для доступу до всіх таблиць
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
// Ініціалізація Supabase клієнта з Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
serve(async (req)=>{
  // --- 1. Автентифікація/Авторизація адміністратора (Дуже важливо!) ---
  // Це приклад базової авторизації. Вам може знадобитися більш надійна система.
  // Наприклад, ви можете перевіряти секретний ключ, який передається у заголовку.
  const ADMIN_SECRET_KEY = Deno.env.get('ADMIN_NOTIFICATION_SECRET'); // Задайте цей ключ в Supabase Secrets
  if (ADMIN_SECRET_KEY && req.headers.get('X-Admin-Secret') !== ADMIN_SECRET_KEY) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Invalid JSON payload'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  // Очікуване корисне навантаження від інтерфейсу адміністратора
  const { title, body, recipientType, specificId, data } = payload; // 'data' - це додаткові дані для додатка
  if (!title || !body || !recipientType) {
    return new Response(JSON.stringify({
      error: 'Missing title, body, or recipientType'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  let tokens = [];
  let errorFetchingTokens = null;
  try {
    // --- 2. Вибір одержувачів та отримання їхніх токенів сповіщень ---
    // Пам'ятаємо: токени лікаря в profile_doctor, пацієнта - в profiles.
    if (recipientType === 'all_doctors' || recipientType === 'all_users') {
      const { data: doctors, error } = await supabase.from('profile_doctor').select('notification_token').not('notification_token', 'is', null); // Вибираємо тільки не-null токени
      if (error) throw error;
      tokens = tokens.concat(doctors.map((d)=>d.notification_token));
    }
    if (recipientType === 'all_patients' || recipientType === 'all_users') {
      const { data: patients, error } = await supabase.from('profiles').select('notification_token').not('notification_token', 'is', null); // Вибираємо тільки не-null токени
      if (error) throw error;
      tokens = tokens.concat(patients.map((p)=>p.notification_token));
    }
    if (recipientType === 'specific_doctor' && specificId) {
      const { data: doctor, error } = await supabase.from('profile_doctor').select('notification_token').eq('user_id', specificId) // Припускаємо, що 'user_id' це ключ для profile_doctor
      .not('notification_token', 'is', null).single();
      if (error) throw error;
      if (doctor) tokens.push(doctor.notification_token);
    }
    if (recipientType === 'specific_patient' && specificId) {
      const { data: patient, error } = await supabase.from('profiles').select('notification_token').eq('id', specificId) // Припускаємо, що 'id' це ключ для profiles
      .not('notification_token', 'is', null).single();
      if (error) throw error;
      if (patient) tokens.push(patient.notification_token);
    }
    // Видалення дублікатів токенів (наприклад, якщо вибрано 'all_users' і один токен збігається)
    tokens = [
      ...new Set(tokens)
    ];
  } catch (e) {
    console.error('Error fetching tokens:', e.message);
    errorFetchingTokens = e.message;
  }
  if (errorFetchingTokens) {
    return new Response(JSON.stringify({
      error: `Failed to fetch notification tokens: ${errorFetchingTokens}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  if (tokens.length === 0) {
    return new Response(JSON.stringify({
      message: 'No active notification tokens found for the selected recipients.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  // --- 3. Надсилання сповіщень через Expo Push API ---
  const messages = tokens.map((token)=>({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      // Додаємо власні дані, наприклад, для ідентифікації типу сповіщення в додатку
      data: {
        ...data,
        type: 'admin_announcement'
      }
    }));
  try {
    const expoResponse = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messages)
    });
    const expoResult = await expoResponse.json();
    console.log('Expo Push API Response:', expoResult);
    if (expoResult.errors) {
      console.error('Expo Push API Errors:', expoResult.errors);
      return new Response(JSON.stringify({
        error: 'Failed to send some notifications via Expo',
        details: expoResult.errors
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      count: tokens.length,
      details: expoResult
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error('Error sending push notifications:', e.message);
    return new Response(JSON.stringify({
      error: `Failed to send push notifications: ${e.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
