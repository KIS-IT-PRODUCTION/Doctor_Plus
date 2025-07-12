import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Icon from '../assets/icon.svg';
import FeedbackModal from "../components/FeedbackModal.js"
import { parseISO, format, isPast } from 'date-fns'; // Import date-fns utilities
import { uk, enUS } from 'date-fns/locale'; // Import locales

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

const LIQPAY_INIT_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/init-liqpay-payment';
const LIQPAY_CALLBACK_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback';

export default function PatientMessages() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);

  // State for feedback modal
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [currentBookingIdForFeedback, setCurrentBookingIdForFeedback] = useState(null);

  // Determine locale for date-fns
  const locale = i18n.language === 'uk' ? uk : enUS;

  // Function to handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };

  // NEW FUNCTION: Update app icon badge
  const updateAppBadge = useCallback(async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`Badge count updated to: ${count}`);
    } catch (error) {
      console.error("Failed to set badge count:", error);
    }
  }, []);

  useEffect(() => {
    const getUserId = async () => {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setCurrentPatientId(user.id);
          console.log("PatientMessages: Current patient ID:", user.id);
        } else if (error) {
          console.error("PatientMessages: Error getting user session:", error.message);
          Alert.alert(t('error'), t('failed_to_load_messages_user_session'));
          setLoading(false);
        } else {
          console.warn("PatientMessages: User session not found. User might not be authenticated.");
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

  // Function to fetch messages from Supabase
  const fetchMessagesFromSupabase = useCallback(async () => {
    if (!currentPatientId) {
      setLoading(false);
      setRefreshing(false);
      console.warn("PatientMessages: currentPatientId is null, skipping fetchMessagesFromSupabase.");
      return;
    }

    setLoading(true);
    console.log("PatientMessages: Fetching notifications for patient with ID:", currentPatientId);
    try {
      // Fetch notifications including admin announcements
      const { data: notificationData, error: notificationError } = await supabase
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

      if (notificationError) {
        throw notificationError;
      }

      // Collect booking_ids from fetched notifications
      const bookingIds = notificationData
        .filter(msg => msg.data && msg.data.booking_id && msg.notification_type !== 'admin_announcement') // Only get booking IDs for non-admin messages
        .map(msg => msg.data.booking_id);

      let bookingDetails = {};
      if (bookingIds.length > 0) {
        // Fetch booking details to get status, has_feedback_patient, and consultation_conducted
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('patient_bookings')
          .select('id, doctor_id, status, has_feedback_patient, consultation_conducted, booking_date, booking_time_slot') // Added booking_date, booking_time_slot for date-fns
          .in('id', bookingIds);

        if (bookingsError) {
          console.error("PatientMessages: Error fetching booking details:", bookingsError.message);
          // Don't throw error, allow to proceed without these details, but with a warning
        } else {
          bookingsData.forEach(booking => {
            bookingDetails[booking.id] = booking;
          });
        }
      }

      const formattedMessages = notificationData.map(msg => {
        const bookingInfo = bookingDetails[msg.data?.booking_id] || {};

        let formattedDate = '';
        let formattedTime = '';
        try {
          const createdAtDate = parseISO(msg.created_at);
          formattedDate = format(createdAtDate, 'PPP', { locale }); // e.g., Jan 1, 2023
          formattedTime = format(createdAtDate, 'p', { locale }); // e.g., 10:30 AM
        } catch (dateError) {
          console.error("Error parsing created_at date with date-fns:", msg.created_at, dateError);
          formattedDate = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(msg.created_at));
          formattedTime = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.created_at));
        }

        return {
          id: msg.id,
          title: msg.title,
          body: msg.body,
          created_at: msg.created_at,
          date: formattedDate, // Added formatted date
          time: formattedTime, // Added formatted time
          is_read: msg.is_read,
          type: msg.notification_type,
          rawData: msg.data || {},
          is_paid: msg.data?.is_paid || false,
          booking_id: msg.data?.booking_id || null,
          amount: msg.data?.amount || 0,
          meet_link: msg.data?.meet_link || null,
          booking_status: bookingInfo.status || null,
          has_feedback_patient: bookingInfo.has_feedback_patient === true,
          consultation_conducted: bookingInfo.consultation_conducted === true,
          booking_date: bookingInfo.booking_date, // Pass booking date
          booking_time_slot: bookingInfo.booking_time_slot, // Pass booking time slot
        };
      });

      setMessages(formattedMessages);
      console.log("PatientMessages: Fetched notifications:", formattedMessages.length);

      const unreadCount = formattedMessages.filter(msg => !msg.is_read).length;
      await updateAppBadge(unreadCount);

    } catch (error) {
      console.error('PatientMessages: Error fetching patient messages:', error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPatientId, t, i18n.language, updateAppBadge, locale]);

  // Use useFocusEffect for refreshing on screen focus
  useFocusEffect(
    useCallback(() => {
      if (currentPatientId) {
        setLoading(true);
        fetchMessagesFromSupabase();
      }
      return () => {};
    }, [currentPatientId, fetchMessagesFromSupabase])
  );

  // Function for "pull-to-refresh"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessagesFromSupabase();
  }, [fetchMessagesFromSupabase]);

  // Function to mark a SINGLE message as read
  const markSingleAsRead = useCallback(async (messageId) => {
    if (!messageId) {
        console.warn("markSingleAsRead: Message ID is missing.");
        return;
    }
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      );
      const unreadCount = updatedMessages.filter(msg => !msg.is_read).length;
      updateAppBadge(unreadCount);
      return updatedMessages;
    });

    try {
      const { error } = await supabase
        .from('patient_notifications')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        throw error;
      }
      console.log("PatientMessages: Single notification marked as read in DB:", messageId);
    } catch (error) {
      console.error('PatientMessages: Error marking single message as read:', error.message);
      Alert.alert(t('error'), `${t('failed_to_mark_as_read')}: ${error.message}`);
      setMessages(prevMessages => {
        const revertedMessages = prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        );
        const unreadCount = revertedMessages.filter(msg => !msg.is_read).length;
        updateAppBadge(unreadCount);
        return revertedMessages;
      });
    }
  }, [t, updateAppBadge]);


  // Function to handle LiqPay payment
  const handleLiqPayPayment = useCallback(async (bookingId, amount, description, doctorName) => {
    if (!bookingId || !amount || !description || !currentPatientId) {
      Alert.alert(t('error'), t('liqpay_missing_params'));
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session || !session.access_token) {
        console.error('SendPaymentNotification: Error getting user session or token:', sessionError?.message || 'Session missing.');
        Alert.alert(t('error'), t('failed_to_authorize_payment'));
        return;
      }

      const userAccessToken = session.access_token;

      console.log("Requesting LiqPay parameters from Supabase Edge Function:", LIQPAY_INIT_FUNCTION_URL);
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
        console.error('Supabase Edge Function reported error or missing data/signature:', jsonResponse.error || 'Unknown error.');
        throw new Error(jsonResponse.error || 'Failed to get LiqPay parameters from Edge Function (missing data/signature).');
      }

      const { data, signature } = jsonResponse;

      const liqPayUrl = 'https://www.liqpay.ua/api/3/checkout';
      const formBody = `data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
      const fullUrl = `${liqPayUrl}?${formBody}`;

      console.log("Attempting to open LiqPay URL:", fullUrl);

      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_url')}: ${fullUrl}`);
      }

    } catch (error) {
      console.error('Error initializing LiqPay payment:', error);
      Alert.alert(t('error'), `${t('liqpay_payment_init_failed')}: ${error.message}`);
    }
  }, [currentPatientId, t, LIQPAY_INIT_FUNCTION_URL, LIQPAY_CALLBACK_FUNCTION_URL]);

  // Function to handle "Join Meet" button press
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


  // Function to handle Deep Links (returning to app after payment)
  const handleDeepLink = useCallback(({ url }) => {
    console.log("App opened via deep link:", url);
    console.log("Calling fetchMessagesFromSupabase after deep link.");
    setTimeout(() => {
        fetchMessagesFromSupabase();
    }, 1000);
  }, [fetchMessagesFromSupabase]);

  // FUNCTION: Submit feedback to Supabase and update doctor points
  const handleSubmitFeedback = useCallback(async (bookingId, consultationOccurred, consultationOnTime, starRating, feedbackText) => {
    try {
      if (!bookingId) {
        throw new Error("Booking ID is required to submit feedback.");
      }

      // 1. Update booking record with patient's feedback
      const { error: updateBookingError } = await supabase
        .from('patient_bookings')
        .update({
          consultation_occurred_patient: consultationOccurred,
          consultation_on_time_patient: consultationOnTime,
          consultation_rating_patient: starRating,
          consultation_feedback_patient: feedbackText,
          has_feedback_patient: true, // Set to true after successful feedback
        })
        .eq('id', bookingId);

      if (updateBookingError) {
        throw updateBookingError;
      }

      console.log("Feedback submitted successfully for booking:", bookingId);
      Alert.alert(t('success'), t('feedback_modal.feedback_submitted_successfully'));

      // 2. Get doctor_id for this booking
      const { data: bookingData, error: fetchBookingError } = await supabase
        .from('patient_bookings')
        .select('doctor_id')
        .eq('id', bookingId)
        .single(); // Use single() because we expect one result

      if (fetchBookingError) {
        console.error("Error fetching doctor_id from booking:", fetchBookingError.message);
        // Can continue without updating points, or throw an error
        // For now, just log and don't update points to avoid blocking feedback
      } else if (bookingData && bookingData.doctor_id) {
        const doctorId = bookingData.doctor_id;
        let pointsChange = 0;

        // 3. Determine points based on starRating
        switch (starRating) {
          case 5:
            pointsChange = 50;
            break;
          case 4:
            pointsChange = 25;
            break;
          case 3:
            pointsChange = 0;
            break;
          case 2:
            pointsChange = -25;
            break;
          case 1:
            pointsChange = -50;
            break;
          default:
            pointsChange = 0; // In case of unexpected rating
        }

        if (pointsChange !== 0) {
          // 4. Update doctor_points for the corresponding doctor
          // Use SQL function `increment_doctor_points` for atomic update
          // This will avoid concurrency issues with simultaneous updates
          const { error: updatePointsError } = await supabase.rpc('increment_doctor_points', {
              doc_id: doctorId,
              points_to_add: pointsChange
          });

          if (updatePointsError) {
            console.error(`Error updating doctor_points for doctor ${doctorId}:`, updatePointsError.message);
            // Here you can decide if you need to display an Alert to the user
            // Alert.alert(t('error'), `${t('failed_to_update_doctor_points')}: ${updatePointsError.message}`);
          } else {
            console.log(`Doctor ${doctorId} points updated by ${pointsChange}.`);
          }
        }
      }

      // Update message state in UI so "Leave Feedback" button disappears
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.booking_id === bookingId ? { ...msg, has_feedback_patient: true } : msg // Update has_feedback_patient in UI state
        )
      );

      const relatedMessage = messages.find(msg => msg.booking_id === bookingId);
      if (relatedMessage && !relatedMessage.is_read) {
        markSingleAsRead(relatedMessage.id);
      }

    } catch (error) {
      console.error('Error submitting feedback or updating doctor points:', error.message);
      Alert.alert(t('error'), `${t('failed_to_submit_feedback')}: ${error.message}`);
    }
  }, [t, messages, markSingleAsRead]);

  // useEffect for subscribing to notifications and Deep Links
  useEffect(() => {
    if (!currentPatientId) return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('PatientMessages: Notification received in foreground:', notification);
      fetchMessagesFromSupabase();
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('PatientMessages: Notification response received (user clicked):', response);
      const { title, body, data } = response.notification.request.content;

      fetchMessagesFromSupabase();

      // NEW: Handle admin announcements if clicked directly
      if (data && data.type === 'admin_announcement') {
        Alert.alert(
          title || t('admin_announcement_label'),
          body || t('notification_body_default'),
          [{ text: t('ok') }]
        );
        return; // Important to return here to prevent further processing for admin announcements
      }

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected' || data.type === 'payment_success' || data.type === 'meet_link_update') && data.booking_id) {
        if (data.type === 'payment_success') {
          Alert.alert(
            title || t('payment_success_notification_title'),
            body || t('payment_success_notification_body'),
            [{ text: t('ok') }]
          );
        } else if (data.type === 'meet_link_update') {
            Alert.alert(
                t('consultation_link_ready_title'),
                `${t('consultation_link_ready_message', { doctorName: data.doctor_name, date: data.booking_date, time: data.booking_time_slot })}`,
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
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t, handleLiqPayPayment, handleDeepLink, handleJoinMeet]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
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
              // Determine if it's an admin announcement
              const isAdminAnnouncement = message.type === 'admin_announcement';

              const showPayButton = !isAdminAnnouncement && message.type === 'booking_confirmed' && !message.is_paid && message.booking_id && message.amount > 0;
              const isPaid = !isAdminAnnouncement && message.is_paid;

              const showJoinMeetButton = !isAdminAnnouncement && (message.type === 'booking_confirmed' || message.type === 'meet_link_update') && isPaid && message.meet_link;

              // Logic for feedback button: now depends on `consultation_conducted`
              const showFeedbackButton =
                !isAdminAnnouncement &&
                message.booking_id &&
                message.booking_status === 'confirmed' &&
                message.consultation_conducted === true && // NEW: Only show if consultation was conducted
                !message.has_feedback_patient;

              // Check if consultation is in the past for feedback logic
              const isConsultationInPast = !isAdminAnnouncement && message.booking_date && message.booking_time_slot
                ? isPast(parseISO(`${message.booking_date}T${message.booking_time_slot}`))
                : false;


              // Determine card styling based on message type and status
              let cardStyle = styles.messageCard;
              if (isAdminAnnouncement) {
                cardStyle = [styles.messageCard, styles.messageCardAdmin];
              } else if (!message.is_read) {
                cardStyle = [styles.messageCard, styles.messageCardUnread];
              } else if (message.type === 'booking_confirmed') {
                cardStyle = [styles.messageCard, styles.messageCardConfirmed];
              } else if (message.type === 'booking_rejected') {
                cardStyle = [styles.messageCard, styles.messageCardRejected];
              } else if (isPaid) {
                cardStyle = [styles.messageCard, styles.messageCardPaid];
              } else if (message.type === 'meet_link_update') {
                cardStyle = [styles.messageCard, styles.messageCardMeetLinkUpdate];
              } else {
                cardStyle = [styles.messageCard, styles.messageCardRead];
              }

              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{message.date}</Text>
                    <Text style={styles.timestampText}>{message.time}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        console.log("Card pressed:", message.id);
                        if (!message.is_read) {
                            markSingleAsRead(message.id);
                        }
                    }}
                    disabled={false}
                    style={cardStyle}
                  >
                    <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                    <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                    {/* Conditional rendering for admin announcement indicator */}
                    {isAdminAnnouncement && (
                      <View style={styles.adminMessageIndicator}>
                          <Ionicons name="information-circle-outline" size={moderateScale(18)} color="#2196F3" />
                          <Text style={styles.adminMessageText}>{t('admin_announcement_label')}</Text>
                      </View>
                    )}

                    {/* Hide these sections for admin announcements */}
                    {!isAdminAnnouncement && (
                      <>
                        {message.meet_link && (
                            <View style={styles.meetLinkContainer}>
                                <Ionicons name="videocam-outline" size={moderateScale(18)} color="#34A853" />
                                <Text style={styles.meetLinkText} onPress={() => handleJoinMeet(message.meet_link)}>
                                    {t('meet_link')}: {message.meet_link}
                                </Text>
                            </View>
                        )}

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
                                <Text style={styles.payButtonText}>{t('pay_now')} {message.amount} {t('USD')}</Text>
                            </TouchableOpacity>
                        ) : showJoinMeetButton ? (
                            <TouchableOpacity
                                style={styles.joinMeetButton}
                                onPress={() => handleJoinMeet(message.meet_link)}
                            >
                                <Ionicons name="videocam-outline" size={moderateScale(20)} color="#FFFFFF" style={styles.joinMeetIcon} />
                                <Text style={styles.joinMeetButtonText}>{t('join_meet_call')}</Text>
                            </TouchableOpacity>
                        ) : showFeedbackButton ? (
                            <TouchableOpacity
                                style={styles.feedbackButton}
                                onPress={() => {
                                    setCurrentBookingIdForFeedback(message.booking_id);
                                    setIsFeedbackModalVisible(true);
                                }}
                            >
                                <Text style={styles.feedbackButtonText}>{t('leave_feedback_button')}</Text>
                            </TouchableOpacity>
                        ) : message.has_feedback_patient ? (
                            <View style={styles.feedbackLeftButton}>
                                <Text style={styles.feedbackLeftButtonText}>{t('feedback_left')}</Text>
                            </View>
                        ) : isPaid && message.type !== 'booking_rejected' ? ( // Show "Paid" only if not rejected
                            <View style={styles.paidButton}>
                                <Text style={styles.paidButtonText}>{t('paid')}</Text>
                            </View>
                        ) : null}
                      </>
                    )}

                    {/* Mark as Read button and status */}
                    <View style={styles.messageActionsRow}>
                        {message.is_read ? (
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

      <FeedbackModal
        isVisible={isFeedbackModalVisible}
        onClose={() => setIsFeedbackModalVisible(false)}
        onSubmit={handleSubmitFeedback}
        initialBookingId={currentBookingIdForFeedback}
      />
    </SafeAreaView>
  );
}

// ОСНОВНІ СТИЛІ ДЛЯ PatientMessages
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    fontFamily: "Mont-SemiBold",
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
    fontFamily: 'Mont-Medium',
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
    color: '#666',
    fontFamily: 'Mont-SemiBold',
  },
  timestampText: {
    fontSize: moderateScale(14),
    color: '#888',
    fontFamily: 'Mont-Regular',
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
  },
  messageCardUnread: {
    borderLeftColor: '#0EB3EB', // Blue for unread
    backgroundColor: '#E8F5E9',
  },
  messageCardRead: {
    borderLeftColor: '#cccccc', // Grey for read (default)
    backgroundColor: '#FFFFFF',
  },
  messageCardConfirmed: {
    borderLeftColor: '#4CAF50', // Green for confirmed booking
    backgroundColor: '#E8F5E9',
  },
  messageCardRejected: {
    borderLeftColor: '#D32F2F', // Red for rejected booking
    backgroundColor: '#FFEBEE',
  },
  messageCardPaid: {
    borderLeftColor: '#2E7D32', // Darker green for paid
    backgroundColor: '#E6FFE6',
  },
  messageCardMeetLinkUpdate: {
    borderLeftColor: '#9C27B0', // Purple for meet link update
    backgroundColor: '#F3E5F5',
  },
  // NEW STYLE: For admin announcements
  messageCardAdmin: {
    borderLeftColor: '#2196F3', // Blue for admin
    backgroundColor: '#E3F2FD',
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Mont-Bold',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  cardText: {
    fontSize: moderateScale(15),
    fontFamily: 'Mont-Regular',
    color: '#555',
    lineHeight: moderateScale(22),
  },
  meetLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    backgroundColor: '#F0FDF4',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  meetLinkText: {
    fontSize: moderateScale(14),
    fontFamily: 'Mont-Medium',
    color: '#2E7D32',
    marginLeft: moderateScale(8),
    flexShrink: 1,
  },
  payButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#0EB3EB',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(5),
    elevation: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontFamily: 'Mont-SemiBold',
  },
  joinMeetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(15),
    backgroundColor: '#34A853', // Google Meet green
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(5),
    elevation: 8,
  },
  joinMeetIcon: {
    marginRight: moderateScale(8),
  },
  joinMeetButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontFamily: 'Mont-SemiBold',
  },
  feedbackButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#FFC107', // Amber for feedback
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(5),
    elevation: 8,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontFamily: 'Mont-SemiBold',
  },
  feedbackLeftButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#E0E0E0',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackLeftButtonText: {
    color: '#757575',
    fontSize: moderateScale(16),
    fontFamily: 'Mont-SemiBold',
  },
  paidButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#A5D6A7', // Lighter green for paid status
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidButtonText: {
    color: '#1B5E20',
    fontSize: moderateScale(16),
    fontFamily: 'Mont-SemiBold',
  },
  messageActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: verticalScale(10),
  },
  readStatusText: {
    fontSize: moderateScale(13),
    fontFamily: 'Mont-Medium',
    color: '#757575',
  },
  markAsReadButton: {
    backgroundColor: 'rgba(14, 179, 235, 0.1)',
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  markAsReadButtonText: {
    color: '#0EB3EB',
    fontSize: moderateScale(13),
    fontFamily: 'Mont-SemiBold',
  },
  // NEW STYLE: Admin Message Indicator
  adminMessageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(10),
    backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue background
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
  },
  adminMessageText: {
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(13),
    color: '#2196F3',
    marginLeft: moderateScale(5),
  },
});