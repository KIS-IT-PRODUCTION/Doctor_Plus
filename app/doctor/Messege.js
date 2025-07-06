import "react-native-url-polyfill/auto";
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
  RefreshControl,
  TextInput,
  Linking,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { parseISO, format, isFuture, isPast } from 'date-fns'; // Імпорт date-fns
import { uk, enUS } from 'date-fns/locale'; // Імпорт локалей для date-fns
import ConsultationCompletionModal from '../../components/ConsultationCompletionModal'; // Переконайтеся, що шлях правильний

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Message() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // Додано i18n для вибору локалі date-fns

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t('doctor'));
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // Стан для модального вікна
  const [selectedMessageForCompletion, setSelectedMessageForCompletion] = useState(null); // Повідомлення для модального вікна

  const notificationReceivedListener = useRef(null);
  const notificationResponseListener = useRef(null);
  const locale = i18n.language === 'uk' ? uk : enUS; // Визначення локалі для date-fns

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addNewMessage = useCallback((notificationContent) => {
    const { title, body, data } = notificationContent;
    const now = new Date();
    // Використовуємо date-fns для форматування
    const messageDate = format(now, 'PPP', { locale });
    const messageTime = format(now, 'p', { locale });

    setMessages(prevMessages => {
      const uniqueMessageId = data && data.db_id ? data.db_id : (Date.now().toString() + Math.random().toString(36).substring(2, 9));

      const isDuplicate = prevMessages.some(msg =>
        msg.id === uniqueMessageId
      );

      if (isDuplicate) {
        console.log("Duplicate message received, not adding to UI.");
        return prevMessages;
      }

      const messageStatus = (data && data.payment_status) ? String(data.payment_status).toLowerCase() : ((data && data.status) ? String(data.status).toLowerCase() : 'pending');
      const messageType = (data && data.type) || 'general';

      return [
        {
          id: uniqueMessageId,
          db_id: data && data.db_id ? data.db_id : null,
          title: title,
          body: body,
          date: messageDate,
          time: messageTime,
          is_read: (data && data.is_read) || false,
          type: messageType,
          rawData: {
            ...data,
            status: messageStatus,
            // Додані поля для ConsultationCompletionModal
            consultation_conducted: data.consultation_conducted,
            consultation_started_on_time: data.consultation_started_on_time,
            doctor_feedback: data.doctor_feedback,
          } || {},
          meetLinkInput: data && data.meet_link ? data.meet_link : '',
        },
        ...prevMessages,
      ];
    });
  }, [t, locale]); // Додано locale в залежності

  const fetchMessagesFromSupabase = useCallback(async (doctorUserId, isRefreshing = false) => {
    if (!doctorUserId) {
      console.warn("Doctor user ID is missing, cannot fetch notifications.");
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
      return;
    }

    if (!isRefreshing) setLoading(true);
    else setRefreshing(false);

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

      const formattedMessages = data.map(notif => {
        const rawData = notif.data || {};
        const messageStatus = (rawData.payment_status) ? String(rawData.payment_status).toLowerCase() : ((rawData.status) ? String(rawData.status).toLowerCase() : 'pending');
        const messageType = rawData.type || 'general';

        let formattedDate = '';
        let formattedTime = '';
        try {
          const createdAtDate = parseISO(notif.created_at); // Використовуємо parseISO
          formattedDate = format(createdAtDate, 'PPP', { locale });
          formattedTime = format(createdAtDate, 'p', { locale });
        } catch (dateError) {
          console.error("Error parsing created_at date with date-fns:", notif.created_at, dateError);
          // Повернення до оригінального форматування, якщо date-fns не справляється
          formattedDate = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at));
          formattedTime = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at));
        }

        return {
          id: notif.id,
          db_id: notif.id,
          title: notif.title,
          body: notif.body,
          date: formattedDate,
          time: formattedTime,
          is_read: notif.is_read,
          type: messageType,
          rawData: {
            ...rawData,
            status: messageStatus,
            // Додані поля для ConsultationCompletionModal
            consultation_conducted: rawData.consultation_conducted,
            consultation_started_on_time: rawData.consultation_started_on_time,
            doctor_feedback: rawData.doctor_feedback,
          },
          meetLinkInput: rawData.meet_link ? rawData.meet_link : '',
        };
      });

      setMessages(formattedMessages);

      await Notifications.setBadgeCountAsync(0);
      console.log('App badge count reset to 0 after fetching messages.');

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  }, [t, i18n.language, locale]); // Додано locale та i18n.language в залежності

  const onRefresh = useCallback(() => {
    if (currentDoctorUserId) {
      fetchMessagesFromSupabase(currentDoctorUserId, true);
    } else {
      setRefreshing(false);
    }
  }, [currentDoctorUserId, fetchMessagesFromSupabase]);

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
      const resetBadgeOnFocus = async () => {
        try {
            await Notifications.setBadgeCountAsync(0);
            console.log('App badge count reset to 0 on screen focus.');
        } catch (error) {
            console.error('Failed to reset badge count on focus:', error);
        }
      };
      resetBadgeOnFocus();

      return () => {
      };
    }, [currentDoctorUserId, fetchMessagesFromSupabase])
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground (Message.js):', notification);
      const notificationContentWithDbId = {
        ...notification.request.content,
        data: {
          ...notification.request.content.data,
          db_id: notification.request.content.data?.id
        }
      };
      addNewMessage(notificationContentWithDbId);
      const newBadgeCount = (notification.request.content.badge !== undefined && notification.request.content.badge !== null)
        ? notification.request.content.badge
        : messages.filter(msg => !msg.is_read).length + 1;
      Notifications.setBadgeCountAsync(newBadgeCount).catch(e => console.error("Error setting badge on received:", e));
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User clicked on notification (Message.js):', response);
      const { title, body, data } = response.notification.request.content;

      const notificationContentWithDbId = {
        ...response.notification.request.content,
        data: {
          ...response.notification.request.content.data,
          db_id: response.notification.request.content.data?.id
        }
      };
      addNewMessage(notificationContentWithDbId);

      Notifications.setBadgeCountAsync(0).catch(e => console.error("Error setting badge on response:", e));


      if (data && data.type === 'new_booking' && data.booking_id) {
        console.log("Navigating to BookingDetails for booking_id:", data.booking_id);
        Alert.alert(
          t('new_booking_notification_title'),
          `${t('patient')}: ${data.patient_name || t('not_specified')}\n${t('date')}: ${data.booking_date || data.date || t('not_specified')}\n${t('time')}: ${data.booking_time_slot || data.time || t('not_specified')}.`,
          [{ text: t('view_details'), onPress: () => {
              navigation.navigate('BookingDetails', { bookingId: data.booking_id, patientId: data.patient_id, doctorId: data.doctor_id });
            }
          }]
        );
      } else if (data && (data.type === 'payment_received' || data.type === 'payment_update_doctor')) {
        Alert.alert(
          title || t('payment_notification_title_default'),
          `${t('payment_status')}: ${data.payment_status || t('not_specified')}\n${t('amount')}: ${data.amount || 'N/A'} ${data.currency || ''}\n${t('patient')}: ${data.patient_name || t('not_specified')}\n${t('date')}: ${data.booking_date || data.date || t('not_specified')}\n${t('time')}: ${data.booking_time_slot || data.time || t('not_specified')}.`,
          [
            { text: t('ok') },
            data.meet_link ? {
              text: t('join_meet'),
              onPress: () => Linking.openURL(data.meet_link)
            } : null
          ].filter(Boolean)
        );
      }
      else {
          Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    return () => {
      if (notificationReceivedListener.current) {
        Notifications.removeNotificationSubscription(notificationReceivedListener.current);
      }
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, [t, addNewMessage, navigation, messages.length]);

  const markAsReadAndStatus = useCallback(async (messageId, newStatus = null, isPaymentNotification = false) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const updatedRawData = { ...msg.rawData };
          if (newStatus) {
            if (updatedRawData.type === 'payment_received' || updatedRawData.type === 'payment_update_doctor') {
                updatedRawData.payment_status = newStatus;
            } else {
                updatedRawData.status = newStatus;
            }
          }
          const shouldMarkAsRead = !(isPaymentNotification && !updatedRawData.meet_link);

          return { ...msg, is_read: shouldMarkAsRead, rawData: updatedRawData };
        }
        return msg;
      })
    );

    try {
      const { data: currentNotification, error: fetchError } = await supabase
        .from('doctor_notifications')
        .select('data, is_read')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error("Error fetching current notification data:", fetchError.message);
        throw fetchError;
      }

      const existingRawData = currentNotification.data || {};
      const updatedDataForDB = { ...existingRawData };

      const updateObject = {};

      if (newStatus) {
        if (existingRawData.type === 'payment_received' || existingRawData.type === 'payment_update_doctor') {
            updatedDataForDB.payment_status = newStatus;
        } else {
            updatedDataForDB.status = newStatus;
        }
        updateObject.data = updatedDataForDB;
      }

      if (isPaymentNotification && !existingRawData.meet_link) {
          updateObject.is_read = false;
      } else {
          updateObject.is_read = true;
      }

      const { error } = await supabase
        .from('doctor_notifications')
        .update(updateObject)
        .eq('id', messageId);

      if (error) {
        console.error("Error marking notification as read or updating status in DB:", error.message);
        Alert.alert(t('error'), t('failed_to_update_notification_status'));
      } else {
        console.log(`Notification ${messageId} marked as read (${updateObject.is_read}) and status updated to ${newStatus || 'N/A'} in DB.`);
        if (updateObject.is_read && currentDoctorUserId) {
            const { count: unreadCountAfterRead, error: countError } = await supabase
              .from('doctor_notifications')
              .select('*', { count: 'exact', head: true })
              .eq('doctor_id', currentDoctorUserId)
              .eq('is_read', false);

            if (!countError && unreadCountAfterRead !== null) {
                await Notifications.setBadgeCountAsync(unreadCountAfterRead);
                console.log(`Badge count updated to ${unreadCountAfterRead} after marking message as read.`);
            } else {
                console.error("Error re-fetching unread count after marking message as read:", countError?.message);
            }
        }
      }
    } catch (error) {
      console.error("Network error marking notification as read or updating status:", error.message);
      Alert.alert(t('error'), t('failed_to_update_notification_status'));
    }
  }, [t, currentDoctorUserId]);

  const markMessageAsRead = useCallback(async (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );

    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        console.error("Error marking message as read in DB:", error.message);
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, is_read: false } : msg
          )
        );
        Alert.alert(t('error'), t('failed_to_update_notification_status'));
      } else {
        console.log(`Message ${messageId} marked as read in DB.`);
        if (currentDoctorUserId) {
            const { count: unreadCountAfterRead, error: countError } = await supabase
              .from('doctor_notifications')
              .select('*', { count: 'exact', head: true })
              .eq('doctor_id', currentDoctorUserId)
              .eq('is_read', false);

            if (!countError && unreadCountAfterRead !== null) {
                await Notifications.setBadgeCountAsync(unreadCountAfterRead);
                console.log(`Badge count updated to ${unreadCountAfterRead} after marking a single message as read.`);
            } else {
                console.error("Error re-fetching unread count after marking single message as read:", countError?.message);
            }
        }
      }
    } catch (error) {
      console.error("Network error marking message as read:", error.message);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        )
      )
      Alert.alert(t('error'), t('failed_to_update_notification_status'));
    }
  }, [t, currentDoctorUserId]);

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
      const bookingDate = message.rawData.booking_date || message.rawData.date;
      const bookingTimeSlot = message.rawData.booking_time_slot || message.rawData.time;
      const doctorFinalName = doctorFullName || t('doctor');

      if (typeof bookingDate !== 'string' || bookingDate.trim() === '' || typeof bookingTimeSlot !== 'string' || bookingTimeSlot.trim() === '') {
          console.error("Missing or invalid booking date or time slot in rawData.");
          Alert.alert(t('error'), t('invalid_booking_data_for_update_date_time'));
          return;
      }

      try {
          console.log(`Updating booking ${bookingId} to status: ${newStatus} for patient ${patientId}`);
          const { error: updateError } = await supabase
              .from('patient_bookings')
              .update({ status: newStatus })
              .eq('id', bookingId);

          if (updateError) {
              console.error("Error updating booking status in Supabase:", updateError.message);
              throw updateError;
          }

          console.log(`Booking ${bookingId} successfully updated to ${newStatus}`);

          if (newStatus === 'rejected') {
              console.log(`Deducting 50 points from doctor ${currentDoctorUserId} due to rejected booking.`);
              const { data: doctorProfile, error: fetchProfileError } = await supabase
                  .from('profile_doctor')
                  .select('doctor_points')
                  .eq('user_id', currentDoctorUserId)
                  .single();

              if (fetchProfileError) {
                  console.error("Error fetching doctor points:", fetchProfileError.message);
              } else if (doctorProfile) {
                  const newPoints = Math.max(0, (doctorProfile.doctor_points || 0) - 50);
                  const { error: updatePointsError } = await supabase
                      .from('profile_doctor')
                      .update({ doctor_points: newPoints })
                      .eq('user_id', currentDoctorUserId);

                  if (updatePointsError) {
                      console.error("Error updating doctor points:", updatePointsError.message);
                  } else {
                      console.log(`Doctor points for ${currentDoctorUserId} updated to ${newPoints}`);
                  }
              }
          }

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
                  amount: 0,
                  is_paid: false,
              },
              doctor_name: doctorFinalName,
          };

          if (newStatus === 'confirmed') {
              const { data: bookingDetails, error: bookingFetchError } = await supabase
                  .from('patient_bookings')
                  .select('amount, is_paid, meet_link')
                  .eq('id', bookingId)
                  .single();

              if (bookingFetchError) {
                  console.error("Error getting booking amount, is_paid, or meet_link status:", bookingFetchError.message);
                  Alert.alert(t('error'), t('failed_to_fetch_booking_details'));
                  return;
              }
              if (bookingDetails) {
                  payload.booking.amount = bookingDetails.amount || 0;
                  payload.booking.is_paid = bookingDetails.is_paid || false;
                  payload.booking.meet_link = bookingDetails.meet_link || null;
              } else {
                  console.warn("Booking amount/is_paid/meet_link not found, setting amount to 0 and is_paid to false for Edge Function.");
                  payload.booking.amount = 0;
                  payload.booking.is_paid = false;
                  payload.booking.meet_link = null;
              }
          }

          console.log("Calling Edge Function handle-booking-status-update with data:", JSON.stringify(payload, null, 2));

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
                  console.warn("Failed to parse error response from Edge Function (possibly not JSON):", parseError);
              }
              console.error('Error calling Edge Function (response not OK):', errorText);
              Alert.alert(t('error'), `${t('failed_to_send_notification')}: ${errorText}`);
              return;
          }

          console.log('Edge Function called successfully. Response:', await response.json());
          Alert.alert(t('success'), newStatus === 'confirmed' ? t('booking_confirmed_successfully_message') : t('booking_rejected_successfully_message'));

          if (message.db_id) {
            await markAsReadAndStatus(message.db_id, newStatus, false);
          } else {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === message.id ? { ...msg, is_read: true, rawData: { ...msg.rawData, status: newStatus } } : msg
              )
            );
          }
      } catch (error) {
          console.error("Error processing booking (general fetch or DB update error):", error.message);
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

  const handleMeetLinkInputChange = useCallback((messageId, text) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, meetLinkInput: text } : msg
      )
    );
  }, []);

  const handleSendMeetLink = useCallback(async (message) => {
    const meetLink = message.meetLinkInput;

    if (!meetLink || meetLink.trim() === '') {
      Alert.alert(t('error'), t('meet_link_empty_error'));
      return;
    }
    if (!meetLink.startsWith('http://') && !meetLink.startsWith('https://')) {
        Alert.alert(t('error'), t('invalid_meet_link_format'));
        return;
    }

    if (!message.rawData || !message.rawData.booking_id || !message.rawData.patient_id || !currentDoctorUserId || !message.db_id) {
        console.error("Missing essential data for sending meet link:", {
            rawData: message.rawData,
            booking_id: message.rawData?.booking_id,
            patient_id: message.rawData?.patient_id,
            currentDoctorUserId: currentDoctorUserId,
            message_db_id: message.db_id
        });
        Alert.alert(t('error'), t('invalid_booking_data_for_meet_link'));
        return;
    }

    const bookingId = message.rawData.booking_id;
    const patientId = message.rawData.patient_id;
    const bookingDate = message.rawData.booking_date || message.rawData.date;
    const bookingTimeSlot = message.rawData.booking_time_slot || message.rawData.time;
    const doctorFinalName = doctorFullName || t('doctor');
    const notificationDbId = message.db_id; // Використовуємо message.db_id для оновлення сповіщення в doctor_notifications

    try {
        const { error: updateBookingError } = await supabase
            .from('patient_bookings')
            .update({ meet_link: meetLink })
            .eq('id', bookingId);

        if (updateBookingError) {
            console.error("Error updating meet_link in patient_bookings:", updateBookingError.message);
            throw updateBookingError;
        }
        console.log(`Meet link for booking ${bookingId} updated in patient_bookings.`);

        const { data: currentNotificationData, error: fetchNotifError } = await supabase
            .from('doctor_notifications')
            .select('data')
            .eq('id', notificationDbId)
            .single();

        if (fetchNotifError) {
            console.warn("Warning: Error fetching current notification data from doctor_notifications, proceeding without updating notification's rawData:", fetchNotifError.message);
        }

        let updatedRawDataForNotification = currentNotificationData?.data || {};
        updatedRawDataForNotification.meet_link = meetLink;

        const { error: updateNotifError } = await supabase
            .from('doctor_notifications')
            .update({
                data: updatedRawDataForNotification,
                is_read: true
            })
            .eq('id', notificationDbId);

        if (updateNotifError) {
            console.error("Error updating meet_link in doctor_notifications:", updateNotifError.message);
            Alert.alert(t('error'), t('failed_to_save_meet_link_in_notification_history'));
        } else {
            console.log(`Meet link for notification ${notificationDbId} updated in doctor_notifications.`);
        }

        const sendMeetLinkUrl = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification';
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
            Alert.alert(t('error'), t('user_not_authenticated_please_login_again'));
            return;
        }

        const meetLinkPayload = {
            type: 'meet_link_update',
            patient_id: patientId,
            booking_id: bookingId,
            meet_link: meetLink,
            doctor_name: doctorFinalName,
            booking_date: bookingDate,
            booking_time_slot: bookingTimeSlot,
        };

        console.log("Calling send-meet-link-notification with data:", JSON.stringify(meetLinkPayload, null, 2));

        const response = await fetch(sendMeetLinkUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(meetLinkPayload),
        });

        if (!response.ok) {
            let errorText = `HTTP Error sending meet link: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorText = errorData.error;
                } else {
                    errorText = JSON.stringify(errorData);
                }
            } catch (parseError) {
                console.warn("Failed to parse error response from meet link Edge Function (possibly not JSON):", parseError);
            }
            console.error('Error calling send-meet-link-notification Edge Function:', errorText);
            Alert.alert(t('error'), `${t('failed_to_send_meet_link')}: ${errorText}`);
            return;
        }

        console.log('Meet link notification sent successfully. Response:', await response.json());
        Alert.alert(t('success'), t('meet_link_sent_successfully'));

        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === message.id
                    ? {
                        ...msg,
                        meetLinkInput: meetLink,
                        rawData: {
                            ...msg.rawData,
                            meet_link: meetLink
                        },
                        is_read: true
                    }
                    : msg
            )
        );
        if (currentDoctorUserId) {
            const { count: unreadCountAfterSend, error: countError } = await supabase
              .from('doctor_notifications')
              .select('*', { count: 'exact', head: true })
              .eq('doctor_id', currentDoctorUserId)
              .eq('is_read', false);

            if (!countError && unreadCountAfterSend !== null) {
                await Notifications.setBadgeCountAsync(unreadCountAfterSend);
                console.log(`Badge count updated to ${unreadCountAfterSend} after sending meet link.`);
            } else {
                console.error("Error re-fetching unread count after sending meet link:", countError?.message);
            }
        }
    } catch (error) {
        console.error("Error sending meet link:", error.message);
        Alert.alert(t('error'), `${t('failed_to_send_meet_link')}: ${error.message}`);
    }
  }, [t, currentDoctorUserId, doctorFullName]);

  const handleCompleteConsultation = useCallback((message) => {
    // Відкриваємо модальне вікно і передаємо дані
    setSelectedMessageForCompletion(message);
    setIsModalVisible(true);
  }, []);

  const handleModalSubmit = useCallback(async ({ consultationConducted, consultationStartedOnTime, doctorFeedback }) => {
    if (!selectedMessageForCompletion) return;

    const message = selectedMessageForCompletion;
    const { patient_id: patientId, booking_id: bookingId, booking_date: bookingDate, booking_time_slot: bookingTimeSlot } = message.rawData;
    const doctorFinalName = doctorFullName || t('doctor');

    if (!bookingId || !patientId || !doctorFinalName || !bookingDate || !bookingTimeSlot) {
      console.error("Відсутні дані для завершення консультації:", {
        bookingId,
        patientId,
        doctorFinalName,
        bookingDate,
        bookingTimeSlot
      });
      Alert.alert(t('error'), t('missing_consultation_details'));
      return;
    }

    setLoadingCompletion(true);
    try {
      const completeConsultationUrl = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification';
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        Alert.alert(t('error'), t('user_not_authenticated_please_login_again'));
        return;
      }

      const completeConsultationPayload = {
        type: 'consultation_completed',
        booking_id: bookingId,
        patient_id: patientId,
        doctor_name: doctorFinalName,
        booking_date: bookingDate,
        booking_time_slot: bookingTimeSlot,
        // НОВІ ДАНІ З МОДАЛЬНОГО ВІКНА:
        consultation_conducted: consultationConducted,
        consultation_started_on_time: consultationStartedOnTime,
        doctor_feedback: doctorFeedback,
      };

      console.log("Calling send-meet-link-notification (consultation_completed) with data:", JSON.stringify(completeConsultationPayload, null, 2));

      const response = await fetch(completeConsultationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(completeConsultationPayload),
      });

      if (!response.ok) {
        let errorText = `HTTP Error completing consultation: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorText = errorData.error;
          } else {
            errorText = JSON.stringify(errorData);
          }
        } catch (parseError) {
          console.warn("Failed to parse error response from complete consultation Edge Function (possibly not JSON):", parseError);
        }
        console.error('Error calling complete consultation Edge Function:', errorText);
        Alert.alert(t('error'), `${t('failed_to_complete_consultation')}: ${errorText}`);
        return;
      }

      console.log('Consultation completion notification sent successfully. Response:', await response.json());
      Alert.alert(t('success'), t('consultation_completed_successfully'));

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === message.id
            ? {
              ...msg,
              rawData: {
                ...msg.rawData,
                status_meet: true, // Це може бути іншим полем, якщо ви відстежуєте статус завершення
                consultation_conducted: consultationConducted,
                consultation_started_on_time: consultationStartedOnTime,
                doctor_feedback: doctorFeedback,
              },
              is_read: true
            }
            : msg
        )
      );

      if (currentDoctorUserId) {
        const { count: unreadCountAfterComplete, error: countError } = await supabase
          .from('doctor_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', currentDoctorUserId)
          .eq('is_read', false);

        if (!countError && unreadCountAfterComplete !== null) {
          await Notifications.setBadgeCountAsync(unreadCountAfterComplete);
          console.log(`Badge count updated to ${unreadCountAfterComplete} after completing consultation.`);
        } else {
          console.error("Error re-fetching unread count after completing consultation:", countError?.message);
        }
      }

    } catch (error) {
      console.error("Error completing consultation:", error.message);
      Alert.alert(t('error'), `${t('failed_to_complete_consultation')}: ${error.message}`);
    } finally {
      setLoadingCompletion(false);
      setIsModalVisible(false); // Закриття модального вікна
      setSelectedMessageForCompletion(null); // Скидання вибраного повідомлення
    }
  }, [t, currentDoctorUserId, doctorFullName, selectedMessageForCompletion]); // Додано selectedMessageForCompletion

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t('loading_messages')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
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

      <ScrollView
        contentContainerStyle={styles.messageList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0EB3EB"]}
            tintColor="#0EB3EB"
          />
        }
      >
        {messages.length === 0 && !loading ? (
          <View style={styles.emptyMessagesContainer}>
            <Text style={styles.emptyMessagesText}>{t("messages_screen.no_messages")}</Text>
            <Text style={styles.emptyMessagesSubText}>{t("messages_screen.waiting_for_bookings")}</Text>
          </View>
        ) : (
          messages.map((message) => {
            const isConfirmedBooking = message.type === 'new_booking' && message.rawData.status === 'confirmed';
            const isRejectedBooking = message.type === 'new_booking' && message.rawData.status === 'rejected';
            const isPendingBooking = message.type === 'new_booking' && message.rawData.status === 'pending';

            const isPaymentReceived = message.type === 'payment_received';
            const isPaymentUpdate = message.type === 'payment_update_doctor';
            const isPaymentSuccessful = (isPaymentReceived || isPaymentUpdate) && message.rawData.status === 'success' && message.rawData.is_paid === true;
            const isPaymentFailed = (isPaymentReceived || isPaymentUpdate) && (message.rawData.status === 'failure' || message.rawData.status === 'error' || message.rawData.status === 'declined');
            const isPaymentPending = (isPaymentReceived || isPaymentUpdate) && (message.rawData.status === 'pending' || message.rawData.status === 'wait_secure' || message.rawData.status === '3ds_verify');

            // Визначення, чи зустріч у минулому
            const isPastConsultation = message.rawData.booking_date && message.rawData.booking_time_slot
                ? isPast(parseISO(`${message.rawData.booking_date}T${message.rawData.booking_time_slot}`))
                : false;

            // Чи вже завершена консультація
            const isConsultationCompleted = message.rawData.status_meet === true;


            let cardColors = ['#FFFFFF', '#FDFDFD'];
            let cardBorderStyle = styles.messageCardDefaultBorder;
            let showActions = false;
            let showStatusText = false;

            if (isPendingBooking) {
                cardColors = ['#E0F7FA', '#B2EBF2'];
                cardBorderStyle = styles.messageCardPendingBorder;
                showActions = true;
            } else if (isConfirmedBooking) {
                cardColors = ['#E8F5E9', '#C8E6C9'];
                cardBorderStyle = styles.messageCardConfirmedBorder;
                showStatusText = true;
            } else if (isRejectedBooking) {
                cardColors = ['#FFEBEE', '#FFCDD2'];
                cardBorderStyle = styles.messageCardRejectedBorder;
                showStatusText = true;
            } else if (isPaymentSuccessful) {
                cardColors = ['#E8F5E9', '#C8E6C9'];
                cardBorderStyle = styles.messageCardConfirmedBorder;
            } else if (isPaymentFailed) {
                cardColors = ['#FFEBEE', '#FFCDD2'];
                cardBorderStyle = styles.messageCardRejectedBorder;
            } else if (isPaymentPending) {
                cardColors = ['#FFFDE7', '#FFF9C4'];
                cardBorderStyle = styles.messageCardWarningBorder;
            } else {
                if (!message.is_read) {
                    cardColors = ['#FFFFFF', '#F0F8FF'];
                    cardBorderStyle = styles.messageCardUnreadBorder;
                } else {
                    cardColors = ['#FFFFFF', '#FDFDFD'];
                    cardBorderStyle = styles.messageCardDefaultBorder;
                }
            }

            const getStatusText = (type, status) => {
              if (type === 'new_booking') {
                if (status === 'confirmed') return t('booking_status_confirmed');
                if (status === 'rejected') return t('booking_status_rejected');
                if (status === 'pending') return t('booking_status_pending');
              } else if (type === 'payment_received' || type === 'payment_update_doctor') {
                if (status === 'success') return t('payment_status_success');
                if (status === 'failure' || status === 'error' || status === 'declined') return t('payment_status_failed');
                if (status === 'pending' || status === 'wait_secure' || status === '3ds_verify') return t('payment_status_pending');
              }
              return '';
            };

            const statusText = getStatusText(message.type, message.rawData.status);

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{message.date}</Text>
                    <Text style={styles.timestampText}>{message.time}</Text>
                </View>
                <LinearGradient
                  colors={cardColors}
                  style={[styles.messageCard, cardBorderStyle, !message.is_read && styles.unreadMessageCard]}
                >
                  <View style={styles.messageHeader}>
                      <Text style={styles.messageTitle}>{message.title}</Text>
                  </View>

                  <Text style={styles.messageBody}>{message.body}</Text>

                  {message.type === 'new_booking' && (
                    <View style={styles.bookingDetailsSection}>
                      <Text style={styles.cardText}>
                        {t('patient')}: {message.rawData.patient_name || t('not_specified')}
                      </Text>
                      <Text style={styles.cardText}>
                        {t('date')}: {message.rawData.booking_date || message.date}
                      </Text>
                      <Text style={styles.cardText}>
                        {t('time')}: {message.rawData.booking_time_slot || message.time}
                      </Text>

                      {showActions && (
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
                                      <Ionicons name="checkmark-done-circle-outline" size={moderateScale(20)} color="#FFFFFF" />
                                      <Text style={styles.actionButtonText}>{t('confirm')}</Text>
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
                                      <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#FFFFFF" />
                                      <Text style={styles.actionButtonText}>{t('reject')}</Text>
                                  </LinearGradient>
                              </TouchableOpacity>
                          </View>
                      )}
                      {showStatusText && (
                          <Text style={[styles.statusText, isConfirmedBooking ? styles.confirmedText : styles.rejectedText]}>
                              {statusText}
                          </Text>
                      )}
                    </View>
                  )}

                  {(isPaymentReceived || isPaymentUpdate) && (
                      <View style={styles.paymentDetailsSection}>
                          <Text style={styles.paymentDetailsText}>
                              {t('payment_status')}:{" "}
                              <Text style={[
                                  styles.paymentStatusValue,
                                  isPaymentSuccessful ? styles.paymentStatusSuccess :
                                  isPaymentFailed ? styles.paymentStatusFailure :
                                  styles.paymentStatusPending
                              ]}>
                                  {message.rawData.status ? t(`payment_statuses.${message.rawData.status}`) : t('not_specified')}
                              </Text>
                          </Text>
                          <Text style={styles.paymentDetailsText}>
                              {t('amount')}: {message.rawData.amount || 'N/A'} {message.rawData.currency || ''}
                          </Text>
                          <Text style={styles.paymentDetailsText}>
                              {t('patient')}: {message.rawData.patient_name || t('not_specified')}
                          </Text>
                          <Text style={styles.paymentDetailsText}>
                              {t('date')}: {message.rawData.booking_date || message.date}
                          </Text>
                          <Text style={styles.paymentDetailsText}>
                              {t('time')}: {message.rawData.booking_time_slot || message.time}
                          </Text>

                      {(message.rawData.is_paid || message.rawData.meet_link) && (
                        <View style={styles.meetLinkInputContainer}>
                          <TextInput
                            style={styles.meetLinkInput}
                            placeholder={t('enter_meet_link_placeholder')}
                            placeholderTextColor="#888"
                            value={message.meetLinkInput}
                            onChangeText={(text) => handleMeetLinkInputChange(message.id, text)}
                            keyboardType="url"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity
                            onPress={() => handleSendMeetLink(message)}
                            style={styles.sendMeetLinkButton}
                          >
                            <LinearGradient
                              colors={['#0EB3EB', '#0A8BC2']}
                              style={styles.sendMeetLinkButtonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <Text style={styles.sendMeetLinkButtonText}>
                                {message.rawData.meet_link ? t('update_meet_link') : t('send_meet_link')}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      )}

                      {message.rawData.meet_link && (
                          <TouchableOpacity
                              onPress={() => Linking.openURL(message.rawData.meet_link)}
                              style={styles.meetLinkButton}
                          >
                              <LinearGradient
                                  colors={['#4CAF50', '#2E7D32']}
                                  style={styles.meetLinkButtonGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                              >
                                  <Text style={styles.meetLinkButtonText}>{t('join_meet')}</Text>
                              </LinearGradient>
                          </TouchableOpacity>
                      )}

                      {/* Кнопка "Завершити консультацію" */}
                      {isPastConsultation && !isConsultationCompleted && (
                        <TouchableOpacity
                          onPress={() => handleCompleteConsultation(message)}
                          style={styles.completeConsultationButton}
                          disabled={loadingCompletion}
                        >
                          <LinearGradient
                            colors={['#FFC107', '#FFA000']}
                            style={styles.completeConsultationButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            {loadingCompletion && selectedMessageForCompletion?.id === message.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.completeConsultationButtonText}>
                                {t('complete_consultation')}
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      )}

                      {/* Індикатор "Консультація завершена" */}
                      {isConsultationCompleted && (
                        <View style={styles.consultationCompletedIndicator}>
                          <Ionicons name="checkmark-circle" size={moderateScale(18)} color="#4CAF50" />
                          <Text style={styles.consultationCompletedText}>
                            {t('consultation_completed_indicator')}
                          </Text>
                           {/* Опціонально: Показати відгук лікаря, якщо він є */}
                            {message.rawData.doctor_feedback && (
                                <Text style={styles.doctorFeedbackDisplay}>
                                    <Text style={styles.doctorFeedbackLabel}>{t('your_feedback')}: </Text>
                                    {message.rawData.doctor_feedback}
                                </Text>
                            )}
                            {/* Опціонально: Показати статуси чекбоксів */}
                            {typeof message.rawData.consultation_conducted === 'boolean' && (
                              <Text style={styles.doctorFeedbackDisplay}>
                                <Text style={styles.doctorFeedbackLabel}>
                                  {t('consultation_conducted_question')}:
                                </Text>
                                {message.rawData.consultation_conducted ? t('yes') : t('no')}
                              </Text>
                            )}
                            {typeof message.rawData.consultation_started_on_time === 'boolean' && (
                              <Text style={styles.doctorFeedbackDisplay}>
                                <Text style={styles.doctorFeedbackLabel}>
                                  {t('consultation_started_on_time_question')}:
                                </Text>
                                {message.rawData.consultation_started_on_time ? t('yes') : t('no')}
                              </Text>
                            )}
                        </View>
                      )}

                    </View>
                  )}

                  {!message.is_read && (
                    <TouchableOpacity
                      onPress={() => markMessageAsRead(message.db_id || message.id)}
                      style={styles.markAsReadButtonCompact}
                    >
                        <Ionicons name="checkmark-circle-outline" size={moderateScale(16)} color="#0EB3EB" />
                        <Text style={styles.markAsReadButtonTextCompact}>{t('messages_screen.mark_as_read')}</Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* КОМПОНЕНТ МОДАЛЬНОГО ВІКНА ДЛЯ ЗАВЕРШЕННЯ КОНСУЛЬТАЦІЇ */}
      <ConsultationCompletionModal
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedMessageForCompletion(null);
        }}
        onSubmit={handleModalSubmit}
        isLoading={loadingCompletion}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(5),
    backgroundColor: "#f0f2f5",
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
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(20),
    color: "#333",
  },
  messageList: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(100),
  },
  messageGroup: {
    marginBottom: verticalScale(20),
  },
  dateAndTimestamp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: verticalScale(8),
    paddingHorizontal: moderateScale(10),
  },
  dateText: {
    fontFamily: "Mont-Medium",
    fontSize: moderateScale(13),
    color: "#777",
  },
  timestampText: {
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(11),
    color: "#999",
  },
  messageCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  unreadMessageCard: {
  },
  messageCardDefaultBorder: {
    borderColor: '#e0e0e0',
  },
  messageCardPendingBorder: {
    borderColor: '#0EB3EB',
  },
  messageCardConfirmedBorder: {
    borderColor: '#4CAF50',
  },
  messageCardRejectedBorder: {
    borderColor: '#D32F2F',
  },
  messageCardWarningBorder: {
    borderColor: '#FFA000',
  },
  messageCardUnreadBorder: {
    borderColor: '#0EB3EB',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  messageTitle: {
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(16),
    color: "#222",
    flexShrink: 1,
  },
  messageBody: {
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(15),
    color: "#555",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(10),
  },
  bookingDetailsSection: {
    marginTop: verticalScale(10),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  paymentDetailsSection: {
    marginTop: verticalScale(10),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cardText: {
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(14),
    color: "#555",
    marginBottom: verticalScale(8),
  },
  bookingActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(15),
  },
  actionButtonContainer: {
    flex: 1,
    marginHorizontal: moderateScale(7),
    borderRadius: moderateScale(30),
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(30),
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
    marginLeft: moderateScale(5),
  },
  statusText: {
      fontFamily: "Mont-SemiBold",
      fontSize: moderateScale(15),
      marginTop: verticalScale(15),
      textAlign: 'center',
  },
  confirmedText: {
      color: '#2E7D32',
  },
  rejectedText: {
      color: '#B71C1C',
  },
  paymentDetailsText: {
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(14),
    color: "#555",
    marginTop: verticalScale(4),
  },
  paymentStatusValue: {
    fontFamily: "Mont-SemiBold",
  },
  paymentStatusSuccess: {
    color: '#2E7D32',
  },
  paymentStatusFailure: {
    color: '#B71C1C',
  },
  paymentStatusPending: {
    color: '#FFA000',
  },
  meetLinkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(15),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  meetLinkInput: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(15),
    color: '#333',
  },
  sendMeetLinkButton: {
    padding: moderateScale(0),
  },
  sendMeetLinkButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: moderateScale(10),
  },
  sendMeetLinkButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(14),
  },
  meetLinkButton: {
    marginTop: verticalScale(15),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginHorizontal: moderateScale(0),
  },
  meetLinkButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(10),
  },
  meetLinkButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
  },
  completeConsultationButton: {
    marginTop: verticalScale(15),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginHorizontal: moderateScale(0),
  },
  completeConsultationButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(10),
  },
  completeConsultationButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
  },
  consultationCompletedIndicator: {
    flexDirection: 'row', // Змінено на column для кращого відображення деталей
    alignItems: 'flex-start', // Вирівнювання по лівому краю
    marginTop: verticalScale(15),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(15),
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  consultationCompletedText: {
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
    color: '#2E7D32',
    marginLeft: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorFeedbackDisplay: {
    fontFamily: 'Mont-Regular',
    fontSize: moderateScale(14),
    color: '#555',
    marginTop: verticalScale(5),
    width: '100%',
  },
  doctorFeedbackLabel: {
    fontFamily: 'Mont-SemiBold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontFamily: 'Mont-Medium',
    fontSize: moderateScale(17),
    color: '#555',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.2,
  },
  emptyMessagesText: {
    fontFamily: 'Mont-Bold',
    fontSize: moderateScale(20),
    color: '#777',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  emptyMessagesSubText: {
    fontFamily: 'Mont-Regular',
    fontSize: moderateScale(16),
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: moderateScale(30),
    lineHeight: moderateScale(24),
  },
  markAsReadButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(10),
    alignSelf: 'flex-end',
    borderRadius: moderateScale(15),
    backgroundColor: 'rgba(14, 179, 235, 0.1)',
  },
  markAsReadButtonTextCompact: {
    color: '#0EB3EB',
    fontFamily: "Mont-Medium",
    fontSize: moderateScale(12),
    marginLeft: moderateScale(5),
  },
});