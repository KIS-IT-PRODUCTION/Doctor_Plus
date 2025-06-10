import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator, // Додаємо для індикації завантаження
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../providers/supabaseClient'; // !!! РОЗКОМЕНТУВАЛИ: Для роботи з Supabase

export default function Messege() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Новий стан для індикатора завантаження
  const [currentDoctorId, setCurrentDoctorId] = useState(null); // ID поточного лікаря

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Функція для додавання нового повідомлення до списку (з Expo Notification)
  const addNewMessage = useCallback((notificationContent) => {
    const { title, body, data } = notificationContent;
    const now = new Date();
    // Форматуємо дату відповідно до локалі користувача
    const messageDate = new Intl.DateTimeFormat(t('locale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    const messageTime = new Intl.DateTimeFormat(t('locale'), { hour: '2-digit', minute: '2-digit' }).format(now);

    setMessages(prevMessages => [
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Унікальний ID для UI
        db_id: data.db_id, // Зберігаємо ID з бази даних, якщо він є
        title: title,
        body: body,
        date: messageDate,
        time: messageTime,
        is_read: data.is_read || false, // Позначаємо як прочитане, якщо прийшло зі статусом
        type: data.type || 'general',
        rawData: data,
      },
      ...prevMessages,
    ]);
  }, [t]);

  // Функція для завантаження повідомлень з Supabase
  const fetchMessagesFromSupabase = useCallback(async (doctorId) => {
    if (!doctorId) {
      console.warn("Doctor ID is missing, cannot fetch notifications.");
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Fetching notifications for doctor:", doctorId);
    try {
      const { data, error } = await supabase
        .from('doctor_notifications')
        .select('*')
        .eq('doctor_id', doctorId) // Фільтруємо за doctor_id
        .order('created_at', { ascending: false }); // Сортуємо від найновіших

      if (error) {
        throw error;
      }

      console.log("Fetched notifications:", data);

      // Форматуємо дані для відображення в UI
      const formattedMessages = data.map(notif => ({
        id: notif.id, // Використовуємо реальний ID з БД
        db_id: notif.id, // Зберігаємо для оновлення
        title: notif.title,
        body: notif.body,
        date: new Intl.DateTimeFormat(t('locale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at)),
        time: new Intl.DateTimeFormat(t('locale'), { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at)),
        is_read: notif.is_read,
        type: (notif.data && notif.data.type) || 'general',
        rawData: notif.data || {},
      }));

      setMessages(formattedMessages);

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Отримання ID поточного лікаря
  useEffect(() => {
    const getDoctorId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user session for doctor:", error.message);
        return;
      }
      if (user) {
        setCurrentDoctorId(user.id);
        console.log("Current doctor ID:", user.id);
      }
    };
    getDoctorId();
  }, []);

  // useFocusEffect для завантаження повідомлень при фокусуванні екрану
  useFocusEffect(
    useCallback(() => {
      if (currentDoctorId) {
        fetchMessagesFromSupabase(currentDoctorId);
      }
      // Функція очищення (немає необхідності для цього випадку)
      return () => {};
    }, [currentDoctorId, fetchMessagesFromSupabase])
  );

  // useEffect для налаштування слухачів сповіщень Expo
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Сповіщення отримано на передньому плані (Messege.js):', notification);
      const { title, body, data } = notification.request.content;

      // Якщо повідомлення прийшло через Expo (push-сповіщення), додаємо його в UI
      // При цьому, якщо воно вже є в БД (наприклад, з Edge Function),
      // то після fetchMessagesFromSupabase() воно буде продубльовано,
      // якщо не перевіряти на дублікати.
      // Найкраще, якщо Edge Function зберігає в БД, а потім відправляє PUSH,
      // то PUSH-сповіщення повинно містити 'db_id', щоб ми могли оновити існуючий запис
      // або принаймні перевірити його наявність.
      // Для простоти, поки що просто додаємо, але варто подумати про уникнення дублікатів.
      // Якщо push-сповіщення містить data.db_id, ми можемо перевірити, чи вже є повідомлення з таким db_id.
      addNewMessage(notification.request.content); // Ця функція вже додає новий запис

      // Немає потреби показувати Alert, якщо повідомлення вже додається в список.
      // Alert.alert(title, body, [{ text: t('ok') }]);
    });

    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Користувач натиснув на сповіщення (Messege.js):', response);
      const { title, body, data } = response.notification.request.content;

      // Якщо користувач натиснув на сповіщення з фону або закритого стану,
      // також додаємо його до списку, якщо потрібно, щоб воно з'явилося після переходу
      // Імовірно, краще просто перезавантажити з БД, якщо екран фокусується,
      // щоб отримати актуальний стан is_read.
      addNewMessage(response.notification.request.content);

      if (data && data.type === 'new_booking') {
        Alert.alert(
          t('new_booking_notification_title'),
          `${t('patient')}: ${data.patient_name}\n${t('date')}: ${data.booking_date}\n${t('time')}: ${data.booking_time_slot}.`,
          [{ text: t('view_details'), onPress: () => {
              // Тут можна реалізувати навігацію на екран деталей бронювання
              // navigation.navigate('DoctorBookings', { bookingId: data.booking_id });
              console.log("Перехід до деталей бронювання");
            }
          }]
        );
      } else {
          Alert.alert(title, body, [{ text: t('ok') }]);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, [t, addNewMessage]);


  // Функція для позначення сповіщення як прочитаного
  const markAsRead = useCallback(async (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );
    try {
      // Оновлюємо статус в Supabase
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ is_read: true })
        .eq('id', messageId); // Використовуємо messageId, який має бути db_id

      if (error) {
        console.error("Error marking notification as read:", error.message);
        Alert.alert(t('error'), t('failed_to_mark_as_read'));
      } else {
        console.log("Notification marked as read in DB:", messageId);
        // Після успішного оновлення в БД, можна також оновити бейдж на головному екрані
        // Шляхом виклику функції з Profile_doctor або оновлення глобального стану
      }
    } catch (error) {
      console.error("Network error marking notification as read:", error.message);
      Alert.alert(t('error'), t('failed_to_mark_as_read'));
    }
  }, [t]);

  // Функція для підтвердження бронювання (якщо це вимагає окремої дії, крім просто "прочитано")
  const handleConfirmBooking = useCallback(async (message) => {
    // Якщо ви хочете, щоб кнопка "Підтвердити" просто позначала сповіщення як прочитане
    await markAsRead(message.db_id); // Використовуємо db_id для оновлення в базі даних

    // Або, якщо "Підтвердити" означає іншу дію, наприклад, оновлення статусу бронювання:
    /*
    try {
        const { error } = await supabase
            .from('patient_bookings')
            .update({ status: 'confirmed' }) // Припустимо, у вас є поле status
            .eq('id', message.rawData.booking_id); // Потрібен booking_id з rawData

        if (error) throw error;
        Alert.alert(t('success'), t('booking_confirmed_successfully'));
        // Після підтвердження, також позначте як прочитане
        await markAsRead(message.db_id);
    } catch (error) {
        console.error("Error confirming booking:", error.message);
        Alert.alert(t('error'), `${t('failed_to_confirm_booking')}: ${error.message}`);
    }
    */
  }, [t, markAsRead]);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t('loading_messages')}</Text>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("messages_screen.header_title")}
        </Text>
        <View>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messageList}>
        {messages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <Text style={styles.emptyMessagesText}>{t("messages_screen.no_messages")}</Text>
            <Text style={styles.emptyMessagesSubText}>{t("messages_screen.waiting_for_bookings")}</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              <View style={styles.dateAndTimestamp}>
                <Text style={styles.dateText}>{message.date}</Text>
                <Text style={styles.timestampText}>{message.time}</Text>
              </View>
              <View style={[styles.messageCard, message.is_read && styles.messageCardRead]}>
                <Text style={styles.cardTitle}>{message.title}</Text>
                <Text style={styles.cardText}>{message.body}</Text>
                {/* Якщо є додаткові дії або посилання, додайте їх тут */}
                {message.type === 'new_booking' && message.rawData && (
                    <View>
                        <Text style={styles.bookingDetailsText}>
                            {t('patient')}: {message.rawData.patient_name}
                        </Text>
                        <Text style={styles.bookingDetailsText}>
                            {t('date')}: {message.rawData.booking_date}
                        </Text>
                        <Text style={styles.bookingDetailsText}>
                            {t('time')}: {message.rawData.booking_time_slot}
                        </Text>

                        {/* Кнопка "Підтвердити" */}
                        {!message.is_read && ( // Показуємо кнопку, тільки якщо повідомлення не прочитано
                            <TouchableOpacity
                                style={styles.confirmBookingButton}
                                onPress={() => handleConfirmBooking(message)}
                            >
                                <Text style={styles.confirmBookingButtonText}>{t('confirm_booking')}</Text>
                            </TouchableOpacity>
                        )}
                        {message.is_read && ( // Якщо прочитано, можна показати статус "Підтверджено" або просто не показувати кнопку
                            <Text style={styles.confirmedText}>{t('confirmed_read')}</Text>
                        )}
                    </View>
                )}
                {/* Опція для позначення як прочитаного, якщо немає кнопки підтвердження */}
                {message.type !== 'new_booking' && !message.is_read && (
                    <TouchableOpacity
                        style={styles.markAsReadButton}
                        onPress={() => markAsRead(message.db_id)}
                    >
                        <Text style={styles.markAsReadButtonText}>{t('mark_as_read')}</Text>
                    </TouchableOpacity>
                )}
                {message.type !== 'new_booking' && message.is_read && (
                    <Text style={styles.confirmedText}>{t('read')}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 50,
  },
  loadingContainer: { // Стилі для індикатора завантаження
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: { // Стилі для тексту індикатора завантаження
    marginTop: 10,
    fontSize: 16,
    color: '#333',
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
    fontSize: 18,
    fontFamily: "Mont-Bold",
    color: "#333",
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  timestampText: {
    fontSize: 14,
    color: "#666",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  messageCardRead: { // Новий стиль для прочитаних повідомлень (можна зробити їх трохи тьмянішими)
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    marginBottom: 5,
    color: "#333",
  },
  cardText: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#555",
    marginBottom: 10,
  },
  bookingDetailsText: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#444",
    marginBottom: 4,
  },
  confirmBookingButton: { // Стиль для кнопки "Підтвердити"
    backgroundColor: '#4CAF50', // Зелений
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmBookingButtonText: { // Стиль для тексту кнопки "Підтвердити"
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: "Mont-SemiBold",
  },
  markAsReadButton: { // Стиль для кнопки "Позначити як прочитане" (для загальних повідомлень)
    backgroundColor: '#0EB3EB', // Синій
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
    opacity: 0.8,
  },
  markAsReadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: "Mont-SemiBold",
  },
  confirmedText: { // Стиль для тексту "Підтверджено" або "Прочитано"
    fontSize: 14,
    fontFamily: "Mont-SemiBold",
    color: '#2E7D32', // Темно-зелений
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#E8F5E9', // Світло-зелений фон
    borderRadius: 10,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontFamily: "Mont-SemiBold",
    color: "#666",
    marginBottom: 10,
  },
  emptyMessagesSubText: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#888",
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});