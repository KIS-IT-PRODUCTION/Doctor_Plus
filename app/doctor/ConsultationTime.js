import "react-native-url-polyfill/auto"; // Залишаємо для Supabase

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
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;
const CONSULTATION_DURATION_MINUTES = 45; // Константа для тривалості консультації

const ConsultationTime = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId;
  console.log("Current doctorId (on load):", doctorId);

  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorTimezone, setDoctorTimezone] = useState(null); // Стан для часового поясу лікаря

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation());
    };

    startRotation();
  }, []);

  // Функція для завантаження часового поясу лікаря
  const fetchDoctorTimezone = useCallback(async () => {
    if (!doctorId) {
      console.warn("No doctorId provided to fetch timezone.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('anketa_doctor')
        .select('country_timezone')
        .eq('user_id', doctorId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
        console.error("Error fetching doctor timezone:", error.message);
        return null;
      }
      if (data && data.country_timezone) {
        let tz = data.country_timezone;
        // Проста логіка мапування для "UTC+X" на IANA, або використання системної
        if (tz && tz.startsWith('UTC')) {
            console.warn(`Doctor timezone is ${data.country_timezone}, which might not be an IANA format. Attempting to map or fallback.`);
            if (data.country_timezone === 'UTC+10') {
                tz = 'Australia/Brisbane';
            } else if (data.country_timezone === 'UTC+2' || data.country_timezone === 'UTC+3') {
                tz = 'Europe/Kiev'; // Якщо це Україна
            }
            if (!tz || tz.startsWith('UTC+')) { // Якщо мапування не відбулося або все ще "UTC+X"
               tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Системна часова зона пристрою
               console.warn(`No specific IANA mapping found for ${data.country_timezone}. Falling back to system timezone: ${tz}`);
            }
        }
        console.log("Resolved doctor timezone:", tz);
        setDoctorTimezone(tz);
        return tz;
      }
      console.warn("Doctor timezone not found in anketa_doctor for ID:", doctorId);
      const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      console.warn("Falling back to system timezone for doctor:", fallbackTimezone);
      setDoctorTimezone(fallbackTimezone);
      return fallbackTimezone;
    } catch (err) {
      console.error("General error fetching doctor timezone:", err.message);
      const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      console.error("Falling back to system timezone for doctor due to error:", fallbackTimezone);
      setDoctorTimezone(fallbackTimezone);
      return fallbackTimezone;
    }
  }, [doctorId]);

  // Модифікована generateSchedule без date-fns
  const generateSchedule = useCallback((tz = null) => {
    const effectiveTimezone = tz || doctorTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    console.log("Generating schedule with effective timezone:", effectiveTimezone);

    try {
      new Intl.DateTimeFormat('en-US', { timeZone: effectiveTimezone });
    } catch (e) {
      console.error(`Invalid timezone "${effectiveTimezone}" detected in generateSchedule. Falling back to system timezone.`, e);
      const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      console.log("Using final fallback timezone for display:", fallbackTimezone);
      return [];
    }

    const schedule = [];
    const now = new Date(); // Поточний час у локальній зоні пристрою
    const currentLocale = i18n.language;

    for (let i = 0; i < 14; i++) { // На 14 днів вперед
      const currentDay = new Date(now);
      currentDay.setDate(now.getDate() + i); // Переходимо на наступний день
      currentDay.setHours(0, 0, 0, 0); // Обнуляємо час для початку дня (у локальній зоні)

      // Створюємо дату для відображення в конкретній часовій зоні
      const displayDateOptions = { weekday: 'long', day: 'numeric', month: 'long', timeZone: effectiveTimezone };
      const displayDate = new Intl.DateTimeFormat(currentLocale, displayDateOptions).format(currentDay);

      // Дата для зберігання в DB у форматі YYYY-MM-DD
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateStringForDB = `${year}-${month}-${day}`;

      const daySlots = [];

      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += CONSULTATION_DURATION_MINUTES) {
          // Створюємо об'єкт Date у локальному часі, а потім використовуємо для форматування з TZ
          const startTime = new Date(currentDay);
          startTime.setHours(hour, minute, 0, 0);

          const endTime = new Date(startTime.getTime() + CONSULTATION_DURATION_MINUTES * 60 * 1000);

          // Перевірка, чи слот не в минулому (порівнюємо з поточним часом пристрою)
          // Важливо: для порівняння з 'now' ми використовуємо локальний час, оскільки саме на його основі JS оперує Date об'єктами
          if (endTime.getTime() <= now.getTime()) {
            continue;
          }

          if (startTime.getHours() >= 18) continue; // Пропускаємо слоти, що починаються після 17:00
          if (endTime.getHours() >= 18 && endTime.getMinutes() > 0) continue; // Пропускаємо слоти, що закінчуються після 18:00

          // Форматуємо час для відображення у вибраній часовій зоні
          const timeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: effectiveTimezone };
          const displayStartTime = new Intl.DateTimeFormat('uk-UA', timeFormatOptions).format(startTime);
          const displayEndTime = new Intl.DateTimeFormat('uk-UA', timeFormatOptions).format(endTime);
          const displayTime = `${displayStartTime} - ${displayEndTime}`;

          // `rawTime` для Supabase: HH:MM:SS. Це час у локальному часі лікаря.
          const rawTimeForDB = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:00`;

          const slotId = `${dateStringForDB}-${rawTimeForDB}`;

          daySlots.push({
            time: displayTime,
            id: slotId,
            date: dateStringForDB,
            rawTime: rawTimeForDB,
          });
        }
      }
      schedule.push({
        date: currentDay, // Зберігаємо об'єкт Date для подальших маніпуляцій, якщо потрібно
        displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1),
        slots: daySlots,
      });
    }
    console.log("Generated schedule for doctor display:", schedule);
    return schedule;
  }, [doctorTimezone, i18n.language]);

  const fetchDoctorSchedule = useCallback(async () => {
    setLoading(true);
    let timezone = null;
    if (doctorId) {
      timezone = await fetchDoctorTimezone();
    }

    if (!doctorId) {
      console.warn("No doctorId provided to fetch schedule. Cannot fetch.");
      setScheduleData(generateSchedule(timezone));
      setLoading(false);
      return;
    }

    console.log("Attempting to fetch doctor schedule for doctorId:", doctorId);
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('date, time_slot')
        .eq('doctor_id', doctorId)
        .gte('date', new Date().toISOString().split('T')[0]); // YYYY-MM-DD

      if (error) {
        console.error("Error fetching doctor schedule:", error.message);
        Alert.alert(t('error_title'), t('failed_to_load_schedule'));
        setScheduleData(generateSchedule(timezone));
        return;
      }

      const fetchedSlots = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          const slotId = `${item.date}-${item.time_slot}`;
          fetchedSlots[slotId] = true;
        });
      } else {
        console.warn("Supabase returned non-array data, or data is null/undefined:", data);
      }

      console.log("Fetched slots from DB (fetchedSlots object):", fetchedSlots);
      setDoctorAvailableSlots(fetchedSlots);
      setScheduleData(generateSchedule(timezone));
      console.log("Doctor schedule fetched and states updated.");
    } catch (err) {
      console.error("Catch error fetching doctor schedule:", err.message);
      Alert.alert(t('error_title'), t('failed_to_load_schedule'));
      setScheduleData(generateSchedule(timezone));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t, generateSchedule, fetchDoctorTimezone]);

  useEffect(() => {
    fetchDoctorSchedule();
  }, [fetchDoctorSchedule]);

  const handleSlotPress = (slot) => {
    setDoctorAvailableSlots(prevSlots => {
      const newSlots = { ...prevSlots };
      const wasSelected = newSlots[slot.id];
      if (wasSelected) {
        delete newSlots[slot.id];
        console.log(`Slot ${slot.id} deselected.`);
      } else {
        newSlots[slot.id] = true;
        console.log(`Slot ${slot.id} selected.`);
      }
      return newSlots;
    });
  };

  const saveDoctorAvailability = async () => {
    if (!doctorId) {
      Alert.alert(t('error_title'), t('doctor_id_missing'));
      return;
    }
    setSaving(true);
    console.log("Attempting to save doctor availability...");
    try {
      const slotsToSave = [];
      if (Array.isArray(scheduleData)) {
        scheduleData.forEach(dayData => {
          if (Array.isArray(dayData.slots)) {
            dayData.slots.forEach(slot => {
              if (doctorAvailableSlots[slot.id]) {
                slotsToSave.push({
                  doctor_id: doctorId,
                  date: slot.date,
                  time_slot: slot.rawTime,
                });
              }
            });
          }
        });
      }

      console.log("Slots prepared for insertion:", slotsToSave);

      const todayDateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`Deleting doctor's availability for doctor_id: ${doctorId} from date: ${todayDateString}`);
      const { error: deleteError } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctorId)
        .gte('date', todayDateString);

      if (deleteError) {
        throw deleteError;
      }
      console.log("Old slots deleted successfully.");

      if (slotsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('doctor_availability')
          .insert(slotsToSave);

        if (insertError) {
          throw insertError;
        }
        console.log("New slots inserted successfully.");
      } else {
        console.log("No slots to insert (all were de-selected or none selected).");
      }

      Alert.alert(t('success_title'), t('schedule_saved_successfully'));
    } catch (err) {
      console.error("Error saving doctor availability:", err.message);
      Alert.alert(t('error_title'), `${t('failed_to_save_schedule')}: ${err.message}`);
    } finally {
      setSaving(false);
      console.log("Saving process finished. Re-fetching schedule...");
      fetchDoctorSchedule();
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveDoctorAvailability}
          disabled={saving}
        >

          <LinearGradient
            colors={['#0EB3EB', '#0A8BA6']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (

              <Text style={styles.saveButtonText}>{t('save_schedule')}</Text>
            )}
          </LinearGradient>
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
              <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}>
                <Ionicons name="time-outline" size={32} color="#0EB3EB" />
              </Animated.View>
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {Array.isArray(dayData.slots) && dayData.slots.map((slot) => {
                  const isSlotSelected = doctorAvailableSlots[slot.id];
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => handleSlotPress(slot)}
                      style={styles.timeSlotWrapper}
                    >
                      {isSlotSelected ? (
                        <LinearGradient
                          colors={['#0EB3EB', '#0A8BA6']}
                          style={styles.timeSlotButtonSelected}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.timeSlotTextSelected}>
                            {slot.time}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.timeSlotButtonUnavailable}>
                          <Text style={styles.timeSlotTextUnavailable}>
                            {slot.time}
                          </Text>
                        </View>
                      )}
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ? 15 : 10) : 0,
    paddingTop: Platform.OS === "ios" ? StatusBar.currentHeight + 15 : 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...Platform.select({
      android: {
        elevation: 0.8,
      },
    }),
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",},
  languageDisplayContainer: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  saveButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
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
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
    overflow: 'hidden',
  },
  dayContainerInner: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
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
  timeSlotWrapper: {
    width: ITEM_WIDTH,
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    ...Platform.select({
      android: {
        elevation: 0.8,
      },
    }),
  },
  timeSlotButtonUnavailable: {
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    borderColor: 'rgba(224, 224, 224, 0.7)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotTextUnavailable: {
    color: '#888888',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ConsultationTime;