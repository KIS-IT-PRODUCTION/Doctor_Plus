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
import { parseISO, format } from 'date-fns';
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

const INIT_PAYMENT_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/init-liqpay-payment';
const CAPTURE_PAYMENT_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/capture-liqpay-payment';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentPatientId(user.id);
      } else {
        setLoading(false);
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
        .select(`
          id, title, body, created_at, is_read, notification_type, data, booking_id,
          booking:patient_bookings (
              id, status, is_paid, meet_link, has_feedback_patient, 
              consultation_occurred_patient, booking_date, booking_time_slot,
              payment_status 
          )
        `)
        .eq('patient_id', currentPatientId)
        .order('created_at', { ascending: false });

      if (notificationError) throw notificationError;

      const unreadMessageIds = notificationData.filter(msg => !msg.is_read).map(msg => msg.id);
      if (unreadMessageIds.length > 0) {
        await supabase.from('patient_notifications').update({ is_read: true }).in('id', unreadMessageIds);
      }

      const finalProcessedMessages = new Map();
      for (const msg of notificationData) {
        const bookingInfo = msg.booking;
        if (!msg.booking_id || !finalProcessedMessages.has(msg.booking_id)) {
          const currentMessage = {
            id: msg.id,
            title: msg.title,
            body: msg.body,
            created_at: msg.created_at,
            date: format(parseISO(msg.created_at), 'PPP', { locale }),
            time: format(parseISO(msg.created_at), 'p', { locale }),
            type: msg.notification_type,
            booking_id: msg.booking_id,
            is_paid: bookingInfo?.is_paid ?? false,
            amount: msg.data?.amount ?? 1,
            meet_link: bookingInfo?.meet_link,
            booking_status: bookingInfo?.status,
            payment_status: bookingInfo?.payment_status,
            has_feedback_patient: bookingInfo?.has_feedback_patient ?? false,
            consultation_occurred_patient: bookingInfo?.consultation_occurred_patient ?? false,
          };
          if (currentMessage.booking_id) {
            finalProcessedMessages.set(currentMessage.booking_id, currentMessage);
          } else {
            finalProcessedMessages.set(currentMessage.id, currentMessage);
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

  const handleHoldPayment = useCallback(async (bookingId) => {
    if (!bookingId) {
      Alert.alert(t('error'), 'Missing booking ID');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(t('auth_error'));
      }

      const response = await fetch(INIT_PAYMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to get payment data.');
      }
      
      const { data, signature } = responseData;
      const liqPayUrl = 'https://www.liqpay.ua/api/3/checkout';
      const formBody = `data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
      const fullUrl = `${liqPayUrl}?${formBody}`;

      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        throw new Error(`${t('cannot_open_url')}: ${fullUrl}`);
      }
    } catch (error) {
      console.error('Error initializing LiqPay hold payment:', error);
      Alert.alert(t('error'), `Payment initialization failed: ${error.message}`);
    }
  }, [t]);

  const handleJoinMeet = useCallback(async (meetLink) => {
    if (!meetLink) return Alert.alert(t('error'), t('meet_link_missing'));
    try {
      if (await Linking.canOpenURL(meetLink)) {
        await Linking.openURL(meetLink);
      } else {
        Alert.alert(t('error'), `${t('cannot_open_meet_link')}: ${meetLink}`);
      }
    } catch (error) {
      Alert.alert(t('error'), `${t('error_opening_meet_link')}: ${error.message}`);
    }
  }, [t]);
  
const handleConfirmConsultation = useCallback(async (bookingId) => {
    if (!bookingId) return;

    // ✅ Оптимістичне оновлення UI: одразу змінюємо вигляд картки на "обробка"
    setMessages(prev => prev.map(msg => 
      msg.booking_id === bookingId ? { ...msg, payment_status: 'processing' } : msg
    ));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(t('auth_error'));
      }
      const response = await fetch(CAPTURE_PAYMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || t('unknown_error'));
      }
      Alert.alert(t('success'), responseData.message || t('consultation_confirmed_success'));
      // Запускаємо оновлення через деякий час, щоб callback від LiqPay встиг спрацювати
      setTimeout(() => fetchMessagesFromSupabase(), 3000);
    } catch (error) {
      console.error("Error confirming consultation:", error);
      Alert.alert(t('error'), `${t('consultation_confirmed_error')}: ${error.message}`);
      // У випадку помилки повертаємо інтерфейс до початкового стану
      fetchMessagesFromSupabase();
    }
  }, [t, fetchMessagesFromSupabase]);

  const handleDeepLink = useCallback(({ url }) => {
    setTimeout(() => fetchMessagesFromSupabase(), 3000);
  }, [fetchMessagesFromSupabase]);

  const handleSubmitFeedback = useCallback(async (bookingId, consultationOccurred, consultationOnTime, starRating, feedbackText) => {
    try {
      if (!bookingId) throw new Error("Booking ID is required.");
      const { error } = await supabase.from('patient_bookings').update({
        consultation_occurred_patient: consultationOccurred,
        consultation_on_time_patient: consultationOnTime,
        consultation_rating_patient: starRating,
        consultation_feedback_patient: feedbackText,
        has_feedback_patient: true,
      }).eq('id', bookingId);
      if (error) throw error;
      Alert.alert(t('success'), t('feedback_modal.feedback_submitted_successfully'));
      fetchMessagesFromSupabase();
    } catch (error) {
      Alert.alert(t('error'), `${t('failed_to_submit_feedback')}: ${error.message}`);
    }
  }, [t, fetchMessagesFromSupabase]);

  useEffect(() => {
    if (!currentPatientId) return;
    const sub = Notifications.addNotificationReceivedListener(fetchMessagesFromSupabase);
    const resSub = Notifications.addNotificationResponseReceivedListener(fetchMessagesFromSupabase);
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
      {loading ? (
        <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#0EB3EB" /></View>
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
              const isPaid = message.is_paid;
              const isHeld = message.payment_status === 'hold_wait';
              const isProcessing = message.payment_status === 'processing';
              const isRejected = message.booking_status === 'rejected';

              const showPayButton = !isAdminAnnouncement && message.booking_status === 'confirmed' && !isPaid && !isHeld && !isProcessing;
              const showJoinMeetButton = !isAdminAnnouncement && (isPaid || isHeld) && message.meet_link;
              const showConfirmButton = isHeld && !isPaid && !isProcessing;
              const showFeedbackButton = isPaid && message.consultation_occurred_patient && !message.has_feedback_patient;
              
              let cardStyle = [styles.messageCard];
              if (isAdminAnnouncement) {
                cardStyle.push(styles.messageCardAdmin);
              } else if (isRejected) {
                cardStyle.push(styles.messageCardRejected);
              } else if (isPaid) {
                cardStyle.push(styles.messageCardPaid);
              } else if (isHeld || isProcessing) {
                cardStyle.push(styles.messageCardHeld);
              } else if (message.booking_status === 'confirmed') {
                cardStyle.push(styles.messageCardConfirmed);
              } else {
                cardStyle.push(styles.messageCardRead);
              }

              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}><Text style={styles.dateText}>{message.date}</Text><Text style={styles.timestampText}>{message.time}</Text></View>
                  <View style={cardStyle}>
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
                        {message.meet_link && 
                          <TouchableOpacity onPress={() => handleJoinMeet(message.meet_link)}>
                            <View style={styles.meetLinkContainer}>
                              <Ionicons name="videocam-outline" size={moderateScale(18)} color="#34A853" />
                              <Text style={styles.meetLinkText}>{t('meet_link')}: {message.meet_link}</Text>
                            </View>
                          </TouchableOpacity>
                        }

                        {showPayButton && 
                          <TouchableOpacity style={styles.payButton} onPress={() => handleHoldPayment(message.booking_id)}>
                            <Text style={styles.payButtonText}>{t('pay_and_hold_funds')}</Text>
                          </TouchableOpacity>
                        }
                        
                        {(isHeld || isProcessing) && !isPaid && (
                          <View style={styles.heldInfoContainer}>
                            <Ionicons name="lock-closed-outline" size={moderateScale(16)} color="#FFA000" />
                            <Text style={styles.heldInfoText}>
                              {isProcessing ? t('payment_processing') : t('funds_are_held')}
                            </Text>
                            {isProcessing && <ActivityIndicator size="small" color="#FFA000" style={{marginLeft: 10}} />}
                          </View>
                        )}

                        {showJoinMeetButton && 
                          <TouchableOpacity style={styles.joinMeetButton} onPress={() => handleJoinMeet(message.meet_link)}>
                            <Ionicons name="videocam-outline" size={moderateScale(20)} color="#FFFFFF" style={styles.joinMeetIcon} />
                            <Text style={styles.joinMeetButtonText}>{t('join_meet_call')}</Text>
                          </TouchableOpacity>
                        }
                        
                        {showConfirmButton && 
                          <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirmConsultation(message.booking_id)}>
                            <Text style={styles.confirmButtonText}>{t('confirm_consultation_and_pay')}</Text>
                          </TouchableOpacity>
                        }
                        
                        {showFeedbackButton && 
                          <TouchableOpacity style={styles.feedbackButton} onPress={() => { setCurrentBookingIdForFeedback(message.booking_id); setIsFeedbackModalVisible(true); }}>
                            <Text style={styles.feedbackButtonText}>{t('leave_feedback_button')}</Text>
                          </TouchableOpacity>
                        }

                        {message.has_feedback_patient && 
                          <View style={styles.feedbackLeftButton}>
                            <Text style={styles.feedbackLeftButtonText}>{t('feedback_left')}</Text>
                          </View>
                        }

                        {isPaid && !showFeedbackButton && 
                          <View style={styles.paidButton}>
                            <Text style={styles.paidButtonText}>{t('paid_successfully')}</Text>
                          </View>
                        }
                      </>
                    )}
                    <View style={styles.messageActionsRow}>
                      <Text style={styles.readStatusText}>{t('read')}</Text>
                    </View>
                  </View>
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
  emptyMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: height * 0.2 },
  emptyMessagesText: { fontFamily: 'Mont-Bold', fontSize: moderateScale(20), color: '#777', marginBottom: verticalScale(12), textAlign: 'center' },
  emptyMessagesSubText: { fontFamily: 'Mont-Regular', fontSize: moderateScale(16), color: '#999', textAlign: 'center', paddingHorizontal: moderateScale(30), lineHeight: moderateScale(24) },
  messageList: { paddingVertical: verticalScale(20), paddingHorizontal: moderateScale(15), flexGrow: 1, backgroundColor: '#F5F7FA' },
  messageGroup: { marginBottom: verticalScale(20) },
  dateAndTimestamp: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(8), paddingHorizontal: moderateScale(5) },
  dateText: { fontSize: moderateScale(14), fontWeight: '600', color: '#666', fontFamily: 'Mont-SemiBold' },
  timestampText: { fontSize: moderateScale(14), color: '#888', fontFamily: 'Mont-Regular' },
  messageCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(15), padding: moderateScale(18), shadowColor: '#000', shadowOffset: { width: 0, height: verticalScale(2) }, shadowOpacity: 0.15, shadowRadius: moderateScale(5), elevation: 5, borderLeftWidth: moderateScale(5) },
  messageCardRead: { borderLeftColor: '#cccccc' },
  messageCardConfirmed: { borderLeftColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  messageCardRejected: { borderLeftColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  messageCardPaid: { borderLeftColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  messageCardHeld: { borderLeftColor: '#FFA000', backgroundColor: '#FFF8E1' },
  messageCardAdmin: { borderLeftColor: '#2196F3', backgroundColor: '#E3F2FD' },
  cardTitle: { fontSize: moderateScale(18), fontFamily: 'Mont-Bold', color: '#333', marginBottom: verticalScale(8) },
  cardText: { fontSize: moderateScale(15), fontFamily: 'Mont-Regular', color: '#555', lineHeight: moderateScale(22) },
  meetLinkContainer: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), backgroundColor: '#F0FDF4', padding: moderateScale(10), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#A5D6A7' },
  meetLinkText: { fontSize: moderateScale(14), fontFamily: 'Mont-Medium', color: '#2E7D32', marginLeft: moderateScale(8), flexShrink: 1, textDecorationLine: 'underline' },
  payButton: { marginTop: verticalScale(15), backgroundColor: '#0EB3EB', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#0EB3EB', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  payButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  joinMeetButton: { marginTop: verticalScale(15), backgroundColor: '#34A853', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#34A853', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  joinMeetIcon: { marginRight: moderateScale(8) },
  joinMeetButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  feedbackButton: { marginTop: verticalScale(15), backgroundColor: '#FFC107', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC107', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  feedbackButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  feedbackLeftButton: { marginTop: verticalScale(15), backgroundColor: '#E0E0E0', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center' },
  feedbackLeftButtonText: { color: '#757575', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  paidButton: { marginTop: verticalScale(15), backgroundColor: '#A5D6A7', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center' },
  paidButtonText: { color: '#1B5E20', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  confirmButton: { marginTop: verticalScale(15), backgroundColor: '#2E7D32', paddingVertical: verticalScale(12), borderRadius: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(5), elevation: 8 },
  confirmButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontFamily: 'Mont-SemiBold' },
  messageActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: verticalScale(15), borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: verticalScale(10) },
  readStatusText: { fontSize: moderateScale(13), fontFamily: 'Mont-Medium', color: '#757575' },
  adminMessageIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: moderateScale(8), alignSelf: 'flex-start' },
  adminMessageText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(13), color: '#2196F3', marginLeft: moderateScale(5) },
  heldInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(15),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(15),
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    borderRadius: moderateScale(8),
  },
  heldInfoText: {
    fontFamily: 'Mont-SemiBold',
    fontSize: moderateScale(14),
    color: '#FFA000',
    marginLeft: moderateScale(10),
  },
});