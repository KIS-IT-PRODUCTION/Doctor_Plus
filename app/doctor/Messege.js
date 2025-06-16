import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions, // <-- Додано Dimensions
  Platform, // <-- Додано Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient';
import Constants from 'expo-constants'; // <-- Додано Constants

// Отримання розмірів екрану
const { width, height } = Dimensions.get("window");

// Функції для масштабування розмірів (як у вас вже є)
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// ... (весь ваш існуючий код компонента Message та інших функцій без змін) ...
// На цьому етапі я не буду повторювати весь код компонента Message,
// оскільки зміни стосуються лише стилів.
// Переконайтеся, що ви замінили лише секцію `styles`.

// === Компоненти та дані ===
// ... (Ваш існуючий код getParsedArray, specializationsList, consultationLanguagesList,
//      LanguageFlags, InfoBox, DoctorCard - вони не потрібні тут, бо це Message.js)

// Починаємо з компонента Message (від його `export default function Message() { ... }` до кінця файлу)

export default function Message() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t('doctor'));

  const notificationReceivedListener = useRef(null);
  const notificationResponseListener = useRef(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addNewMessage = useCallback((notificationContent) => {
    const { title, body, data } = notificationContent;
    const now = new Date();
    const locale = t('locale') || 'uk-UA';
    const messageDate = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    const messageTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(now);

    setMessages(prevMessages => {
      const isDuplicate = prevMessages.some(msg =>
        (data && data.db_id && msg.db_id === data.db_id) ||
        (msg.title === title && msg.body === body && msg.date === messageDate && msg.time === messageTime && msg.type === (data.type || 'general'))
      );

      if (isDuplicate) {
        console.log("Duplicate message received, not adding to UI.");
        return prevMessages;
      }

      const messageStatus = (data && data.status) ? String(data.status).toLowerCase() : 'pending';

      return [
        {
          id: data && data.db_id ? data.db_id : (Date.now().toString() + Math.random().toString(36).substring(2, 9)),
          db_id: data && data.db_id ? data.db_id : null,
          title: title,
          body: body,
          date: messageDate,
          time: messageTime,
          is_read: (data && data.is_read) || false,
          type: (data && data.type) || 'general',
          rawData: { ...data, status: messageStatus } || {},
        },
        ...prevMessages,
      ];
    });
  }, [t]);

  const fetchMessagesFromSupabase = useCallback(async (doctorUserId) => {
    if (!doctorUserId) {
      console.warn("Doctor user ID is missing, cannot fetch notifications.");
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Fetching notifications for doctor (user ID):", doctorUserId);
    try {
      const { data, error } = await supabase
        .from('doctor_notifications')
        .select('*')
        .eq('doctor_id', doctorUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Fetched notifications:", data);

      const locale = t('locale') || 'uk-UA';

      const formattedMessages = data.map(notif => {
        const rawData = notif.data || {};
        const messageStatus = (rawData.status) ? String(rawData.status).toLowerCase() : 'pending';

        return {
          id: notif.id,
          db_id: notif.id,
          title: notif.title,
          body: notif.body,
          date: new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at)),
          time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at)),
          is_read: notif.is_read,
          type: rawData.type || 'general',
          rawData: { ...rawData, status: messageStatus },
        };
      });

      setMessages(formattedMessages);

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const getDoctorData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user session for doctor:", error.message);
        return;
      }
      if (user) {
        setCurrentDoctorUserId(user.id);
        console.log("Current doctor user ID:", user.id);

        try {
            const { data: doctorProfile, error: profileError } = await supabase
                .from('profile_doctor')
                .select('full_name')
                .eq('user_id', user.id)
                .single();

            if (profileError) {
                console.warn("Error fetching doctor full name from profile_doctor:", profileError.message);
            }

            if (doctorProfile && doctorProfile.full_name) {
                setDoctorFullName(doctorProfile.full_name);
            } else {
                console.log("Doctor profile (full_name) not found in profile_doctor for user ID:", user.id);
                setDoctorFullName(t('doctor'));
            }
        } catch (e) {
            console.error("Unexpected error in fetching doctor full name:", e.message);
            setDoctorFullName(t('doctor'));
        }
      }
    };
    getDoctorData();
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (currentDoctorUserId) {
        fetchMessagesFromSupabase(currentDoctorUserId);
      }
      return () => {};
    }, [currentDoctorUserId, fetchMessagesFromSupabase])
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Сповіщення отримано на передньому плані (Message.js):', notification);
      addNewMessage(notification.request.content);
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Користувач натиснув на сповіщення (Message.js):', response);
      const { title, body, data } = response.notification.request.content;

      addNewMessage(response.notification.request.content);

      if (data && data.type === 'new_booking' && data.patient_name && data.booking_date && data.booking_time_slot) {
        Alert.alert(
          t('new_booking_notification_title'),
          `${t('patient')}: ${data.patient_name || t('not_specified')}\n${t('date')}: ${data.booking_date || t('not_specified')}\n${t('time')}: ${data.booking_time_slot || t('not_specified')}.`,
          [{ text: t('view_details'), onPress: () => {
              console.log("Navigate to booking details for booking_id:", data.booking_id);
            }
          }]
        );
      } else {
          Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    return () => {
      if (notificationReceivedListener.current) {
        notificationReceivedListener.current.remove();
      }
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, [t, addNewMessage]);

  const markAsReadAndStatus = useCallback(async (messageId, newStatus = null) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const updatedRawData = { ...msg.rawData };
          if (newStatus) {
            updatedRawData.status = newStatus;
          }
          return { ...msg, is_read: true, rawData: updatedRawData };
        }
        return msg;
      })
    );

    try {
      const updateObject = { is_read: true };
      if (newStatus) {
        const { data: currentNotification, error: fetchError } = await supabase
          .from('doctor_notifications')
          .select('data')
          .eq('id', messageId)
          .single();

        if (fetchError) {
          console.error("Error fetching current notification data:", fetchError.message);
          throw fetchError;
        }

        const existingRawData = currentNotification.data || {};
        updateObject.data = { ...existingRawData, status: newStatus };
      }

      const { error } = await supabase
        .from('doctor_notifications')
        .update(updateObject)
        .eq('id', messageId);

      if (error) {
        console.error("Error marking notification as read or updating status:", error.message);
        Alert.alert(t('error'), t('failed_to_update_notification_status'));
      } else {
        console.log(`Notification ${messageId} marked as read and status updated to ${newStatus} in DB.`);
      }
    } catch (error) {
      console.error("Network error marking notification as read or updating status:", error.message);
      Alert.alert(t('error'), t('failed_to_update_notification_status'));
    }
  }, [t]);

  const updateBookingStatusAndNotify = useCallback(async (message, newStatus) => {
      if (!message || !message.rawData || !message.rawData.booking_id || !message.rawData.patient_id || !currentDoctorUserId) {
          console.error("Missing essential data for updateBookingStatusAndNotify (initial check):", {
              message: message ? "present" : "missing",
              rawData: message && message.rawData ? "present" : "missing",
              booking_id: message && message.rawData && message.rawData.booking_id ? message.rawData.booking_id : "missing",
              patient_id: message && message.rawData && message.rawData.patient_id ? message.rawData.patient_id : "missing",
              currentDoctorUserId: currentDoctorUserId ? currentDoctorUserId : "missing",
          });
          Alert.alert(t('error'), t('invalid_booking_data_for_update'));
          return;
      }

      const bookingId = message.rawData.booking_id;
      const patientId = message.rawData.patient_id;
      const bookingDate = message.rawData.date;
      const bookingTimeSlot = message.rawData.time;
      const doctorFinalName = doctorFullName || t('doctor');

      if (!bookingDate || !bookingTimeSlot) {
          console.error("Missing booking date or time slot in rawData:", {
              booking_date: bookingDate ? bookingDate : "missing",
              booking_time_slot: bookingTimeSlot ? bookingTimeSlot : "missing",
          });
          Alert.alert(t('error'), t('invalid_booking_data_for_update_date_time'));
          return;
      }

      try {
          console.log(`Оновлення бронювання ${bookingId} на статус: ${newStatus} для пацієнта ${patientId}`);
          const { error: updateError } = await supabase
              .from('patient_bookings')
              .update({ status: newStatus })
              .eq('id', bookingId);

          if (updateError) {
              console.error("Помилка оновлення статусу бронювання в Supabase:", updateError.message);
              throw updateError;
          }

          console.log(`Бронювання ${bookingId} успішно оновлено до ${newStatus}`);

         const edgeFunctionUrl = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/handle-booking-status-update';

          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;

          if (!accessToken) {
            console.error("No access token available for Edge Function call.");
            Alert.alert(t('error'), t('user_not_authenticated_please_login_again'));
            return;
          }

          const payload = {
              booking: {
                  id: bookingId,
                  patient_id: patientId,
                  doctor_id: currentDoctorUserId,
                  status: newStatus,
                  booking_date: bookingDate,
                  booking_time_slot: bookingTimeSlot,
              },
              doctor_name: doctorFinalName,
          };

          console.log("Виклик Edge Function handle-booking-status-update з даними:", payload);

          const response = await fetch(edgeFunctionUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(payload),
          });

          if (!response.ok) {
              let errorText = `HTTP Error: ${response.status} ${response.statusText}`;
              try {
                  const errorData = await response.json();
                  if (errorData && errorData.error) {
                      errorText = errorData.error;
                  } else {
                      errorText = JSON.stringify(errorData);
                  }
              } catch (parseError) {
                  console.warn("Не вдалося розпарсити відповідь помилки від Edge Function (можливо, не JSON):", parseError);
              }
              console.error('Помилка виклику Edge Function (відповідь не ОК):', errorText);
              Alert.alert(t('error'), `${t('failed_to_send_notification')}: ${errorText}`);
              return;
          }

          console.log('Edge Function викликана успішно. Відповідь:', await response.json());
          Alert.alert(t('success'), newStatus === 'confirmed' ? t('booking_confirmed_successfully_message') : t('booking_rejected_successfully_message'));

          if (message.db_id) {
            await markAsReadAndStatus(message.db_id, newStatus);
          } else {
            console.warn("Message does not have db_id, cannot update status in doctor_notifications table.");
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === message.id ? { ...msg, is_read: true, rawData: { ...msg.rawData, status: newStatus } } : msg
              )
            );
          }
      } catch (error) {
          console.error("Помилка обробки бронювання (загальна помилка fetch або DB update):", error.message);
          Alert.alert(t('error'), `${t('failed_to_process_booking')}: ${error.message}`);
      }
  }, [t, currentDoctorUserId, doctorFullName, markAsReadAndStatus]);


  const handleConfirmBooking = useCallback(async (message) => {
      Alert.alert(
          t('confirm_booking_title'),
          t('confirm_booking_message_doctor'),
          [
              { text: t('cancel'), style: 'cancel' },
              { text: t('confirm'), onPress: () => updateBookingStatusAndNotify(message, 'confirmed') }
          ]
      );
  }, [t, updateBookingStatusAndNotify]);

  const handleRejectBooking = useCallback(async (message) => {
      Alert.alert(
          t('reject_booking_title'),
          t('reject_booking_message_doctor'),
          [
              { text: t('cancel'), style: 'cancel' },
              { text: t('reject'), onPress: () => updateBookingStatusAndNotify(message, 'rejected') }
          ]
      );
  }, [t, updateBookingStatusAndNotify]);


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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#000" /> 
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("messages_screen.header_title")}
        </Text>
        <View>
          <Icon width={moderateScale(50)} height={moderateScale(50)} /> 
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messageList}>
        {messages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <Text style={styles.emptyMessagesText}>{t("messages_screen.no_messages")}</Text>
            <Text style={styles.emptyMessagesSubText}>{t("messages_screen.waiting_for_bookings")}</Text>
          </View>
        ) : (
          messages.map((message) => {
            const isConfirmed = message.rawData.status === 'confirmed';
            const isRejected = message.rawData.status === 'rejected';

            const messageCardStyle = [
              styles.messageCard,
              (message.is_read && message.type !== 'new_booking') && styles.messageCardRead,
              isConfirmed && styles.messageCardConfirmed,
              isRejected && styles.messageCardRejected,
            ];

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.dateAndTimestamp}>
                  <Text style={styles.dateText}>{message.date}</Text>
                  <Text style={styles.timestampText}>{message.time}</Text>
                </View>
                <View style={messageCardStyle}>
                  <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                  <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                  {message.type === 'new_booking' ? (
                      message.rawData.status === 'pending' ? (
                          <View style={styles.bookingActionButtons}>
                              <TouchableOpacity
                                  style={styles.confirmBookingButton}
                                  onPress={() => handleConfirmBooking(message)}
                              >
                                  <Text style={styles.confirmBookingButtonText}>{t('confirm_booking')}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                  style={styles.rejectBookingButton}
                                  onPress={() => handleRejectBooking(message)}
                              >
                                  <Text style={styles.rejectBookingButtonText}>{t('reject_booking')}</Text>
                              </TouchableOpacity>
                          </View>
                      ) : (
                          <Text style={[
                              styles.statusText,
                              isConfirmed ? styles.confirmedText : styles.rejectedText
                          ]}>
                              {isConfirmed ? t('confirmed_read') : t('rejected_read')}
                          </Text>
                      )
                  ) : (
                      !message.is_read ? (
                          <TouchableOpacity
                              style={styles.markAsReadButton}
                              onPress={() => message.db_id && markAsReadAndStatus(message.db_id)}
                          >
                              <Text style={styles.markAsReadButtonText}>{t('mark_as_read')}</Text>
                          </TouchableOpacity>
                      ) : (
                          <Text style={styles.readStatusText}>{t('read')}</Text>
                      )
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : verticalScale(50), // Адаптовано для Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: verticalScale(10), // Адаптовано розмір
    fontSize: moderateScale(16), // Адаптовано розмір
    color: '#333',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(15), // Адаптовано розмір
    paddingVertical: verticalScale(10), // Адаптовано розмір
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(25), // Адаптовано розмір
    width: moderateScale(48), // Адаптовано розмір
    height: moderateScale(48), // Адаптовано розмір
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: moderateScale(18), // Адаптовано розмір
    fontFamily: "Mont-Bold",
    color: "#333",
  },
  messageList: {
    paddingVertical: verticalScale(20), // Адаптовано розмір
    paddingHorizontal: scale(15), // Адаптовано розмір
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: verticalScale(20), // Адаптовано розмір
  },
  dateAndTimestamp: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10), // Адаптовано розмір
    paddingHorizontal: scale(5), // Адаптовано розмір
  },
  dateText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    fontWeight: "bold",
    color: "#666",
  },
  timestampText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    color: "#666",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(15), // Адаптовано розмір
    padding: moderateScale(15), // Адаптовано розмір
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  messageCardRead: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  messageCardConfirmed: {
    backgroundColor: '#E6FFE6',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  messageCardRejected: {
    backgroundColor: '#FFEEEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: moderateScale(16), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
    marginBottom: verticalScale(5), // Адаптовано розмір
    color: "#333",
  },
  cardText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-Regular",
    color: "#555",
    marginBottom: verticalScale(10), // Адаптовано розмір
  },
  bookingInfo: {
    marginTop: verticalScale(5), // Адаптовано розмір
    marginBottom: verticalScale(10), // Адаптовано розмір
    paddingVertical: verticalScale(5), // Адаптовано розмір
    paddingHorizontal: scale(8), // Адаптовано розмір
    backgroundColor: '#F0F8FF',
    borderRadius: moderateScale(8), // Адаптовано розмір
    borderLeftWidth: 3,
    borderLeftColor: '#0EB3EB',
  },
  bookingDetailsText: {
    fontSize: moderateScale(13), // Адаптовано розмір
    fontFamily: "Mont-Regular",
    color: "#444",
    marginBottom: verticalScale(2), // Адаптовано розмір
  },
  bookingActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: verticalScale(10), // Адаптовано розмір
    gap: scale(10), // Адаптовано розмір (якщо підтримується)
    flexWrap: 'wrap', // <-- ДОДАНО! Дозволяє кнопкам переноситися на наступний рядок
  },
  confirmBookingButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: verticalScale(10), // Адаптовано розмір
    paddingHorizontal: scale(15), // Адаптовано розмір
    borderRadius: moderateScale(25), // Адаптовано розмір
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmBookingButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
  },
  rejectBookingButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: verticalScale(10), // Адаптовано розмір
    paddingHorizontal: scale(15), // Адаптовано розмір
    borderRadius: moderateScale(25), // Адаптовано розмір
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rejectBookingButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
  },
  markAsReadButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: verticalScale(8), // Адаптовано розмір
    paddingHorizontal: scale(15), // Адаптовано розмір
    borderRadius: moderateScale(20), // Адаптовано розмір
    alignSelf: 'flex-start',
    marginTop: verticalScale(10), // Адаптовано розмір
    opacity: 0.8,
  },
  markAsReadButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
  },
  statusText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
    marginTop: verticalScale(10), // Адаптовано розмір
    alignSelf: 'flex-start',
    paddingVertical: verticalScale(5), // Адаптовано розмір
    paddingHorizontal: scale(10), // Адаптовано розмір
    borderRadius: moderateScale(10), // Адаптовано розмір
    borderWidth: 1,
  },
  confirmedText: {
    color: '#2E7D32',
    backgroundColor: '#E6FFE6',
    borderColor: '#2E7D32',
  },
  rejectedText: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
    borderColor: '#D32F2F',
  },
  readStatusText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
    marginTop: verticalScale(10), // Адаптовано розмір
    alignSelf: 'flex-start',
    paddingVertical: verticalScale(5), // Адаптовано розмір
    paddingHorizontal: scale(10), // Адаптовано розмір
    borderRadius: moderateScale(10), // Адаптовано розмір
    backgroundColor: '#E0E0E0',
    color: '#757575',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(50), // Адаптовано розмір
  },
  emptyMessagesText: {
    fontSize: moderateScale(18), // Адаптовано розмір
    fontFamily: "Mont-SemiBold",
    color: "#666",
    marginBottom: verticalScale(10), // Адаптовано розмір
  },
  emptyMessagesSubText: {
    fontSize: moderateScale(14), // Адаптовано розмір
    fontFamily: "Mont-Regular",
    color: "#888",
    textAlign: 'center',
    paddingHorizontal: scale(20), // Адаптовано розмір
  },
});