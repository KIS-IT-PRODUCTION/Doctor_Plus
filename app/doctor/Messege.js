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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from "expo-notifications";
import { supabase } from "../../providers/supabaseClient";
import { parseISO, format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import ConsultationCompletionModal from "../../components/ConsultationCompletionModal";

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function DoctorMessages() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t("doctor"));
  
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessageForCompletion, setSelectedMessageForCompletion] = useState(null);

  const notificationReceivedListener = useRef(null);
  const locale = i18n.language === "uk" ? uk : enUS;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const fetchMessagesFromSupabase = useCallback(
    async (doctorUserId, isRefreshing = false) => {
      if (!doctorUserId) {
        if (!isRefreshing) setLoading(false);
        else setRefreshing(false);
        return;
      }

      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);

      try {
        const { data: doctorNotifications, error: doctorError } = await supabase
          .from("doctor_notifications")
          .select("*, booking_id")
          .eq("doctor_id", doctorUserId)
          .order("created_at", { ascending: false });

        if (doctorError) throw doctorError;

        const unreadIds = doctorNotifications
          .filter((n) => !n.is_read)
          .map((n) => n.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("doctor_notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
        }

        const bookingIds = doctorNotifications
          .map((n) => n.booking_id || n.data?.booking_id)
          .filter((id) => id);

        let bookingsMap = {};
        if (bookingIds.length > 0) {
          const { data: freshBookings } = await supabase
            .from("patient_bookings")
            .select("id, meet_link, status, is_paid, status_meet, doctor_feedback")
            .in("id", bookingIds);

          if (freshBookings) {
            freshBookings.forEach((b) => {
              bookingsMap[b.id] = b;
            });
          }
        }

        const formattedMessages = [];
        const processedBookingIds = new Set();

        doctorNotifications.forEach((notif) => {
          const rawData = notif.data || {};
          const bookingId = notif.booking_id || rawData.booking_id;
          
          if (bookingId) {
            if (processedBookingIds.has(bookingId)) {
                return; 
            }
            processedBookingIds.add(bookingId);
          }

          const messageType = rawData.type || notif.type || "general";
          const freshBooking = bookingId ? (bookingsMap[bookingId] || {}) : {};
          
          const actualStatus = freshBooking.status || rawData.status || rawData.payment_status || "pending";
          const actualMeetLink = freshBooking.meet_link || rawData.meet_link || "";
          const actualIsPaid = freshBooking.is_paid !== undefined ? freshBooking.is_paid : rawData.is_paid;
          
          const actualStatusMeet = freshBooking.status_meet !== undefined ? freshBooking.status_meet : rawData.status_meet;

          let formattedDate = "", formattedTime = "";
          try {
            const createdAtDate = parseISO(notif.created_at);
            formattedDate = format(createdAtDate, "PPP", { locale });
            formattedTime = format(createdAtDate, "p", { locale });
          } catch (dateError) {
             const d = new Date(notif.created_at);
            formattedDate = d.toLocaleDateString();
            formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          formattedMessages.push({
            id: notif.id,
            db_id: notif.id,
            title: notif.title,
            body: notif.body,
            date: formattedDate,
            time: formattedTime,
            is_read: true,
            type: messageType,
            rawData: { 
                ...rawData, 
                status: actualStatus, 
                meet_link: actualMeetLink,
                is_paid: actualIsPaid,
                messageType: messageType,
                booking_id: bookingId,
                status_meet: actualStatusMeet 
            },
            meetLinkInput: actualMeetLink,
            booking_id: bookingId,
          });
        });

        setMessages(formattedMessages);
        await Notifications.setBadgeCountAsync(0);
      } catch (error) {
        console.error("Error fetching messages:", error.message);
      } finally {
        if (!isRefreshing) setLoading(false);
        else setRefreshing(false);
      }
    },
    [t, i18n.language, locale]
  );

  const onRefresh = useCallback(() => {
    if (currentDoctorUserId) fetchMessagesFromSupabase(currentDoctorUserId, true);
    else setRefreshing(false);
  }, [currentDoctorUserId, fetchMessagesFromSupabase]);

  useEffect(() => {
    const getDoctorData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentDoctorUserId(user.id);
        const { data: doctorProfile } = await supabase.from("profile_doctor").select("full_name").eq("user_id", user.id).single();
        if (doctorProfile?.full_name) setDoctorFullName(doctorProfile.full_name);
      }
    };
    getDoctorData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentDoctorUserId) fetchMessagesFromSupabase(currentDoctorUserId);
      Notifications.setBadgeCountAsync(0);
    }, [currentDoctorUserId, fetchMessagesFromSupabase])
  );

  useEffect(() => {
    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(() => {
      if (currentDoctorUserId) fetchMessagesFromSupabase(currentDoctorUserId, true);
    });
    return () => {
      if (notificationReceivedListener.current) Notifications.removeNotificationSubscription(notificationReceivedListener.current);
    };
  }, [currentDoctorUserId, fetchMessagesFromSupabase]);

  const markAsRead = useCallback(async (messageId) => {
    setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, is_read: true } : msg));
    await supabase.from("doctor_notifications").update({ is_read: true }).eq("id", messageId);
  }, []);

  const updateBookingStatusAndNotify = useCallback(async (message, newStatus) => {
      let bookingId = message.booking_id;
      let patientId = message.rawData.patient_id;
      
      setMessages(prev => prev.map(m => m.id === message.id ? { 
          ...m, 
          rawData: { ...m.rawData, status: newStatus },
          is_read: true 
      } : m));

      if (!bookingId || !currentDoctorUserId) return Alert.alert(t("error"), t("invalid_booking_data_for_update"));

      let { booking_date, booking_time_slot, consultation_duration_minutes } = message.rawData;

      if (!patientId || !booking_date || !booking_time_slot) {
         const { data: bd } = await supabase.from('patient_bookings').select('*').eq('id', bookingId).single();
         if (bd) {
            patientId = bd.patient_id;
            booking_date = bd.booking_date;
            booking_time_slot = bd.booking_time_slot;
            consultation_duration_minutes = bd.consultation_duration_minutes;
         }
      }

      try {
        await supabase.from("patient_bookings").update({ status: newStatus }).eq("id", bookingId);

        if (newStatus === "rejected") {
          const { data: doc } = await supabase.from("profile_doctor").select("doctor_points").eq("user_id", currentDoctorUserId).single();
          if (doc) {
             await supabase.from("profile_doctor").update({ doctor_points: Math.max(0, (doc.doctor_points || 0) - 50) }).eq("user_id", currentDoctorUserId);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        const payload = {
          booking: {
            id: bookingId,
            patient_id: patientId,
            doctor_id: currentDoctorUserId,
            status: newStatus,
            booking_date, booking_time_slot, consultation_duration_minutes,
            amount: 0, is_paid: false, meet_link: null
          },
          doctor_name: doctorFullName,
        };
        
        if (newStatus === 'confirmed') {
            const { data: bDetails } = await supabase.from("patient_bookings").select("amount, is_paid, meet_link").eq("id", bookingId).maybeSingle();
            if (bDetails) {
                payload.booking.amount = bDetails.amount;
                payload.booking.is_paid = bDetails.is_paid;
                payload.booking.meet_link = bDetails.meet_link;
            }
        }

        await fetch("https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/handle-booking-status-update", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify(payload),
        });

        Alert.alert(t("success"), newStatus === "confirmed" ? t("booking_confirmed_successfully_message") : t("booking_rejected_successfully_message"));
        fetchMessagesFromSupabase(currentDoctorUserId);

      } catch (error) {
        Alert.alert(t("error"), error.message);
        fetchMessagesFromSupabase(currentDoctorUserId);
      }
  }, [t, currentDoctorUserId, doctorFullName, fetchMessagesFromSupabase]);

  const handleConfirmBooking = (msg) => {
    Alert.alert(t("confirm_booking_title"), t("confirm_booking_message_doctor"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("confirm"), onPress: () => updateBookingStatusAndNotify(msg, "confirmed") },
    ]);
  };

  const handleRejectBooking = (msg) => {
    Alert.alert(t("reject_booking_title"), t("reject_booking_message_doctor"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("reject"), onPress: () => updateBookingStatusAndNotify(msg, "rejected") },
    ]);
  };

  const handleSendMeetLink = async (message) => {
    const meetLink = message.meetLinkInput;
    if (!meetLink || !meetLink.trim().startsWith("https://")) return Alert.alert(t("error"), t("invalid_meet_link_format"));

    const bookingId = message.booking_id;
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, rawData: { ...m.rawData, meet_link: meetLink } } : m));

    try {
        await supabase.from("patient_bookings").update({ meet_link: meetLink }).eq("id", bookingId);
        
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
                type: "meet_link_update",
                patient_id: message.rawData.patient_id,
                booking_id: bookingId,
                meet_link: meetLink,
                doctor_name: doctorFullName,
                booking_date: message.rawData.booking_date,
                booking_time_slot: message.rawData.booking_time_slot,
            }),
        });

        Alert.alert(t("success"), t("meet_link_sent_successfully"));
        fetchMessagesFromSupabase(currentDoctorUserId);
    } catch (e) {
        Alert.alert(t("error"), e.message);
    }
  };

  const handleCompleteConsultation = (message) => {
    setSelectedMessageForCompletion(message);
    setIsModalVisible(true);
  };

  const handleModalSubmit = async (data) => {
      setLoadingCompletion(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const msg = selectedMessageForCompletion;
          const bookingId = msg.booking_id || msg.rawData.booking_id;
          
          if (!bookingId) throw new Error("Booking ID is missing");

          const { error: dbError } = await supabase
            .from("patient_bookings")
            .update({
                status_meet: true,
                consultation_ended_at: new Date().toISOString(),
                consultation_conducted: data.conducted,
                consultation_started_on_time: data.onTime,
                doctor_feedback: data.feedback
            })
            .eq("id", bookingId);

          if (dbError) throw dbError;
          
          await fetch("https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({
                  type: "consultation_completed",
                  booking_id: bookingId,
                  patient_id: msg.rawData.patient_id,
                  doctor_name: doctorFullName,
                  booking_date: msg.rawData.booking_date,
                  booking_time_slot: msg.rawData.booking_time_slot,
                  ...data
              }),
          });
          
          Alert.alert(t("success"), t("consultation_completed_successfully"));
          
          setMessages(prev => prev.map(m => m.id === msg.id ? { 
              ...m, 
              rawData: { 
                  ...m.rawData, 
                  status_meet: true,
                  doctor_feedback: data.feedback 
              } 
          } : m));

          fetchMessagesFromSupabase(currentDoctorUserId);
      } catch (e) {
          Alert.alert(t("error"), e.message);
      } finally {
          setLoadingCompletion(false);
          setIsModalVisible(false);
      }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#0EB3EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("messages_screen.header_title")}</Text>
        <View style={{ width: 48 }}><Icon width={moderateScale(40)} height={moderateScale(40)} /></View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0EB3EB" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.messageList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EB3EB" />}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
               <Text style={styles.emptyMessagesText}>{t("messages_screen.no_messages")}</Text>
               <Text style={styles.emptyMessagesSubText}>{t("messages_screen.waiting_for_bookings")}</Text>
            </View>
          ) : (
            messages.map((message) => {
              const { status, type, is_paid, meet_link, status_meet, messageType } = message.rawData;
              
              const isPending = type === "new_booking" && status === "pending";
              const isConfirmed = status === "confirmed";
              const isRejected = status === "rejected";
              const isAdminAnnouncement = type === "admin_announcement";
              const isCompleted = status_meet === true;
              
              const isHeld = status === "hold_wait" || messageType === "payment_hold";
              
              const canInteractWithLink = (is_paid === true || isHeld) && !isCompleted && !isRejected;

              let cardStyle = [styles.messageCard];
              if (isAdminAnnouncement) {
                cardStyle.push(styles.messageCardAdmin);
              } else if (isRejected) {
                cardStyle.push(styles.messageCardRejected);
              } else if (isCompleted) {
                cardStyle.push(styles.messageCardCompleted);
              } else if (is_paid || isConfirmed) {
                cardStyle.push(styles.messageCardConfirmed);
              } else if (isHeld) {
                cardStyle.push(styles.messageCardHeld);
              }

              return (
                <View key={message.id} style={styles.messageGroup}>
                  <View style={styles.dateAndTimestamp}>
                    <Text style={styles.dateText}>{message.date}</Text>
                    <Text style={styles.timestampText}>{message.time}</Text>
                  </View>

                  <View style={cardStyle}>
                    <Text style={styles.messageTitle}>{message.title}</Text>
                    <Text style={styles.messageBody}>{message.body}</Text>

                    {isAdminAnnouncement && (
                      <View style={styles.adminMessageIndicator}>
                        <Ionicons name="information-circle-outline" size={moderateScale(18)} color="#2196F3" />
                        <Text style={styles.adminMessageText}>{t("admin_announcement_label")}</Text>
                      </View>
                    )}

                    {!isAdminAnnouncement && (
                        <>
                             {isHeld && !isCompleted && (
                                <View style={styles.heldInfoContainer}>
                                    <Ionicons name="lock-closed-outline" size={moderateScale(16)} color="#FFA000" />
                                    <Text style={styles.heldInfoText}>{t('funds_are_held') || "Кошти зарезервовано. Ви можете надіслати посилання."}</Text>
                                </View>
                             )}

                             {isPending && (
                                 <View style={styles.bookingActionButtons}>
                                      <TouchableOpacity style={[styles.actionButtonContainer, { backgroundColor: '#4CAF50' }]} onPress={() => handleConfirmBooking(message)}>
                                          <View style={styles.actionButtonGradient}>
                                              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF"/>
                                              <Text style={styles.actionButtonText}>{t("confirm")}</Text>
                                          </View>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.actionButtonContainer, { backgroundColor: '#D32F2F' }]} onPress={() => handleRejectBooking(message)}>
                                          <View style={styles.actionButtonGradient}>
                                              <Ionicons name="close-circle-outline" size={20} color="#FFF"/>
                                              <Text style={styles.actionButtonText}>{t("reject")}</Text>
                                          </View>
                                      </TouchableOpacity>
                                 </View>
                             )}

                             {canInteractWithLink && (
                                 <View style={styles.meetLinkInputContainer}>
                                      <TextInput 
                                         style={styles.meetLinkInput}
                                         placeholder={t("enter_meet_link_placeholder") || "https://meet.google.com/..."}
                                         value={message.meetLinkInput}
                                         onChangeText={(text) => setMessages(prev => prev.map(m => m.id === message.id ? { ...m, meetLinkInput: text } : m))}
                                         autoCapitalize="none"
                                      />
                                      <TouchableOpacity 
                                         style={styles.sendMeetLinkButton} 
                                         onPress={() => handleSendMeetLink(message)}
                                      >
                                          <View style={[styles.sendMeetLinkButtonGradient, { backgroundColor: '#0EB3EB' }]}>
                                              <Ionicons name="send" size={18} color="#FFF" />
                                          </View>
                                      </TouchableOpacity>
                                 </View>
                             )}

                             {meet_link && meet_link.length > 5 && (
                                <TouchableOpacity style={[styles.meetLinkButton, { backgroundColor: '#34A853' }]} onPress={() => Linking.openURL(meet_link)}>
                                    <View style={styles.meetLinkButtonGradient}>
                                        <Ionicons name="videocam-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
                                        <Text style={styles.meetLinkButtonText}>{t("join_meet")}</Text>
                                    </View>
                                </TouchableOpacity>
                             )}

                             {canInteractWithLink && meet_link && meet_link.length > 5 && (
                                 <TouchableOpacity style={[styles.completeConsultationButton, { backgroundColor: '#FFC107' }]} onPress={() => handleCompleteConsultation(message)}>
                                      <View style={styles.completeConsultationButtonGradient}>
                                         <Text style={styles.completeConsultationButtonText}>{t("complete_consultation")}</Text>
                                      </View>
                                 </TouchableOpacity>
                             )}

                             {isCompleted && (
                                 <View style={styles.consultationCompletedIndicator}>
                                     <Ionicons name="checkmark-done-circle" size={moderateScale(18)} color="#00897B" />
                                     <Text style={styles.consultationCompletedText}>{t("consultation_completed_indicator")}</Text>
                                 </View>
                             )}

                             {isRejected && (
                                 <Text style={[styles.statusText, styles.rejectedText]}>{t("booking_status_rejected")}</Text>
                             )}
                        </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      
      <ConsultationCompletionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleModalSubmit}
        isLoading={loadingCompletion}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f2f5", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(16), paddingVertical: verticalScale(2), backgroundColor: "#f0f2f5" },
  backButton: { backgroundColor: "#F0F0F0", borderRadius: moderateScale(25), width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(20), color: "#333" },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  messageList: { padding: moderateScale(16), paddingBottom: verticalScale(100) },
  messageGroup: { marginBottom: verticalScale(20) },
  
  dateAndTimestamp: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: verticalScale(8), paddingHorizontal: moderateScale(10) },
  dateText: { fontFamily: "Mont-Medium", fontSize: moderateScale(13), color: "#777" },
  timestampText: { fontFamily: "Mont-Regular", fontSize: moderateScale(11), color: "#999" },
  
  messageCard: { borderRadius: moderateScale(12), padding: moderateScale(18), backgroundColor: '#FFF', shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: '#e0e0e0', borderLeftWidth: 5 },
  
  messageCardRead: { borderLeftColor: '#cccccc' },
  messageCardConfirmed: { borderLeftColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  messageCardRejected: { borderLeftColor: '#B71C1C', backgroundColor: '#FFEBEE' },
  messageCardHeld: { borderLeftColor: '#FFA000', backgroundColor: '#FFF8E1' },
  messageCardAdmin: { borderLeftColor: '#2196F3', backgroundColor: '#E3F2FD' },
  messageCardCompleted: { borderLeftColor: '#00897B', backgroundColor: '#E0F2F1', opacity: 0.95 },

  messageTitle: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(16), color: "#222", flexShrink: 1, marginBottom: 5 },
  messageBody: { fontFamily: "Mont-Regular", fontSize: moderateScale(15), color: "#555", lineHeight: moderateScale(22), marginBottom: verticalScale(10) },
  
  bookingActionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: verticalScale(15) },
  actionButtonContainer: { flex: 1, marginHorizontal: moderateScale(7), borderRadius: moderateScale(30), overflow: 'hidden' },
  actionButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(18), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(30), flexDirection: 'row' },
  actionButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), marginLeft: moderateScale(5) },
  
  statusText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), marginTop: verticalScale(15), textAlign: 'center' },
  confirmedText: { color: '#2E7D32' },
  rejectedText: { color: '#B71C1C' },
  
  emptyMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: height * 0.2 },
  emptyMessagesText: { fontFamily: 'Mont-Bold', fontSize: moderateScale(20), color: '#777', marginBottom: verticalScale(12), textAlign: 'center' },
  emptyMessagesSubText: { fontFamily: 'Mont-Regular', fontSize: moderateScale(16), color: '#999', textAlign: 'center', paddingHorizontal: moderateScale(30), lineHeight: moderateScale(24) },
  
  meetLinkInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(15), marginBottom: verticalScale(8), borderWidth: 1, borderColor: '#d0d0d0', borderRadius: moderateScale(10), overflow: 'hidden', backgroundColor: '#f9f9f9' },
  meetLinkInput: { flex: 1, paddingVertical: verticalScale(10), paddingHorizontal: moderateScale(12), fontFamily: "Mont-Regular", fontSize: moderateScale(15), color: '#333' },
  sendMeetLinkButton: { padding: moderateScale(0) },
  sendMeetLinkButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: moderateScale(10) },
  sendMeetLinkButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(14) },
  
  meetLinkButton: { marginTop: verticalScale(15), borderRadius: moderateScale(10), overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: moderateScale(0) },
  meetLinkButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(10), flexDirection: 'row' },
  meetLinkButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15) },
  
  completeConsultationButton: { marginTop: verticalScale(15), borderRadius: moderateScale(10), overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: moderateScale(0) },
  completeConsultationButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(10) },
  completeConsultationButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15) },
  
  consultationCompletedIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(15), paddingVertical: verticalScale(10), paddingHorizontal: moderateScale(15), backgroundColor: 'rgba(0, 137, 123, 0.1)', borderRadius: moderateScale(10), borderWidth: 1, borderColor: 'rgba(0, 137, 123, 0.3)' },
  consultationCompletedText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), color: '#00695C', marginLeft: moderateScale(8) },
  
  adminMessageIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: moderateScale(8), alignSelf: 'flex-start' },
  adminMessageText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(13), color: '#2196F3', marginLeft: moderateScale(5) },
  
  heldInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), padding: moderateScale(10), backgroundColor: '#FFF3E0', borderRadius: moderateScale(8) },
  heldInfoText: { fontFamily: 'Mont-Medium', fontSize: moderateScale(13), color: '#EF6C00', marginLeft: 8, flexShrink: 1 },

  markAsReadButton: { marginTop: verticalScale(12), alignItems: 'flex-end' },
  markAsReadButtonText: { fontSize: moderateScale(13), color: '#2196F3', fontFamily: 'Mont-SemiBold' },
});