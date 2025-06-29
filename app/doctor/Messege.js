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

const { width, height } = Dimensions.get("window");

// Функції масштабування для адаптивного дизайну
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Message() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t('doctor'));
  const [hiddenMessageIds, setHiddenMessageIds] = useState(new Set());

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

      const messageStatus = (data && data.payment_status) ? String(data.payment_status).toLowerCase() : ((data && data.status) ? String(data.status).toLowerCase() : 'pending');
      const messageType = (data && data.type) || 'general';

      return [
        {
          id: data && data.db_id ? data.db_id : (Date.now().toString() + Math.random().toString(36).substring(2, 9)),
          db_id: data && data.db_id ? data.db_id : null,
          title: title,
          body: body,
          date: messageDate,
          time: messageTime,
          is_read: (data && data.is_read) || false,
          type: messageType,
          rawData: { ...data, status: messageStatus } || {},
          meetLinkInput: data && data.meet_link ? data.meet_link : '',
        },
        ...prevMessages,
      ];
    });
  }, [t]);

  const fetchMessagesFromSupabase = useCallback(async (doctorUserId, isRefreshing = false) => {
    if (!doctorUserId) {
      console.warn("Doctor user ID is missing, cannot fetch notifications.");
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
      return;
    }

    if (!isRefreshing) setLoading(true);
    else setRefreshing(true);

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
        const messageStatus = (rawData.payment_status) ? String(rawData.payment_status).toLowerCase() : ((rawData.status) ? String(rawData.status).toLowerCase() : 'pending');
        const messageType = rawData.type || 'general';

        return {
          id: notif.id,
          db_id: notif.id,
          title: notif.title,
          body: notif.body,
          date: new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at)),
          time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at)),
          is_read: notif.is_read,
          type: messageType,
          rawData: { ...rawData, status: messageStatus },
          meetLinkInput: rawData.meet_link ? rawData.meet_link : '',
        };
      });

      setMessages(formattedMessages);

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  }, [t]);

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
      return () => {};
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
  }, [t, addNewMessage, navigation]);

  const markAsReadAndStatus = useCallback(async (messageId, newStatus = null, isPaymentNotification = false) => {
    // Optimistic UI update
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
      }
    } catch (error) {
      console.error("Network error marking notification as read or updating status:", error.message);
      Alert.alert(t('error'), t('failed_to_update_notification_status'));
    }
  }, [t]);

  const handleMarkAsRead = useCallback(async (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );
    setHiddenMessageIds(prev => new Set(prev).add(messageId));

    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        console.error("Error marking general notification as read in DB:", error.message);
        Alert.alert(t('error'), t('failed_to_update_notification_status'));
      } else {
        console.log(`General notification ${messageId} marked as read in DB.`);
      }
    } catch (error) {
      console.error("Network error marking general notification as read:", error.message);
      Alert.alert(t('error'), t('failed_to_update_notification_status'));
    }
  }, [t]);

  const handleHideMessage = useCallback((messageId) => {
    setHiddenMessageIds(prev => new Set(prev).add(messageId));
  }, []);

  const handleOpenMessage = useCallback((messageId) => {
    setHiddenMessageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  }, []);

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
      // const bookingAmount = message.rawData.amount; // Це значення може бути неактуальним для всіх статусів

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

    if (!message.rawData || !message.rawData.booking_id || !message.rawData.patient_id || !currentDoctorUserId) {
        console.error("Missing essential data for sending meet link:", {
            rawData: message.rawData,
            booking_id: message.rawData?.booking_id,
            patient_id: message.rawData?.patient_id,
            currentDoctorUserId: currentDoctorUserId,
        });
        Alert.alert(t('error'), t('invalid_booking_data_for_meet_link'));
        return;
    }

    const bookingId = message.rawData.booking_id;
    const patientId = message.rawData.patient_id;
    const bookingDate = message.rawData.booking_date || message.rawData.date;
    const bookingTimeSlot = message.rawData.booking_time_slot || message.rawData.time;
    const doctorFinalName = doctorFullName || t('doctor');

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

        const sendMeetLinkUrl = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification';
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
            Alert.alert(t('error'), t('user_not_authenticated_please_login_again'));
            return;
        }

        const meetLinkPayload = {
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

        await markAsReadAndStatus(message.db_id, message.rawData.status, true);

    } catch (error) {
        console.error("Error sending meet link:", error.message);
        Alert.alert(t('error'), `${t('failed_to_send_meet_link')}: ${error.message}`);
    }
  }, [t, currentDoctorUserId, doctorFullName, markAsReadAndStatus]);

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
            if (hiddenMessageIds.has(message.id)) {
              return (
                <View key={message.id} style={styles.hiddenMessageContainer}>
                  <Text style={styles.hiddenMessageText}>
                    {message.title} ({t('messages_screen.hidden_message')})
                  </Text>
                  <TouchableOpacity onPress={() => handleOpenMessage(message.id)} style={styles.openMessageButton}>
                    <Ionicons name="eye-outline" size={moderateScale(20)} color="#0EB3EB" />
                    <Text style={styles.openMessageButtonText}>{t('messages_screen.open')}</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            const isConfirmedBooking = message.type === 'new_booking' && message.rawData.status === 'confirmed';
            const isRejectedBooking = message.type === 'new_booking' && message.rawData.status === 'rejected';
            const isPendingBooking = message.type === 'new_booking' && message.rawData.status === 'pending';

            const isPaymentReceived = message.type === 'payment_received';
            const isPaymentUpdate = message.type === 'payment_update_doctor';
            const isPaymentSuccessful = (isPaymentReceived || isPaymentUpdate) && message.rawData.status === 'success' && message.rawData.is_paid === true;
            const isPaymentFailed = (isPaymentReceived || isPaymentUpdate) && (message.rawData.status === 'failure' || message.rawData.status === 'error' || message.rawData.status === 'declined');
            const isPaymentPending = (isPaymentReceived || isPaymentUpdate) && (message.rawData.status === 'pending' || message.rawData.status === 'wait_secure' || message.rawData.status === '3ds_verify');

            let cardColors = ['#FFFFFF', '#FDFDFD'];
            let cardBorderStyle = {};
            let showActions = false;
            let showStatusText = false;
            let isGeneralMessage = false;

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
                isGeneralMessage = true;
                if (!message.is_read) {
                    cardColors = ['#FFFFFF', '#F0F8FF'];
                    cardBorderStyle = styles.messageCardUnreadBorder;
                } else {
                    cardColors = ['#F8F8F8', '#ECECEC'];
                    cardBorderStyle = styles.messageCardDefaultBorder;
                }
            }

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.dateAndTimestamp}>
                  <Text style={styles.dateText}>{message.date}</Text>
                  <Text style={styles.timestampText}>{message.time}</Text>
                </View>
                <LinearGradient
                  colors={cardColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.messageCard,
                    cardBorderStyle,
                    !message.is_read && styles.messageCardUnreadLeftBar,
                  ]}
                >
                  <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                  <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                  {/* Секція для повідомлень про бронювання */}
                  {message.type === 'new_booking' && (
                      <View>
                          {message.rawData.patient_name && <Text style={styles.paymentDetailsText}>{t('patient')}: {message.rawData.patient_name}</Text>}
                          {message.rawData.booking_date && <Text style={styles.paymentDetailsText}>{t('date')}: {message.rawData.booking_date}</Text>}
                          {message.rawData.booking_time_slot && <Text style={styles.paymentDetailsText}>{t('time')}: {message.rawData.booking_time_slot}</Text>}
                          {message.rawData.reason && <Text style={styles.paymentDetailsText}>{t('reason')}: {message.rawData.reason}</Text>}

                          {isPendingBooking && showActions && (
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
                          )}

                          {(isConfirmedBooking || isRejectedBooking) && showStatusText && (
                              <Text style={[
                                  styles.statusText,
                                  isConfirmedBooking ? styles.confirmedText : styles.rejectedText
                              ]}>
                                  {isConfirmedBooking ? t('confirmed_read') : t('rejected_read')}
                              </Text>
                          )}
                      </View>
                  )}


                  {/* Секція для платіжних повідомлень */}
                  {(isPaymentReceived || isPaymentUpdate) && (
                    <View>
                      <Text style={styles.paymentDetailsText}>
                        {t('patient')}: {message.rawData.patient_name || t('not_specified')}
                      </Text>
                      <Text style={styles.paymentDetailsText}>
                        {t('booking_date_time')}: {message.rawData.booking_date || message.rawData.date} {message.rawData.booking_time_slot || message.rawData.time}
                      </Text>
                      <Text style={styles.paymentDetailsText}>
                        {t('amount')}: {message.rawData.amount || 'N/A'} {message.rawData.currency || ''}
                      </Text>
                      <Text style={styles.paymentDetailsText}>
                        {t('payment_status')}:{" "}
                        <Text
                          style={[
                            styles.paymentStatusValue,
                            message.rawData.status === 'success' || message.rawData.is_paid === true ? styles.paymentStatusSuccess :
                            (message.rawData.status === 'failure' || message.rawData.status === 'error' || message.rawData.status === 'declined' ? styles.paymentStatusFailure : styles.paymentStatusPending)
                          ]}
                        >
                          {t(`payment_status_${message.rawData.status || 'pending'}`)}
                        </Text>
                      </Text>

                      {/* Умовне відображення для посилання на зустріч */}
                      {(message.rawData.is_paid || message.rawData.meet_link) && (
                        <View style={styles.meetLinkInputContainer}>
                          <TextInput
                            style={styles.meetLinkInput}
                            placeholder={t('enter_meet_link_placeholder')}
                            placeholderTextColor="#888"
                            value={message.meetLinkInput}
                            onChangeText={(text) => handleMeetLinkInputChange(message.id, text)}
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

                      {/* Кнопка "Приєднатися до зустрічі" тільки якщо посилання є і воно не вводиться/редагується */}
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

                    </View>
                  )}
                  {/* Кнопки дій для загальних повідомлень */}
                  {isGeneralMessage && (
                      <View style={styles.generalMessageActions}>
                          {!message.is_read ? (
                            <TouchableOpacity
                                onPress={() => handleMarkAsRead(message.id)}
                                style={styles.actionButtonContainer} // Використовуємо той самий контейнер для градієнта
                            >
                                <LinearGradient
                                  colors={['#0EB3EB', '#0A8BC2']}
                                  style={styles.actionButtonGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                >
                                  <Ionicons name="checkmark-done-circle-outline" size={moderateScale(20)} color="#FFFFFF" />
                                  <Text style={styles.actionButtonText}>{t('messages_screen.mark_as_read')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                                onPress={() => handleHideMessage(message.id)}
                                style={styles.actionButtonContainer} // Використовуємо той самий контейнер для градієнта
                            >
                                <LinearGradient
                                  colors={['#6c757d', '#5a6268']}
                                  style={styles.actionButtonGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                >
                                  <Ionicons name="eye-off-outline" size={moderateScale(20)} color="#FFFFFF" />
                                  <Text style={styles.actionButtonText}>{t('messages_screen.hide')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                          )}
                      </View>
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
    backgroundColor: "#f0f2f5",
    // Об'єднано два padding на Platform.OS
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
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
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  messageCardUnreadLeftBar: {
    borderLeftWidth: moderateScale(6),
    borderLeftColor: "#0EB3EB",
  },
  messageCardDefaultBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageCardPendingBorder: {
    borderWidth: 1.5,
    borderColor: '#0EB3EB',
  },
  messageCardConfirmedBorder: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  messageCardRejectedBorder: {
    borderWidth: 1.5,
    borderColor: '#D32F2F',
  },
  messageCardWarningBorder: {
    borderWidth: 1.5,
    borderColor: '#FFA000',
  },
  messageCardUnreadBorder: {
    borderWidth: 1.5,
    borderColor: '#0EB3EB',
  },
  cardTitle: {
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
    color: "#222",
  },
  cardText: {
    fontFamily: "Mont-Regular",
    fontSize: moderateScale(14),
    color: "#555",
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(22),
  },
  bookingActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 30, // Цей стиль на View не має ефекту на градієнтні кнопки всередині
    marginTop: verticalScale(15), // Додано для відступу від попереднього контенту
  },
  actionButtonContainer: {
    flex: 1,
    marginHorizontal: moderateScale(7),
    borderRadius: 30, // Додано сюди для округлення градієнта
    overflow: 'hidden', // Обрізає градієнт за межами borderRadius
  },
  actionButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Забезпечує округлення всередині
    flexDirection: 'row', // Щоб іконка була поруч з текстом
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
    marginLeft: moderateScale(5), // Відступ від іконки
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
    padding: moderateScale(0), // Залишаємо 0, оскільки градієнт обробляє padding
  },
  sendMeetLinkButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // Щоб текст був по центру, якщо буде іконка
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
    alignSelf: 'center',
    width: '80%',
  },
  meetLinkButtonGradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetLinkButtonText: {
    color: '#fff',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(15),
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
  // Стилі для загальних повідомлень
  generalMessageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Вирівнювання праворуч для кнопок "Прочитати"/"Приховати"
    marginTop: verticalScale(15),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  hiddenMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hiddenMessageText: {
    fontSize: moderateScale(15),
    fontStyle: 'italic',
    color: '#666666',
    flexShrink: 1,
    marginRight: moderateScale(10),
  },
  openMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: '#0EB3EB',
  },
  openMessageButtonText: {
    color: '#0EB3EB',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginLeft: moderateScale(5),
  },
});