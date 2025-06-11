// ConsultationTimePatient.js

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

// --- КОНСТАНТИ ТА НАЛАШТУВАННЯ ---
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3; // Ширина елемента для гнучкого розміщення

// !!! ВАЖЛИВО: Замініть цей URL на URL вашої Supabase Edge Function
// Ви знайдете його в панелі керування Supabase -> Edge Functions -> Ваша функція 'notify-doctor'
const SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co/functions/v1/notify-doctor';
// Якщо ви тестуєте локально з `supabase functions serve`, URL буде щось на зразок:
// const SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL = 'http://localhost:54321/functions/v1/notify-doctor';


// --- ОСНОВНИЙ КОМПОНЕНТ ---
const ConsultationTimePatient = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // t для перекладів, i18n для доступу до мови
  const doctorId = route.params?.doctorId; // ID лікаря, переданий з попереднього екрану
  console.log("Booking screen: doctorId:", doctorId);

  // Стейт для даних, що завантажуються/змінюються
  const [patientId, setPatientId] = useState(null); // ID поточного пацієнта
  const [patientProfile, setPatientProfile] = useState(null); // Для зберігання профілю пацієнта (ім'я)
  const [scheduleData, setScheduleData] = useState([]); // Дані розкладу для відображення
  const [loading, setLoading] = useState(true); // Індикатор завантаження даних
  const [booking, setBooking] = useState(false); // Індикатор завантаження під час бронювання

  // Словники для швидкого доступу до статусу слотів
  const [doctorAvailableSlotsMap, setDoctorAvailableSlotsMap] = useState({}); // Слоти, доступні лікарем
  const [allBookedSlotsMap, setAllBookedSlotsMap] = useState({}); // Всі слоти, заброньовані іншими пацієнтами
  const [myBookingsMap, setMyBookingsMap] = useState({}); // Мої особисті бронювання з цим лікарем

  const [selectedSlot, setSelectedSlot] = useState(null); // Слот, який пацієнт щойно вибрав (для бронювання)

  // --- ЕФЕКТ: Отримання ID та профілю поточного пацієнта ---
  // Цей useEffect запускається один раз при завантаженні компонента для отримання інформації про користувача.
  useEffect(() => {
    const getPatientSessionAndProfile = async () => {
      setLoading(true); // Починаємо завантаження
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession(); // Отримуємо активну сесію
        if (sessionError) {
          throw sessionError; // Викидаємо помилку, якщо є проблема з отриманням сесії
        }

        if (!session?.user) { // Якщо користувач не залогінений
          Alert.alert(t('error'), t('user_not_logged_in_please_login'));
          navigation.goBack(); // Повертаємося назад
          return;
        }

        setPatientId(session.user.id); // Встановлюємо ID пацієнта
        console.log("Current patientId:", session.user.id);

        // Отримання профілю пацієнта для його повного імені (full_name)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles') // Змініть на 'profile_patient', якщо так називається ваша таблиця
          .select('full_name') // Важливо: переконайтеся, що це правильне поле з ім'ям
          .eq('id', session.user.id) 
          .single();

        if (profileError) {
          throw profileError; // Викидаємо помилку, якщо є проблема з отриманням профілю
        }
        if (profileData) {
          setPatientProfile(profileData); // Встановлюємо дані профілю
          console.log("Patient profile:", profileData);
        } else {
          console.warn("Patient profile not found for ID:", session.user.id);
          Alert.alert(t('error'), t('failed_to_get_patient_profile_data'));
          navigation.goBack();
        }
      } catch (err) {
        console.error("Error getting user session or patient profile:", err.message);
        Alert.alert(t('error'), t('failed_to_get_user_info_or_profile'));
        navigation.goBack();
      } finally {
        setLoading(false); // Завершуємо завантаження в будь-якому випадку
      }
    };
    getPatientSessionAndProfile();
  }, [t, navigation]); // Залежності: t для перекладів, navigation для навігації

  // --- КОЛБЕК: Генерація структури розкладу ---
  // Цей колбек генерує 14 днів з годинними слотами.
  const generateSchedule = useCallback(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) { // Генеруємо розклад на 14 днів
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);

      // Форматування дати для відображення на різних мовах
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const displayDate = new Intl.DateTimeFormat(i18n.language, options).format(currentDay);
      const dateString = currentDay.toISOString().split('T')[0]; // Формат 'YYYY-MM-DD'

      const slots = [];
      for (let hour = 9; hour <= 17; hour++) { // Годинні слоти з 9:00 до 17:00
        const startHour = String(hour).padStart(2, '0');
        const slotId = `${dateString}-${startHour}:00`; // Унікальний ID слота
        slots.push({
          time: `${startHour}:00-${String(hour + 1).padStart(2, '0')}:00`, // Часовий проміжок для відображення
          id: slotId,
          date: dateString, // Дата слота
          rawTime: `${startHour}:00`, // Час початку слота у форматі HH:MM
        });
      }
      days.push({
        date: currentDay,
        displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1), // Перша літера велика
        slots: slots,
      });
    }

    // Додаткове логування для діагностики проблеми з унікальністю ID слотів
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
  }, [i18n.language]); // Залежність: мова для форматування дати

  // --- КОЛБЕК: Завантаження доступних та заброньованих слотів ---
  const fetchAvailableSlotsAndBookings = useCallback(async () => {
    // Перевірка наявності необхідних ID перед виконанням запитів.
    if (!doctorId || !patientId) {
      console.warn("Missing doctorId or patientId. Cannot fetch slots for booking.");
      setLoading(false);
      setScheduleData(generateSchedule()); // Генеруємо розклад, навіть якщо не можемо завантажити дані
      return;
    }
    setLoading(true); // Починаємо завантаження
    console.log(`Fetching available and booked slots for doctorId: ${doctorId} and patientId: ${patientId}`);
    try {
      // 1. Завантажуємо слоти, які лікар зробив доступними ('doctor_availability')
      const { data: doctorAvailData, error: doctorAvailError } = await supabase
        .from('doctor_availability')
        .select('date, time_slot')
        .eq('doctor_id', doctorId)
        .gte('date', new Date().toISOString().split('T')[0]); // Тільки майбутні дати

      if (doctorAvailError) throw doctorAvailError; // Викидаємо помилку для обробки в catch

      const availMap = {};
      if (Array.isArray(doctorAvailData)) {
        doctorAvailData.forEach(item => {
          const formattedTimeSlot = item.time_slot.substring(0, 5); // Приводимо до HH:MM
          const slotId = `${item.date}-${formattedTimeSlot}`;
          availMap[slotId] = true;
        });
      }
      setDoctorAvailableSlotsMap(availMap);
      console.log("Doctor's available slots map:", availMap);

      // 2. Завантажуємо всі заброньовані слоти для цього лікаря ('patient_bookings')
      const { data: bookedData, error: bookedError } = await supabase
        .from('patient_bookings')
        .select('booking_date, booking_time_slot, patient_id')
        .eq('doctor_id', doctorId)
        .gte('booking_date', new Date().toISOString().split('T')[0]); // Тільки майбутні дати

      if (bookedError) throw bookedError;

      const allBookedMap = {}; // Карта всіх заброньованих слотів
      const myBookings = {}; // Карта слотів, заброньованих поточним пацієнтом
      if (Array.isArray(bookedData)) {
        bookedData.forEach(item => {
          const formattedTimeSlot = item.booking_time_slot.substring(0, 5);
          const slotId = `${item.booking_date}-${formattedTimeSlot}`;
          allBookedMap[slotId] = true; // Позначаємо, що слот заброньовано
          if (item.patient_id === patientId) {
            myBookings[slotId] = true; // Позначаємо, що це моє бронювання
          }
        });
      }
      setAllBookedSlotsMap(allBookedMap);
      setMyBookingsMap(myBookings);
      console.log("All booked slots map:", allBookedMap);
      console.log("My bookings map:", myBookings);

      setScheduleData(generateSchedule()); // Оновлюємо дані розкладу
    } catch (err) {
      console.error("Error fetching slots for booking:", err.message);
      Alert.alert(t('error'), t('failed_to_load_slots_for_booking'));
      setScheduleData(generateSchedule()); // Все одно генеруємо розклад, щоб уникнути порожнього екрану
    } finally {
      setLoading(false); // Завершуємо завантаження
    }
  }, [doctorId, patientId, t, generateSchedule]); // Залежності: ID лікаря/пацієнта, переклади, функція генерації розкладу

  // --- ЕФЕКТ: Виклик функції завантаження даних, коли доступні ID ---
  useEffect(() => {
    // Цей ефект спрацьовує, коли doctorId, patientId та patientProfile.full_name стають доступними.
    // patientProfile.full_name важливий для надсилання сповіщення.
    if (doctorId && patientId && patientProfile?.full_name) {
      fetchAvailableSlotsAndBookings();
    }
  }, [doctorId, patientId, patientProfile, fetchAvailableSlotsAndBookings]);


  // --- ФУНКЦІЯ: Обробка натискання на слот ---
  const handleSlotPress = (slot) => {
    // 1. Якщо лікар не зробив слот доступним, його не можна обрати
    if (!doctorAvailableSlotsMap[slot.id]) {
      Alert.alert(t('not_available'), t('doctor_not_available_at_this_time'));
      console.log(`Slot ${slot.id} is not available by doctor.`);
      return;
    }

    // 2. Якщо слот вже заброньований кимось іншим (і це не моє бронювання), його не можна обрати
    if (allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id]) {
      Alert.alert(t('booked'), t('slot_already_booked_by_other'));
      console.log(`Slot ${slot.id} is already booked by another patient.`);
      return;
    }

    // 3. Якщо це моє вже заброньоване бронювання, дозволяємо його "обрати" для можливого скасування чи перебронювання.
    if (myBookingsMap[slot.id]) {
      if (selectedSlot && selectedSlot.id === slot.id) {
        setSelectedSlot(null); // Знімаємо вибір, якщо це моє вже вибране бронювання
        console.log(`Slot ${slot.id} (my booking) deselected.`);
      } else {
        setSelectedSlot(slot); // Вибираємо моє бронювання
        console.log(`Slot ${slot.id} (my booking) selected.`);
      }
      return;
    }

    // 4. Звичайний доступний слот (не заброньований ніким)
    if (selectedSlot && selectedSlot.id === slot.id) {
      setSelectedSlot(null); // Знімаємо вибір
      console.log(`Slot ${slot.id} deselected.`);
    } else {
      setSelectedSlot(slot); // Вибираємо новий слот
      console.log(`Slot ${slot.id} selected for booking.`);
    }
  };

  // --- ФУНКЦІЯ: Виклик Edge Function для надсилання сповіщення лікарю ---
  const sendNotificationViaEdgeFunction = async (doctorId, patientFullName, bookingDate, bookingTimeSlot) => {
    console.log("Calling Edge Function with:", { doctorId, patientFullName, bookingDate, bookingTimeSlot });
    try {
      const { data: { session } } = await supabase.auth.getSession(); // Отримуємо поточну сесію
      const accessToken = session?.access_token || ''; // Отримуємо access_token

      const response = await fetch(SUPABASE_NOTIFY_DOCTOR_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Додаємо авторизаційний заголовок, якщо ваша Edge Function захищена
          // Якщо функція викликається з SERVICE_ROLE_KEY (як у файлі Edge Function), цей заголовок може бути необов'язковим,
          // але його наявність не завадить і є хорошою практикою для ідентифікації клієнта.
          'Authorization': `Bearer ${accessToken}`, 
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_name: patientFullName,
          booking_date: bookingDate,
          booking_time_slot: bookingTimeSlot,
        }),
      });

      const data = await response.json(); // Намагаємося завжди розпарсити JSON

      if (!response.ok) { // Якщо відповідь не ОК (наприклад, статус 4xx або 5xx)
        console.error('Edge Function returned an error (HTTP status not OK):', response.status, data.error || data.message || data);
        Alert.alert(t('error'), `${t('failed_to_send_notification')}: ${data.error || data.message || 'Невідома помилка Edge Function'}`);
        return false;
      }

      // Перевірка на помилки, повернені самою функцією у тілі відповіді (якщо status 200, але є поле 'error')
      if (data.error) {
        console.error('Edge Function returned an error in JSON body:', data.error);
        Alert.alert(t('error'), `${t('failed_to_send_notification')}: ${data.error || 'Невідома помилка Edge Function'}`);
        return false;
      }

      console.log('Edge Function call successful:', data);
      return true;

    } catch (error) {
      // Обробка мережевих помилок або помилок парсингу JSON
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


  // --- ФУНКЦІЯ: Бронювання обраного слота ---
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
    // Обов'язкова перевірка наявності імені пацієнта для сповіщення лікаря
    if (!patientProfile || !patientProfile.full_name) {
      Alert.alert(t('error'), t('failed_to_get_patient_name'));
      console.error("Patient full_name is missing from profile. Cannot send notification.");
      return;
    }

    setBooking(true); // Встановлюємо індикатор завантаження
    console.log(`Attempting to book slot ${selectedSlot.id} for doctorId: ${doctorId}, patientId: ${patientId}`);
    try {
      // 1. Перевірка доступності слота в останній момент (для уникнення конфліктів)
      const { data: currentAvail, error: availCheckError } = await supabase
        .from('doctor_availability')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', selectedSlot.date)
        .eq('time_slot', selectedSlot.rawTime)
        .single(); // Використовуємо .single() для більш точної перевірки, очікуючи 0 або 1 результат

      if (availCheckError || !currentAvail) { // Якщо error або data порожній, значить слот недоступний
        // Якщо error.code === 'PGRST116' це означає No rows found
        if (availCheckError?.code === 'PGRST116') { // No rows found
            throw new Error(t('slot_no_longer_available_by_doctor'));
        }
        throw availCheckError || new Error(t('slot_no_longer_available_by_doctor'));
      }

      // 2. Перевірка, чи не заброньовано слот кимось іншим, поки пацієнт його вибирав
      const { data: currentBookings, error: bookingCheckError } = await supabase
        .from('patient_bookings')
        .select('id, patient_id')
        .eq('doctor_id', doctorId)
        .eq('booking_date', selectedSlot.date)
        .eq('booking_time_slot', selectedSlot.rawTime)
        .single(); // Очікуємо 0 або 1 результат

      if (bookingCheckError && bookingCheckError.code !== 'PGRST116') { // PGRST116 = No rows found (це нормально)
        throw bookingCheckError;
      }
      
      if (currentBookings) { // Якщо currentBookings не null, значить слот вже заброньовано
        if (currentBookings.patient_id !== patientId) {
          // Слот заброньовано іншим пацієнтом
          throw new Error(t('slot_just_booked_by_another_patient'));
        } else {
          // Слот вже заброньовано поточним пацієнтом (дублікат або оновлення)
          console.log("Slot is already booked by current patient. Refreshing UI.");
          Alert.alert(t('info'), t('slot_already_your_booking'));
          setSelectedSlot(null); // Очищаємо вибір
          fetchAvailableSlotsAndBookings(); // Оновлюємо UI
          return; // Виходимо, бронювати не потрібно
        }
      }

      // 3. Видалення попередніх бронювань цього пацієнта для цього лікаря
      // Цей крок гарантує, що у пацієнта є лише одне активне бронювання для цього лікаря.
      // Якщо ви хочете дозволити кілька бронювань, видаліть цей блок.
      const { error: deletePrevError } = await supabase
        .from('patient_bookings')
        .delete()
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId);
      if (deletePrevError) {
        console.warn("Warning: Could not delete previous booking (if any):", deletePrevError.message);
        // Не кидаємо помилку, якщо видалення попереднього не вдалося, бо це може бути не критично для нового бронювання.
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

      if (insertError) throw insertError; // Викидаємо помилку, якщо вставка не вдалася

      Alert.alert(t('success'), t('slot_booked_successfully'));

      // 5. Виклик Edge Function для надсилання сповіщення
      const notificationSent = await sendNotificationViaEdgeFunction(
        doctorId,
        patientProfile.full_name, // Використовуємо отримане ім'я пацієнта
        selectedSlot.date,
        selectedSlot.rawTime
      );

      if (notificationSent) {
        console.log("Notification successfully triggered via Edge Function.");
      } else {
        console.warn("Failed to trigger notification via Edge Function. Check Edge Function logs for details.");
      }

      setSelectedSlot(null); // Очищаємо вибір після успішного бронювання
      fetchAvailableSlotsAndBookings(); // Перезавантажуємо слоти, щоб оновити UI (підсвітити нове бронювання)

    } catch (err) { // Типізуємо помилку як 'unknown'
      let errorMessage = 'Failed to book slot.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      console.error("Error booking slot:", errorMessage, err);
      Alert.alert(t('error'), `${t('failed_to_book_slot')}: ${errorMessage}`);
    } finally {
      setBooking(false); // Завершуємо індикатор завантаження
    }
  };

  // --- Обробник натискання кнопки "Назад" ---
  const handleBackPress = () => {
    navigation.goBack();
  };

  // --- Відображення індикатора завантаження, поки дані завантажуються ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t('loading_schedule')}</Text>
      </View>
    );
  }

  // --- Рендеринг UI ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('book_consultation')}</Text>
          {/* Пустий View для вирівнювання, якщо потрібно */}
          <View style={{ width: 48, height: 48 }} />
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={bookSelectedSlot}
          disabled={booking || !selectedSlot} // Кнопка неактивна під час бронювання або якщо слот не обрано
        >
          {booking ? ( // Показуємо ActivityIndicator під час бронювання
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
                const isBookedByOther = allBookedSlotsMap[slot.id] && !myBookingsMap[slot.id]; // Заброньовано іншим (не мною)
                const isMyBooking = myBookingsMap[slot.id]; // Заброньовано мною
                const isSelected = selectedSlot && selectedSlot.id === slot.id; // Обрано пацієнтом (тимчасово)

                let buttonStyle = [styles.timeSlotButton]; // Базовий стиль кнопки
                let textStyle = [styles.timeSlotText]; // Базовий стиль тексту
                let isDisabled = true; // За замовчуванням слот неактивний
                let slotLabel = slot.time; // Текст слота

                if (isMyBooking) { // Найвищий пріоритет - моє бронювання
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
                    buttonStyle.push(styles.timeSlotButtonAvailable);
                    textStyle.push(styles.timeSlotTextAvailable);
                    isDisabled = false;
                  }
                } else { // Лікар НЕ зробив доступним
                  buttonStyle.push(styles.timeSlotButtonUnavailableByDoctor);
                  textStyle.push(styles.timeSlotTextUnavailableByDoctor);
                  isDisabled = true;
                  slotLabel = `${slot.time}\n(${t('unavailable')})`;
                }

                // Якщо поточний слот вибрано пацієнтом, він завжди буде синім (окрім випадку, коли це моя вже заброньована бронь)
                if (isSelected && !isMyBooking) {
                  buttonStyle.push(styles.timeSlotButtonSelected);
                  textStyle.push(styles.timeSlotTextSelected);
                } 
                // Якщо це моя бронь і я її вибрав, то вона залишається зеленою, але вважається "обраною"
                // Пропускаємо зміну стилю тут, щоб зберегти зелений колір моєї броні.

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

// --- СТИЛІ ---
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
    paddingTop: 50, // Відступ для iOS Safe Area
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'column',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
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
    marginTop: 10,
    width: '80%',
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
    fontWeight: '700',
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