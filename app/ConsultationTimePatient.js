import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const CONSULTATION_DURATION_MINUTES = 45;
const SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/notify-doctor';

const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId;
  console.log("Booking screen: doctorId:", doctorId);

  const [patientId, setPatientId] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientTimezone, setPatientTimezone] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [doctorAvailableSlotsMap, setDoctorAvailableSlotsMap] = useState({});
  const [allBookedSlotsMap, setAllBookedSlotsMap] = useState({});
  const [myBookingsMap, setMyBookingsMap] = useState({});

  const [doctorConsultationCost, setDoctorConsultationCost] = useState(null);

  const [selectedSlots, setSelectedSlots] = useState([]);

  // useEffect для отримання сесії пацієнта та його профілю
  useEffect(() => {
    console.count('useEffect - getPatientSessionAndProfile call');
    const getPatientSessionAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          Alert.alert(t('error'), t('user_not_logged_in_please_login'));
          navigation.goBack();
          return;
        }

        setPatientId(session.user.id);
        console.log("Current patientId:", session.user.id);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, country_timezone')
          .eq('user_id', session.user.id)
          .single();
        if (profileError) {
          throw profileError;
        }
        if (profileData) {
          setPatientProfile(profileData);
          let tz = profileData.country_timezone;

          // Логіка визначення часової зони пацієнта
          if (tz && tz.startsWith('UTC')) {
              console.warn(`Patient timezone is ${profileData.country_timezone}, which might not be an IANA format. Attempting to map or fallback.`);
              if (profileData.country_timezone === 'UTC+10') {
                  tz = 'Australia/Brisbane';
              } else if (profileData.country_timezone === 'UTC+2' || profileData.country_timezone === 'UTC+3') {
                  tz = 'Europe/Kiev';
              }
              // Якщо після мапування все ще UTC-формат або мапування не відбулося
              if (!tz || tz.startsWith('UTC+')) {
                 tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                 console.warn(`No specific IANA mapping found for ${profileData.country_timezone}. Falling back to system timezone: ${tz}`);
              }
          } else if (!tz) { // Якщо country_timezone порожній або null
              tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              console.warn(`Patient country_timezone is empty/null. Falling back to system timezone: ${tz}`);
          }
          setPatientTimezone(tz); // Встановлюємо часову зону тут, тільки після її визначення
          console.log("Patient profile:", profileData);
          console.log("Patient timezone (resolved):", tz);
        } else {
          console.warn("Patient profile not found for ID:", session.user.id);
          Alert.alert(t('error'), t('failed_to_get_patient_profile_data'));
          navigation.goBack();
        }

        const { data: doctorProfileData, error: doctorProfileError } = await supabase
          .from('anketa_doctor')
          .select('consultation_cost')
          .eq('user_id', doctorId)
          .single();

        if (doctorProfileError) {
          console.error("Error fetching doctor consultation cost:", doctorProfileError);
          setDoctorConsultationCost(0);
          Alert.alert(t('error'), t('failed_to_get_doctor_cost'));
        } else if (doctorProfileData) {
          setDoctorConsultationCost(doctorProfileData.consultation_cost);
          console.log("Doctor consultation cost:", doctorProfileData.consultation_cost);
        } else {
          setDoctorConsultationCost(0);
          console.warn("Doctor profile found, but consultation_cost is null/undefined.");
        }
      } catch (err) {
        console.error("Error getting user session or patient profile:", err.message);
        Alert.alert(t('error'), t('failed_to_get_user_info_or_profile'));
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    getPatientSessionAndProfile();
  }, [t, navigation, doctorId]);

  // generateSchedule без date-fns
  const generateSchedule = useCallback(() => {
    console.count('generateSchedule call');
    const schedule = [];
    const now = new Date();
    const currentLocale = i18n.language;

    // ВИПРАВЛЕНО: patientTimezone тепер не буде null тут, якщо викликається після його встановлення
    // Однак, все одно краще мати запасний варіант
    const targetTimezone = patientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        new Intl.DateTimeFormat('en-US', { timeZone: targetTimezone });
    } catch (e) {
        console.error(`Invalid timezone "${targetTimezone}" detected in generateSchedule. Falling back to system timezone.`, e);
        const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Запобігаємо нескінченній рекурсії, якщо системна TZ теж "не працює"
        if (targetTimezone !== systemTimezone) {
            return generateSchedule(systemTimezone); // Виклик з запасним варіантом (це теоретично може бути нескінченно, але дуже рідко)
        }
        return [];
    }

    console.log("Using target timezone for display:", targetTimezone);

    for (let i = 0; i < 14; i++) {
      const currentDay = new Date(now);
      currentDay.setDate(now.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);

      const displayDateOptions = { weekday: 'long', day: 'numeric', month: 'long', timeZone: targetTimezone };
      const displayDate = new Intl.DateTimeFormat(currentLocale, displayDateOptions).format(currentDay);

      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateStringForDB = `${year}-${month}-${day}`;

      const daySlots = [];

      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += CONSULTATION_DURATION_MINUTES) {
          const startTime = new Date(currentDay);
          startTime.setHours(hour, minute, 0, 0);

          const endTime = new Date(startTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

          if (endTime.getTime() <= now.getTime()) {
            continue;
          }

          if (startTime.getHours() >= 18) continue;
          if (endTime.getHours() >= 18 && endTime.getMinutes() > 0) continue;

          const timeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: targetTimezone };
          const displayStartTime = new Intl.DateTimeFormat(currentLocale, timeFormatOptions).format(startTime);
          const displayEndTime = new Intl.DateTimeFormat(currentLocale, timeFormatOptions).format(endTime);
          const displayTime = `${displayStartTime} - ${displayEndTime}`;

          const rawTimeForDB = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:${String(startTime.getSeconds()).padStart(2, '0')}`;

          const slotId = `${dateStringForDB}-${rawTimeForDB}`;

          daySlots.push({
            time: displayTime,
            id: slotId,
            date: dateStringForDB,
            rawTime: rawTimeForDB,
            startTimeUtc: startTime.toISOString(),
            endTimeUtc: endTime.toISOString(),
          });
        }
      }
      schedule.push({
        date: currentDay,
        displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1),
        slots: daySlots,
      });
    }

    const allGeneratedSlotIds = schedule.flatMap(day => day.slots.map(slot => slot.id));
    const uniqueGeneratedSlotIds = new Set(allGeneratedSlotIds);
    if (allGeneratedSlotIds.length !== uniqueGeneratedSlotIds.size) {
      const duplicateIds = allGeneratedSlotIds.filter((item, index) => allGeneratedSlotIds.indexOf(item) !== index);
      console.error("Critical: Duplicate slot IDs generated in generateSchedule! Duplicates found:", duplicateIds);
    } else {
      console.log("All generated slot IDs are unique as expected.");
    }

    console.log("Generated schedule for patient display:", schedule);
    return schedule;
  }, [patientTimezone, i18n.language]);

  const fetchAvailableSlotsAndBookings = useCallback(async () => {
    console.count('fetchAvailableSlotsAndBookings call');
    if (!doctorId || !patientId || patientTimezone === null) {
      console.warn("Missing doctorId, patientId, or patientTimezone. Cannot fetch slots for booking.");
      setLoading(false);
      setScheduleData(generateSchedule()); // Генеруємо розклад навіть при відсутності даних, але без фільтрації доступності
      return;
    }
    setLoading(true);
    console.log(`Fetching available and booked slots for doctorId: ${doctorId} and patientId: ${patientId}`);
    try {
      const { data: doctorAvailData, error: doctorAvailError } = await supabase
        .from('doctor_availability')
        .select('date, time_slot, doctor_id')
        .eq('doctor_id', doctorId)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (doctorAvailError) throw doctorAvailError;

      const availMap = {};
      if (Array.isArray(doctorAvailData)) {
        doctorAvailData.forEach(item => {
          const slotId = `${item.date}-${item.time_slot}`;
          availMap[slotId] = true;
        });
      }
      setDoctorAvailableSlotsMap(availMap);
      console.log("Doctor's available slots map:", availMap);

      const { data: bookedData, error: bookedError } = await supabase
        .from('patient_bookings')
        .select('booking_date, booking_time_slot, patient_id')
        .eq('doctor_id', doctorId)
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      if (bookedError) throw bookedError;

      const allBookedMap = {};
      const myBookings = {};
      if (Array.isArray(bookedData)) {
        bookedData.forEach(item => {
          const slotId = `${item.booking_date}-${item.booking_time_slot}`;
          allBookedMap[slotId] = true;
          if (item.patient_id === patientId) {
            myBookings[slotId] = true;
          }
        });
      }
      setAllBookedSlotsMap(allBookedMap);
      setMyBookingsMap(myBookings);
      console.log("All booked slots map:", allBookedMap);
      console.log("My bookings map:", myBookings);

      setScheduleData(generateSchedule()); // Оновлюємо розклад після отримання даних
    } catch (err) {
      console.error("Error fetching slots for booking:", err.message);
      Alert.alert(t('error'), t('failed_to_load_slots_for_booking'));
      setScheduleData(generateSchedule());
    } finally {
      setLoading(false);
    }
  }, [doctorId, patientId, patientTimezone, t, generateSchedule]);

  // Цей useEffect тепер спрацьовує тільки тоді, коли всі необхідні дані для вибірки готові.
  // patientTimezone встановлюється лише один раз у першому useEffect.
  useEffect(() => {
    console.count('useEffect - fetchAvailableSlotsAndBookings trigger (corrected)');
    if (doctorId && patientId && patientTimezone) { // patientTimezone має бути встановлений
      fetchAvailableSlotsAndBookings();
    }
  }, [doctorId, patientId, patientTimezone, fetchAvailableSlotsAndBookings]);


  const handleSlotPress = (slot) => {
    if (!doctorAvailableSlotsMap[slot.id]) {
      Alert.alert(t('not_available'), t('doctor_not_available_at_this_time'));
      console.log(`Slot ${slot.id} is not available by doctor.`);
      return;
    }

    if (allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id]) {
      Alert.alert(t('booked'), t('slot_already_booked_by_other'));
      console.log(`Slot ${slot.id} is already booked by another patient.`);
      return;
    }

    setSelectedSlots(prevSelectedSlots => {
      const isAlreadySelected = prevSelectedSlots.some(s => s.id === slot.id);

      if (isAlreadySelected) {
        return prevSelectedSlots.filter(s => s.id !== slot.id);
      } else {
        return [slot];
      }
    });
    console.log(`Slot ${slot.id} selection toggled. Current selectedSlots:`, selectedSlots.map(s => s.id));
  };


  const sendNotificationViaEdgeFunction = async (doctorId, patientFullName, bookingDate, bookingTimeSlot, bookingId, patientId, amount) => {
    console.log("Calling Edge Function with:", { doctorId, patientFullName, bookingDate, bookingTimeSlot, bookingId, patientId, amount });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';

      const response = await fetch(SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_name: patientFullName,
          booking_date: bookingDate,
          booking_time_slot: bookingTimeSlot,
          booking_id: bookingId,
          patient_id: patientId,
          amount: amount,
          consultation_duration_minutes: CONSULTATION_DURATION_MINUTES,
          patient_timezone: patientTimezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge Function returned an error (HTTP status not OK):', response.status, data.error || data.message || data);
        return false;
      }

      if (data.error) {
        console.error('Edge Function returned an error in JSON body:', data.error);
        return false;
      }

      console.log('Edge Function call successful:', data);
      return true;

    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Network or unexpected error calling Edge Function:', errorMessage, error);
      Alert.alert(t('error'), `${t('failed_to_send_notification')}: ${errorMessage}`);
      return false;
    }
  };

  const bookSelectedSlots = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert(t('no_slot_selected'), t('please_select_a_slot_to_book'));
      return;
    }
    if (!patientId || !doctorId || !patientProfile || !patientProfile.full_name || patientTimezone === null) {
      Alert.alert(t('error'), t('missing_booking_info'));
      return;
    }

    if (doctorConsultationCost === null) {
      Alert.alert(t('error'), t('consultation_cost_not_loaded_yet'));
      return;
    }
    if (doctorConsultationCost === 0) {
      Alert.alert(t('attention'), t('this_consultation_is_free_confirm_booking'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('confirm'), onPress: () => processBookingAfterConfirmation() }
      ]);
      return;
    }

    processBookingAfterConfirmation();
  };

  const processBookingAfterConfirmation = async () => {
    setBooking(true);
    let successfulBookingsCount = 0;
    const errors = [];
    const patientFullName = patientProfile.full_name;
    const bookingAmount = doctorConsultationCost;

    for (const slot of selectedSlots) {
      try {
        console.log(`Attempting to book slot ${slot.id} for doctorId: ${doctorId}, patientId: ${patientId} with amount: ${bookingAmount}`);

        const { data: currentAvail, error: availCheckError } = await supabase
          .from('doctor_availability')
          .select('id')
          .eq('doctor_id', doctorId)
          .eq('date', slot.date)
          .eq('time_slot', slot.rawTime)
          .single();

        if (availCheckError || !currentAvail) {
          if (availCheckError?.code === 'PGRST116') {
            errors.push(`${t('failed_to_book')} ${slot.time} ${slot.date}: ${t('slot_no_longer_available_by_doctor')}`);
            continue;
          }
          throw availCheckError || new Error(t('slot_no_longer_available_by_doctor'));
        }

        const { data: currentBookings, error: bookingCheckError } = await supabase
          .from('patient_bookings')
          .select('id, patient_id')
          .eq('doctor_id', doctorId)
          .eq('booking_date', slot.date)
          .eq('booking_time_slot', slot.rawTime)
          .single();

        if (bookingCheckError && bookingCheckError.code !== 'PGRST116') {
          throw bookingCheckError;
        }

        if (currentBookings) {
          if (currentBookings.patient_id !== patientId) {
            errors.push(`${t('failed_to_book')} ${slot.time} ${slot.date}: ${t('slot_just_booked_by_another_patient')}`);
            continue;
          } else {
            console.log(`Slot ${slot.id} is already booked by current patient. Skipping.`);
            successfulBookingsCount++;
            continue;
          }
        }

        const bookingEndTime = new Date(slot.endTimeUtc);
        const bookingEndTimeFormatted = `${String(bookingEndTime.getHours()).padStart(2, '0')}:${String(bookingEndTime.getMinutes()).padStart(2, '0')}:${String(bookingEndTime.getSeconds()).padStart(2, '0')}`;


        const { data: newBookingData, error: insertError } = await supabase
          .from('patient_bookings')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            booking_date: slot.date,
            booking_time_slot: slot.rawTime,
            // booking_end_time: bookingEndTimeFormatted,
            status: 'pending',
            amount: bookingAmount,
            consultation_duration_minutes: CONSULTATION_DURATION_MINUTES,
            patient_timezone: patientTimezone,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newBookingId = newBookingData.id;
        console.log("New booking successfully created with ID:", newBookingId);

        const notificationSent = await sendNotificationViaEdgeFunction(
          doctorId,
          patientFullName,
          slot.date,
          slot.rawTime,
          newBookingId,
          patientId,
          bookingAmount
        );

        if (notificationSent) {
          console.log(`Notification for slot ${slot.id} successfully triggered.`);
          successfulBookingsCount++;
        } else {
          errors.push(`${t('failed_to_send_notification_for_slot')} ${slot.time} ${slot.date}`);
        }
      } catch (err) {
        let errorMessage = 'Failed to book slot.';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        errors.push(`${t('failed_to_book_slot_error')} ${slot.time} ${slot.date}: ${errorMessage}`);
        console.error(`Error booking slot ${slot.id}:`, errorMessage, err);
      }
    }

    if (successfulBookingsCount > 0) {
      Alert.alert(
        t('booking_summary'),
        `${t('successfully_booked_slots')}: ${successfulBookingsCount}\n${t('failed_slots')}: ${errors.length}\n${errors.join('\n')}`
      );
    } else {
      Alert.alert(t('error'), t('no_slots_could_be_booked') + (errors.length > 0 ? `\n${errors.join('\n')}` : ''));
    }

    setSelectedSlots([]);
    fetchAvailableSlotsAndBookings();
    setBooking(false);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t('loading_schedule')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('book_consultation')}</Text>
          <View style={{ width: 48, height: 48 }} />
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={bookSelectedSlots}
          disabled={booking || selectedSlots.length === 0}
        >
          {booking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>
              {t('book_now')} ({selectedSlots.length})
              {doctorConsultationCost !== null && doctorConsultationCost !== undefined ? ` - $${doctorConsultationCost.toFixed(2)}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {Array.isArray(scheduleData) && scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayCardOuter}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.dayContainerInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {Array.isArray(dayData.slots) && dayData.slots.map((slot) => {
                  const isAvailableByDoctor = doctorAvailableSlotsMap[slot.id];
                  const isBookedByOther = allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id];
                  const isMyBooking = myBookingsMap[slot.id];
                  const isSelectedForBooking = selectedSlots.some(s => s.id === slot.id);

                  let buttonStyle = [styles.timeSlotButton];
                  let textStyle = [styles.timeSlotText];
                  let isDisabled = true;
                  let slotLabel = slot.time;

                  if (isMyBooking) {
                    buttonStyle.push(styles.timeSlotButtonBookedByMe);
                    textStyle.push(styles.timeSlotTextBooked);
                    isDisabled = false;
                    slotLabel = `${slot.time}\n(${t('booked')})`;
                  } else if (isBookedByOther) {
                    buttonStyle.push(styles.timeSlotButtonBookedByOther);
                    textStyle.push(styles.timeSlotTextBooked);
                    isDisabled = true;
                    slotLabel = `${slot.time}\n(${t('booked_by_other')})`;
                  } else if (isAvailableByDoctor) {
                    buttonStyle.push(styles.timeSlotButtonAvailable);
                    textStyle.push(styles.timeSlotTextAvailable);
                    isDisabled = false;
                  } else {
                    buttonStyle.push(styles.timeSlotButtonUnavailableByDoctor);
                    textStyle.push(styles.timeSlotTextUnavailableByDoctor);
                    isDisabled = true;
                    slotLabel = `${slot.time}\n(${t('unavailable')})`;
                  }

                  if (isSelectedForBooking && !isMyBooking) {
                    buttonStyle.push(styles.timeSlotButtonSelected);
                    textStyle.push(styles.timeSlotTextSelected);
                  }

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={buttonStyle}
                      onPress={() => handleSlotPress(slot)}
                      disabled={isDisabled}
                    >
                      <Text style={textStyle}>
                        {slotLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === "android"
      ? (StatusBar.currentHeight || 0) + 10
      : (StatusBar.currentHeight || 0) + 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    paddingTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
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
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0EB3EB',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '80%',
    marginTop: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  dayCardOuter: {
    marginTop: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  dayContainerInner: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },
  dayHeader: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 15,
    textAlign: 'center',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  timeSlotButton: {
    width: ITEM_WIDTH,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeSlotButtonAvailable: {
    backgroundColor: '#E0F7FA', // Light blue/cyan
    borderColor: '#0EB3EB',
  },
  timeSlotTextAvailable: {
    color: '#0EB3EB',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  timeSlotButtonBookedByMe: {
    backgroundColor: '#D1FAE5', // Light green
    borderColor: '#06D6A0',
  },
  timeSlotTextBooked: {
    color: '#06D6A0',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  timeSlotButtonBookedByOther: {
    backgroundColor: '#FFE0B2', // Light orange
    borderColor: '#FF9800',
    opacity: 0.6,
  },
  timeSlotTextBookedByOther: {
    color: '#FF9800',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  timeSlotButtonUnavailableByDoctor: {
    backgroundColor: '#FBE9E7', // Light red
    borderColor: '#FF7043',
    opacity: 0.6,
  },
  timeSlotTextUnavailableByDoctor: {
    color: '#FF7043',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  timeSlotButtonSelected: {
    backgroundColor: '#0EB3EB', // Blue
    borderColor: '#0A84FF',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default ConsultationTimePatient;