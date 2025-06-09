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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../providers/supabaseClient'; // Переконайтеся, що шлях правильний

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId; // ID лікаря, для якого бронюємо
  console.log("Booking screen: doctorId:", doctorId);

  const [patientId, setPatientId] = useState(null); // ID поточного пацієнта
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false); // Для індикатора завантаження під час бронювання

  // Словники для швидкого доступу до статусу слотів
  const [doctorAvailableSlotsMap, setDoctorAvailableSlotsMap] = useState({}); // Слоти, доступні лікарем
  const [allBookedSlotsMap, setAllBookedSlotsMap] = useState({}); // Всі слоти, заброньовані іншими пацієнтами
  const [myBookingsMap, setMyBookingsMap] = useState({}); // Мої особисті бронювання з цим лікарем
  
  const [selectedSlot, setSelectedSlot] = useState(null); // Слот, який пацієнт щойно вибрав

  // Отримуємо ID поточного пацієнта
  useEffect(() => {
    const getPatientSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user session:", error.message);
        Alert.alert(t('error'), t('failed_to_get_user_info'));
        navigation.goBack(); // Повертаємося, якщо не можемо отримати інформацію про користувача
        return;
      }
      if (user) {
        setPatientId(user.id);
        console.log("Current patientId:", user.id);
      } else {
        Alert.alert(t('error'), t('user_not_logged_in_please_login'));
        navigation.goBack();
      }
    };
    getPatientSession();
  }, [t, navigation]);

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
      // 1. Завантажуємо слоти, які лікар зробив доступними
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

      // 2. Завантажуємо всі заброньовані слоти для цього лікаря
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
    if (doctorId && patientId) {
      fetchAvailableSlotsAndBookings();
    }
  }, [doctorId, patientId, fetchAvailableSlotsAndBookings]);


  const handleSlotPress = (slot) => {
    // Якщо лікар не зробив слот доступним, його не можна обрати
    if (!doctorAvailableSlotsMap[slot.id]) {
      Alert.alert(t('not_available'), t('doctor_not_available_at_this_time'));
      console.log(`Slot ${slot.id} is not available by doctor.`);
      return;
    }

    // Якщо слот вже заброньований кимось іншим (і це не моє бронювання), його не можна обрати
    if (allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id]) {
      Alert.alert(t('booked'), t('slot_already_booked_by_other'));
      console.log(`Slot ${slot.id} is already booked by another patient.`);
      return;
    }

    // Якщо це моє вже заброньоване бронювання, дозволяємо його "обрати" для можливого скасування чи перебронювання
    // Але якщо обраний слот вже є моїм, то знімаємо вибір.
    if (myBookingsMap[slot.id]) {
      if (selectedSlot && selectedSlot.id === slot.id) {
        setSelectedSlot(null); // Знімаємо вибір, якщо це моє вже вибране
        console.log(`Slot ${slot.id} (my booking) deselected.`);
      } else {
        setSelectedSlot(slot); // Вибираємо моє бронювання
        console.log(`Slot ${slot.id} (my booking) selected.`);
      }
      return;
    }

    // Звичайний доступний слот
    if (selectedSlot && selectedSlot.id === slot.id) {
      setSelectedSlot(null); // Знімаємо вибір
      console.log(`Slot ${slot.id} deselected.`);
    } else {
      setSelectedSlot(slot); // Вибираємо новий слот
      console.log(`Slot ${slot.id} selected for booking.`);
    }
  };

  const bookSelectedSlot = async () => {
    if (!selectedSlot) {
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

    setBooking(true);
    console.log(`Attempting to book slot ${selectedSlot.id} for doctorId: ${doctorId}, patientId: ${patientId}`);
    try {
      // 1. Перевірка доступності слота в останній момент (для уникнення конфліктів)
      const { data: currentAvail, error: availCheckError } = await supabase
        .from('doctor_availability')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', selectedSlot.date)
        .eq('time_slot', selectedSlot.rawTime);
      if (availCheckError || !currentAvail || currentAvail.length === 0) {
        throw new Error(t('slot_no_longer_available_by_doctor'));
      }

      // 2. Перевірка, чи не заброньовано слот кимось іншим, поки пацієнт його вибирав
      const { data: currentBookings, error: bookingCheckError } = await supabase
        .from('patient_bookings')
        .select('id, patient_id')
        .eq('doctor_id', doctorId)
        .eq('booking_date', selectedSlot.date)
        .eq('booking_time_slot', selectedSlot.rawTime);
      
      if (bookingCheckError) throw bookingCheckError;

      if (currentBookings && currentBookings.length > 0) {
          // Якщо слот вже заброньовано, і це не моє попереднє бронювання, кидаємо помилку
          if (currentBookings[0].patient_id !== patientId) {
              throw new Error(t('slot_just_booked_by_another_patient'));
          } else {
              // Якщо це моє попереднє бронювання, ми його просто оновимо або залишимо
              console.log("Slot is already booked by current patient, no action needed or consider update/delete previous.");
              Alert.alert(t('info'), t('slot_already_your_booking'));
              setSelectedSlot(null); // Clear selection
              fetchAvailableSlotsAndBookings(); // Re-fetch to update UI
              return;
          }
      }

      // 3. Видалення попередніх бронювань цього пацієнта для цього лікаря (якщо пацієнт може мати лише одне активне бронювання)
      const { error: deletePrevError } = await supabase
        .from('patient_bookings')
        .delete()
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId); // Видаляємо лише бронювання цього пацієнта з цим лікарем
      if (deletePrevError) {
        console.warn("Warning: Could not delete previous booking (if any):", deletePrevError.message);
      }

      // 4. Вставка нового бронювання
      const { error: insertError } = await supabase
        .from('patient_bookings')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          booking_date: selectedSlot.date,
          booking_time_slot: selectedSlot.rawTime,
        });

      if (insertError) throw insertError;

      Alert.alert(t('success'), t('slot_booked_successfully'));
      setSelectedSlot(null); // Очищаємо вибір після успішного бронювання
      fetchAvailableSlotsAndBookings(); // Перезавантажуємо слоти, щоб оновити UI (підсвітити нове бронювання)
    } catch (err) {
      console.error("Error booking slot:", err.message);
      Alert.alert(t('error'), `${t('failed_to_book_slot')}: ${err.message}`);
    } finally {
      setBooking(false);
    }
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
          {/* Пустий View для вирівнювання, якщо потрібно, або просто відсутність елемента справа */}
          <View style={{ width: 48, height: 48 }} /> 
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={bookSelectedSlot}
          disabled={booking || !selectedSlot}
        >
          {booking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>{t('book_now')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {Array.isArray(scheduleData) && scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
            <View style={styles.slotsContainer}>
              {Array.isArray(dayData.slots) && dayData.slots.map((slot) => {
                const isAvailableByDoctor = doctorAvailableSlotsMap[slot.id]; // Чи лікар зробив доступним
                const isBookedByOther = allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id]; // Заброньовано іншим
                const isMyBooking = myBookingsMap[slot.id]; // Заброньовано мною
                const isSelected = selectedSlot && selectedSlot.id === slot.id; // Обрано пацієнтом (тимчасово)

                let buttonStyle = [styles.timeSlotButton]; // Базовий стиль кнопки
                let textStyle = [styles.timeSlotText]; // Базовий стиль тексту
                let isDisabled = true;
                let slotLabel = slot.time;

                if (isMyBooking) { // Найвищий пріоритет - моє бронювання (завжди зелене)
                  buttonStyle.push(styles.timeSlotButtonBookedByMe);
                  textStyle.push(styles.timeSlotTextBookedByMe);
                  isDisabled = false; // Можна переобрати/скасувати
                  slotLabel = `${slot.time}\n(${t('booked')})`; // Додаємо перенос рядка для "Заброньовано"
                } else if (isAvailableByDoctor) { // Якщо лікар зробив доступним
                  if (isBookedByOther) { // Але заброньовано іншим
                    buttonStyle.push(styles.timeSlotButtonBookedByOther);
                    textStyle.push(styles.timeSlotTextBookedByOther);
                    isDisabled = true; // Не можна обрати
                    slotLabel = `${slot.time}\n(${t('booked')})`; // Також показуємо "Заброньовано"
                  } else { // Доступний для бронювання
                    buttonStyle.push(styles.timeSlotButtonAvailable); // Як лікар бачить незайнятий
                    textStyle.push(styles.timeSlotTextAvailable);
                    isDisabled = false;
                  }
                } else { // Лікар НЕ зробив доступним
                  buttonStyle.push(styles.timeSlotButtonUnavailableByDoctor);
                  textStyle.push(styles.timeSlotTextUnavailableByDoctor);
                  isDisabled = true;
                  slotLabel = `${slot.time}\n(${t('unavailable')})`;
                }

                // Якщо поточний слот вибрано пацієнтом (незалежно від його попереднього стану),
                // він завжди буде синім і перекриє інші стилі (окрім myBooking, якщо ви хочете, щоб вибрана власна бронь залишалася зеленою)
                // Для простоти, якщо вибрано, робимо синім.
                if (isSelected && !isMyBooking) { // Якщо це не моя бронь, але я її вибрав, тоді синій
                  buttonStyle.push(styles.timeSlotButtonSelected);
                  textStyle.push(styles.timeSlotTextSelected);
                } else if (isSelected && isMyBooking) { 
                    // Якщо це моя бронь і я її вибрав (для скасування, наприклад), 
                    // залишаємо її зеленою, як заброньовану, але вона все одно вважається selectedSlot
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Змінено на column для вертикального розміщення елементів
    flexDirection: 'column', 
    alignItems: 'center', // Центрування по горизонталі
  },
  headerTopRow: { // Новий стиль для верхнього ряду (кнопка назад + заголовок)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', // Займає всю ширину
    marginBottom: 10, // Відступ до кнопки бронювання
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1, // Дозволяє зайняти доступний простір, шоб центруватись
    textAlign: 'center',
    marginHorizontal: 10,
  },
  bookButton: { 
    backgroundColor: '#0EB3EB', 
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 10, // Додано відступ від заголовка
    width: '80%', // Можна налаштувати ширину кнопки
  },
  bookButtonText: { 
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  dayContainer: {
    marginTop: 20,
    backgroundColor: '#E3F2FD', 
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    paddingBottom: 5,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotButton: { 
    width: ITEM_WIDTH,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    justifyContent: 'center', 
  },
  timeSlotText: { 
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', 
  },
  timeSlotButtonAvailable: { 
    backgroundColor: '#E0E0E0', 
    borderColor: '#BDBDBD',
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
    backgroundColor: '#F0F0F0', 
    borderColor: '#D9D9D9',
    opacity: 0.7, 
  },
  timeSlotTextBookedByOther: {
    color: '#A0A0A0', 
    fontWeight: '500',
  },
  timeSlotButtonBookedByMe: { 
    backgroundColor: '#4CAF50', 
    borderColor: '#2E7D32',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  timeSlotTextBookedByMe: {
    color: '#FFFFFF', 
    fontWeight: '70',
  },
  timeSlotButtonUnavailableByDoctor: { 
    backgroundColor: '#F7F7F7', 
    borderColor: '#E0E0E0',
    opacity: 0.4,
  },
  timeSlotTextUnavailableByDoctor: {
    color: '#C0C0C0', 
    fontWeight: '500',
  },
});

export default ConsultationTimePatient;