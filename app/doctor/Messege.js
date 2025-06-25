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
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

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

      if (data && data.type === 'new_booking' && data.patient_name && (data.booking_date || data.date) && (data.booking_time_slot || data.time)) {
        Alert.alert(
          t('new_booking_notification_title'),
          `${t('patient')}: ${data.patient_name || t('not_specified')}\n${t('date')}: ${data.booking_date || data.date || t('not_specified')}\n${t('time')}: ${data.booking_time_slot || data.time || t('not_specified')}.`,
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
      // ОНОВЛЕНО: Надійний запасний варіант для отримання дати та часу
      const bookingDate = message.rawData.booking_date || message.rawData.date; 
      const bookingTimeSlot = message.rawData.booking_time_slot || message.rawData.time;
      const doctorFinalName = doctorFullName || t('doctor');
      const bookingAmount = message.rawData.amount; // Отримуємо суму з rawData

      // ОНОВЛЕНО: Перевіряємо, чи є bookingDate та bookingTimeSlot дійсними рядками
      if (typeof bookingDate !== 'string' || bookingDate.trim() === '' || typeof bookingTimeSlot !== 'string' || bookingTimeSlot.trim() === '') {
          console.error("Missing or invalid booking date or time slot in rawData. Expected YYYY-MM-DD and HH:MM strings (from booking_date/booking_time_slot or date/time):", {
              booking_date: bookingDate,
              booking_time_slot: bookingTimeSlot,
              rawData: message.rawData // Додано для повнішої діагностики
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

        // --- НОВА ЛОГІКА: Зняття балів з лікаря при відхиленні консультації ---
          if (newStatus === 'rejected') {
              console.log(`Знімаємо 50 балів з лікаря ${currentDoctorUserId} через відхилення бронювання.`);
              const { data: doctorProfile, error: fetchProfileError } = await supabase
                  .from('profile_doctor') // Використовуємо таблицю 'profile_doctor'
                  .select('doctor_points') // Вибираємо колонку 'doctor_points'
                  .eq('user_id', currentDoctorUserId) // Фільтруємо за user_id поточного лікаря
                  .single();

              if (fetchProfileError) {
                  console.error("Помилка при отриманні балів лікаря:", fetchProfileError.message);
              } else if (doctorProfile) {
                  const newPoints = Math.max(0, (doctorProfile.doctor_points || 0) - 50); // Використовуємо doctor_points
                  const { error: updatePointsError } = await supabase
                      .from('profile_doctor') // Оновлюємо таблицю 'profile_doctor'
                      .update({ doctor_points: newPoints }) // Оновлюємо колонку 'doctor_points'
                      .eq('user_id', currentDoctorUserId);

                  if (updatePointsError) {
                      console.error("Помилка при оновленні балів лікаря:", updatePointsError.message);
                  } else {
                      console.log(`Бали лікаря ${currentDoctorUserId} оновлено до ${newPoints}`);
                  }
              }
          }
          // --- КІНЕЦЬ НОВОЇ ЛОГІКИ ---

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
                  booking_date: bookingDate, // Використовуємо booking_date (або date) з rawData
                  booking_time_slot: bookingTimeSlot, // Використовуємо booking_time_slot (або time) з rawData
                  amount: bookingAmount,     // Додано поле amount
                  is_paid: false,            // Додано поле is_paid зі значенням false
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
            const isNewBooking = message.type === 'new_booking';
            const isPendingBooking = isNewBooking && message.rawData.status === 'pending';

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.dateAndTimestamp}>
                  <Text style={styles.dateText}>{message.date}</Text>
                  <Text style={styles.timestampText}>{message.time}</Text>
                </View>
                <LinearGradient
                  colors={
                    isPendingBooking
                      ? ['#FFFFFF', '#F0F8FF']
                      : isConfirmed
                      ? ['#E6FFE6', '#D4FAD4']
                      : isRejected
                      ? ['#FFEEEE', '#FAD4D4']
                      : message.is_read
                      ? ['#F8F8F8', '#ECECEC']
                      : ['#FFFFFF', '#FDFDFD']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.messageCard,
                    isConfirmed && styles.messageCardConfirmedBorder,
                    isRejected && styles.messageCardRejectedBorder,
                    !message.is_read && styles.messageCardUnread,
                  ]}
                >
                  <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                  <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                  {isNewBooking ? (
                      isPendingBooking ? (
                          <View style={styles.bookingActionButtons}>
                              <TouchableOpacity
                                  onPress={() => handleConfirmBooking(message)}
                                  style={styles.actionButtonContainer}
                              >
                                  <LinearGradient
                                      colors={['#4CAF50', '#2E7D32']}
                                      style={styles.actionButtonGradient}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 1, y: 0 }}
                                  >
                                      <Text style={styles.actionButtonText}>{t('confirm_booking')}</Text>
                                  </LinearGradient>
                              </TouchableOpacity>
                              <TouchableOpacity
                                  onPress={() => handleRejectBooking(message)}
                                  style={styles.actionButtonContainer}
                              >
                                  <LinearGradient
                                      colors={['#D32F2F', '#B71C1C']}
                                      style={styles.actionButtonGradient}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 1, y: 0 }}
                                  >
                                      <Text style={styles.actionButtonText}>{t('reject_booking')}</Text>
                                  </LinearGradient>
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
                              onPress={() => message.db_id && markAsReadAndStatus(message.db_id)}
                              style={styles.actionButtonContainer}
                          >
                              <LinearGradient
                                  colors={['#0EB3EB', '#0A8BA6']}
                                  style={styles.actionButtonGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                               >
                                  <Text style={styles.actionButtonText}>{t('mark_as_read')}</Text>
                              </LinearGradient>
                          </TouchableOpacity>
                      ) : (
                          <Text style={styles.readStatusText}>{t('read')}</Text>
                      )
                  )}
                </LinearGradient>
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
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : verticalScale(50),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: '#555',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(15),
   
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: moderateScale(25),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",

  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: "Mont-Bold",
    color: "#333333",
  },
  messageList: {
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(15),
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: verticalScale(20),
  },
  dateAndTimestamp: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(8),
  },
  dateText: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: "#777",
  },
  timestampText: {
    fontSize: moderateScale(13),
    color: "#777",
  },
  messageCard: {
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    overflow: 'hidden',
  },
  messageCardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: '#0EB3EB',
    paddingLeft: moderateScale(13),
  },
  messageCardConfirmedBorder: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  messageCardRejectedBorder: {
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  cardTitle: {
    fontSize: moderateScale(17),
    fontFamily: "Mont-SemiBold",
    marginBottom: verticalScale(8),
    color: "#333",
  },
  cardText: {
    fontSize: moderateScale(14.5),
    fontFamily: "Mont-Regular",
    color: "#555",
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(22),
  },
  bookingActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(15),
    flexWrap: 'wrap',
    gap: scale(10),
  },
  actionButtonContainer: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
    flex: 1,
    minWidth: scale(120),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14.5),
    fontFamily: "Mont-SemiBold",
  },
  statusText: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
    marginTop: verticalScale(15),
    alignSelf: 'flex-start',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  confirmedText: {
    color: '#2E7D32',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  rejectedText: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    color: '#D32F2F',
    borderColor: '#D32F2F',
  },
  readStatusText: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
    marginTop: verticalScale(15),
    alignSelf: 'flex-start',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#E0E0E0',
    color: '#757575',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(80),
  },
  emptyMessagesText: {
    fontSize: moderateScale(20),
    fontFamily: "Mont-SemiBold",
    color: "#555",
    marginBottom: verticalScale(15),
  },
  emptyMessagesSubText: {
    fontSize: moderateScale(15),
    fontFamily: "Mont-Regular",
    color: "#777",
    textAlign: 'center',
    paddingHorizontal: scale(30),
    lineHeight: moderateScale(24),
  },
});
