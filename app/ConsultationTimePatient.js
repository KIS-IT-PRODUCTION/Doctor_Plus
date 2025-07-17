import "react-native-url-polyfill/auto";
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  Alert, ActivityIndicator, Platform, StatusBar, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime } from 'luxon';
import Constants from 'expo-constants'; // Імпортуємо Constants

const { width } = Dimensions.get('window');
const CONSULTATION_DURATION_MINUTES = 45;

const sendNotificationToDoctor = async (bookingData, patientName) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("User is not authenticated.");
    }
    const payload = { booking: bookingData, patient_name: patientName };
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', `Bearer ${session.access_token}`);
    const response = await fetch('https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/notify-doctor', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} ${errorText}`);
    }
    console.log("Successfully triggered doctor notification.");
    return true;
  } catch (error) {
    console.error("Error in sendNotificationToDoctor:", error.message);
    return false;
  }
};

const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { doctorId } = route.params;

  const [patientId, setPatientId] = React.useState(null);
  const [patientProfile, setPatientProfile] = React.useState(null);
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
    // Ця функція не буде викликана для заброньованих слотів через 'disabled'
    setSelectedSlot(prev => (prev?.id === slot.id ? null : slot));
  };
  
  const processBooking = async () => {
    if (!selectedSlot || !patientProfile) return;
    setBooking(true);
    try {
        const { dbDate, dbTime } = selectedSlot;
        
        const { data: newBooking, error: insertError } = await supabase.from('patient_bookings').insert({
            patient_id: patientId, doctor_id: doctorId, booking_date: dbDate,
            booking_time_slot: dbTime, status: 'pending',
            patient_timezone: patientTimezone, consultation_duration_minutes: CONSULTATION_DURATION_MINUTES,
            amount: doctorConsultationCost,
        }).select().single();

        if (insertError) {
          if (insertError.code === '23505') throw new Error(t('slot_just_booked_by_another_patient'));
          throw insertError;
        }

        await sendNotificationToDoctor(newBooking, patientProfile.full_name);

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
        <LinearGradient colors={['#F7F8FA', '#E8F2F8']} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0EB3EB" />
            <Text style={styles.loadingText}>{t('loading_schedule')}</Text>
        </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F7F8FA', '#E8F2F8']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('book_consultation')}</Text>
                <View style={{ width: 48 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {scheduleData.length > 0 ? scheduleData.map((dayData, dayIndex) => (
                <View key={dayIndex} style={styles.dayCard}>
                    <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
                    <View style={styles.slotsContainer}>
                        {dayData.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const isBooked = slot.isBooked;
                        const isMyBooking = slot.isMyBooking;

                        return (
                            <TouchableOpacity 
                                key={slot.id} 
                                style={[
                                    styles.timeSlotButton,
                                    isMyBooking ? styles.myBookingSlot : 
                                    isBooked ? styles.bookedSlot : 
                                    styles.availableSlot,
                                    isSelected && styles.selectedSlot
                                ]}
                                onPress={() => handleSlotPress(slot)} 
                                disabled={isBooked} // Будь-який заброньований слот буде неактивним
                            >
                                <Text style={[
                                    styles.timeSlotText,
                                    isBooked ? styles.bookedText :
                                    styles.availableText,
                                    isMyBooking && styles.myBookingText, // Стиль для свого бронювання
                                    isSelected && styles.selectedText
                                ]}>
                                    {isMyBooking ? `${slot.time}\n(${t('booked')})` : slot.time}
                                </Text>
                            </TouchableOpacity>
                        );
                        })}
                    </View>
                </View>
                )) : !loading && <Text style={styles.noScheduleText}>{t('no_schedule_data_available')}</Text>}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={bookSelectedSlots} disabled={booking || !selectedSlot}>
                    <LinearGradient
                        colors={!selectedSlot ? ['#B0B0B0', '#909090'] : ['#0EB3EB', '#0A8BC2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bookButton}
                    >
                        {booking ? <ActivityIndicator color="#FFFFFF" /> : 
                        <Text style={styles.bookButtonText}>{t('book_now')}</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    fontFamily: 'System',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.15)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    // Збільшуємо paddingBottom для прокручуваної області
    // Щоб вміст не перекривався футером
    paddingBottom: Platform.OS === 'android' ? 120 + Constants.statusBarHeight : 120, // Додано Constants.statusBarHeight
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dayHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 20,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotButton: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 60,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  availableSlot: {
    backgroundColor: '#F0F9FF',
    borderColor: '#B3E5FC',
  },
  availableText: {
    color: '#0288D1',
  },
  bookedSlot: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  bookedText: {
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  myBookingSlot: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  myBookingText: {
    color: '#388E3C',
  },
  selectedSlot: {
    backgroundColor: '#0EB3EB',
    borderColor: '#0A8BC2',
    transform: [{ scale: 1.05 }],
  },
  selectedText: {
    color: '#FFFFFF',
  },
  noScheduleText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7f8c8d',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    // Використовуємо SafeAreaView для коректного відступу знизу
    paddingBottom: Platform.OS === 'ios' ? 30 : 20 + (Constants.statusBarHeight || 0), // Додано Constants.statusBarHeight
    backgroundColor: 'rgba(247, 248, 250, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  bookButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConsultationTimePatient;