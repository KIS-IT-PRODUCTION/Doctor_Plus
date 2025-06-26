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
import Icon from "../../assets/icon.svg"; // Переконайтеся, що шлях правильний
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient'; // Переконайтеся, що шлях правильний
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
      // Use db_id to check for duplicates if it exists
      const isDuplicate = prevMessages.some(msg =>
        (data && data.db_id && msg.db_id === data.db_id) ||
        // Additional check if db_id is not present (e.g., for test notifications or simple alerts)
        // This fallback should be used less often with robust db_id handling
        (msg.title === title && msg.body === body && msg.date === messageDate && msg.time === messageTime && msg.type === (data.type || 'general'))
      );

      if (isDuplicate) {
        console.log("Duplicate message received, not adding to UI.");
        return prevMessages;
      }

      // Ensure status is always lowercase and has a default value for bookings
      const messageStatus = (data && data.payment_status) ? String(data.payment_status).toLowerCase() : ((data && data.status) ? String(data.status).toLowerCase() : 'pending');
      const messageType = (data && data.type) || 'general'; // Get the type of the notification

      return [
        {
          id: data && data.db_id ? data.db_id : (Date.now().toString() + Math.random().toString(36).substring(2, 9)),
          db_id: data && data.db_id ? data.db_id : null, // Store db_id if it exists
          title: title,
          body: body,
          date: messageDate,
          time: messageTime,
          is_read: (data && data.is_read) || false, // is_read should be in data if not inserted separately
          type: messageType, // Use the extracted type
          rawData: { ...data, status: messageStatus } || {}, // Store all rawData, status key might be 'payment_status' or 'status'
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
        // Prioritize payment_status if it exists, otherwise use status
        const messageStatus = (rawData.payment_status) ? String(rawData.payment_status).toLowerCase() : ((rawData.status) ? String(rawData.status).toLowerCase() : 'pending');
        const messageType = rawData.type || 'general'; // Get type from rawData

        return {
          id: notif.id,
          db_id: notif.id, // Database ID
          title: notif.title,
          body: notif.body,
          date: new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at)),
          time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at)),
          is_read: notif.is_read, // Read is_read from DB
          type: messageType, // Use the extracted type
          rawData: { ...rawData, status: messageStatus }, // Pass all rawData, ensuring consistent 'status' key
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
      // Re-fetch messages when currentDoctorUserId changes or when the screen gains focus.
      // This helps ensure messages are up-to-date after any DB changes.
      return () => {}; // Cleanup function, if needed
    }, [currentDoctorUserId, fetchMessagesFromSupabase])
  );

  useEffect(() => {
    // Configure notification handler for background and foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // Show notification when app is active
        shouldPlaySound: true, // Play sound
        shouldSetBadge: true, // Update app badge
      }),
    });

    // Listener for notifications received in the foreground
    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground (Message.js):', notification);
      // Ensure db_id is passed to addNewMessage to prevent duplicates
      const notificationContentWithDbId = {
        ...notification.request.content,
        data: {
          ...notification.request.content.data,
          db_id: notification.request.content.data?.id // Assuming 'id' from notification data is db_id
        }
      };
      addNewMessage(notificationContentWithDbId); // Add to message list in UI
    });

    // Listener for notification clicks
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User clicked on notification (Message.js):', response);
      const { title, body, data } = response.notification.request.content;

      // Update UI if the notification hasn't been added before
      const notificationContentWithDbId = {
        ...response.notification.request.content,
        data: {
          ...response.notification.request.content.data,
          db_id: response.notification.request.content.data?.id // Assuming 'id' from notification data is db_id
        }
      };
      addNewMessage(notificationContentWithDbId);

      // Redirect or show Alert depending on the notification type
      if (data && data.type === 'new_booking' && data.booking_id) {
        // Navigate to booking details screen
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
        // Alert for payment notifications
        Alert.alert(
          title || t('payment_notification_title_default'),
          `${t('payment_status')}: ${data.payment_status || t('not_specified')}\n${t('amount')}: ${data.amount || 'N/A'} ${data.currency || ''}\n${t('patient')}: ${data.patient_name || t('not_specified')}\n${t('date')}: ${data.booking_date || data.date || t('not_specified')}\n${t('time')}: ${data.booking_time_slot || data.time || t('not_specified')}.`,
          [{ text: t('ok') }]
        );
      }
      else {
          // General Alert for other notification types
          Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    // Cleanup function
    return () => {
      if (notificationReceivedListener.current) {
        Notifications.removeNotificationSubscription(notificationReceivedListener.current);
      }
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, [t, addNewMessage, navigation]);

  const markAsReadAndStatus = useCallback(async (messageId, newStatus = null) => {
    // Optimistic UI update
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const updatedRawData = { ...msg.rawData };
          if (newStatus) {
            // Ensure status or payment_status is updated correctly
            if (updatedRawData.type === 'payment_received' || updatedRawData.type === 'payment_update_doctor') {
                updatedRawData.payment_status = newStatus;
            } else {
                updatedRawData.status = newStatus;
            }
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
        const updatedDataForDB = { ...existingRawData };

        // Update the correct status key based on notification type
        if (existingRawData.type === 'payment_received' || existingRawData.type === 'payment_update_doctor') {
            updatedDataForDB.payment_status = newStatus;
        } else {
            updatedDataForDB.status = newStatus;
        }
        updateObject.data = updatedDataForDB;
      }

      const { error } = await supabase
        .from('doctor_notifications')
        .update(updateObject)
        .eq('id', messageId);

      if (error) {
        console.error("Error marking notification as read or updating status in DB:", error.message);
        Alert.alert(t('error'), t('failed_to_update_notification_status'));
      } else {
        console.log(`Notification ${messageId} marked as read and status updated to ${newStatus || 'N/A'} in DB.`);
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
      // Use booking_date and booking_time_slot first, fallback to date and time
      const bookingDate = message.rawData.booking_date || message.rawData.date;
      const bookingTimeSlot = message.rawData.booking_time_slot || message.rawData.time;
      const doctorFinalName = doctorFullName || t('doctor');
      const bookingAmount = message.rawData.amount; // Get amount from rawData if available

      // Check if bookingDate and bookingTimeSlot are valid strings
      if (typeof bookingDate !== 'string' || bookingDate.trim() === '' || typeof bookingTimeSlot !== 'string' || bookingTimeSlot.trim() === '') {
          console.error("Missing or invalid booking date or time slot in rawData. Expected YYYY-MM-DD and HH:MM strings (from booking_date/booking_time_slot or date/time):", {
              booking_date: bookingDate,
              booking_time_slot: bookingTimeSlot,
              rawData: message.rawData
          });
          Alert.alert(t('error'), t('invalid_booking_data_for_update_date_time'));
          return;
      }

      try {
          console.log(`Updating booking ${bookingId} to status: ${newStatus} for patient ${patientId}`);
          const { error: updateError } = await supabase
              .from('patient_bookings') // or 'bookings' if it's the single table for bookings
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

          // If status is "confirmed", fetch the actual amount from the booking
          if (newStatus === 'confirmed') {
              const { data: bookingDetails, error: bookingFetchError } = await supabase
                  .from('patient_bookings')
                  .select('amount, is_paid')
                  .eq('id', bookingId)
                  .single();

              if (bookingFetchError) {
                  console.error("Error getting booking amount or is_paid status:", bookingFetchError.message);
                  Alert.alert(t('error'), t('failed_to_fetch_booking_amount'));
                  return;
              }
              if (bookingDetails && bookingDetails.amount !== undefined) {
                  payload.booking.amount = bookingDetails.amount;
                  payload.booking.is_paid = bookingDetails.is_paid;
              } else {
                  console.warn("Booking amount/is_paid not found, setting amount to 0 and is_paid to false for Edge Function.");
                  payload.booking.amount = 0;
                  payload.booking.is_paid = false;
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
            // Pass the original message type to ensure markAsReadAndStatus updates the correct status key
            await markAsReadAndStatus(message.db_id, newStatus);
          } else {
            console.warn("Message does not have db_id, cannot update status in doctor_notifications table.");
            // Fallback for UI update if no db_id
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
  }, [t, currentDoctorUserId, doctorFullName, markAsReadAndStatus, navigation]);


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
            const isConfirmedBooking = message.type === 'new_booking' && message.rawData.status === 'confirmed';
            const isRejectedBooking = message.type === 'new_booking' && message.rawData.status === 'rejected';
            const isPendingBooking = message.type === 'new_booking' && message.rawData.status === 'pending';
            
            const isPaymentReceived = message.type === 'payment_received' && message.rawData.is_paid === true;
            const isPaymentUpdate = message.type === 'payment_update_doctor'; // Covers 'failed', 'pending', etc.
            const isPaymentFailed = isPaymentUpdate && (message.rawData.status === 'failure' || message.rawData.status === 'error' || message.rawData.status === 'declined');
            const isPaymentPending = isPaymentUpdate && (message.rawData.status === 'pending' || message.rawData.status === 'wait_secure' || message.rawData.status === '3ds_verify');
            
            // Determine gradient colors and border style based on message type and status
            let cardColors = ['#FFFFFF', '#FDFDFD']; // Default light gradient
            let cardBorderStyle = {};
            let showActions = false; // Flag to control action buttons visibility
            let showStatusText = false; // Flag to control status text visibility

            if (isPendingBooking) {
                cardColors = ['#E0F7FA', '#B2EBF2']; // Light blue for new, pending bookings
                cardBorderStyle = styles.messageCardPendingBorder;
                showActions = true;
            } else if (isConfirmedBooking || isPaymentReceived) {
                cardColors = ['#E8F5E9', '#C8E6C9']; // Light green for confirmed bookings and successful payments
                cardBorderStyle = styles.messageCardConfirmedBorder;
                showStatusText = true;
            } else if (isRejectedBooking || isPaymentFailed) {
                cardColors = ['#FFEBEE', '#FFCDD2']; // Light red for rejected bookings and failed payments
                cardBorderStyle = styles.messageCardRejectedBorder;
                showStatusText = true;
            } else if (isPaymentPending) {
                cardColors = ['#FFFDE7', '#FFF9C4']; // Light yellow for pending payments
                cardBorderStyle = styles.messageCardWarningBorder;
                showStatusText = true;
            } else {
                // General notifications, distinguish read/unread
                if (!message.is_read) {
                    cardColors = ['#FFFFFF', '#F0F8FF']; // Slightly off-white for unread general
                    cardBorderStyle = styles.messageCardUnreadBorder;
                } else {
                    cardColors = ['#F8F8F8', '#ECECEC']; // Greyish for read general
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
                    cardBorderStyle, // Apply the determined border style
                    !message.is_read && styles.messageCardUnreadLeftBar, // Keep the left bar for unread
                  ]}
                >
                  <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                  <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                  {/* Render content based on type and status */}
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

                  {(isPaymentReceived || isPaymentUpdate) && (
                    <View>
                      <Text style={styles.paymentDetailsText}>
                        {t('patient')}: {message.rawData.patient_name || t('not_specified')}
                      </Text>
                      <Text style={styles.paymentDetailsText}>
                        {t('booking_date_time')}: {message.rawData.booking_date || message.rawData.date} {message.rawData.booking_time_slot || message.rawData.time}
                      </Text>
                      <Text style={[
                          styles.paymentStatusText,
                          isPaymentReceived ? styles.paidStatusText : (isPaymentFailed ? styles.failedStatusText : styles.pendingStatusText)
                      ]}>
                          {t('payment_status')}: {isPaymentReceived ? t('paid') : (isPaymentFailed ? t('failed') : t('pending'))}
                          {message.rawData.amount ? ` (${message.rawData.amount} ${message.rawData.currency || 'UAH'})` : ''}
                      </Text>
                       {!message.is_read && ( // Only show mark as read for payment notifications if unread
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
                      )}
                    </View>
                  )}

                  {/* For general messages (not booking/payment related) */}
                  {!isPendingBooking && !isConfirmedBooking && !isRejectedBooking && !isPaymentReceived && !isPaymentUpdate && (
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
    fontFamily: "Mont-Regular",
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
    fontFamily: "Mont-SemiBold",
    color: "#777",
  },
  timestampText: {
    fontSize: moderateScale(13),
    fontFamily: "Mont-Regular",
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
    overflow: 'hidden', // Ensures gradient doesn't go outside border radius
  },
  messageCardUnreadLeftBar: { // Keep this for the left blue bar
    borderLeftWidth: 5,
    borderLeftColor: '#0EB3EB',
    paddingLeft: moderateScale(13), // Adjust padding to make space for the bar
  },
  // New border styles for different message types/statuses
  messageCardPendingBorder: {
    borderWidth: 1,
    borderColor: '#0EB3EB', // Blue for pending bookings
  },
  messageCardConfirmedBorder: {
    borderWidth: 1,
    borderColor: '#4CAF50', // Green for confirmed/paid
  },
  messageCardRejectedBorder: {
    borderWidth: 1,
    borderColor: '#D32F2F', // Red for rejected/failed
  },
  messageCardWarningBorder: {
    borderWidth: 1,
    borderColor: '#FFA000', // Orange for payment updates/pending
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
    marginBottom: verticalScale(10),
  },
  bookingActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(15),
  },
  actionButtonContainer: {
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: scale(5),
  },
  actionButtonGradient: {
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
  },
  statusText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
    textAlign: 'center',
  },
  confirmedText: {
    color: '#4CAF50', // Green
  },
  rejectedText: {
    color: '#D32F2F', // Red
  },
  readStatusText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    fontFamily: "Mont-Regular",
    color: '#888',
    textAlign: 'right',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(50),
  },
  emptyMessagesText: {
    fontSize: moderateScale(18),
    fontFamily: 'Mont-Bold',
    color: '#777',
    marginBottom: verticalScale(10),
  },
  emptyMessagesSubText: {
    fontSize: moderateScale(14),
    fontFamily: 'Mont-Regular',
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: scale(30),
  },
  // Payment specific styles
  paymentDetailsText: {
    fontSize: moderateScale(13.5),
    fontFamily: "Mont-Regular",
    color: '#666',
    marginBottom: verticalScale(3),
  },
  paymentStatusText: {
    fontSize: moderateScale(14.5),
    fontFamily: "Mont-SemiBold",
    marginTop: verticalScale(8),
  },
  paidStatusText: {
    color: '#4CAF50', // Green for paid
  },
  unpaidStatusText: { // Fallback, could be pending or failed if not explicitly paid
    color: '#FFA000', // Orange
  },
  failedStatusText: { // Specific for failed payments
    color: '#D32F2F', // Red
  },
  pendingStatusText: { // Specific for pending payments
    color: '#0EB3EB', // Blue
  },
});