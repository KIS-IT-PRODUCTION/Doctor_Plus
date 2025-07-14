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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Notifications from "expo-notifications";
import { supabase } from "../../providers/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { parseISO, format, isFuture, isPast } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import ConsultationCompletionModal from "../../components/ConsultationCompletionModal";

const { width, height } = Dimensions.get("window");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Message() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [doctorFullName, setDoctorFullName] = useState(t("doctor"));
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessageForCompletion, setSelectedMessageForCompletion] =
    useState(null);

  const notificationReceivedListener = useRef(null);
  const notificationResponseListener = useRef(null);
  const locale = i18n.language === "uk" ? uk : enUS;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addNewMessage = useCallback(
    (notificationContent) => {
      const { title, body, data } = notificationContent;
      const now = new Date();
      const messageDate = format(now, "PPP", { locale });
      const messageTime = format(now, "p", { locale });

      setMessages((prevMessages) => {
        const uniqueMessageId =
          data && data.db_id
            ? data.db_id
            : Date.now().toString() + Math.random().toString(36).substring(2, 9);

        const isDuplicate = prevMessages.some(
          (msg) => msg.id === uniqueMessageId
        );

        if (isDuplicate) {
          console.log("Duplicate message received, not adding to UI.");
          return prevMessages;
        }

        const messageType = (data && data.type) || "general";

        let messageStatus = "N/A";
        if (messageType === "new_booking") {
          messageStatus = data && data.payment_status
            ? String(data.payment_status).toLowerCase()
            : data && data.status
            ? String(data.status).toLowerCase()
            : "pending";
        } else if (
          messageType === "payment_received" ||
          messageType === "payment_update_doctor"
        ) {
          messageStatus = data && data.payment_status
            ? String(data.payment_status).toLowerCase()
            : "pending";
        }

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
              consultation_conducted: data.consultation_conducted,
              consultation_started_on_time: data.consultation_started_on_time,
              doctor_feedback: data.doctor_feedback,
            } || {},
            meetLinkInput: data && data.meet_link ? data.meet_link : "",
          },
          ...prevMessages,
        ];
      });
    },
    [t, locale]
  );

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
        // IMPORTANT: Select 'booking_id' as a top-level column now
        const { data: doctorNotifications, error: doctorError } = await supabase
          .from("doctor_notifications")
          .select("*, booking_id") // Add booking_id here
          .eq("doctor_id", doctorUserId)
          .not("data->>type", "eq", "admin_announcement")
          .order("created_at", { ascending: false });

        if (doctorError) throw doctorError;

        // IMPORTANT: Select 'booking_id' as a top-level column now for admin notifications if applicable
        const { data: adminNotifications, error: adminError } = await supabase
          .from("doctor_notifications")
          .select("*, booking_id") // Add booking_id here
          .eq("data->>type", "admin_announcement")
          .order("created_at", { ascending: false });

        if (adminError)
          console.warn("Error fetching admin notifications:", adminError.message);

        const combinedNotifications = [
          ...(doctorNotifications || []),
          ...(adminNotifications || []),
        ];
        combinedNotifications.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        const formattedMessages = combinedNotifications.map((notif) => {
          const rawData = notif.data || {};
          const messageType = rawData.type || notif.type || "general";
          let messageStatus = "N/A";
          if (messageType === "new_booking") {
            messageStatus = rawData.status
              ? String(rawData.status).toLowerCase()
              : "pending";
          } else if (
            messageType === "payment_received" ||
            messageType === "payment_update_doctor"
          ) {
            messageStatus = rawData.payment_status
              ? String(rawData.payment_status).toLowerCase()
              : "pending";
          }
          let formattedDate = "",
            formattedTime = "";
          try {
            const createdAtDate = parseISO(notif.created_at);
            formattedDate = format(createdAtDate, "PPP", { locale });
            formattedTime = format(createdAtDate, "p", { locale });
          } catch (dateError) {
            formattedDate = new Intl.DateTimeFormat(i18n.language).format(
              new Date(notif.created_at)
            );
            formattedTime = new Intl.DateTimeFormat(i18n.language, {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(notif.created_at));
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
            rawData: { ...rawData, status: messageStatus },
            meetLinkInput: rawData.meet_link ? rawData.meet_link : "",
            booking_id: notif.booking_id, // Add top-level booking_id to message object
          };
        });

        setMessages(formattedMessages);
        await Notifications.setBadgeCountAsync(0);
      } catch (error) {
        console.error("Error fetching messages from Supabase:", error.message);
        Alert.alert(
          t("error"),
          `${t("failed_to_load_messages")}: ${error.message}`
        );
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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user session for doctor:", error.message);
        return;
      }
      if (user) {
        setCurrentDoctorUserId(user.id);
        try {
          const { data: doctorProfile, error: profileError } = await supabase
            .from("profile_doctor")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          if (profileError && profileError.code !== "PGRST116")
            console.warn(
              "Error fetching doctor full name:",
              profileError.message
            );
          if (doctorProfile?.full_name) setDoctorFullName(doctorProfile.full_name);
        } catch (e) {
          console.error("Unexpected error in fetching doctor full name:", e.message);
        }
      }
    };
    getDoctorData();
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (currentDoctorUserId) fetchMessagesFromSupabase(currentDoctorUserId);
      Notifications.setBadgeCountAsync(0);
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
    notificationReceivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        addNewMessage(notification.request.content);
      });
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        addNewMessage(response.notification.request.content);
      });
    return () => {
      if (notificationReceivedListener.current)
        Notifications.removeNotificationSubscription(
          notificationReceivedListener.current
        );
      if (notificationResponseListener.current)
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        );
    };
  }, [t, addNewMessage, navigation]);

  const markAsReadAndStatus = useCallback(
    async (messageId, newStatus = null) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            const updatedRawData = { ...msg.rawData };
            if (newStatus) updatedRawData.status = newStatus;
            return { ...msg, is_read: true, rawData: updatedRawData };
          }
          return msg;
        })
      );
      try {
        const { data: currentNotification, error: fetchError } = await supabase
          .from("doctor_notifications")
          .select("data, is_read")
          .eq("id", messageId)
          .single();
        if (fetchError) throw fetchError;
        const existingRawData = currentNotification.data || {};
        const updatedDataForDB = { ...existingRawData };
        const updateObject = {};
        if (newStatus) updatedDataForDB.status = newStatus;
        updateObject.data = updatedDataForDB;
        updateObject.is_read = true;
        await supabase
          .from("doctor_notifications")
          .update(updateObject)
          .eq("id", messageId);
      } catch (error) {
        console.error(
          "Error marking notification as read or updating status:",
          error.message
        );
      }
    },
    [t]
  );

  const markMessageAsRead = useCallback(
    async (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      try {
        await supabase
          .from("doctor_notifications")
          .update({ is_read: true })
          .eq("id", messageId);
      } catch (error) {
        console.error("Error marking message as read in DB:", error.message);
      }
    },
    [t]
  );

  const updateBookingStatusAndNotify = useCallback(
    async (message, newStatus) => {
      // Prioritize top-level booking_id if available
      let bookingId = message?.booking_id || message?.rawData?.booking_id || message?.rawData?.id;
      let patientId = message?.rawData?.patient_id;
      
      // --- DEBUGGING START ---
      console.log("updateBookingStatusAndNotify: initial message", message);
      console.log(`updateBookingStatusAndNotify: bookingId: ${bookingId}, patientId: ${patientId}, currentDoctorUserId: ${currentDoctorUserId}`);
      // --- DEBUGGING END ---

      if (!bookingId || !currentDoctorUserId) {
        Alert.alert(t("error"), t("invalid_booking_data_for_update"));
        return;
      }

      // Fetch ALL necessary booking details if not fully available in notification rawData
      let bookingDate = message.rawData.booking_date;
      let bookingTimeSlot = message.rawData.booking_time_slot;
      let consultationDurationMinutes = message.rawData.consultation_duration_minutes;

      if (!patientId || !bookingDate || !bookingTimeSlot || !consultationDurationMinutes) {
        try {
            console.log(`Fetching missing booking details for bookingId: ${bookingId}`); // DEBUG
            const { data: bookingDetails, error: bookingDetailsError } = await supabase
                .from('patient_bookings')
                .select('patient_id, booking_date, booking_time_slot, consultation_duration_minutes') // Fetch patient_id too
                .eq('id', bookingId)
                .single();

            if (bookingDetailsError) {
              console.error("Supabase Error fetching booking details for status update:", bookingDetailsError); // DEBUG
              throw bookingDetailsError;
            }

            // Update variables with fetched data
            patientId = bookingDetails.patient_id;
            bookingDate = bookingDetails.booking_date;
            bookingTimeSlot = bookingDetails.booking_time_slot;
            consultationDurationMinutes = bookingDetails.consultation_duration_minutes;
            console.log("Fetched booking details:", { patientId, bookingDate, bookingTimeSlot, consultationDurationMinutes }); // DEBUG
            
        } catch (error) {
            console.error("Error fetching booking details for status update (catch block):", error.message); // DEBUG
            Alert.alert(t('error'), 'Не вдалося отримати повні дані бронювання для оновлення статусу.');
            return;
        }
      }

      // Final check after attempting to fetch
      if (!patientId || !bookingDate || !bookingTimeSlot) {
        console.log("updateBookingStatusAndNotify: Final check failed - patientId, bookingDate or bookingTimeSlot missing."); // DEBUG
        Alert.alert(t("error"), "Не вдалося отримати повні дані бронювання для оновлення статусу.");
        return;
      }

      const doctorFinalName = doctorFullName || t("doctor");

      try {
        await supabase
          .from("patient_bookings")
          .update({ status: newStatus })
          .eq("id", bookingId)
          .throwOnError();
        console.log(`Booking ${bookingId} successfully updated to ${newStatus}`);

        if (newStatus === "rejected") {
          const { data: doctorProfile } = await supabase
            .from("profile_doctor")
            .select("doctor_points")
            .eq("user_id", currentDoctorUserId)
            .single();
          if (doctorProfile) {
            const newPoints = Math.max(0, (doctorProfile.doctor_points || 0) - 50);
            await supabase
              .from("profile_doctor")
              .update({ doctor_points: newPoints })
              .eq("user_id", currentDoctorUserId);
          }
        }

        const payload = {
          booking: {
            id: bookingId,
            patient_id: patientId, // Now definitely available
            doctor_id: currentDoctorUserId,
            status: newStatus,
            booking_date: bookingDate, 
            booking_time_slot: bookingTimeSlot,
            consultation_duration_minutes: consultationDurationMinutes,
            amount: 0,
            is_paid: false,
            meet_link: null,
          },
          doctor_name: doctorFinalName,
        };

        if (newStatus === "confirmed") {
          const { data: details, error: fetchError } = await supabase
            .from("patient_bookings")
            .select("amount, is_paid, meet_link")
            .eq("id", bookingId)
            .maybeSingle();
          if (fetchError)
            console.error("Error fetching booking details:", fetchError.message);
          if (details) {
            payload.booking.amount = details.amount || 0;
            payload.booking.is_paid = details.is_paid || false;
            payload.booking.meet_link = details.meet_link || null;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token)
          throw new Error(t("user_not_authenticated_please_login_again"));

        const response = await fetch(
          "https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/handle-booking-status-update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok)
          throw new Error(`Edge Function error: ${await response.text()}`);

        Alert.alert(
          t("success"),
          newStatus === "confirmed"
            ? t("booking_confirmed_successfully_message")
            : t("booking_rejected_successfully_message")
        );
        if (message.db_id) await markAsReadAndStatus(message.db_id, newStatus);
      } catch (error) {
        console.error("Error processing booking update:", error.message);
        Alert.alert(
          t("error"),
          `${t("failed_to_process_booking")}: ${error.message}`
        );
      }
    },
    [t, currentDoctorUserId, doctorFullName, markAsReadAndStatus]
  );

  const handleConfirmBooking = useCallback(
    (message) => {
      Alert.alert(
        t("confirm_booking_title"),
        t("confirm_booking_message_doctor"),
        [
          { text: t("cancel"), style: "cancel" },
          { text: t("confirm"), onPress: () => updateBookingStatusAndNotify(message, "confirmed") },
        ]
      );
    },
    [t, updateBookingStatusAndNotify]
  );
  const handleRejectBooking = useCallback(
    (message) => {
      Alert.alert(t("reject_booking_title"), t("reject_booking_message_doctor"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("reject"), onPress: () => updateBookingStatusAndNotify(message, "rejected") },
      ]);
    },
    [t, updateBookingStatusAndNotify]
  );
  const handleMeetLinkInputChange = useCallback((messageId, text) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, meetLinkInput: text } : msg
      )
    );
  }, []);
  const handleCompleteConsultation = useCallback((message) => {
    setSelectedMessageForCompletion(message);
    setIsModalVisible(true);
  }, []);

  const handleSendMeetLink = useCallback(async (message) => {
    const meetLink = message.meetLinkInput;
    if (!meetLink || !meetLink.trim().startsWith("https://")) {
      Alert.alert(t("error"), t("invalid_meet_link_format"));
      return;
    }

    // Prioritize top-level booking_id from the fetched message object
    const bookingId = message?.booking_id || message?.rawData?.booking_id || message?.rawData?.id;
    let patientId = message?.rawData?.patient_id;
    let bookingDate = message?.rawData?.booking_date;
    let bookingTimeSlot = message?.rawData?.booking_time_slot;
    const doctorFinalName = doctorFullName || t("doctor");

    // --- DEBUGGING START ---
    console.log("handleSendMeetLink: initial message", message);
    console.log(`handleSendMeetLink: Before checks - bookingId: ${bookingId}, patientId: ${patientId}`);
    // --- DEBUGGING END ---

    if (!bookingId) {
      console.log("handleSendMeetLink: Missing bookingId.");
      Alert.alert(t("error"), t("invalid_booking_data_for_meet_link"));
      return;
    }

    // Fetch all missing booking details from patient_bookings if not in rawData
    if (!patientId || !bookingDate || !bookingTimeSlot) {
      try {
        console.log(`handleSendMeetLink: Fetching missing booking details (patient_id, date, time) for bookingId: ${bookingId}`);
        const { data: bookingDetails, error: bookingDetailsError } = await supabase
          .from('patient_bookings')
          .select('patient_id, booking_date, booking_time_slot')
          .eq('id', bookingId)
          .single();

        if (bookingDetailsError) {
          console.error("Supabase Error fetching booking details for meet link:", bookingDetailsError);
          throw bookingDetailsError;
        }

        patientId = bookingDetails.patient_id;
        bookingDate = bookingDetails.booking_date;
        bookingTimeSlot = bookingDetails.booking_time_slot;
        console.log("handleSendMeetLink: Fetched booking details:", { patientId, bookingDate, bookingTimeSlot });
      } catch (error) {
        console.error("handleSendMeetLink: Error fetching booking details (catch block):", error.message);
        Alert.alert(t('error'), 'Не вдалося отримати повні дані бронювання для зустрічі.');
        return;
      }
    }

    // Final check after attempting to fetch
    if (!patientId || !bookingDate || !bookingTimeSlot) {
      console.log("handleSendMeetLink: Final check failed - patientId, bookingDate or bookingTimeSlot missing.");
      Alert.alert(t('error'), t('invalid_booking_data_for_meet_link'));
      return;
    }

    try {
      // Update patient_bookings table
      await supabase
        .from("patient_bookings")
        .update({ meet_link: meetLink })
        .eq("id", bookingId)
        .throwOnError();
      console.log(`handleSendMeetLink: Successfully updated meet_link in patient_bookings for booking ${bookingId}`);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token)
        throw new Error(t("user_not_authenticated_please_login_again"));

      const payload = {
        type: "meet_link_update",
        patient_id: patientId,
        booking_id: bookingId,
        meet_link: meetLink,
        doctor_name: doctorFinalName,
        booking_date: bookingDate,
        booking_time_slot: bookingTimeSlot,
      };

      console.log("handleSendMeetLink: Sending payload to Edge Function:", payload);
      const response = await fetch(
        "https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      if (!response.ok)
        throw new Error(`Edge Function error: ${responseText}`);

      console.log("handleSendMeetLink: Edge Function response OK.");
      Alert.alert(t("success"), t("meet_link_sent_successfully"));
      
      // Update local state and DB notification with accurate data, including patient_id
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                is_read: true,
                rawData: { ...msg.rawData, meet_link: meetLink, patient_id: patientId, booking_id: bookingId }, // Include patient_id and booking_id here
              }
            : msg
        )
      );
      await supabase.from('doctor_notifications').update({ is_read: true, data: { ...message.rawData, meet_link: meetLink, patient_id: patientId, booking_id: bookingId }, booking_id: bookingId }).eq('id', message.id); // Update top-level booking_id as well
      console.log("handleSendMeetLink: Local and DB message updated.");

    } catch (error) {
      console.error("handleSendMeetLink: Error sending meet link (outer catch block):", error.message);
      Alert.alert(
        t("error"),
        `${t("failed_to_send_meet_link")}: ${error.message}`
      );
    }
  }, [t, doctorFullName]);

  const handleModalSubmit = useCallback(async ({ consultationConducted, consultationStartedOnTime, doctorFeedback }) => {
    if (!selectedMessageForCompletion) return;
    const message = selectedMessageForCompletion;

    // Prioritize top-level booking_id if available
    const bookingId = message?.booking_id || message?.rawData?.booking_id || message?.rawData?.id;
    let patientId = message?.rawData?.patient_id;
    let bookingDate = message?.rawData?.booking_date;
    let bookingTimeSlot = message?.rawData?.booking_time_slot;
    const doctorFinalName = doctorFullName || t("doctor");

    // --- DEBUGGING START ---
    console.log("handleModalSubmit: initial message", message);
    console.log(`handleModalSubmit: Before checks - bookingId: ${bookingId}, patientId: ${patientId}`);
    // --- DEBUGGING END ---

    if (!bookingId) {
      console.log("handleModalSubmit: Missing bookingId.");
      Alert.alert(t("error"), t("missing_consultation_details"));
      return;
    }

    // Fetch all missing booking details from patient_bookings if not in rawData
    if (!patientId || !bookingDate || !bookingTimeSlot) {
      try {
        console.log(`handleModalSubmit: Fetching missing booking details (patient_id, date, time) for bookingId: ${bookingId}`);
        const { data: bookingDetails, error: bookingDetailsError } = await supabase
          .from('patient_bookings')
          .select('patient_id, booking_date, booking_time_slot')
          .eq('id', bookingId)
          .single();

        if (bookingDetailsError) {
          console.error("Supabase Error fetching booking details for completion:", bookingDetailsError);
          throw bookingDetailsError;
        }

        patientId = bookingDetails.patient_id;
        bookingDate = bookingDetails.booking_date;
        bookingTimeSlot = bookingDetails.booking_time_slot;
        console.log("handleModalSubmit: Fetched booking details:", { patientId, bookingDate, bookingTimeSlot });
      } catch (error) {
        console.error("handleModalSubmit: Error fetching booking details (catch block):", error.message);
        Alert.alert(t('error'), 'Не вдалося отримати дату або час бронювання для завершення консультації.');
        return;
      }
    }

    // Final check after attempting to fetch
    if (!patientId || !bookingDate || !bookingTimeSlot) {
      console.log("handleModalSubmit: Final check failed - patientId, bookingDate or bookingTimeSlot missing.");
      Alert.alert(t('error'), t('missing_consultation_details'));
      return;
    }

    setLoadingCompletion(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token)
        throw new Error(t("user_not_authenticated_please_login_again"));

      const payload = {
        type: "consultation_completed",
        booking_id: bookingId,
        patient_id: patientId,
        doctor_name: doctorFinalName,
        booking_date: bookingDate,
        booking_time_slot: bookingTimeSlot,
        consultation_conducted: consultationConducted,
        consultation_started_on_time: consultationStartedOnTime,
        doctor_feedback: doctorFeedback,
      };

      console.log("handleModalSubmit: Sending payload to Edge Function:", payload);
      const response = await fetch(
        "https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/send-meet-link-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const responseText = await response.text();
      if (!response.ok)
        throw new Error(`Edge Function error: ${responseText}`);

      console.log("handleModalSubmit: Edge Function response OK.");
      Alert.alert(t("success"), t("consultation_completed_successfully"));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                is_read: true,
                rawData: {
                  ...msg.rawData,
                  status_meet: true,
                  consultation_conducted,
                  consultation_started_on_time,
                  doctor_feedback,
                },
              }
            : msg
        )
      );
      console.log("handleModalSubmit: Local message updated.");

    } catch (error) {
      console.error("handleModalSubmit: Error completing consultation (outer catch block):", error.message);
      Alert.alert(
        t("error"),
        `${t("failed_to_complete_consultation")}: ${error.message}`
      );
    } finally {
      setLoadingCompletion(false);
      setIsModalVisible(false);
      setSelectedMessageForCompletion(null);
    }
  }, [t, doctorFullName, selectedMessageForCompletion]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t("loading_messages")}</Text>
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
        <Text style={styles.headerTitle}>{t("messages_screen.header_title")}</Text>
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
            <Text style={styles.emptyMessagesText}>
              {t("messages_screen.no_messages")}
            </Text>
            <Text style={styles.emptyMessagesSubText}>
              {t("messages_screen.waiting_for_bookings")}
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const { status, type, is_paid, meet_link } = message.rawData;
            const isPendingBooking = type === "new_booking" && status === "pending";
            const isConfirmedBooking = status === "confirmed";
            const isRejectedBooking = status === "rejected";
            const isPaymentSuccessful = is_paid === true;
            const isAdminAnnouncement = type === "admin_announcement";
            
            // Check if booking_date exists and is valid before parsing
            const hasValidBookingDate = message.rawData.booking_date && !isNaN(new Date(message.rawData.booking_date).getTime());
            
            const isPastConsultation =
              !isAdminAnnouncement &&
              hasValidBookingDate && // Ensure valid date
              isPast(parseISO(`${message.rawData.booking_date}T${message.rawData.booking_time_slot || '00:00:00'}`));
            
            const isConsultationCompleted =
              !isAdminAnnouncement && message.rawData.status_meet === true;

            let cardColors = ["#FFFFFF", "#FDFDFD"];
            if (!message.is_read) cardColors = ["#E3F2FD", "#FFFFFF"];

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.dateAndTimestamp}>
                  <Text style={styles.dateText}>{message.date}</Text>
                  <Text style={styles.timestampText}>{message.time}</Text>
                </View>
                <LinearGradient colors={cardColors} style={styles.messageCard}>
                  <Text style={styles.messageTitle}>{message.title}</Text>
                  <Text style={styles.messageBody}>{message.body}</Text>

                  {isPendingBooking && (
                    <View style={styles.bookingActionButtons}>
                      <TouchableOpacity
                        onPress={() => handleConfirmBooking(message)}
                        style={styles.actionButtonContainer}
                      >
                        <LinearGradient
                          colors={["#4CAF50", "#2E7D32"]}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons
                            name="checkmark-done-circle-outline"
                            size={moderateScale(20)}
                            color="#FFFFFF"
                          />
                          <Text style={styles.actionButtonText}>
                            {t("confirm")}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRejectBooking(message)}
                        style={styles.actionButtonContainer}
                      >
                        <LinearGradient
                          colors={["#D32F2F", "#B71C1C"]}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={moderateScale(20)}
                            color="#FFFFFF"
                          />
                          <Text style={styles.actionButtonText}>
                            {t("reject")}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                  {(isConfirmedBooking || isRejectedBooking) && (
                    <Text
                      style={[
                        styles.statusText,
                        isConfirmedBooking ? styles.confirmedText : styles.rejectedText,
                      ]}
                    >
                      {isConfirmedBooking
                        ? t("booking_status_confirmed")
                        : t("booking_status_rejected")}
                    </Text>
                  )}

                  {isPaymentSuccessful && !isConsultationCompleted && (
                    <View style={styles.meetLinkInputContainer}>
                      <TextInput
                        style={styles.meetLinkInput}
                        placeholder={t("enter_meet_link_placeholder")}
                        value={message.meetLinkInput}
                        onChangeText={(text) =>
                          handleMeetLinkInputChange(message.id, text)
                        }
                      />
                      <TouchableOpacity
                        onPress={() => handleSendMeetLink(message)}
                        style={styles.sendMeetLinkButton}
                      >
                        <LinearGradient
                          colors={["#0EB3EB", "#0A8BC2"]}
                          style={styles.sendMeetLinkButtonGradient}
                        >
                          <Text style={styles.sendMeetLinkButtonText}>
                            {meet_link ? t("update_meet_link") : t("send_meet_link")}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                  {meet_link && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(meet_link)}
                      style={styles.meetLinkButton}
                    >
                      <LinearGradient
                        colors={["#4CAF50", "#2E7D32"]}
                        style={styles.meetLinkButtonGradient}
                      >
                        <Text style={styles.meetLinkButtonText}>
                          {t("join_meet")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {isPastConsultation && !isConsultationCompleted && isConfirmedBooking && (
                    <TouchableOpacity
                      onPress={() => handleCompleteConsultation(message)}
                      style={styles.completeConsultationButton}
                    >
                      <LinearGradient
                        colors={["#FFC107", "#FFA000"]}
                        style={styles.completeConsultationButtonGradient}
                      >
                        <Text style={styles.completeConsultationButtonText}>
                          {t("complete_consultation")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {isConsultationCompleted && (
                    <View style={styles.consultationCompletedIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(18)}
                        color="#4CAF50"
                      />
                      <Text style={styles.consultationCompletedText}>
                        {t("consultation_completed_indicator")}
                      </Text>
                    </View>
                  )}
                  {isAdminAnnouncement && (
                    <View style={styles.adminMessageIndicator}>
                      <Ionicons
                        name="information-circle-outline"
                        size={moderateScale(18)}
                        color="#2196F3"
                      />
                      <Text style={styles.adminMessageText}>
                        {t("admin_announcement_label")}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            );
          })
        )}
      </ScrollView>
      <ConsultationCompletionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleModalSubmit}
        isLoading={loadingCompletion}
      />
    </SafeAreaView>
  );
}

// Повний блок ваших оригінальних стилів
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f2f5", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10, },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(16), paddingVertical: verticalScale(5), backgroundColor: "#f0f2f5", },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: moderateScale(25), width: moderateScale(48), height: moderateScale(48), justifyContent: "center", alignItems: "center", },
  headerTitle: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(20), color: "#333", },
  messageList: { padding: moderateScale(16), paddingBottom: verticalScale(100), },
  messageGroup: { marginBottom: verticalScale(20), },
  dateAndTimestamp: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: verticalScale(8), paddingHorizontal: moderateScale(10), },
  dateText: { fontFamily: "Mont-Medium", fontSize: moderateScale(13), color: "#777", },
  timestampText: { fontFamily: "Mont-Regular", fontSize: moderateScale(11), color: "#999", },
  messageCard: { borderRadius: moderateScale(12), padding: moderateScale(18), shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: '#e0e0e0', },
  messageTitle: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(16), color: "#222", flexShrink: 1, },
  messageBody: { fontFamily: "Mont-Regular", fontSize: moderateScale(15), color: "#555", lineHeight: moderateScale(22), marginBottom: verticalScale(10), },
  bookingActionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: verticalScale(15), },
  actionButtonContainer: { flex: 1, marginHorizontal: moderateScale(7), borderRadius: moderateScale(30), overflow: 'hidden', },
  actionButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(18), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(30), flexDirection: 'row', },
  actionButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), marginLeft: moderateScale(5), },
  statusText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), marginTop: verticalScale(15), textAlign: 'center', },
  confirmedText: { color: '#2E7D32', },
  rejectedText: { color: '#B71C1C', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', },
  loadingText: { marginTop: verticalScale(10), fontFamily: 'Mont-Medium', fontSize: moderateScale(17), color: '#555', },
  emptyMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: height * 0.2, },
  emptyMessagesText: { fontFamily: 'Mont-Bold', fontSize: moderateScale(20), color: '#777', marginBottom: verticalScale(12), textAlign: 'center', },
  emptyMessagesSubText: { fontFamily: 'Mont-Regular', fontSize: moderateScale(16), color: '#999', textAlign: 'center', paddingHorizontal: moderateScale(30), lineHeight: moderateScale(24), },
  meetLinkInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(15), marginBottom: verticalScale(8), borderWidth: 1, borderColor: '#d0d0d0', borderRadius: moderateScale(10), overflow: 'hidden', backgroundColor: '#f9f9f9', },
  meetLinkInput: { flex: 1, paddingVertical: verticalScale(10), paddingHorizontal: moderateScale(12), fontFamily: "Mont-Regular", fontSize: moderateScale(15), color: '#333', },
  sendMeetLinkButton: { padding: moderateScale(0), },
  sendMeetLinkButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: moderateScale(10), },
  sendMeetLinkButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(14), },
  meetLinkButton: { marginTop: verticalScale(15), borderRadius: moderateScale(10), overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: moderateScale(0), },
  meetLinkButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(10), },
  meetLinkButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), },
  completeConsultationButton: { marginTop: verticalScale(15), borderRadius: moderateScale(10), overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: moderateScale(0), },
  completeConsultationButtonGradient: { paddingVertical: verticalScale(12), paddingHorizontal: moderateScale(15), alignItems: 'center', justifyContent: 'center', borderRadius: moderateScale(10), },
  completeConsultationButtonText: { color: '#fff', fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), },
  consultationCompletedIndicator: { flexDirection: 'column', alignItems: 'flex-start', marginTop: verticalScale(15), paddingVertical: verticalScale(8), paddingHorizontal: moderateScale(15), backgroundColor: '#E8F5E9', borderRadius: moderateScale(10), borderWidth: 1, borderColor: '#4CAF50', },
  consultationCompletedText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(15), color: '#2E7D32', marginLeft: moderateScale(8), marginTop: verticalScale(2), },
  doctorFeedbackDisplay: { fontFamily: 'Mont-Regular', fontSize: moderateScale(14), color: '#555', marginTop: verticalScale(5), width: '100%', },
  doctorFeedbackLabel: { fontFamily: 'Mont-SemiBold', color: '#333', },
  adminMessageIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: moderateScale(8), alignSelf: 'flex-start', },
  adminMessageText: { fontFamily: "Mont-SemiBold", fontSize: moderateScale(13), color: '#2196F3', marginLeft: moderateScale(5), },
  markAsReadButtonCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: verticalScale(10), paddingVertical: verticalScale(5), paddingHorizontal: moderateScale(10), alignSelf: 'flex-end', borderRadius: moderateScale(15), backgroundColor: 'rgba(14, 179, 235, 0.1)', },
  markAsReadButtonTextCompact: { color: '#0EB3EB', fontFamily: "Mont-Medium", fontSize: moderateScale(12), marginLeft: moderateScale(5), },
});