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
  Linking,
  Dimensions,
  StatusBar, // Додаємо StatusBar для умовних стилів
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Icon from '../assets/icon.svg';
import Constants from 'expo-constants';

// Одиниці масштабування для адаптивного інтерфейсу
const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// URL вашої Supabase Edge Function, яка ініціює LiqPay платіж
const LIQPAY_INIT_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/init-liqpay-payment';

// URL вашої Supabase Edge Function, яка обробляє callback від LiqPay
const LIQPAY_CALLBACK_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback';

export default function PatientMessages() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);

  // Функція для обробки натискання кнопки "Назад"
  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const getUserId = async () => {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setCurrentPatientId(user.id);
          console.log("PatientMessages: Поточний ID пацієнта:", user.id);
        } else if (error) {
          console.error("PatientMessages: Помилка отримання сесії користувача:", error.message);
          Alert.alert(t('error'), t('failed_to_load_messages_user_session'));
          setLoading(false);
        } else {
          console.warn("PatientMessages: Сесія користувача не знайдена. Користувач може бути не авторизований.");
          setLoading(false);
        }
      } catch (err) {
        console.error("PatientMessages: Несподівана помилка при отриманні ID користувача:", err.message);
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
      console.warn("PatientMessages: currentPatientId є null, пропускаємо fetchMessagesFromSupabase.");
      return;
    }

    setLoading(true);
    console.log("PatientMessages: Отримання сповіщень для пацієнта з ID:", currentPatientId);
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
          data
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
        type: msg.notification_type, // Використовуємо notification_type
        rawData: msg.data || {},
        is_paid: msg.data?.is_paid || false,
        booking_id: msg.data?.booking_id || null,
        amount: msg.data?.amount || 0,
        meet_link: msg.data?.meet_link || null, // Отримуємо meet_link з rawData
      }));

      setMessages(formattedMessages);
      console.log("PatientMessages: Отримано сповіщень:", formattedMessages.length);

    } catch (error) {
      console.error('PatientMessages: Помилка отримання повідомлень пацієнта:', error.message);
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

  // Функція для "pull-to-refresh"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessagesFromSupabase();
  }, [fetchMessagesFromSupabase]);

  // Функція для позначення ОДНОГО повідомлення як прочитаного (може бути викликана кнопкою)
  const markSingleAsRead = useCallback(async (messageId) => {
    if (!messageId) {
        console.warn("markSingleAsRead: ID повідомлення відсутній.");
        return;
    }
    // Оновлюємо UI негайно
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
      console.log("PatientMessages: Одне сповіщення позначено як прочитане в БД:", messageId);
    } catch (error) {
      console.error('PatientMessages: Помилка позначення одного повідомлення як прочитаного:', error.message);
      Alert.alert(t('error'), `${t('failed_to_mark_as_read')}: ${error.message}`);
      // Відкат UI у випадку помилки
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        )
      );
    }
  }, [t]);


  // НОВА ФУНКЦІЯ: Обробка оплати через LiqPay
  const handleLiqPayPayment = useCallback(async (bookingId, amount, description, doctorName) => {
    if (!bookingId || !amount || !description || !currentPatientId) {
      Alert.alert(t('error'), t('liqpay_missing_params'));
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session || !session.access_token) {
        console.error('SendPaymentNotification: Помилка отримання сесії користувача або токена:', sessionError?.message || 'Сесія відсутня.');
        Alert.alert(t('error'), t('failed_to_authorize_payment'));
        return;
      }

      const userAccessToken = session.access_token;

      console.log("Запит параметрів LiqPay до Supabase Edge Function:", LIQPAY_INIT_FUNCTION_URL);
      const response = await fetch(LIQPAY_INIT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAccessToken}`,
        },
        body: JSON.stringify({
          amount,
          bookingId,
          description,
          patientId: currentPatientId,
          doctorName: doctorName,
          server_url: LIQPAY_CALLBACK_FUNCTION_URL,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase Edge Function returned non-OK status:', response.status, errorText);
        let userMessage = t('liqpay_payment_init_failed_http') + `: ${response.status}.`;
        if (errorText.length > 0) {
            userMessage += ` ${errorText.substring(0, Math.min(errorText.length, 150))}${errorText.length > 150 ? '...' : ''}`;
        }
        Alert.alert(t('error'), userMessage);
        return;
      }

      const jsonResponse = await response.json();

      if (!jsonResponse.success || !jsonResponse.data || !jsonResponse.signature) {
        console.error('Supabase Edge Function reported error or missing data/signature:', jsonResponse.error || 'Невідома помилка.');
        throw new Error(jsonResponse.error || 'Не вдалося отримати параметри LiqPay з Edge Function (відсутні data/signature).');
      }

      const { data, signature } = jsonResponse;

      const liqPayUrl = 'https://www.liqpay.ua/api/3/checkout';
      const formBody = `data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
      const fullUrl = `${liqPayUrl}?${formBody}`;

      console.log("Спроба відкрити URL LiqPay:", fullUrl);

      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_url')}: ${fullUrl}`);
      }

    } catch (error) {
      console.error('Помилка ініціалізації оплати LiqPay:', error);
      Alert.alert(t('error'), `${t('liqpay_payment_init_failed')}: ${error.message}`);
    }
  }, [currentPatientId, t, LIQPAY_INIT_FUNCTION_URL, LIQPAY_CALLBACK_FUNCTION_URL]);

  // Зміни тут: НОВА ФУНКЦІЯ: Обробка натискання кнопки "Приєднатися до зустрічі"
  const handleJoinMeet = useCallback(async (meetLink) => {
    if (!meetLink) {
      Alert.alert(t('error'), t('meet_link_missing'));
      return;
    }
    try {
      const supported = await Linking.canOpenURL(meetLink);
      if (supported) {
        await Linking.openURL(meetLink);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_meet_link')}: ${meetLink}`);
      }
    } catch (error) {
      console.error("Error opening Google Meet link:", error);
      Alert.alert(t('error'), `${t('error_opening_meet_link')}: ${error.message}`);
    }
  }, [t]);


  // Функція для обробки Deep Links (повернення в додаток після оплати)
  const handleDeepLink = useCallback(({ url }) => {
    console.log("Додаток відкрито через deep link:", url);
    console.log("Викликаю fetchMessagesFromSupabase після deep link.");
    // Додайте затримку перед оновленням, щоб дати БД синхронізуватися
    setTimeout(() => {
        fetchMessagesFromSupabase();
    }, 1000); // Затримка 1 секунда, можна налаштувати
  }, [fetchMessagesFromSupabase]);

  // useEffect для підписки на сповіщення та Deep Links
  useEffect(() => {
    if (!currentPatientId) return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('PatientMessages: Сповіщення отримано на передньому плані:', notification);
      fetchMessagesFromSupabase(); // Оновлення списку після отримання нового сповіщення
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('PatientMessages: Отримано відповідь на сповіщення (користувач натиснув):', response);
      const { title, body, data } = response.notification.request.content;

      // Оновити повідомлення після взаємодії зі сповіщенням
      // Викликаємо fetchMessagesFromSupabase для отримання найновіших даних,
      // оскільки це сповіщення могло змінити стан в БД.
      fetchMessagesFromSupabase();

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected' || data.type === 'payment_success' || data.type === 'meet_link_update') && data.booking_id) {
        if (data.type === 'payment_success') {
          Alert.alert(
            title || t('payment_success_notification_title'),
            body || t('payment_success_notification_body'),
            [{ text: t('ok') }]
          );
        } else if (data.type === 'meet_link_update') { // Обробка сповіщення про оновлення Meet-посилання
            Alert.alert(
                t('consultation_link_ready_title'), // Додайте цей ключ перекладу
                `${t('consultation_link_ready_message', { doctorName: data.doctor_name, date: data.booking_date, time: data.booking_time_slot })}`, // Додайте цей ключ перекладу
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('join_meet_call'), onPress: () => handleJoinMeet(data.meet_link) }
                ]
            );
        } else {
          Alert.alert(
            title || t('booking_status_update_default_title'),
            `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
            `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
            `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
            (data.status === 'confirmed' ? t('booking_confirmed_message_full') : t('booking_rejected_message_full')),
            [
              { text: t('ok'), onPress: () => {
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
                                  `Оплата консультації ${data.doctor_name || ''}`,
                                  data.doctor_name
                              )
                          }
                      ]
                    );
                  }
                  // Зміни тут: Якщо оплачено і є посилання на Meet, запропонувати приєднатися
                  // Цей блок тепер обробляє випадки, коли посилання надходить разом з підтвердженням
                  // або пізніше через окреме сповіщення "meet_link_update".
                  if (data.status === 'confirmed' && data.is_paid && data.meet_link) {
                      Alert.alert(
                          t('consultation_ready_title'),
                          t('consultation_ready_message'),
                          [
                              { text: t('cancel'), style: 'cancel' },
                              { text: t('join_meet_call'), onPress: () => handleJoinMeet(data.meet_link) }
                          ]
                      );
                  }
              }}
            ]
          );
        }
      } else {
        Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      Notifications.removeNotificationSubscription(subscription);
      Notifications.removeNotificationSubscription(responseSubscription);
      linkingSubscription.remove();
    };
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t, handleLiqPayPayment, handleDeepLink, handleJoinMeet]); // Додано handleJoinMeet в залежності

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header_title')}</Text>
        <View style={styles.headerIconContainer}>
          <Icon width={moderateScale(50)} height={moderateScale(50)} />
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

              const showPayButton = message.type === 'booking_confirmed' && !message.is_paid && message.booking_id && message.amount > 0;
              const isPaid = message.is_paid;

              // Логіка для відображення кнопки "Приєднатися"
              // Вона показується, якщо бронювання підтверджено АБО це оновлення посилання, І ОПЛАЧЕНО, І Є ПОСИЛАННЯ
              const showJoinMeetButton = (message.type === 'booking_confirmed' || message.type === 'meet_link_update') && isPaid && message.meet_link;


              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{messageDate}</Text>
                    <Text style={styles.timestampText}>{messageTime}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        console.log("Card pressed:", message.id);
                        // Автоматично позначати як прочитане при натисканні на картку
                        if (!message.is_read) {
                            markSingleAsRead(message.id);
                        }
                    }}
                    disabled={false}
                    style={[
                        styles.messageCard,
                        message.is_read && !isPaid && styles.messageCardRead,
                        message.type === 'booking_confirmed' && styles.messageCardConfirmed,
                        message.type === 'booking_rejected' && styles.messageCardRejected,
                        isPaid && styles.messageCardPaid,
                        message.type === 'meet_link_update' && styles.messageCardMeetLinkUpdate, // Новий стиль для оновлень Meet Link
                    ]}
                  >
                    <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                    <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                    {/* ДОДАНО: Відображення посилання Meet, якщо воно є */}
                    {message.meet_link && (
                        <View style={styles.meetLinkContainer}>
                            <Ionicons name="videocam-outline" size={moderateScale(18)} color="#34A853" />
                            <Text style={styles.meetLinkText} onPress={() => handleJoinMeet(message.meet_link)}>
                                {t('meet_link')}: {message.meet_link}
                            </Text>
                        </View>
                    )}


                    {/* БЛОК: Кнопка "Оплатити" / "Оплачено" / "Приєднатися" */}
                    {showPayButton ? (
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => {
                                handleLiqPayPayment(
                                    message.booking_id,
                                    message.amount,
                                    `Оплата консультації з ${message.rawData.doctor_name || 'лікарем'}`,
                                    message.rawData.doctor_name
                                );
                            }}
                        >
                            <Text style={styles.payButtonText}>{t('pay_now')} {message.amount} {t('uah')}</Text>
                        </TouchableOpacity>
                    ) : showJoinMeetButton ? ( // Зміни тут: Кнопка "Приєднатися"
                        <TouchableOpacity
                            style={styles.joinMeetButton} // Новий стиль
                            onPress={() => handleJoinMeet(message.meet_link)}
                        >
                            <Ionicons name="videocam-outline" size={moderateScale(20)} color="#FFFFFF" style={styles.joinMeetIcon} />
                            <Text style={styles.joinMeetButtonText}>{t('join_meet_call')}</Text>
                        </TouchableOpacity>
                    ) : isPaid ? ( // Якщо оплачено, але немає Meet посилання (ще не надіслано)
                        <View style={styles.paidButton}>
                            <Text style={styles.paidButtonText}>{t('paid')}</Text>
                        </View>
                    ) : null}

                    <View style={styles.messageActionsRow}>
                        {isPaid ? (
                            <Text style={styles.readStatusText}>{t('paid')}</Text>
                        ) : message.is_read ? (
                            <Text style={styles.readStatusText}>{t('read')}</Text>
                        ) : null}

                        {!message.is_read && (
                            <TouchableOpacity
                                style={styles.markAsReadButton}
                                onPress={() => markSingleAsRead(message.id)}
                            >
                                <Text style={styles.markAsReadButtonText}>{t('mark_as_read')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
    paddingTop: Platform.OS === "ios" ? StatusBar.currentHeight + 5 : 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(25),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Mont-SemiBold", // Якщо шрифт Mont-SemiBold доступний
    fontSize: moderateScale(20),
    color: "#333",
  },
  headerIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: '#555',
    // fontFamily: 'Mont-Regular', // Якщо шрифт Mont-Regular доступний
  },
  messageList: {
    paddingVertical: verticalScale(20),
    paddingHorizontal: moderateScale(15),
    flexGrow: 1,
    backgroundColor: '#F5F7FA',
  },
  messageGroup: {
    marginBottom: verticalScale(20),
  },
  dateAndTimestamp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
    paddingHorizontal: moderateScale(5),
  },
  dateText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    // fontFamily: 'Mont-SemiBold', // Якщо шрифт Mont-SemiBold доступний
    color: '#666',
  },
  timestampText: {
    fontSize: moderateScale(14),
    color: '#888',
    // fontFamily: 'Mont-Regular', // Якщо шрифт Mont-Regular доступний
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(15),
    padding: moderateScale(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(5),
    elevation: 5,
    borderLeftWidth: moderateScale(5),
    borderLeftColor: '#0EB3EB',
  },
  messageCardRead: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#cccccc',
    opacity: 0.95,
  },
  messageCardConfirmed: {
    borderLeftColor: '#4CAF50',
  },
  messageCardRejected: {
    borderLeftColor: '#D32F2F',
  },
  messageCardPaid: {
    backgroundColor: '#E6FFE6',
    borderLeftColor: '#2E7D32',
    opacity: 1,
  },
  // НОВИЙ СТИЛЬ: для повідомлення про оновлення Meet Link
  messageCardMeetLinkUpdate: {
    borderLeftColor: '#9C27B0', // Фіолетовий колір, як у лікаря
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    // fontFamily: 'Mont-Bold', // Якщо шрифт Mont-Bold доступний
    color: '#333',
    marginBottom: verticalScale(8),
  },
  cardText: {
    fontSize: moderateScale(15),
    color: '#555',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(10),
    // fontFamily: 'Mont-Regular', // Якщо шрифт Mont-Regular доступний
  },
  // НОВІ СТИЛІ: для контейнера Meet-посилання
  meetLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(5),
    marginBottom: verticalScale(10),
    padding: moderateScale(10),
    backgroundColor: '#F0FFF0', // Світло-зелений фон
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#A8DDA8', // Зелена рамка
  },
  meetLinkText: {
    fontSize: moderateScale(14),
    color: '#34A853', // Темно-зелений колір тексту
    marginLeft: moderateScale(8),
    textDecorationLine: 'underline', // Підкреслення
    flexShrink: 1, // Дозволяє тексту скорочуватися
    // fontFamily: 'Mont-Regular',
  },
  payButton: {
    marginTop: verticalScale(10),
    backgroundColor: '#0EB3EB',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(2),
    elevation: 2,
    marginBottom: verticalScale(10),
  },
  payButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    // fontFamily: 'Mont-Bold', // Якщо шрифт Mont-Bold доступний
  },
  paidButton: {
    marginTop: verticalScale(10),
    backgroundColor: '#4CAF50',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  paidButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    // fontFamily: 'Mont-Bold', // Якщо шрифт Mont-Bold доступний
  },
  joinMeetButton: {
    marginTop: verticalScale(10),
    backgroundColor: '#34A853', // Колір Google Meet
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(2),
    elevation: 2,
    marginBottom: verticalScale(10),
  },
  joinMeetButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    // fontFamily: 'Mont-Bold', // Якщо шрифт Mont-Bold доступний
    marginLeft: moderateScale(8),
  },
  joinMeetIcon: {
    // Стилі для іконки, якщо потрібні додаткові налаштування
  },
  messageActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  readStatusText: {
    fontSize: moderateScale(14),
    color: '#888',
    // fontFamily: 'Mont-Regular', // Якщо шрифт Mont-Regular доступний
  },
  markAsReadButton: {
    backgroundColor: 'transparent',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    borderColor: '#0EB3EB',
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  markAsReadButtonText: {
    color: '#0EB3EB',
    fontSize: moderateScale(13),
    // fontFamily: 'Mont-SemiBold', // Якщо шрифт Mont-SemiBold доступний
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(50),
  },
  emptyMessagesText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#777',
    marginBottom: verticalScale(10),
    // fontFamily: 'Mont-SemiBold', // Якщо шрифт Mont-SemiBold доступний
  },
  emptyMessagesSubText: {
    fontSize: moderateScale(14),
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: moderateScale(30),
    // fontFamily: 'Mont-Regular', // Якщо шрифт Mont-Regular доступний
  },
});