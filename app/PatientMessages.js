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
  Platform // Для Platform-specific стилів
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient'; // Переконайтеся, що шлях правильний
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons'; // Імпортуємо Ionicons для іконки стрілки назад
import Icon from '../assets/icon.svg'; // Припустимо, у вас є така іконка (забезпечте шлях та наявність)

// Встановіть обробник для сповіщень, коли додаток активний
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

  // Отримання ID поточного пацієнта
  useEffect(() => {
    const getUserId = async () => {
      setLoading(true); // Встановлюємо loading на true на початку
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
          // Не показуємо Alert.alert тут, якщо користувача немає - це нормально.
          // Лише якщо він намагається отримати повідомлення, а ID немає.
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

  const fetchMessagesFromSupabase = useCallback(async () => {
    if (!currentPatientId) {
      // Якщо currentPatientId ще не завантажився, просто виходимо,
      // `loading` буде оброблений верхнім `useEffect`
      setLoading(false);
      setRefreshing(false);
      console.warn("PatientMessages: currentPatientId is null, skipping fetchMessagesFromSupabase.");
      return;
    }

    setLoading(true); // Завжди встановлюємо loading на true при початку завантаження
    console.log("PatientMessages: Fetching notifications for patient ID:", currentPatientId);
    try {
      const { data, error } = await supabase
        .from('patient_notifications')
        .select('*')
        .eq('patient_id', currentPatientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedMessages = data.map(msg => ({
        id: msg.id, // Використовуємо id з бази даних як унікальний ключ
        title: msg.title,
        body: msg.body,
        created_at: msg.created_at,
        is_read: msg.is_read,
        type: msg.notification_type,
        rawData: msg.data || {},
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

  useFocusEffect(
    useCallback(() => {
      // Запускаємо завантаження лише коли currentPatientId вже доступний
      if (currentPatientId) {
        setLoading(true); // Встановлюємо loading, коли переходимо до цього екрану з фокусом
        fetchMessagesFromSupabase();
      }
      return () => {}; // Функція очищення
    }, [currentPatientId, fetchMessagesFromSupabase])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessagesFromSupabase();
  }, [fetchMessagesFromSupabase]);

  const markAsRead = useCallback(async (messageId) => {
    if (!messageId) {
        console.warn("markAsRead: Message ID is missing, cannot mark as read.");
        return;
    }
    // Оптимістичне оновлення UI
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
      // Відкочуємо зміну в UI, якщо запит до DB не вдався
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        )
      );
    }
  }, [t]);

  useEffect(() => {
    if (!currentPatientId) return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('PatientMessages: Notification received in foreground:', notification);
      fetchMessagesFromSupabase(); // Оновлюємо список повідомлень
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('PatientMessages: Notification response received (user clicked):', response);
      const { title, body, data } = response.notification.request.content;

      fetchMessagesFromSupabase(); // Оновлюємо список повідомлень

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected') && data.booking_id) {
        Alert.alert(
            title || t('booking_status_update_default_title'), // Використовуємо title з push-сповіщення
            `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
            `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
            `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
            (data.status === 'confirmed' ? t('booking_confirmed_message_full') : t('booking_rejected_message_full')),
            [{ text: t('ok'), onPress: () => {
                // Можливо, навігація до деталей бронювання, якщо потрібно
                // navigation.navigate('BookingDetails', { bookingId: data.booking_id });
            }}]
        );
      } else {
        // Для інших типів сповіщень або якщо дані неповні
        Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(subscription);
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t]); // Додано 'navigation' та 't' до залежностей

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER - Схожий на header лікаря */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patient_messages_screen.header_title')}</Text>
        <View style={styles.headerIconContainer}>
          {/* Припустимо, це та сама іконка, що і у лікаря */}
          <Icon width={50} height={50} />
        </View>
      </View>

      {/* СПИСОК ПОВІДОМЛЕНЬ */}
      {loading && messages.length === 0 ? ( // Показуємо завантажувач лише якщо немає повідомлень і йде завантаження
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
              const locale = t('locale') || 'uk-UA'; // Використовуємо мову для форматування
              const messageDate = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(message.created_at));
              const messageTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at));

              return (
                <View key={message.id} style={styles.messageGroup}>
                  {/* Дата та час */}
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{messageDate}</Text>
                    <Text style={styles.timestampText}>{messageTime}</Text>
                  </View>

                  {/* Картка повідомлення */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => !message.is_read && markAsRead(message.id)} // Позначаємо прочитаним при натисканні, якщо не прочитано
                    style={[
                        styles.messageCard,
                        message.is_read && styles.messageCardRead,
                        message.type === 'booking_confirmed' && styles.messageCardConfirmed,
                        message.type === 'booking_rejected' && styles.messageCardRejected,
                    ]}
                  >
                    <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                    <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                

                    {/* Кнопка "Позначити як прочитане" або статус "Прочитано" */}
                    {!message.is_read ? (
                        <TouchableOpacity
                            style={styles.markAsReadButton}
                            onPress={() => markAsRead(message.id)} // Перевіряємо id перед викликом
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
    backgroundColor: '#f8f8f8', // Легкий сірий фон для всього екрану
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Додатковий відступ для Android status bar
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Легка нижня межа
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Тінь для Android
  },
  backButton: { // Стилі для кнопки "Назад"
    backgroundColor: "rgba(14, 179, 235, 0.2)", // Напівпрозорий синій
    borderRadius: 25, // Кругла кнопка
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    // fontFamily: 'Mont-Bold', // Увімкніть, якщо завантажено
    fontWeight: 'bold', // Запасний варіант
    color: '#333',
    flexShrink: 1, // Дозволяє тексту стискатися
    textAlign: 'center', // Центрування тексту
  },
  headerIconContainer: {
    // Якщо потрібно, щоб іконка займала місце, щоб заголовок був по центру
    width: 50, // Відповідає ширині іконки
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: { // Стилі для повноекранного завантажувача
    ...StyleSheet.absoluteFillObject, // Розтягуємо на весь екран
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Напівпрозорий білий фон
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Перекриває інший вміст
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    // fontFamily: 'Mont-Regular',
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexGrow: 1, // Дозволяє вмісту розтягуватися і центруватися при необхідності
  },
  messageGroup: {
    marginBottom: 20, // Відступ між картками повідомлень
  },
  dateAndTimestamp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    // fontFamily: 'Mont-SemiBold',
    fontWeight: '600',
    color: '#666',
  },
  timestampText: {
    fontSize: 14,
    // fontFamily: 'Mont-Regular',
    color: '#888',
  },
  messageCard: {
    backgroundColor: '#FFFFFF', // Білий фон картки
    borderRadius: 15, // Закруглені кути
    padding: 18, // Внутрішній відступ
    shadowColor: '#000', // Тінь
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5, // Тінь для Android
    borderLeftWidth: 5, // Кольоровий лівий бордюр
    borderLeftColor: '#0EB3EB', // Дефолтний колір бордюру (синій)
  },
  messageCardRead: {
    backgroundColor: '#f0f0f0', // Сіріший фон для прочитаних
    borderLeftColor: '#cccccc', // Сірий бордюр для прочитаних
    opacity: 0.8, // Зменшена прозорість для прочитаних
  },
  messageCardConfirmed: {
    borderLeftColor: '#4CAF50', // Зелений бордюр для підтверджених
  },
  messageCardRejected: {
    borderLeftColor: '#D32F2F', // Червоний бордюр для відхилених
  },
  cardTitle: {
    fontSize: 18,
    // fontFamily: 'Mont-Bold',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    // fontFamily: 'Mont-Regular',
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  bookingInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E0F7FA', // Легкий блакитний фон
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B2EBF2',
  },
  bookingDetailsText: {
    fontSize: 14,
    // fontFamily: 'Mont-Regular',
    color: '#444',
    marginBottom: 4,
  },
  bookingStatusText: {
    fontSize: 15,
    // fontFamily: 'Mont-SemiBold',
    fontWeight: '600',
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start', // Вирівнювання за лівим краєм
  },
  statusConfirmed: {
    backgroundColor: '#E8F5E9', // Дуже світло-зелений фон
    color: '#2E7D32', // Темно-зелений текст
  },
  statusRejected: {
    backgroundColor: '#FFEBEE', // Дуже світло-червоний фон
    color: '#D32F2F', // Темно-червоний текст
  },
  markAsReadButton: {
    marginTop: 15,
    backgroundColor: '#0EB3EB', // Яскраво-синій
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
    // fontFamily: 'Mont-SemiBold',
    fontWeight: '600',
  },
  readStatusText: {
    marginTop: 15,
    fontSize: 14,
    // fontFamily: 'Mont-Regular',
    color: '#888',
    textAlign: 'right', // Вирівнювання праворуч для тексту "Прочитано"
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50, // Відступ зверху/знизу
  },
  emptyMessagesText: {
    fontSize: 18,
    // fontFamily: 'Mont-SemiBold',
    fontWeight: '600',
    color: '#777',
    marginBottom: 10,
  },
  emptyMessagesSubText: {
    fontSize: 14,
    // fontFamily: 'Mont-Regular',
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});