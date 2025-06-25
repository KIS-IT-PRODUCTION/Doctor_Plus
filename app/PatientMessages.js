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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Icon from '../assets/icon.svg';
import sha1 from 'js-sha1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// LiqPay credentials and API URL
const LIQPAY_PUBLIC_KEY = 'sandbox_i32319370149';
const LIQPAY_PRIVATE_KEY = 'sandbox_zMI6cVf79SuNsn4nPIWkoFFWBwZ96Bm7Gikt9H1t'; // Make sure this is ABSOLUTELY CORRECT from LiqPay Dashboard
const LIQPAY_API_URL = 'https://www.liqpay.ua/api/3/checkout'; // <--- ВИПРАВЛЕНО: Правильний API URL

export default function PatientMessages() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Fixed: Correct useState usage
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);

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
          console.log("PatientMessages: Current patient ID:", user.id);
        } else if (error) {
          console.error("PatientMessages: Error fetching user session:", error.message);
          Alert.alert(t('error'), t('failed_to_load_messages_user_session'));
          setLoading(false);
        } else {
          console.warn("PatientMessages: No user session found. User might not be logged in.");
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
      setLoading(false);
      setRefreshing(false);
      console.warn("PatientMessages: currentPatientId is null, skipping fetchMessagesFromSupabase.");
      return;
    }

    setLoading(true);
    console.log("PatientMessages: Fetching notifications for patient ID:", currentPatientId);
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
          data,
          patient_bookings:patient_bookings (
            amount,
            payment_status,
            id
          )
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
        type: msg.notification_type,
        rawData: msg.data || {},
        booking: msg.patient_bookings,
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
      if (currentPatientId) {
        setLoading(true);
        fetchMessagesFromSupabase();
      }
      return () => {};
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
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: false } : msg
        )
      );
    }
  }, [t]);

  const handlePayment = useCallback(async (bookingId, amount, description) => {
    console.log("handlePayment called with:", { bookingId, amount, description });

    if (!amount || amount <= 0) {
      Alert.alert(t('payment_error'), t('invalid_payment_amount'));
      console.log("Invalid payment amount:", amount);
      return;
    }

    const data = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      amount: amount.toFixed(2),
      currency: 'UAH',
      description: 'Test Payment', // Simplified description for testing
      order_id: `booking_${bookingId}_${Date.now()}`,
      server_url: 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback', // Make sure this URL is correct and points to liqpay-callback
    };
    console.log("LiqPay data object:", data);

    const encodeBase64 = (str) => {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'utf8').toString('base64');
        } else if (typeof btoa !== 'undefined') {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        } else {
            console.error("Base64 encoding not supported in this environment. Requires Buffer or btoa.");
            throw new Error("Base64 encoding not supported.");
        }
    };

    let base64Data;
    try {
        base64Data = encodeBase64(JSON.stringify(data));
        console.log("Base64 Encoded Data:", base64Data);
    } catch (e) {
        console.error("Error encoding Base64 data:", e);
        Alert.alert(t('error'), t('payment_processing_error_encoding'));
        return;
    }

    const signatureRaw = LIQPAY_PRIVATE_KEY + base64Data + LIQPAY_PRIVATE_KEY;
    const sha1Hash = sha1(signatureRaw);
    const signature = encodeBase64(sha1Hash);
    console.log("Generated SHA1 Hash (before Base64):", sha1Hash);
    console.log("Generated LiqPay Signature:", signature);

    const formData = new URLSearchParams();
    formData.append('data', base64Data);
    formData.append('signature', signature);

    try {
        const liqpayUrl = `${LIQPAY_API_URL}?${formData.toString()}`;
        console.log("Full LiqPay URL to open:", liqpayUrl);

        const supported = await Linking.canOpenURL(liqpayUrl);
        console.log("Linking.canOpenURL result:", supported);

        if (supported) {
            console.log("Attempting to open URL:", liqpayUrl);
            await Linking.openURL(liqpayUrl);
        } else {
            Alert.alert(t('error'), t('cannot_open_liqpay'));
            console.log("Unable to open LiqPay URL:", liqpayUrl);
        }
    } catch (error) {
        console.error("Error in handlePayment:", error);
        Alert.alert(t('error'), t('payment_processing_error'));
    }
  }, [t]);

  // EXISTING NOTIFICATIONS LOGIC (EXPO PUSH NOTIFICATIONS)
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

      if (data && (data.type === 'booking_confirmed' || data.type === 'booking_rejected' || data.type === 'payment_status_update') && data.booking_id) {
        let alertMessage = "";
        let alertTitle = "";

        if (data.type === 'booking_confirmed') {
            alertTitle = t('booking_status_update_default_title');
            alertMessage = `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
                           `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
                           `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
                           t('booking_confirmed_message_full');
        } else if (data.type === 'booking_rejected') {
            alertTitle = t('booking_status_update_default_title');
            alertMessage = `${t('doctor')}: ${data.doctor_name || t('not_specified')}\n` +
                           `${t('date')}: ${data.booking_date || t('not_specified')}\n` +
                           `${t('time')}: ${data.booking_time_slot || t('not_specified')}\n\n` +
                           t('booking_rejected_message_full');
        } else if (data.type === 'payment_status_update') {
            alertTitle = t('payment_notification_title');
            alertMessage = `${t('booking_id')}: ${data.booking_id || t('not_specified')}\n` +
                           `${t('status')}: ${data.status_message || t('not_specified')}\n\n` +
                           (data.status === 'paid' ? t('payment_successful_notification_body') : t('payment_failed_notification_body'));
        }

        Alert.alert(alertTitle || t('notification_title_default'), alertMessage, [{ text: t('ok'), onPress: () => {
            // Optional: navigate to relevant screen after user acknowledges
            // if (data.booking_id) {
            //    navigation.navigate('BookingDetailsPatient', { bookingId: data.booking_id });
            // }
        }}]);
      } else {
        Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(subscription);
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }, [currentPatientId, fetchMessagesFromSupabase, navigation, t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patient_messages_screen.header_title')}</Text>
        <View style={styles.headerIconContainer}>
          <Icon width={50} height={50} />
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

              // Check if payment status is 'paid' (case-insensitive)
              const isPaid = message.booking?.payment_status?.toLowerCase() === 'paid';

              const showPayButton =
                message.type === 'booking_confirmed' &&
                message.booking &&
                message.booking.amount &&
                !isPaid; // Show pay button ONLY if not paid
              
              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{messageDate}</Text>
                    <Text style={styles.timestampText}>{messageTime}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => !message.is_read && markAsRead(message.id)}
                    style={[
                        styles.messageCard,
                        message.is_read && styles.messageCardRead,
                        message.type === 'booking_confirmed' && styles.messageCardConfirmed,
                        message.type === 'booking_rejected' && styles.messageCardRejected,
                    ]}
                  >
                    <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                    <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>

                    {showPayButton && (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayment(message.booking.id, message.booking.amount, message.title)}
                      >
                        <Text style={styles.payButtonText}>{t('pay_now')}</Text>
                      </TouchableOpacity>
                    )}

                    {isPaid && ( // NEW: Render "You paid" button if status is paid
                      <TouchableOpacity
                        style={[styles.payButton, styles.payButtonDisabled]} // Apply disabled styles
                        disabled={true} // Make it non-interactive
                      >
                        <Text style={styles.payButtonText}>{t('you_paid')}</Text> {/* New translation key */}
                      </TouchableOpacity>
                    )}

                    {!message.is_read ? (
                        <TouchableOpacity
                            style={styles.markAsReadButton}
                            onPress={() => markAsRead(message.id)}
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
    paddingTop: Platform.OS === 'android' ? 25 : 0,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    textAlign: 'center',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timestampText: {
    fontSize: 14,
    color: '#888',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#0EB3EB',
  },
  messageCardRead: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#cccccc',
    opacity: 0.8,
  },
  messageCardConfirmed: {
    borderLeftColor: '#4CAF50',
  },
  messageCardRejected: {
    borderLeftColor: '#D32F2F',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  payButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  payButtonDisabled: { // NEW: Styles for disabled button
    backgroundColor: '#A0A0A0', // Greyed out color
  },
  markAsReadButton: {
    marginTop: 15,
    backgroundColor: '#0EB3EB',
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
    fontWeight: '600',
  },
  readStatusText: {
    marginTop: 15,
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#777',
    marginBottom: 10,
  },
  emptyMessagesSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
