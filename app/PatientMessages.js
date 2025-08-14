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
import { parseISO, format, isPast } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const LIQPAY_INIT_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/init-liqpay-payment';
const LIQPAY_CALLBACK_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/liqpay-callback';
// Новий URL для вашої функції підтвердження консультації та виплати
const CONFIRM_AND_PAYOUT_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/confirm-and-payout';

export default function PatientMessages() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [currentBookingIdForFeedback, setCurrentBookingIdForFeedback] = useState(null);
  const locale = i18n.language === 'uk' ? uk : enUS;

  const handleBackPress = () => navigation.goBack();
  const updateAppBadge = useCallback(async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
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
        } else {
          setLoading(false);
          if (error) console.error("PatientMessages: Error getting user session:", error.message);
        }
      } catch (err) {
        setLoading(false);
        console.error("PatientMessages: Unexpected error getting user ID:", err.message);
      }
    };
    getUserId();
  }, []);

  const fetchMessagesFromSupabase = useCallback(async () => {
    if (!currentPatientId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const { data: notificationData, error: notificationError } = await supabase
        .from('patient_notifications')
        .select(`id, title, body, created_at, is_read, notification_type, data, booking_id`)
        .eq('patient_id', currentPatientId)
        .order('created_at', { ascending: false });

      if (notificationError) throw notificationError;

      const unreadMessageIds = notificationData.filter(msg => !msg.is_read).map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        const { error: markAsReadError } = await supabase
          .from('patient_notifications')
          .update({ is_read: true })
          .in('id', unreadMessageIds);
        
        if (markAsReadError) {
          console.error("PatientMessages: Error marking messages as read:", markAsReadError.message);
        }
      }

      const bookingIds = notificationData
        .filter(msg => msg.booking_id && msg.notification_type !== 'admin_announcement')
        .map(msg => msg.booking_id);

      let bookingDetails = {};
      if (bookingIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('patient_bookings')
          .select('id, doctor_id, status, has_feedback_patient, consultation_occurred_patient, booking_date, booking_time_slot, is_paid, meet_link')
          .in('id', bookingIds);
        if (bookingsError) console.error("PatientMessages: Error fetching booking details:", bookingsError.message);
        else bookingsData.forEach(booking => bookingDetails[booking.id] = booking);
      }

      const finalProcessedMessages = new Map();

      for (const msg of notificationData) {
        const bookingInfo = bookingDetails[msg.booking_id] || {};
        
        let formattedDate = '', formattedTime = '';
        try {
          const createdAtDate = parseISO(msg.created_at);
          formattedDate = format(createdAtDate, 'PPP', { locale });
          formattedTime = format(createdAtDate, 'p', { locale });
        } catch (e) {
          const fallbackDate = new Date(msg.created_at);
          formattedDate = fallbackDate.toLocaleDateString(i18n.language);
          formattedTime = fallbackDate.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
        }

        const currentMessage = {
          id: msg.id, title: msg.title, body: msg.body, created_at: msg.created_at,
          date: formattedDate, time: formattedTime,
          is_read: true,
          type: msg.notification_type,
          rawData: msg.data || {}, 
          is_paid: bookingInfo.is_paid || msg.data?.is_paid || false,
          booking_id: msg.booking_id || null,
          amount: msg.data?.amount || 0,
          meet_link: bookingInfo.meet_link || msg.data?.meet_link || null,
          booking_status: bookingInfo.status || null,
          has_feedback_patient: bookingInfo.has_feedback_patient === true,
          // Оновлене поле
          consultation_occurred_patient: bookingInfo.consultation_occurred_patient === true,
          booking_date: bookingInfo.booking_date, 
          booking_time_slot: bookingInfo.booking_time_slot,
        };

        if (currentMessage.type === 'admin_announcement') {
            finalProcessedMessages.set(`admin_${currentMessage.id}`, currentMessage); 
        } else if (currentMessage.booking_id) {
            const existingMessage = finalProcessedMessages.get(currentMessage.booking_id);

            if (!existingMessage) {
                finalProcessedMessages.set(currentMessage.booking_id, currentMessage);
            } else {
                let shouldReplace = false;

                if (currentMessage.type === 'payment_update') {
                    if (existingMessage.type !== 'payment_update' || currentMessage.is_paid > existingMessage.is_paid) {
                        shouldReplace = true;
                    }
                } 
                else if (currentMessage.type === 'booking_rejected') {
                    if (existingMessage.type !== 'booking_rejected') {
                        shouldReplace = true;
                    }
                }
                else if (currentMessage.type === 'booking_confirmed') {
                    if (existingMessage.type !== 'payment_update' && existingMessage.type !== 'booking_rejected') {
                        if (new Date(currentMessage.created_at) > new Date(existingMessage.created_at)) {
                            shouldReplace = true;
                        }
                    }
                }
                if (existingMessage.is_paid && !currentMessage.is_paid) {
                    shouldReplace = false;
                }

                if (shouldReplace) {
                    finalProcessedMessages.set(currentMessage.booking_id, currentMessage);
                }
            }
        }
      }

      const finalMessages = Array.from(finalProcessedMessages.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMessages(finalMessages);
      await updateAppBadge(0);
    } catch (error) {
      Alert.alert(t('error'), `${t('failed_to_load_messages')}: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPatientId, t, i18n.language, updateAppBadge, locale]);

  useFocusEffect(useCallback(() => {
    if (currentPatientId) fetchMessagesFromSupabase();
  }, [currentPatientId, fetchMessagesFromSupabase]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessagesFromSupabase();
  }, [fetchMessagesFromSupabase]);

  const handleLiqPayPayment = useCallback(async (bookingId, amount, description, doctorName) => {
    if (!bookingId || !amount || !description || !currentPatientId) {
      Alert.alert(t('error'), t('liqpay_missing_params'));
      return;
    }
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(t('failed_to_authorize_payment'));
      }
      const userAccessToken = session.access_token;

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', `Bearer ${userAccessToken}`);

      const response = await fetch(LIQPAY_INIT_FUNCTION_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          amount, bookingId, description, patientId: currentPatientId,
          doctorName: doctorName, server_url: LIQPAY_CALLBACK_FUNCTION_URL,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${t('liqpay_payment_init_failed_http')}: ${response.status}. ${errorText}`);
      }
      const jsonResponse = await response.json();
      if (!jsonResponse.success || !jsonResponse.data || !jsonResponse.signature) {
        throw new Error(jsonResponse.error || 'Failed to get LiqPay parameters.');
      }
      const { data, signature } = jsonResponse;
      const liqPayUrl = 'https://www.liqpay.ua/api/3/checkout';
      const formBody = `data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
      const fullUrl = `${liqPayUrl}?${formBody}`;
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
          await Linking.openURL(fullUrl);
          setMessages(prevMessages => prevMessages.map(msg =>
              (msg.booking_id === bookingId && msg.type === 'booking_confirmed' && !msg.is_read)
                  ? { ...msg, is_read: true }
                  : msg
          ));
          updateAppBadge(messages.filter(m => !(m.booking_id === bookingId && m.type === 'booking_confirmed')).filter(m => !m.is_read).length);

      } else {
          throw new Error(`${t('cannot_open_url')}: ${fullUrl}`);
      }
    } catch (error) {
      console.error('Error initializing LiqPay payment:', error);
      Alert.alert(t('error'), `${t('liqpay_payment_init_failed')}: ${error.message}`);
    }
  }, [currentPatientId, t, messages, updateAppBadge]);

  const handleJoinMeet = useCallback(async (meetLink) => {
    if (!meetLink) return Alert.alert(t('error'), t('meet_link_missing'));
    try {
      if (await Linking.canOpenURL(meetLink)) await Linking.openURL(meetLink);
      else Alert.alert(t('error'), `${t('cannot_open_meet_link')}: ${meetLink}`);
    } catch (error) {
      Alert.alert(t('error'), `${t('error_opening_meet_link')}: ${error.message}`);
    }
  }, [t]);

  // Нова функція для підтвердження консультації та ініціації виплати
  const handleConfirmConsultation = useCallback(async (bookingId) => {
    if (!bookingId) return;
    
    Alert.alert(
      t('confirm_consultation_title'),
      t('confirm_consultation_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              if (sessionError || !session?.access_token) {
                throw new Error(t('auth_error'));
              }
                    console.log('Sending bookingId:', bookingId); 

              const response = await fetch(CONFIRM_AND_PAYOUT_FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ bookingId })
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('unknown_error'));
              }

              Alert.alert(t('success'), t('consultation_confirmed_success'));
              // Оновлюємо список повідомлень, щоб відобразити зміну статусу
              fetchMessagesFromSupabase();

            } catch (error) {
              console.error("Error confirming consultation:", error);
              Alert.alert(t('error'), `${t('consultation_confirmed_error')}: ${error.message}`);
            }
          },
        },
      ]
    );
  }, [t, fetchMessagesFromSupabase]);
const handleDeepLink = useCallback(({ url }) => {
    // Цей обробник потрібен для оновлення стану повідомлень
    // після того, як користувач повертається з оплати LiqPay
    setTimeout(() => fetchMessagesFromSupabase(), 1000);
}, [fetchMessagesFromSupabase]);
  const handleSubmitFeedback = useCallback(async (bookingId, consultationOccurred, consultationOnTime, starRating, feedbackText) => {
    try {
      if (!bookingId) throw new Error("Booking ID is required.");
      const { error: updateBookingError } = await supabase.from('patient_bookings').update({
        consultation_occurred_patient: consultationOccurred,
        consultation_on_time_patient: consultationOnTime,
        consultation_rating_patient: starRating,
        consultation_feedback_patient: feedbackText,
        has_feedback_patient: true,
      }).eq('id', bookingId);
      if (updateBookingError) throw updateBookingError;

      Alert.alert(t('success'), t('feedback_modal.feedback_submitted_successfully'));

      const { data: bookingData, error: fetchBookingError } = await supabase.from('patient_bookings').select('doctor_id').eq('id', bookingId).single();
      if (fetchBookingError) console.error("Error fetching doctor_id:", fetchBookingError.message);
      else if (bookingData?.doctor_id) {
        let pointsChange = {5: 50, 4: 25, 3: 0, 2: -25, 1: -50}[starRating] || 0;
        if (pointsChange !== 0) {
          const { error: rpcError } = await supabase.rpc('increment_doctor_points', { doc_id: bookingData.doctor_id, points_to_add: pointsChange });
          if (rpcError) console.error(`Error updating points:`, rpcError.message);
        }
      }
      setMessages(prev => prev.map(msg => msg.booking_id === bookingId ? { ...msg, has_feedback_patient: true, is_read: true } : msg));
      updateAppBadge(messages.filter(m => !(m.booking_id === bookingId)).filter(m => !m.is_read).length);
    } catch (error) {
      Alert.alert(t('error'), `${t('failed_to_submit_feedback')}: ${error.message}`);
    }
  }, [t, messages, updateAppBadge]);

  useEffect(() => {
    if (!currentPatientId) return;
    const sub = Notifications.addNotificationReceivedListener(() => fetchMessagesFromSupabase());
    const resSub = Notifications.addNotificationResponseReceivedListener(() => fetchMessagesFromSupabase());
    const linkSub = Linking.addEventListener('url', handleDeepLink);
    return () => {
      sub.remove();
      resSub.remove();
      linkSub.remove();
    };
  }, [currentPatientId, fetchMessagesFromSupabase, handleDeepLink]);

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EB3EB" />}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesText}>{t("patient_messages_screen.no_messages")}</Text>
              <Text style={styles.emptyMessagesSubText}>{t("patient_messages_screen.waiting_for_updates")}</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isAdminAnnouncement = message.type === 'admin_announcement';
              const showPayButton = !isAdminAnnouncement && message.type === 'booking_confirmed' && !message.is_paid && message.booking_id && message.amount > 0;
              const isPaid = !isAdminAnnouncement && message.is_paid;
              const showJoinMeetButton = !isAdminAnnouncement && isPaid && message.meet_link;
              const isConsultationPast = message.booking_date && message.booking_time_slot && isPast(new Date(`${message.booking_date}T${message.booking_time_slot}`));
              
              // Логіка для нової кнопки
              const showConfirmConsultationButton = isPaid && isConsultationPast && !message.consultation_occurred_patient;
              // Логіка для кнопки відгуку
              const showFeedbackButton = !isAdminAnnouncement && message.booking_id && message.booking_status === 'confirmed' && message.consultation_occurred_patient && !message.has_feedback_patient;
              
              let cardStyle = [styles.messageCard, isAdminAnnouncement ? styles.messageCardAdmin : !message.is_read ? styles.messageCardUnread : styles.messageCardRead];
              if(message.type === 'booking_confirmed') cardStyle.push(styles.messageCardConfirmed)
              else if (message.type === 'booking_rejected') cardStyle.push(styles.messageCardRejected)
              else if (isPaid) cardStyle.push(styles.messageCardPaid)

              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}><Text style={styles.dateText}>{message.date}</Text><Text style={styles.timestampText}>{message.time}</Text></View>
                  <TouchableOpacity activeOpacity={1} style={cardStyle}>
                    <Text style={styles.cardTitle}>{message.title}</Text>
                    <Text style={styles.cardText}>{message.body}</Text>
                    {isAdminAnnouncement && (
                      <View style={styles.adminMessageIndicator}>
                          <Ionicons name="information-circle-outline" size={moderateScale(18)} color="#2196F3" />
                          <Text style={styles.adminMessageText}>{t('admin_announcement_label')}</Text>
                      </View>
                    )}
                    {!isAdminAnnouncement && (
                      <>
                        {message.meet_link && <View style={styles.meetLinkContainer}><Ionicons name="videocam-outline" size={moderateScale(18)} color="#34A853" /><Text style={styles.meetLinkText} onPress={() => handleJoinMeet(message.meet_link)}>{t('meet_link')}: {message.meet_link}</Text></View>}
                        {showPayButton && <TouchableOpacity style={styles.payButton} onPress={() => handleLiqPayPayment(message.booking_id, message.amount, `Оплата консультації з ${message.rawData.doctor_name || 'лікарем'}`, message.rawData.doctor_name)}><Text style={styles.payButtonText}>{t('pay_now')} {message.amount} {t('USD')}</Text></TouchableOpacity>}
                        {showJoinMeetButton && <TouchableOpacity style={styles.joinMeetButton} onPress={() => handleJoinMeet(message.meet_link)}><Ionicons name="videocam-outline" size={moderateScale(20)} color="#FFFFFF" style={styles.joinMeetIcon} /><Text style={styles.joinMeetButtonText}>{t('join_meet_call')}</Text></TouchableOpacity>}
                        
                        {/* Кнопка "Підтвердити консультацію" */}
                        {showConfirmConsultationButton && (
                          <TouchableOpacity
                              style={styles.confirmButton}
                              onPress={() => handleConfirmConsultation(message.booking_id)}
                          >
                              <Text style={styles.confirmButtonText}>
                                  {t('confirm_consultation_button')}
                              </Text>
                          </TouchableOpacity>
                        )}

                        {/* Кнопка "Залишити відгук" */}
                        {showFeedbackButton && <TouchableOpacity style={styles.feedbackButton} onPress={() => { setCurrentBookingIdForFeedback(message.booking_id); setIsFeedbackModalVisible(true); }}><Text style={styles.feedbackButtonText}>{t('leave_feedback_button')}</Text></TouchableOpacity>}
                        {message.has_feedback_patient && <View style={styles.feedbackLeftButton}><Text style={styles.feedbackLeftButtonText}>{t('feedback_left')}</Text></View>}
                        {isPaid && !showPayButton && !showJoinMeetButton && !showFeedbackButton && !message.has_feedback_patient && message.type !== 'booking_rejected' && <View style={styles.paidButton}><Text style={styles.paidButtonText}>{t('paid')}</Text></View>}
                      </>
                    )}
                    <View style={styles.messageActionsRow}>
                      <Text style={styles.readStatusText}>{t('read')}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <FeedbackModal isVisible={isFeedbackModalVisible} onClose={() => setIsFeedbackModalVisible(false)} onSubmit={handleSubmitFeedback} initialBookingId={currentBookingIdForFeedback} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10, backgroundColor: '#F5F7FA' },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(15), paddingVertical: verticalScale(5) },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: moderateScale(25), width: moderateScale(48), height: moderateScale(48), justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(20), color: "#333" },
  headerIconContainer: { width: moderateScale(50), height: moderateScale(50), justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: verticalScale(10), fontSize: moderateScale(16), color: '#555', fontFamily: 'Mont-Medium' },
  emptyMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: height * 0.2 },
  emptyMessagesText: { fontFamily: 'Mont-Bold', fontSize: moderateScale(20), color: '#777', marginBottom: verticalScale(12), textAlign: 'center' },
  emptyMessagesSubText: { fontFamily: 'Mont-Regular', fontSize: moderateScale(16), color: '#999', textAlign: 'center', paddingHorizontal: moderateScale(30), lineHeight: moderateScale(24) },
  messageList: { paddingVertical: verticalScale(20), paddingHorizontal: moderateScale(15), flexGrow: 1, backgroundColor: '#F5F7FA' },
  messageGroup: { marginBottom: verticalScale(20) },
  dateAndTimestamp: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(8), paddingHorizontal: moderateScale(5) },
  dateText: { fontSize: moderateScale(14), fontWeight: '600', color: '#666', fontFamily: 'Mont-SemiBold' },
  timestampText: { fontSize: moderateScale(14), color: '#888', fontFamily: 'Mont-Regular' },
  messageCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(15), padding: moderateScale(18), shadowColor: '#000', shadowOffset: { width: 0, height: verticalScale(2) }, shadowOpacity: 0.15, shadowRadius: moderateScale(5), elevation: 5, borderLeftWidth: moderateScale(5) },
  messageCardUnread: { borderLeftColor: '#0EB3EB' },
  messageCardRead: { borderLeftColor: '#cccccc' },
  messageCardConfirmed: { borderLeftColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  messageCardRejected: { borderLeftColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  messageCardPaid: { borderLeftColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  messageCardMeetLinkUpdate: { borderLeftColor: '#9C27B0', backgroundColor: '#F3E5F5' },
  messageCardAdmin: { borderLeftColor: '#2196F3', backgroundColor: '#E3F2FD' },
  cardTitle: { fontSize: moderateScale(18), fontFamily: 'Mont-Bold', color: '#333', marginBottom: verticalScale(8) },
  cardText: { fontSize: moderateScale(15), fontFamily: 'Mont-Regular', color: '#555', lineHeight: moderateScale(22) },
  meetLinkContainer: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), backgroundColor: '#F0FDF4', padding: moderateScale(10), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#A5D6A7' },
  meetLinkText: { fontSize: moderateScale(14), fontFamily: 'Mont-Medium', color: '#2E7D32', marginLeft: moderateScale(8), flexShrink: 1 },
  payButton: { marginTop: verticalScale(15), backgroundColor: '#0EB3EB', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#0EB3EB', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  payButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  joinMeetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(15), backgroundColor: '#34A853', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), shadowColor: '#34A853', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  joinMeetIcon: { marginRight: moderateScale(8) },
  joinMeetButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  feedbackButton: { marginTop: verticalScale(15), backgroundColor: '#FFC107', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC107', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  feedbackButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  feedbackLeftButton: { marginTop: verticalScale(15), backgroundColor: '#E0E0E0', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center' },
  feedbackLeftButtonText: { color: '#757575', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  paidButton: { marginTop: verticalScale(15), backgroundColor: '#A5D6A7', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center' },
  paidButtonText: { color: '#1B5E20', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  // Нові стилі для кнопки підтвердження
  confirmButton: { 
    marginTop: verticalScale(15), 
    backgroundColor: '#2E7D32', // Темно-зелений
    paddingVertical: verticalScale(12), 
    borderRadius: moderateScale(10), 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#2E7D32', 
    shadowOffset: { width: 0, height: verticalScale(4) }, 
    shadowOpacity: 0.3, 
    shadowRadius: moderateScale(5), 
    elevation: 8 
  },
  confirmButtonText: { 
    color: '#FFFFFF', 
    fontSize: moderateScale(16), 
    fontFamily: 'Mont-SemiBold' 
  },
  messageActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: verticalScale(15), borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: verticalScale(10) },
  readStatusText: { fontSize: moderateScale(13), fontFamily: 'Mont-Medium', color: '#757575' },
  markAsReadButton: { backgroundColor: 'rgba(14, 179, 235, 0.1)', paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), borderRadius: moderateScale(20) },
  markAsReadButtonText: { color: '#0EB3EB', fontSize: moderateScale(13), fontFamily: 'Mont-SemiBold' },
  adminMessageIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: moderateScale(8), alignSelf: 'flex-start' },
  adminMessageText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(13), color: '#2196F3', marginLeft: moderateScale(5) },
});