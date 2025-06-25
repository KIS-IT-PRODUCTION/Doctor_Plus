import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
<<<<<<< HEAD
  Linking
=======
  Linking, // Імпорт Linking для відкриття зовнішніх URL та Deep Linking
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
<<<<<<< HEAD
import { supabase } from '../providers/supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Icon from '../assets/icon.svg';
import sha1 from 'js-sha1';

=======
import { supabase } from '../providers/supabaseClient'; // Шлях до вашого supabaseClient
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons'; // Імпорт Ionicons для іконки стрілки назад
import Icon from '../assets/icon.svg'; // Припустимо, у вас є така іконка (забезпечте шлях та наявність)

// Встановлення обробника для сповіщень, коли додаток активний
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// LiqPay credentials and API URL
const LIQPAY_PUBLIC_KEY = 'sandbox_i32319370149';
const LIQPAY_PRIVATE_KEY = 'sandbox_zMI6cVf79SuNsn4nPIWkoFFWBwZ96Bm7Gikt9H1t'; // Make sure this is ABSOLUTELY CORRECT from LiqPay Dashboard
const LIQPAY_API_URL = 'https://www.liqpay.ua/api/3/checkout'; // <--- ВИПРАВЛЕНО: Правильний API URL

export default function PatientMessages() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Fixed: Correct useState usage
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);

<<<<<<< HEAD
=======
  // ВАЖЛИВО: ЗАМІНІТЬ ЦЕ НА ПУБЛІЧНИЙ URL ВАШОГО БЕКЕНДУ!
  // Це має бути той URL, який ви отримали від ngrok (якщо тестуєте локально)
  // або ваш постійний домен бекенду (для продакшну).
  const BACKEND_URL = 'https://31be-194-44-152-4.ngrok-free.app'; 

  // Функція для обробки натискання кнопки "Назад"
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const getUserId = async () => {
<<<<<<< HEAD
      setLoading(true);
=======
      setLoading(true); // Встановлюємо loading на true на початку завантаження користувача
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setCurrentPatientId(user.id);
          console.log("PatientMessages: Current patient ID:", user.id);
        } else if (error) {
          console.error("PatientMessages: Error fetching user session:", error.message);
          Alert.alert(t('error'), t('failed_to_load_messages_user_session'));
          setLoading(false);
        } else {
          console.warn("PatientMessages: No user session found. User might not be logged in.");
          setLoading(false);
        }
      } catch (err) {
        console.error("PatientMessages: Unexpected error getting user ID:", err.message);
        Alert.alert(t('error'), t('failed_to_load_messages_unexpected'));
        setLoading(false);
      }
    };
    getUserId();
  }, [t]);

  // Функція для отримання повідомлень з Supabase
  const fetchMessagesFromSupabase = useCallback(async () => {
    if (!currentPatientId) {
      setLoading(false);
      setRefreshing(false);
      console.warn("PatientMessages: currentPatientId is null, skipping fetchMessagesFromSupabase.");
      return;
    }

    setLoading(true);
    console.log("PatientMessages: Fetching notifications for patient ID:", currentPatientId);
    try {
      const { data, error } = await supabase
        .from('patient_notifications')
        .select(`
          id,
          title,
          body,
          created_at,
          is_read,
          notification_type,
          data,
          patient_bookings:patient_bookings (
            amount,
            payment_status,
            id
          )
        `)
        .eq('patient_id', currentPatientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        title: msg.title,
        body: msg.body,
        created_at: msg.created_at,
        is_read: msg.is_read,
        type: msg.notification_type,
        rawData: msg.data || {},
<<<<<<< HEAD
        booking: msg.patient_bookings,
=======
        is_paid: msg.data?.is_paid || false, // Припускаємо, що status оплати є в rawData
        booking_id: msg.data?.booking_id || null, // Припускаємо, що booking_id є в rawData
        amount: msg.data?.amount || 0, // Припускаємо, що сума платежу є в rawData
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
      }));

      setMessages(formattedMessages);
      console.log("PatientMessages: Fetched notifications:", formattedMessages.length);
    } catch (error) {
      console.error('PatientMessages: Error fetching patient messages:', error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPatientId, t]);

  // Використовуємо useFocusEffect для оновлення при фокусуванні на екрані
  useFocusEffect(
    useCallback(() => {
      if (currentPatientId) {
        setLoading(true);
        fetchMessagesFromSupabase();
      }
      return () => {};
    }, [currentPatientId, fetchMessagesFromSupabase])
  );

  // Функція для оновлення при "pull-to-refresh"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessagesFromSupabase();
  }, [fetchMessagesFromSupabase]);

  // Функція для позначення повідомлення як прочитаного
  const markAsRead = useCallback(async (messageId) => {
    if (!messageId) {
        console.warn("markAsRead: Message ID is missing, cannot mark as read.");
        return;
    }
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );
    try {
      const { error } = await supabase
        .from('patient_notifications')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        throw error;
      }
      console.log("PatientMessages: Notification marked as read in DB:", messageId);
    } catch (error) {
      console.error('PatientMessages: Error marking message as read:', error.message);
      Alert.alert(t('error'), `${t('failed_to_mark_as_read')}: ${error.message}`);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        )
      );
    }
  }, [t]);

<<<<<<< HEAD
  const handlePayment = useCallback(async (bookingId, amount, description) => {
    console.log("handlePayment called with:", { bookingId, amount, description });

    if (!amount || amount <= 0) {
      Alert.alert(t('payment_error'), t('invalid_payment_amount'));
      console.log("Invalid payment amount:", amount);
      return;
    }

    const data = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      amount: amount.toFixed(2),
      currency: 'UAH',
      description: 'Test Payment', // Simplified description for testing
      order_id: `booking_${bookingId}_${Date.now()}`,
      server_url: 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback', // Make sure this URL is correct and points to liqpay-callback
    };
    console.log("LiqPay data object:", data);

    const encodeBase64 = (str) => {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'utf8').toString('base64');
        } else if (typeof btoa !== 'undefined') {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        } else {
            console.error("Base64 encoding not supported in this environment. Requires Buffer or btoa.");
            throw new Error("Base64 encoding not supported.");
        }
    };

    let base64Data;
    try {
        base64Data = encodeBase64(JSON.stringify(data));
        console.log("Base64 Encoded Data:", base64Data);
    } catch (e) {
        console.error("Error encoding Base64 data:", e);
        Alert.alert(t('error'), t('payment_processing_error_encoding'));
        return;
    }

    const signatureRaw = LIQPAY_PRIVATE_KEY + base64Data + LIQPAY_PRIVATE_KEY;
    const sha1Hash = sha1(signatureRaw);
    const signature = encodeBase64(sha1Hash);
    console.log("Generated SHA1 Hash (before Base64):", sha1Hash);
    console.log("Generated LiqPay Signature:", signature);

    const formData = new URLSearchParams();
    formData.append('data', base64Data);
    formData.append('signature', signature);

    try {
        const liqpayUrl = `${LIQPAY_API_URL}?${formData.toString()}`;
        console.log("Full LiqPay URL to open:", liqpayUrl);

        const supported = await Linking.canOpenURL(liqpayUrl);
        console.log("Linking.canOpenURL result:", supported);

        if (supported) {
            console.log("Attempting to open URL:", liqpayUrl);
            await Linking.openURL(liqpayUrl);
        } else {
            Alert.alert(t('error'), t('cannot_open_liqpay'));
            console.log("Unable to open LiqPay URL:", liqpayUrl);
        }
    } catch (error) {
        console.error("Error in handlePayment:", error);
        Alert.alert(t('error'), t('payment_processing_error'));
    }
  }, [t]);

  // EXISTING NOTIFICATIONS LOGIC (EXPO PUSH NOTIFICATIONS)
=======
  // НОВА ФУНКЦІЯ: Обробка оплати через LiqPay
  const handleLiqPayPayment = useCallback(async (bookingId, amount, description, doctorName) => {
    if (!bookingId || !amount || !description || !currentPatientId) {
      Alert.alert(t('error'), t('liqpay_missing_params'));
      return;
    }

    try {
      // 1. Отримуємо data та signature від вашого бекенду
      console.log("Requesting LiqPay parameters from backend:", BACKEND_URL + '/create-liqpay-payment');
      const response = await fetch(BACKEND_URL + '/create-liqpay-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          bookingId,
          description,
          patientId: currentPatientId,
          doctorName: doctorName, // Передаємо ім'я лікаря для extra_data на бекенд
        }),
      });

      const jsonResponse = await response.json();

      if (!response.ok || !jsonResponse.success) {
        throw new Error(jsonResponse.error || 'Failed to get LiqPay parameters from backend.');
      }

      const { data, signature } = jsonResponse;

      // 2. Формуємо URL для LiqPay і відкриваємо його в системному браузері
      // Використовуємо LiqPay Checkout URL
      const liqPayUrl = 'https://www.liqpay.ua/api/3/checkout'; // Офіційний URL LiqPay Checkout

      // Створюємо POST-форму, закодовану в URL-параметри для відкриття через Linking
      // LiqPay Checkout API підтримує цей спосіб
      const formBody = `data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
      const fullUrl = `${liqPayUrl}?${formBody}`; // LiqPay може прийняти POST дані через GET параметри

      console.log("Attempting to open LiqPay URL:", fullUrl);

      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_url')}: ${fullUrl}`);
      }

    } catch (error) {
      console.error('LiqPay payment initiation error:', error);
      Alert.alert(t('error'), `${t('liqpay_payment_init_failed')}: ${error.message}`);
    }
  }, [currentPatientId, t, BACKEND_URL]); // Додано BACKEND_URL до залежностей

  // Функція для обробки Deep Links, якщо ви повертаєтесь з LiqPay в додаток
  const handleDeepLink = useCallback(({ url }) => {
    console.log("App opened via deep link:", url);
    // Після повернення з LiqPay, оновимо список повідомлень,
    // щоб перевірити оновлений статус оплати з бекенду (який отримав Call-back)
    fetchMessagesFromSupabase();
    // Можна також додати логіку для відображення успішності/неуспішності платежу
    // на основі `url`, якщо LiqPay включає такі параметри в `result_url`
  }, [fetchMessagesFromSupabase]);


  // useEffect для підписки на сповіщення та Deep Links
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
  useEffect(() => {
    if (!currentPatientId) return;

    // Слухачі для сповіщень Expo
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('PatientMessages: Notification received in foreground:', notification);
<<<<<<< HEAD
      fetchMessagesFromSupabase();
=======
      fetchMessagesFromSupabase(); // Оновлюємо список повідомлень при отриманні нового сповіщення
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('PatientMessages: Notification response received (user clicked):', response);
      const { title, body, data } = response.notification.request.content;

<<<<<<< HEAD
      fetchMessagesFromSupabase();

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected' || data.type === 'payment_status_update') && data.booking_id) {
        let alertMessage = "";
        let alertTitle = "";

        if (data.type === 'booking_confirmed') {
            alertTitle = t('booking_status_update_default_title');
            alertMessage = `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
                           `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
                           `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
                           t('booking_confirmed_message_full');
        } else if (data.type === 'booking_rejected') {
            alertTitle = t('booking_status_update_default_title');
            alertMessage = `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
                           `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
                           `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
                           t('booking_rejected_message_full');
        } else if (data.type === 'payment_status_update') {
            alertTitle = t('payment_notification_title');
            alertMessage = `${t('booking_id')}: ${data.booking_id || t('not_specified')}\n` +
                           `${t('status')}: ${data.status_message || t('not_specified')}\n\n` +
                           (data.status === 'paid' ? t('payment_successful_notification_body') : t('payment_failed_notification_body'));
        }

        Alert.alert(alertTitle || t('notification_title_default'), alertMessage, [{ text: t('ok'), onPress: () => {
            // Optional: navigate to relevant screen after user acknowledges
            // if (data.booking_id) {
            //    navigation.navigate('BookingDetailsPatient', { bookingId: data.booking_id });
            // }
        }}]);
=======
      fetchMessagesFromSupabase(); // Оновлюємо список повідомлень після кліку на сповіщення

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected') && data.booking_id) {
        Alert.alert(
          title || t('booking_status_update_default_title'), // Використовуємо title з push-сповіщення
          `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
          `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
          `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
          (data.status === 'confirmed' ? t('booking_confirmed_message_full') : t('booking_rejected_message_full')),
          [
            { text: t('ok'), onPress: () => {
                // Якщо статус "confirmed", ще не сплачено, є booking_id та сума, запропонувати оплату
                if (data.status === 'confirmed' && !data.is_paid && data.booking_id && data.amount > 0) {
                    Alert.alert(
                        t('payment_required_title'),
                        t('payment_required_message'),
                        [
                            { text: t('cancel'), style: 'cancel' },
                            {
                                text: t('pay_now'),
                                onPress: () => handleLiqPayPayment(
                                    data.booking_id,
                                    data.amount,
                                    `Оплата консультації ${data.doctor_name || ''}`, // Опис для платежу
                                    data.doctor_name // Ім'я лікаря
                                )
                            }
                        ]
                    );
                }
            }}
          ]
        );
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
      } else {
        Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    // Слухач для Deep Links (повернення в додаток після оплати)
    // ЗМІНЕНО: Тепер Linking.addEventListener повертає об'єкт-підписку, який має метод remove()
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Функція очищення для useEffect: видаляємо слухачі при розмонтуванні компонента
    return () => {
      Notifications.removeNotificationSubscription(subscription);
      Notifications.removeNotificationSubscription(responseSubscription);
      // ЗМІНЕНО: Видаляємо підписку за допомогою її методу .remove()
      linkingSubscription.remove(); 
    };
<<<<<<< HEAD
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t]);
=======
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t, handleLiqPayPayment, handleDeepLink]); // Додано handleDeepLink до залежностей
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patient_messages_screen.header_title')}</Text>
        <View style={styles.headerIconContainer}>
          <Icon width={50} height={50} />
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0EB3EB" />
          <Text style={styles.loadingText}>{t('loading_messages')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.messageList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EB3EB" />
          }
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesText}>{t("patient_messages_screen.no_messages")}</Text>
              <Text style={styles.emptyMessagesSubText}>{t("patient_messages_screen.waiting_for_updates")}</Text>
            </View>
          ) : (
            messages.map((message) => {
              const locale = t('locale') || 'uk-UA';
              const messageDate = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(message.created_at));
              const messageTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at));

<<<<<<< HEAD
              // Check if payment status is 'paid' (case-insensitive)
              const isPaid = message.booking?.payment_status?.toLowerCase() === 'paid';

              const showPayButton =
                message.type === 'booking_confirmed' &&
                message.booking &&
                message.booking.amount &&
                !isPaid; // Show pay button ONLY if not paid
              
=======
              // Визначаємо, чи потрібно показати кнопку "Оплатити"
              const showPayButton = message.type === 'booking_confirmed' && !message.is_paid && message.booking_id && message.amount > 0;

>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{messageDate}</Text>
                    <Text style={styles.timestampText}>{messageTime}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => !message.is_read && markAsRead(message.id)}
                    style={[
                        styles.messageCard,
                        message.is_read && styles.messageCardRead,
                        message.type === 'booking_confirmed' && styles.messageCardConfirmed,
                        message.type === 'booking_rejected' && styles.messageCardRejected,
                    ]}
                  >
                    <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                    <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

<<<<<<< HEAD
                    {showPayButton && (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayment(message.booking.id, message.booking.amount, message.title)}
                      >
                        <Text style={styles.payButtonText}>{t('pay_now')}</Text>
                      </TouchableOpacity>
                    )}

                    {isPaid && ( // NEW: Render "You paid" button if status is paid
                      <TouchableOpacity
                        style={[styles.payButton, styles.payButtonDisabled]} // Apply disabled styles
                        disabled={true} // Make it non-interactive
                      >
                        <Text style={styles.payButtonText}>{t('you_paid')}</Text> {/* New translation key */}
=======
                    {/* НОВИЙ БЛОК: Кнопка "Оплатити" */}
                    {showPayButton && (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handleLiqPayPayment(
                            message.booking_id,
                            message.amount,
                            `Оплата консультації з ${message.rawData.doctor_name || 'лікарем'}`, // Опис для LiqPay
                            message.rawData.doctor_name // Ім'я лікаря для extra_data на бекенді
                        )}
                      >
                        <Text style={styles.payButtonText}>{t('pay_now')} {message.amount} UAH</Text>
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
                      </TouchableOpacity>
                    )}

                    {!message.is_read ? (
                        <TouchableOpacity
                            style={styles.markAsReadButton}
                            onPress={() => markAsRead(message.id)}
                        >
                            <Text style={styles.markAsReadButtonText}>{t('mark_as_read')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.readStatusText}>{t('read')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    textAlign: 'center',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: 20,
  },
  dateAndTimestamp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timestampText: {
    fontSize: 14,
    color: '#888',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#0EB3EB',
  },
  messageCardRead: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#cccccc',
    opacity: 0.8,
  },
  messageCardConfirmed: {
    borderLeftColor: '#4CAF50',
  },
  messageCardRejected: {
    borderLeftColor: '#D32F2F',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  payButton: {
    marginTop: 10,
<<<<<<< HEAD
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  payButtonDisabled: { // NEW: Styles for disabled button
    backgroundColor: '#A0A0A0', // Greyed out color
=======
    backgroundColor: '#FFC107', // Жовтий колір
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'stretch', // Розтягуємо на всю ширину картки
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10, // Відступ від інших елементів
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
>>>>>>> ecf557a99e2af2cf16bb5aefdf9ba77fcb7a533b
  },
  markAsReadButton: {
    marginTop: 15,
    backgroundColor: '#0EB3EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markAsReadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  readStatusText: {
    marginTop: 15,
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#777',
    marginBottom: 10,
  },
  emptyMessagesSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
