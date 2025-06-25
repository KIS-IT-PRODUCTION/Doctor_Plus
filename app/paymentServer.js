// paymentServer.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const cors = require('cors');

// --- НАЛАШТУВАННЯ SUPABASE (ВСТАВТЕ ВАШІ КЛЮЧІ) ---
// УВАГА: Для продакшну використовуйте змінні оточення (process.env.SUPABASE_URL тощо)
const SUPABASE_URL = "https://yslchkbmpuysxghidnrb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbGNoa2JtdXB1eXhnaWRuenJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkwMzgwMCwiZXhwIjoyMDYzNDc5ODAwfQ.MkNxsM1TjZqDUa79_aTxg2bkcGiHMSW3_ljBtSIMIPA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- НАЛАШТУВАННЯ LIQPAY ---
// ВАЖЛИВО: Отримайте ці ключі з вашого мерчант-кабінету LiqPay.
// Для продакшну також використовуйте змінні оточення (process.env.LIQPAY_PUBLIC_KEY)
const LIQPAY_PUBLIC_KEY = 'sandbox_i32319370149'; // <-- ЗАМІНІТЬ ЦЕ НА ВАШ PUBLIC KEY
const LIQPAY_PRIVATE_KEY = 'sandbox_zMI6cVf79SuNsn4nPIWkoFFWBwZ96Bm7Gikt9H1t'; // <-- ЗАМІНІТЬ ЦЕ НА ВАШ PRIVATE KEY

// --- НАЛАШТУВАННЯ СЕРВЕРА ---
const PORT = process.env.PORT || 3001; // Використовуйте порт 3001, щоб уникнути конфліктів, якщо 3000 вже зайнятий
const YOUR_BACKEND_PUBLIC_URL = 'https://31be-194-44-152-4.ngrok-free.app'; // <-- ЗАМІНІТЬ ЦЕ НА ПУБЛІЧНИЙ URL ВАШОГО СЕРВЕРА

// Додаємо middleware для обробки CORS та JSON/URL-кодованих запитів
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- ДОПОМІЖНА ФУНКЦІЯ: Генерує data та signature для LiqPay ---
function generateLiqPaySignature(params) {
    const jsonString = JSON.stringify(params);
    const dataBase64 = Buffer.from(jsonString).toString('base64');

    const signatureString = LIQPAY_PRIVATE_KEY + dataBase64 + LIQPAY_PRIVATE_KEY;
    const sha1 = crypto.createHash('sha1');
    sha1.update(signatureString);
    const signature = sha1.digest('base64');

    return { data: dataBase64, signature: signature };
}

// --- ЕНДПОІНТ: Створення параметрів для оплати LiqPay ---
app.post('/create-liqpay-payment', async (req, res) => {
    const { amount, bookingId, description, patientId, doctorName } = req.body;

    if (!amount || !bookingId || !description || !patientId) {
        console.error("Missing required payment parameters:", req.body);
        return res.status(400).json({ error: 'Missing required payment parameters (amount, bookingId, description, patientId).' });
    }

    const orderId = `booking_${bookingId}_${Date.now()}`; // Унікальний ID замовлення

    const params = {
        'action': 'pay',
        'amount': amount.toString(),
        'currency': 'UAH', // Можете змінити на 'USD', 'EUR' за потреби
        'description': description,
        'order_id': orderId,
        'version': '3',
        'public_key': LIQPAY_PUBLIC_KEY,
        'result_url': `${YOUR_BACKEND_PUBLIC_URL}/liqpay-callback`, // URL, куди LiqPay поверне користувача
        'server_url': `${YOUR_BACKEND_PUBLIC_URL}/liqpay-callback`, // URL для Call-back запитів від LiqPay (повинен бути доступний з інтернету)
        'pay_way': 'card', // 'card', 'liqpay', 'privat24'
        'language': 'uk', // Мова платіжної сторінки
        'extra_data': JSON.stringify({ bookingId: bookingId, patientId: patientId, doctorName: doctorName, originalAmount: amount }),
        // 'sandbox': 1 // Розкоментуйте для тестування в Sandbox-режимі LiqPay
    };

    try {
        const { data, signature } = generateLiqPaySignature(params);
        res.json({ success: true, data: data, signature: signature });
    } catch (error) {
        console.error("Error generating LiqPay parameters:", error.message);
        res.status(500).json({ error: 'Failed to generate LiqPay payment parameters.' });
    }
});

// --- ЕНДПОІНТ: Обробка Call-back від LiqPay ---
app.post('/liqpay-callback', async (req, res) => {
    const { data, signature } = req.body;

    if (!data || !signature) {
        console.error("Invalid LiqPay callback data: data or signature missing.", req.body);
        return res.status(400).json({ error: 'Invalid LiqPay callback data.' });
    }

    // --- ПЕРЕВІРКА ПІДПИСУ CALL-BACK ---
    // Це CRITICAL для безпеки!
    const callbackSignatureString = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
    const sha1 = crypto.createHash('sha1');
    sha1.update(callbackSignatureString);
    const calculatedSignature = sha1.digest('base64');

    if (calculatedSignature !== signature) {
        console.error("LiqPay Callback: Signature mismatch!", { received: signature, calculated: calculatedSignature, rawData: data });
        return res.status(403).json({ error: 'Signature mismatch. Unauthorized access attempt.' });
    }

    let decodedData;
    try {
        decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    } catch (parseError) {
        console.error("Failed to decode LiqPay callback data:", parseError.message, data);
        return res.status(400).json({ error: 'Failed to decode LiqPay callback data.' });
    }
    console.log("LiqPay Callback: Decoded data:", decodedData);

    const { status, order_id, transaction_id, amount, currency, extra_data } = decodedData;
    let bookingId, patientId;

    try {
        const parsedExtraData = JSON.parse(extra_data || '{}');
        bookingId = parsedExtraData.bookingId;
        patientId = parsedExtraData.patientId;
    } catch (extraDataParseError) {
        console.error("Failed to parse extra_data from LiqPay callback:", extraDataParseError.message, extra_data);
        return res.status(400).json({ error: 'Failed to parse extra_data.' });
    }

    if (!bookingId) {
        console.error("LiqPay Callback: bookingId missing in extra_data.", decodedData);
        return res.status(400).json({ error: 'Booking ID is missing in callback data.' });
    }

    try {
        let updateData = {
            payment_status: status,
            liqpay_order_id: order_id,
            liqpay_transaction_id: transaction_id,
            paid_amount: amount,
            payment_currency: currency,
            updated_at: new Date().toISOString() // Додамо оновлення часу
        };

        if (status === 'success') {
            updateData.is_paid = true;
            console.log(`Payment successful for booking ${bookingId}. Updating database.`);
        } else if (['failure', 'error', 'reversed', '3ds_verify'].includes(status)) {
            updateData.is_paid = false; // Позначаємо як неоплачене або відхилене
            console.warn(`Payment for booking ${bookingId} failed/reversed with status: ${status}.`);
        } else {
            // Для інших статусів (pending, processing тощо) ми просто оновлюємо статус, але не is_paid
            console.log(`Payment for booking ${bookingId} is in status: ${status}. No change to is_paid.`);
        }

        // Оновлюємо таблицю 'bookings'
        const { error: bookingUpdateError } = await supabase
            .from('bookings') // Переконайтеся, що це правильна таблиця з вашими бронюваннями
            .update(updateData)
            .eq('id', bookingId);

        if (bookingUpdateError) {
            console.error("Supabase update error for booking:", bookingId, bookingUpdateError.message);
            // Розгляньте механізм відшкодування, якщо оплата успішна, але оновлення БД не вдалося.
            return res.status(500).send('Database update failed for booking.');
        }

        // Оновлюємо також сповіщення, якщо потрібно (наприклад, щоб оновити статус "сплачено" у повідомленні)
        const { error: notificationUpdateError } = await supabase
            .from('patient_notifications')
            .update({ is_paid: updateData.is_paid }) // Оновлюємо поле is_paid у сповіщенні
            .eq('data->>booking_id', bookingId); // Шукаємо за booking_id всередині JSONB 'data'

        if (notificationUpdateError) {
            console.warn("Supabase notification update error:", notificationUpdateError.message);
        }

        res.status(200).send('OK'); // LiqPay очікує відповідь 200 OK
    } catch (dbError) {
        console.error("Unexpected database error in LiqPay callback handler:", dbError.message);
        res.status(500).send('Internal Server Error in callback processing.');
    }
});

// Запускаємо сервер
app.listen(PORT, () => {
    console.log(`LiqPay backend server running on port ${PORT}`);
    console.log(`Public URL for LiqPay callbacks should be: ${YOUR_BACKEND_PUBLIC_URL}`);
});