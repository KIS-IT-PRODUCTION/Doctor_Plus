import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/notify-doctor';

const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId;
  console.log("Booking screen: doctorId:", doctorId);

  const [patientId, setPatientId] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [doctorAvailableSlotsMap, setDoctorAvailableSlotsMap] = useState({});
  const [allBookedSlotsMap, setAllBookedSlotsMap] = useState({});
  const [myBookingsMap, setMyBookingsMap] = useState({});
  
  // Зміни тут: Новий стан для зберігання ціни консультації лікаря
  const [doctorConsultationCost, setDoctorConsultationCost] = useState(null); 

  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
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
          .select('full_name')
          .eq('user_id', session.user.id)
          .single();
        if (profileError) {
          throw profileError;
        }
        if (profileData) {
          setPatientProfile(profileData);
          console.log("Patient profile:", profileData);
        } else {
          console.warn("Patient profile not found for ID:", session.user.id);
          Alert.alert(t('error'), t('failed_to_get_patient_profile_data'));
          navigation.goBack();
        }

        // Зміни тут: Отримання consultation_cost лікаря
        const { data: doctorProfileData, error: doctorProfileError } = await supabase
          .from('anketa_doctor')
          .select('consultation_cost')
          .eq('user_id', doctorId)
          .single();

        if (doctorProfileError) {
          console.error("Error fetching doctor consultation cost:", doctorProfileError);
          // Можливо, ви захочете встановити ціну за замовчуванням або повідомити користувача
          setDoctorConsultationCost(0); // Встановлюємо 0 або значення за замовчуванням
          Alert.alert(t('error'), t('failed_to_get_doctor_cost'));
        } else if (doctorProfileData) {
          setDoctorConsultationCost(doctorProfileData.consultation_cost);
          console.log("Doctor consultation cost:", doctorProfileData.consultation_cost);
        } else {
          // Якщо лікаря знайдено, але вартість відсутня
          setDoctorConsultationCost(0); // Або інше значення за замовчуванням
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
  }, [t, navigation, doctorId]); // Додаємо doctorId в залежності

  const generateSchedule = useCallback(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);

      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const displayDate = new Intl.DateTimeFormat(i18n.language, options).format(currentDay);
      const dateString = currentDay.toISOString().split('T')[0];

      const slots = [];
      for (let hour = 9; hour <= 17; hour++) {
        const startHour = String(hour).padStart(2, '0');
        const slotId = `${dateString}-${startHour}:00`;
        slots.push({
          time: `${startHour}:00-${String(hour + 1).padStart(2, '0')}:00`,
          id: slotId,
          date: dateString,
          rawTime: `${startHour}:00`,
        });
      }
      days.push({
        date: currentDay,
        displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1),
        slots: slots,
      });
    }

    const allGeneratedSlotIds = days.flatMap(day => day.slots.map(slot => slot.id));
    const uniqueGeneratedSlotIds = new Set(allGeneratedSlotIds);
    if (allGeneratedSlotIds.length !== uniqueGeneratedSlotIds.size) {
      const duplicateIds = allGeneratedSlotIds.filter((item, index) => allGeneratedSlotIds.indexOf(item) !== index);
      console.error("Critical: Duplicate slot IDs generated in generateSchedule! Duplicates found:", duplicateIds);
    } else {
      console.log("All generated slot IDs are unique as expected.");
    }

    console.log("Schedule generated for patient:", days);
    return days;
  }, [i18n.language]);

  const fetchAvailableSlotsAndBookings = useCallback(async () => {
    if (!doctorId || !patientId) {
      console.warn("Missing doctorId or patientId. Cannot fetch slots for booking.");
      setLoading(false);
      setScheduleData(generateSchedule());
      return;
    }
    setLoading(true);
    console.log(`Fetching available and booked slots for doctorId: ${doctorId} and patientId: ${patientId}`);
    try {
      const { data: doctorAvailData, error: doctorAvailError } = await supabase
        .from('doctor_availability')
        .select('date, time_slot')
        .eq('doctor_id', doctorId)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (doctorAvailError) throw doctorAvailError;

      const availMap = {};
      if (Array.isArray(doctorAvailData)) {
        doctorAvailData.forEach(item => {
          const formattedTimeSlot = item.time_slot.substring(0, 5);
          const slotId = `${item.date}-${formattedTimeSlot}`;
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
          const formattedTimeSlot = item.booking_time_slot.substring(0, 5);
          const slotId = `${item.booking_date}-${formattedTimeSlot}`;
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

      setScheduleData(generateSchedule());
    } catch (err) {
      console.error("Error fetching slots for booking:", err.message);
      Alert.alert(t('error'), t('failed_to_load_slots_for_booking'));
      setScheduleData(generateSchedule());
    } finally {
      setLoading(false);
    }
  }, [doctorId, patientId, t, generateSchedule]);

  useEffect(() => {
    // Тригер для завантаження доступних слотів та бронювань
    if (doctorId && patientId && patientProfile?.full_name) {
      fetchAvailableSlotsAndBookings();
    }
  }, [doctorId, patientId, patientProfile, fetchAvailableSlotsAndBookings]);


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
        return [...prevSelectedSlots, slot];
      }
    });
    console.log(`Slot ${slot.id} selection toggled. Current selectedSlots:`, selectedSlots.map(s => s.id));
  };


  // --- ФУНКЦІЯ: Виклик Edge Function для надсилання сповіщення лікарю ---
  // Додано параметр `amount`
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
          amount: amount // <-- Передаємо amount
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

  // --- ФУНКЦІЯ: Бронювання обраних слотів ---
  const bookSelectedSlots = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert(t('no_slot_selected'), t('please_select_a_slot_to_book'));
      return;
    }
    if (!patientId) {
      Alert.alert(t('error'), t('user_not_logged_in_cannot_book'));
      return;
    }
    if (!doctorId) {
      Alert.alert(t('error'), t('doctor_id_missing_cannot_book'));
      return;
    }
    if (!patientProfile || !patientProfile.full_name) {
      Alert.alert(t('error'), t('failed_to_get_patient_name'));
      console.error("Patient full_name is missing from profile. Cannot send notification.");
      return;
    }
    
    // Зміни тут: Перевіряємо, чи отримано ціну консультації
    if (doctorConsultationCost === null) {
      Alert.alert(t('error'), t('consultation_cost_not_loaded_yet'));
      // Можливо, перезапустити завантаження або попросити користувача повторити спробу
      await fetchDoctorDataAndCost(); // Спробувати завантажити ще раз
      return;
    }
    // Якщо cost === 0, можна запитати підтвердження, чи це безкоштовно
    if (doctorConsultationCost === 0) {
      Alert.alert(t('attention'), t('this_consultation_is_free_confirm_booking'));
      // Або додати діалог підтвердження
    }


    setBooking(true);
    let successfulBookingsCount = 0;
    const errors = [];
    const patientFullName = patientProfile.full_name;

    // Зміни тут: Використовуємо doctorConsultationCost замість TEST_BOOKING_AMOUNT
    const bookingAmount = doctorConsultationCost; 

    for (const slot of selectedSlots) {
      try {
        console.log(`Attempting to book slot ${slot.id} for doctorId: ${doctorId}, patientId: ${patientId} with amount: ${bookingAmount}`);

        // 1. Перевірка доступності слота в останній момент
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

        // 2. Перевірка, чи не заброньовано слот кимось іншим
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

        // 3. Вставка нового бронювання
        const { data: newBookingData, error: insertError } = await supabase
          .from('patient_bookings')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            booking_date: slot.date,
            booking_time_slot: slot.rawTime,
            status: 'pending',
            amount: bookingAmount, // <-- Використовуємо doctorConsultationCost
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newBookingId = newBookingData.id;
        console.log("New booking successfully created with ID:", newBookingId);

        // 4. Виклик Edge Function для надсилання сповіщення
        const notificationSent = await sendNotificationViaEdgeFunction(
          doctorId,
          patientFullName,
          slot.date,
          slot.rawTime,
          newBookingId,
          patientId,
          bookingAmount // <-- Передаємо bookingAmount до Edge Function
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
    fetchAvailableSlotsAndBookings(); // Оновити стан слотів після бронювання

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
    backgroundColor: '#FFFFFF',
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
    elevation: 3,
    justifyContent: 'center',
    minHeight: 65,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  timeSlotButtonAvailable: {
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    borderColor: 'rgba(224, 224, 224, 0.7)',
  },
  timeSlotTextAvailable: {
    color: '#757575',
  },
  timeSlotButtonSelected: {
    backgroundColor: '#0EB3EB',
    borderColor: '#0A8BA6',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSlotButtonBookedByOther: {
    backgroundColor: 'rgba(52, 152, 219, 0.6)',
    borderColor: 'rgba(41, 128, 185, 0.6)',
  },
  timeSlotButtonBookedByMe: {
    backgroundColor: '#0EB3EB',
    borderColor: '#0A8BA6',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  timeSlotTextBooked: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSlotButtonUnavailableByDoctor: {
    backgroundColor: 'rgba(247, 247, 247, 0.3)',
    borderColor: 'rgba(224, 224, 224, 0.3)',
    opacity: 0.4,
  },
  timeSlotTextUnavailableByDoctor: {
    color: '#C0C0C0',
    fontWeight: '500',
  },
});

export default ConsultationTimePatient;