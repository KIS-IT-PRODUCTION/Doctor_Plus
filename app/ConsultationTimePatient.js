// ConsultationTimePatient.js - FINAL VERSION

import "react-native-url-polyfill/auto";
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime } from 'luxon';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;
const CONSULTATION_DURATION_MINUTES = 45;

const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { doctorId } = route.params;

  const [patientId, setPatientId] = React.useState(null);
  const [patientProfile, setPatientProfile] = React.useState(null); // FIX: Додано стан для профілю
  const [patientTimezone, setPatientTimezone] = React.useState(null);
  const [scheduleData, setScheduleData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [booking, setBooking] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [doctorConsultationCost, setDoctorConsultationCost] = React.useState(null);

  const processAndDisplaySchedule = React.useCallback((availableSlots, bookedSlots, myBookings, ptZone) => {
    if (!ptZone) return;
    const scheduleMap = new Map();
    const now = DateTime.local().setZone(ptZone);
    availableSlots.forEach(slot => {
      const { date, time_slot } = slot;
      const slotId = `${date}-${time_slot}`;
      const utcDateTime = DateTime.fromISO(`${date}T${time_slot}`, { zone: 'utc' });
      if (!utcDateTime.isValid) return;
      const localDateTime = utcDateTime.setZone(ptZone);
      if (localDateTime < now) return;
      const displayDateKey = localDateTime.toISODate();
      if (!scheduleMap.has(displayDateKey)) {
        scheduleMap.set(displayDateKey, { displayDate: localDateTime.toLocaleString(DateTime.DATE_FULL), slots: [] });
      }
      const endTimeLocalDateTime = localDateTime.plus({ minutes: CONSULTATION_DURATION_MINUTES });
      scheduleMap.get(displayDateKey).slots.push({
        id: slotId,
        time: `${localDateTime.toFormat('HH:mm')} - ${endTimeLocalDateTime.toFormat('HH:mm')}`,
        isBooked: bookedSlots.has(slotId),
        isMyBooking: myBookings.has(slotId),
        utcDateTime, dbDate: date, dbTime: time_slot,
      });
    });
    const sortedSchedule = Array.from(scheduleMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => {
        entry[1].slots.sort((a, b) => a.utcDateTime - b.utcDateTime);
        return entry[1];
      });
    setScheduleData(sortedSchedule);
  }, []);

  const fetchScheduleAndProfile = React.useCallback(async () => {
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");
        const currentPatientId = session.user.id;
        setPatientId(currentPatientId);

        const todayDateStringUTC = DateTime.utc().toISODate();
        const [patientProfileRes, doctorAvailRes, bookingsRes, doctorCostRes] = await Promise.all([
            supabase.from('profiles').select('full_name, country_timezone').eq('user_id', currentPatientId).single(),
            supabase.from('doctor_availability').select('date, time_slot').eq('doctor_id', doctorId).gte('date', todayDateStringUTC),
            supabase.from('patient_bookings').select('booking_date, booking_time_slot, patient_id').eq('doctor_id', doctorId).gte('booking_date', todayDateStringUTC),
            supabase.from('anketa_doctor').select('consultation_cost').eq('user_id', doctorId).single()
        ]);
        
        // FIX: Зберігаємо профіль пацієнта
        if(patientProfileRes.data) setPatientProfile(patientProfileRes.data);

        let ptZone = patientProfileRes.data?.country_timezone;
        if (!ptZone || !DateTime.local().setZone(ptZone).isValid) ptZone = DateTime.local().zoneName;
        setPatientTimezone(ptZone);

        setDoctorConsultationCost(doctorCostRes.data?.consultation_cost ?? 0);
        
        const availableSlots = doctorAvailRes.data || [];
        const bookedData = bookingsRes.data || [];
        const bookedSlotsMap = new Map(bookedData.map(b => [`${b.booking_date}-${b.booking_time_slot}`, true]));
        const myBookingsMap = new Map(bookedData.filter(b => b.patient_id === currentPatientId).map(b => [`${b.booking_date}-${b.booking_time_slot}`, true]));
        
        processAndDisplaySchedule(availableSlots, bookedSlotsMap, myBookingsMap, ptZone);
    } catch (err) {
        console.error("Error fetching data for booking:", err.message);
        Alert.alert(t('error'), t('failed_to_load_schedule'));
    } finally {
        setLoading(false);
    }
  }, [doctorId, t, processAndDisplaySchedule]);

  React.useEffect(() => { fetchScheduleAndProfile() }, [fetchScheduleAndProfile]);

  const handleSlotPress = (slot) => {
    if (slot.isBooked && !slot.isMyBooking) {
      Alert.alert(t('booked'), t('slot_already_booked_by_other'));
      return;
    }
    setSelectedSlot(prev => (prev?.id === slot.id ? null : slot));
  };
  
  const processBooking = async () => {
    if (!selectedSlot || !patientProfile) return;
    setBooking(true);
    try {
        const { dbDate, dbTime } = selectedSlot;
        
        // 1. Створюємо бронювання
        const { data: newBooking, error: insertError } = await supabase.from('patient_bookings').insert({
            patient_id: patientId, doctor_id: doctorId, booking_date: dbDate,
            booking_time_slot: dbTime, status: 'pending', // Статус 'pending', доки лікар не підтвердить
            patient_timezone: patientTimezone, consultation_duration_minutes: CONSULTATION_DURATION_MINUTES,
            amount: doctorConsultationCost,
        }).select().single();

        if (insertError) {
          if (insertError.code === '23505') throw new Error(t('slot_just_booked_by_another_patient'));
          throw insertError;
        }

        // 2. FIX: Викликаємо Edge Function для сповіщення лікаря
        const { data: doctorProfile } = await supabase.from('anketa_doctor').select('language').eq('user_id', doctorId).single();
        const { data: { session } } = await supabase.auth.getSession();
        const payload = {
            booking: newBooking,
            patient_name: patientProfile.full_name,
            doctor_language: doctorProfile?.language || 'uk',
        };
        const response = await fetch('https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/notify-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify(payload)
        });
        if (!response.ok) console.error("Failed to trigger doctor notification:", await response.text());

        Alert.alert(t('success_title'), `${t('you_have_successfully_booked_the_slot_for')} ${selectedSlot.time}`);
        setSelectedSlot(null);
        fetchScheduleAndProfile();

    } catch (err) {
        console.error("Error booking slot:", err.message);
        Alert.alert(t('error'), `${t('failed_to_book_slot_error')}: ${err.message}`);
        fetchScheduleAndProfile();
    } finally {
        setBooking(false);
    }
  };

  const bookSelectedSlots = () => {
    if (!selectedSlot) return Alert.alert(t('no_slot_selected'), t('please_select_a_slot_to_book'));
    if (doctorConsultationCost > 0) {
        Alert.alert(t('confirm_booking'), `${t('are_you_sure_you_want_to_book_for')} $${doctorConsultationCost.toFixed(2)}?`,
            [{ text: t('cancel'), style: 'cancel' }, { text: t('confirm'), onPress: processBooking }]
        );
    } else {
        processBooking();
    }
  };

  const handleBackPress = () => navigation.goBack();

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
          {/* This empty view acts as a spacer to help center the title */}
          <View style={{ width: 48 }} /> 
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
          onPress={bookSelectedSlots}
          disabled={booking || !selectedSlot}
        >
          {booking ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.bookButtonText}>{t('book_now')}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {scheduleData.length > 0 ? scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayCardOuter}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.dayContainerInner}
            >
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {dayData.slots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  let buttonStyle = [styles.timeSlotButton];
                  let textStyle = [styles.timeSlotText];
                  let slotLabel = slot.time;

                  if (slot.isMyBooking) {
                    buttonStyle.push(styles.timeSlotButtonBookedByMe);
                    textStyle.push(styles.timeSlotTextBooked);
                    slotLabel = `${slot.time}\n(${t('booked')})`;
                  } else if (slot.isBooked) {
                    buttonStyle.push(styles.timeSlotButtonBookedByOther);
                    textStyle.push(styles.timeSlotTextBookedByOther);
                  } else {
                    buttonStyle.push(styles.timeSlotButtonAvailable);
                    textStyle.push(styles.timeSlotTextAvailable);
                  }

                  if (isSelected) {
                    buttonStyle.push(styles.timeSlotButtonSelected);
                    textStyle.push(styles.timeSlotTextSelected);
                  }

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={buttonStyle}
                      onPress={() => handleSlotPress(slot)}
                      disabled={slot.isBooked && !slot.isMyBooking}
                    >
                      <Text style={textStyle}>{slotLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        )) : !loading && <Text style={styles.noScheduleText}>{t('no_schedule_data_available')}</Text>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  header: { paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 25, width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  // FIX: Styles for centering the title
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center', // Ensure text is centered within its container
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: { backgroundColor: '#0EB3EB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, width: '80%', alignItems: 'center', shadowColor: '#0EB3EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  bookButtonDisabled: { backgroundColor: '#A0A0A0' },
  bookButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  scrollViewContent: { paddingHorizontal: 15, paddingBottom: 30 },
  dayCardOuter: { marginTop: 20, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, overflow: 'hidden' },
  dayContainerInner: { borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  dayHeader: { fontSize: 19, fontWeight: 'bold', color: '#222', marginBottom: 15, textAlign: 'center' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  // FIX: Adjusted slot button width to better fit the new time format
  timeSlotButton: { width: '100%', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, minHeight: 60, justifyContent: 'center', marginBottom: 10 },
  timeSlotText: { fontWeight: '500', fontSize: 14, textAlign: 'center' },
  timeSlotButtonAvailable: { backgroundColor: '#E0F7FA', borderColor: '#0EB3EB' },
  timeSlotTextAvailable: { color: '#007B8B' },
  timeSlotButtonBookedByMe: { backgroundColor: '#D1FAE5', borderColor: '#06D6A0' },
  timeSlotTextBooked: { color: '#059669' },
  timeSlotButtonBookedByOther: { backgroundColor: '#EEEEEE', borderColor: '#BDBDBD' },
  timeSlotTextBookedByOther: { color: '#757575', textDecorationLine: 'line-through' },
  timeSlotButtonSelected: { backgroundColor: '#0EB3EB', borderColor: '#0A84FF' },
  timeSlotTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  noScheduleText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#555' },
});

export default ConsultationTimePatient;