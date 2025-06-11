import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import { supabase } from '../../providers/supabaseClient';

export default function Messege() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDoctorId, setCurrentDoctorId] = useState(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addNewMessage = useCallback((notificationContent) => {
    const { title, body, data } = notificationContent;
    const now = new Date();
    const messageDate = new Intl.DateTimeFormat(t('locale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    const messageTime = new Intl.DateTimeFormat(t('locale'), { hour: '2-digit', minute: '2-digit' }).format(now);

    setMessages(prevMessages => {
      // Check for duplicates based on db_id (if available) or a unique combination
      const isDuplicate = prevMessages.some(msg =>
        (data.db_id && msg.db_id === data.db_id) ||
        (msg.title === title && msg.body === body && msg.date === messageDate && msg.time === messageTime)
      );

      if (isDuplicate) {
        console.log("Duplicate message received, not adding to UI.");
        return prevMessages;
      }

      return [
        {
          id: data.db_id || (Date.now().toString() + Math.random().toString(36).substring(2, 9)), // Use db_id if present
          db_id: data.db_id || null, // Store db_id for updates
          title: title,
          body: body,
          date: messageDate,
          time: messageTime,
          is_read: data.is_read || false,
          type: data.type || 'general',
          rawData: data || {}, // Ensure rawData is an object
        },
        ...prevMessages,
      ];
    });
  }, [t]);

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
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Fetched notifications:", data);

      const formattedMessages = data.map(notif => ({
        id: notif.id,
        db_id: notif.id,
        title: notif.title,
        body: notif.body,
        date: new Intl.DateTimeFormat(t('locale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(notif.created_at)),
        time: new Intl.DateTimeFormat(t('locale'), { hour: '2-digit', minute: '2-digit' }).format(new Date(notif.created_at)),
        is_read: notif.is_read,
        type: (notif.data && notif.data.type) || 'general',
        rawData: notif.data || {}, // Ensure rawData is an object
      }));

      setMessages(formattedMessages);

    } catch (error) {
      console.error("Error fetching messages from Supabase:", error.message);
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  useFocusEffect(
    useCallback(() => {
      if (currentDoctorId) {
        fetchMessagesFromSupabase(currentDoctorId);
      }
      return () => {};
    }, [currentDoctorId, fetchMessagesFromSupabase])
  );

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
      addNewMessage(notification.request.content);
    });

    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Користувач натиснув на сповіщення (Messege.js):', response);
      const { title, body, data } = response.notification.request.content;

      // When user interacts with notification, ensure it's added/updated in the list
      addNewMessage(response.notification.request.content);

      if (data && data.type === 'new_booking' && data.patient_name && data.booking_date && data.booking_time_slot) {
        Alert.alert(
          t('new_booking_notification_title'),
          `${t('patient')}: ${data.patient_name}\n${t('date')}: ${data.booking_date}\n${t('time')}: ${data.booking_time_slot}.`,
          [{ text: t('view_details'), onPress: () => {
              // Add navigation to booking details screen here if needed
              console.log("Navigate to booking details");
            }
          }]
        );
      } else {
          Alert.alert(title || t('notification_title_default'), body || t('notification_body_default'), [{ text: t('ok') }]);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, [t, addNewMessage]);

  const markAsRead = useCallback(async (messageId) => {
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
        console.error("Error marking notification as read:", error.message);
        Alert.alert(t('error'), t('failed_to_mark_as_read'));
      } else {
        console.log("Notification marked as read in DB:", messageId);
      }
    } catch (error) {
      console.error("Network error marking notification as read:", error.message);
      Alert.alert(t('error'), t('failed_to_mark_as_read'));
    }
  }, [t]);

  const handleConfirmBooking = useCallback(async (message) => {
    await markAsRead(message.db_id); // Mark as read immediately

    // You can add additional logic here for actually "confirming" the booking
    // For example, updating a 'status' column in 'patient_bookings'
    // For now, it just marks the notification as read.
    Alert.alert(t('success'), t('booking_confirmed_successfully_message'));

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
                <Text style={styles.cardTitle}>{message.title || t('notification_title_default')}</Text>
                <Text style={styles.cardText}>{message.body || t('notification_body_default')}</Text>
                
                {message.type === 'new_booking' && (
                    <View>
                        {/* <Text style={styles.bookingDetailsText}>
                            {t('patient')}: {(message.body) || t('not_specified')}
                        </Text>
                        <Text style={styles.bookingDetailsText}>
                            {t('date')}: {(message.date) || t('not_specified')}
                        </Text>
                        <Text style={styles.bookingDetailsText}>
                            {t('time')}: {(message.time) || t('not_specified')}
                        </Text> */}

                        {!message.is_read ? (
                            <TouchableOpacity
                                style={styles.confirmBookingButton}
                                onPress={() => handleConfirmBooking(message)}
                            >
                                <Text style={styles.confirmBookingButtonText}>{t('confirm_booking')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.confirmedText}>{t('confirmed_read')}</Text>
                        )}
                    </View>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
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
  messageCardRead: {
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
  confirmBookingButton: {
    backgroundColor: '#4CAF50',
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
  confirmBookingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: "Mont-SemiBold",
  },
  markAsReadButton: {
    backgroundColor: '#0EB3EB',
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
  confirmedText: {
    fontSize: 14,
    fontFamily: "Mont-SemiBold",
    color: '#2E7D32',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#E8F5E9',
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