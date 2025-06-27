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
  Linking, // Додано для відкриття посилань
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from 'react-native-modal';

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
  const [refreshing, setRefreshing] = useState(false);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t('doctor'));

  // Нові стани для модального вікна Meet
  const [isMeetModalVisible, setMeetModalVisible] = useState(false);
  const [selectedBookingForMeet, setSelectedBookingForMeet] = useState(null);
  const [meetLinkInput, setMeetLinkInput] = useState(''); // Для введення посилання
  const [isMeetLinkSubmitting, setIsMeetLinkSubmitting] = useState(false); // Для індикатора завантаження

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

      // Fetch meet_link for 'new_booking' type messages from 'patient_bookings'
      // This is crucial because doctor_notifications might not always have the meet_link if it's added later
      const bookingIdsToFetch = formattedMessages
        .filter(msg => msg.type === 'new_booking' && msg.rawData.booking_id && !msg.rawData.meet_link)
        .map(msg => msg.rawData.booking_id);

      if (bookingIdsToFetch.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('patient_bookings')
          .select('id, meet_link, status, is_paid') // Also fetch status and is_paid to ensure consistency
          .in('id', bookingIdsToFetch);

        if (bookingsError) {
          console.error("Error fetching meet_links from patient_bookings:", bookingsError.message);
          // Continue without meet links if there's an error
        } else if (bookingsData) {
          const bookingsMap = new Map(bookingsData.map(b => [b.id, b]));

          formattedMessages.forEach(msg => {
            if (msg.type === 'new_booking' && msg.rawData.booking_id) {
              const bookingDetails = bookingsMap.get(msg.rawData.booking_id);
              if (bookingDetails) {
                // Update rawData with meet_link and ensure status/is_paid are consistent
                msg.rawData.meet_link = bookingDetails.meet_link || null;
                // Prefer the status from patient_bookings if available and it's more definitive
                msg.rawData.status = bookingDetails.status ? String(bookingDetails.status).toLowerCase() : msg.rawData.status;
                msg.rawData.is_paid = bookingDetails.is_paid !== undefined ? bookingDetails.is_paid : msg.rawData.is_paid;
              }
            }
          });
        }
      }

      setMessages(formattedMessages);

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  }, [t]);

  // Handle pull-to-refresh
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
      // If it's a meet_link_update, re-fetch messages to ensure the stored link is updated
      if (notification.request.content.data?.type === 'meet_link_update' && currentDoctorUserId) {
        fetchMessagesFromSupabase(currentDoctorUserId, false);
      }
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

      // Re-fetch messages if it's a meet_link_update to get the latest link
      if (data && data.type === 'meet_link_update' && currentDoctorUserId) {
        fetchMessagesFromSupabase(currentDoctorUserId, false);
      }

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
      } else if (data && data.type === 'meet_link_update' && data.meet_link) { // Handle meet_link_update notifications
        Alert.alert(
            t('meet_link_update_notification_title'),
            `${t('meet_link_updated_body')}\n\n${t('link')}: ${data.meet_link}`,
            [{ text: t('open_link'), onPress: () => Linking.openURL(data.meet_link) }, { text: t('ok') }]
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
  }, [t, addNewMessage, navigation, currentDoctorUserId, fetchMessagesFromSupabase]); // Added currentDoctorUserId and fetchMessagesFromSupabase to dependencies

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
          console.error("Missing or invalid booking date or time slot in rawData. ExpectedYYYY-MM-DD and HH:MM strings (from booking_date/booking_time_slot or date/time):", {
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

  // Функції для керування модальним вікном Meet
  const handleAddMeetLinkPress = useCallback((message) => {
    setSelectedBookingForMeet(message);
    setMeetLinkInput(message.rawData.meet_link || ''); // Заповнюємо, якщо посилання вже є
    setMeetModalVisible(true);
  }, []);

  const handleCloseMeetModal = useCallback(() => {
    setMeetModalVisible(false);
    setSelectedBookingForMeet(null);
    setMeetLinkInput('');
  }, []);

  const handleSaveMeetLink = useCallback(async () => {
    if (!selectedBookingForMeet || !selectedBookingForMeet.rawData || !selectedBookingForMeet.rawData.booking_id) {
      Alert.alert(t('error'), t('invalid_booking_data'));
      return;
    }

    if (!meetLinkInput.trim()) {
      Alert.alert(t('error'), t('please_enter_meet_link'));
      return;
    }

    setIsMeetLinkSubmitting(true);
    const bookingId = selectedBookingForMeet.rawData.booking_id;
    const patientId = selectedBookingForMeet.rawData.patient_id;
    const doctorName = doctorFullName || t('doctor');

    try {
      // Оновлення meet_link у patient_bookings
      const { error: updateBookingError } = await supabase
        .from('patient_bookings')
        .update({ meet_link: meetLinkInput.trim() })
        .eq('id', bookingId);

      if (updateBookingError) {
        console.error("Error updating meet_link in patient_bookings:", updateBookingError.message);
        throw updateBookingError;
      }
      console.log(`Meet link for booking ${bookingId} updated successfully to: ${meetLinkInput.trim()}`);

      // Виклик Edge Function для надсилання сповіщення пацієнту
      const edgeFunctionUrl = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification'; // ПОТРІБНО СТВОРИТИ ЦЮ EDGE FUNCTION!

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        Alert.alert(t('error'), t('user_not_authenticated_please_login_again'));
        setIsMeetLinkSubmitting(false);
        return;
      }

      const payload = {
        booking_id: bookingId,
        meet_link: meetLinkInput.trim(),
        patient_id: patientId,
        doctor_name: doctorName,
        booking_date: selectedBookingForMeet.rawData.booking_date || selectedBookingForMeet.rawData.date,
        booking_time_slot: selectedBookingForMeet.rawData.booking_time_slot || selectedBookingForMeet.rawData.time,
      };

      console.log("Calling Edge Function send-meet-link-notification with data:", JSON.stringify(payload, null, 2));

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
          console.warn("Failed to parse error response from Edge Function:", parseError);
        }
        console.error('Error calling Edge Function (response not OK):', errorText);
        Alert.alert(t('error'), `${t('failed_to_send_meet_link_notification')}: ${errorText}`);
        return;
      }

      console.log('Edge Function send-meet-link-notification called successfully. Response:', await response.json());

      // Оновити UI повідомлень після успішного збереження посилання
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === selectedBookingForMeet.id ? { ...msg, rawData: { ...msg.rawData, meet_link: meetLinkInput.trim() } } : msg
        )
      );

      Alert.alert(t('success'), t('meet_link_sent_successfully'));
      handleCloseMeetModal();

    } catch (error) {
      console.error("Error saving meet link or sending notification:", error.message);
      Alert.alert(t('error'), `${t('failed_to_save_meet_link')}: ${error.message}`);
    } finally {
      setIsMeetLinkSubmitting(false);
    }
  }, [selectedBookingForMeet, meetLinkInput, t, doctorFullName, handleCloseMeetModal]);


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


  if (loading && !refreshing) { // Only show full loading screen if not refreshing
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
        refreshControl={ // Add RefreshControl here
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0EB3EB"]} // Color of the refresh indicator
            tintColor="#0EB3EB" // For iOS
          />
        }
      >
        {messages.length === 0 && !loading ? ( // Only show empty message if not loading
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
            const isPaymentFailed = isPaymentUpdate && (message.rawData.status === 'failure' || message.rawData.status === 'error' || message.rawData.status === 'declined' || message.rawData.status === 'reversed');
            const isPaymentPending = isPaymentUpdate && (message.rawData.status === 'pending' || message.rawData.status === 'wait_secure' || message.rawData.status === '3ds_verify');

            // --- НОВИЙ ТИП ПОВІДОМЛЕННЯ ДЛЯ MEET LINK ---
            const isMeetLinkUpdate = message.type === 'meet_link_update';
            // --- КІНЕЦЬ НОВОГО ТИПУ ПОВІДОМЛЕННЯ ---


            // Determine gradient colors and border style based on message type and status
            let cardColors = ['#FFFFFF', '#FDFDFD']; // Default light gradient
            let cardBorderStyle = {};
            let showActions = false; // Flag to control action buttons visibility
            let showStatusText = false; // Flag to control status text visibility for confirmed/rejected bookings

            if (isPendingBooking) {
                cardColors = ['#E0F7FA', '#B2EBF2']; // Light blue for new, pending bookings
                cardBorderStyle = styles.messageCardPendingBorder;
                showActions = true;
            } else if (isConfirmedBooking) { // Specific check for confirmed booking
                cardColors = ['#E8F5E9', '#C8E6C9']; // Light green for confirmed bookings
                cardBorderStyle = styles.messageCardConfirmedBorder;
                showStatusText = true;
            } else if (isRejectedBooking) { // Specific check for rejected booking
                cardColors = ['#FFEBEE', '#FFCDD2']; // Light red for rejected bookings
                cardBorderStyle = styles.messageCardRejectedBorder;
                showStatusText = true;
            } else if (isPaymentReceived) { // Specific check for payment received (green)
                cardColors = ['#E8F5E9', '#C8E6C9'];
                cardBorderStyle = styles.messageCardConfirmedBorder;
            } else if (isPaymentFailed) { // Specific check for payment failed (red)
                cardColors = ['#FFEBEE', '#FFCDD2'];
                cardBorderStyle = styles.messageCardRejectedBorder;
            } else if (isPaymentPending) { // Specific check for payment pending (orange)
                cardColors = ['#FFF3E0', '#FFE0B2'];
                cardBorderStyle = styles.messageCardPendingBorder; // Reusing pending border style for payments
            } else if (isMeetLinkUpdate) { // Specific styling for meet link updates
                cardColors = ['#F3E5F5', '#E1BEE7']; // Light purple for Meet link updates
                cardBorderStyle = styles.messageCardMeetLinkBorder; // You might want to define this style
            }


            return (
              <LinearGradient
                key={message.id}
                colors={cardColors}
                style={[styles.messageCard, cardBorderStyle, message.is_read ? styles.readMessage : styles.unreadMessage]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (!message.is_read) {
                      markAsReadAndStatus(message.id, message.rawData.status);
                    }
                  }}
                >
                  <Text style={styles.messageTitle}>
                    {message.title}
                  </Text>
                  <Text style={styles.messageBody}>{message.body}</Text>
                  <View style={styles.messageFooter}>
                    <Text style={styles.messageDate}>{message.date}</Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>

                  {/* Додано відображення Meet Link та кнопку "Відкрити Meet" */}
                  {(isConfirmedBooking || isMeetLinkUpdate) && message.rawData.meet_link && (
                    <View style={styles.meetLinkContainer}>
                      <Text style={styles.meetLinkText}>{t('meet_link')}:</Text>
                      <TouchableOpacity onPress={() => Linking.openURL(message.rawData.meet_link)}>
                        <Text style={styles.meetLink}>{message.rawData.meet_link}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.openMeetButton}
                        onPress={() => Linking.openURL(message.rawData.meet_link)}
                      >
                        <Text style={styles.openMeetButtonText}>{t('open_meet')}</Text>
                        <Ionicons name="link" size={moderateScale(16)} color="#fff" style={{ marginLeft: 5 }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Кнопка "Додати/Редагувати посилання на Meet" */}
                  {isConfirmedBooking && ( // Показуємо тільки для підтверджених бронювань
                    <TouchableOpacity
                      style={styles.addMeetLinkButton}
                      onPress={() => handleAddMeetLinkPress(message)}
                    >
                      <Text style={styles.addMeetLinkButtonText}>
                        {message.rawData.meet_link ? t('edit_meet_link') : t('add_meet_link')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Buttons for 'new_booking' type and 'pending' status */}
                  {showActions && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirmBooking(message)}
                      >
                        <Text style={styles.buttonText}>{t('confirm')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectBooking(message)}
                      >
                        <Text style={styles.buttonText}>{t('reject')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Status Text for Confirmed/Rejected bookings */}
                  {showStatusText && (
                    <Text style={[
                      styles.statusText,
                      isConfirmedBooking ? styles.statusTextConfirmed : styles.statusTextRejected
                    ]}>
                      {t('status')}: {t(message.rawData.status)} {/* Use t() for translation */}
                    </Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            );
          })
        )}
      </ScrollView>

      {/* Meet Link Modal */}
      <Modal
        isVisible={isMeetModalVisible}
        onBackdropPress={handleCloseMeetModal}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
        backdropTransitionOutTiming={0}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('add_meet_link_title')}</Text>
          <TextInput
            style={styles.meetLinkTextInput}
            placeholder={t('enter_meet_link')}
            value={meetLinkInput}
            onChangeText={setMeetLinkInput}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={handleCloseMeetModal}
              disabled={isMeetLinkSubmitting}
            >
              <Text style={styles.modalButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleSaveMeetLink}
              disabled={isMeetLinkSubmitting}
            >
              {isMeetLinkSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(15),
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 10 : verticalScale(15),
  },
  backButton: {
    padding: moderateScale(5),
    marginRight: moderateScale(10),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    color: "#333",
    flex: 1, // Allow title to take up available space
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: "#555",
  },
  messageList: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(20),
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(50),
  },
  emptyMessagesText: {
    fontSize: moderateScale(18),
    color: '#888',
    textAlign: 'center',
    marginBottom: verticalScale(5),
  },
  emptyMessagesSubText: {
    fontSize: moderateScale(14),
    color: '#999',
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  readMessage: {
    backgroundColor: "#F8F8F8", // Slightly grey for read messages
    opacity: 0.8,
  },
  unreadMessage: {
    // No specific style, inherits from messageCard
  },
  messageCardPendingBorder: {
    borderColor: '#0EB3EB', // Light blue
    borderWidth: 1.5,
  },
  messageCardConfirmedBorder: {
    borderColor: '#4CAF50', // Green
    borderWidth: 1.5,
  },
  messageCardRejectedBorder: {
    borderColor: '#F44336', // Red
    borderWidth: 1.5,
  },
  messageCardMeetLinkBorder: { // New style for Meet Link messages
    borderColor: '#9C27B0', // Purple
    borderWidth: 1.5,
  },
  messageTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    marginBottom: verticalScale(5),
    color: "#333",
  },
  messageBody: {
    fontSize: moderateScale(15),
    color: "#555",
    marginBottom: verticalScale(10),
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: verticalScale(8),
  },
  messageDate: {
    fontSize: moderateScale(12),
    color: "#777",
  },
  messageTime: {
    fontSize: moderateScale(12),
    color: "#777",
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(15),
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(8),
    flex: 1,
    marginRight: scale(5),
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(8),
    flex: 1,
    marginLeft: scale(5),
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusTextConfirmed: {
    color: '#4CAF50',
  },
  statusTextRejected: {
    color: '#F44336',
  },
  // Meet Link Styles
  meetLinkContainer: {
    marginTop: verticalScale(10),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  meetLinkText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#555',
    marginBottom: verticalScale(5),
  },
  meetLink: {
    fontSize: moderateScale(14),
    color: '#007BFF', // Blue link color
    textDecorationLine: 'underline',
    marginBottom: verticalScale(10),
  },
  openMeetButton: {
    backgroundColor: '#007BFF',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(5),
  },
  openMeetButtonText: {
    color: '#fff',
    fontSize: moderateScale(15),
    fontWeight: 'bold',
  },
  addMeetLinkButton: {
    backgroundColor: '#9C27B0', // Purple color
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: verticalScale(15),
  },
  addMeetLinkButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  // Modal Styles
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(20),
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
    color: '#333',
  },
  meetLinkTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    width: '100%',
    marginBottom: verticalScale(20),
    fontSize: moderateScale(16),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(8),
    flex: 1,
    alignItems: 'center',
    marginHorizontal: scale(5),
  },
  modalSaveButton: {
    backgroundColor: '#9C27B0',
  },
  modalCancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});