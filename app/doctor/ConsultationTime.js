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
  Platform, // <-- Додаємо Platform для умовних стилів
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const ConsultationTime = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId;
  console.log("Current doctorId (on load):", doctorId);

  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const generateSchedule = useCallback(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);

      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const displayDate = new Intl.DateTimeFormat('uk-UA', options).format(currentDay);
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
    console.log("Schedule generated:", days);
    return days;
  }, []);

  const fetchDoctorSchedule = useCallback(async () => {
    if (!doctorId) {
      console.warn("No doctorId provided to fetch schedule. Cannot fetch.");
      setLoading(false);
      setScheduleData(generateSchedule());
      return;
    }
    setLoading(true);
    console.log("Attempting to fetch doctor schedule for doctorId:", doctorId);
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('date, time_slot')
        .eq('doctor_id', doctorId)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error("Error fetching doctor schedule:", error.message);
        Alert.alert(t('error'), t('failed_to_load_schedule'));
        setScheduleData(generateSchedule());
        return;
      }

      const fetchedSlots = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          const formattedTimeSlot = item.time_slot.substring(0, 5);
          const slotId = `${item.date}-${formattedTimeSlot}`;
          fetchedSlots[slotId] = true;
        });
      } else {
        console.warn("Supabase returned non-array data, or data is null/undefined:", data);
      }

      console.log("Fetched slots from DB (fetchedSlots object):", fetchedSlots);
      setDoctorAvailableSlots(fetchedSlots);
      setScheduleData(generateSchedule());
      console.log("Doctor schedule fetched and states updated.");
    } catch (err) {
      console.error("Catch error fetching doctor schedule:", err.message);
      Alert.alert(t('error'), t('failed_to_load_schedule'));
      setScheduleData(generateSchedule());
    } finally {
      setLoading(false);
    }
  }, [doctorId, t, generateSchedule]);

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
      Alert.alert(t('error'), t('doctor_id_missing'));
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

      const todayDateString = new Date().toISOString().split('T')[0];
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

      Alert.alert(t('success'), t('schedule_saved_successfully'));
    } catch (err) {
      console.error("Error saving doctor availability:", err.message);
      Alert.alert(t('error'), `${t('failed_to_save_schedule')}: ${err.message}`);
    } finally {
      setSaving(false);
      console.log("Saving process finished. Re-fetching schedule...");
      fetchDoctorSchedule();
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
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('set_my_availability')}</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveDoctorAvailability}
          disabled={saving}
        >
          <LinearGradient
            colors={['#0EB3EB', '#0A8BA6']} // Gradient colors for save button
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
          // Змінюємо dayContainer на View та додаємо LinearGradient всередині для "скляного" ефекту
          <View key={dayIndex} style={styles.dayCardOuter}>
            <LinearGradient
              // Ці кольори створюють ефект напівпрозорого скла
              colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.dayContainerInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {Array.isArray(dayData.slots) && dayData.slots.map((slot) => {
                  const isSlotSelected = doctorAvailableSlots[slot.id];
                  console.log(`Slot ID: ${slot.id}, isSlotSelected: ${isSlotSelected}`);
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => handleSlotPress(slot)}
                      style={styles.timeSlotWrapper} // Wrapper for gradient
                    >
                      {isSlotSelected ? (
                        <LinearGradient
                          colors={['#0EB3EB', '#0A8BA6']} // Gradient for selected slot
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
    backgroundColor: '#F5F7FA', // Lighter background for overall screen
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
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0, // Remove border for cleaner look
    shadowColor: '#000', // Add shadow to header
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    backgroundColor: 'rgba(14, 179, 235, 0.1)', // Lighter, more subtle background
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    borderRadius: 12, // More rounded corners
    overflow: 'hidden', // Crucial for gradient to respect border-radius
    shadowColor: '#0EB3EB', // Shadow matching gradient color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
  // Новий зовнішній контейнер для тіні та ефекту скла
  dayCardOuter: {
    marginTop: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden', // Важливо для обрізки вмісту по borderRadius
    // backdropFilter та border (для ефекту скла) переміщуємо на inner
  },
  // Внутрішній LinearGradient для "скляного" ефекту
  dayContainerInner: {
    borderRadius: 18,
    padding: 20,
    // Додаємо тонку прозору рамку для візуального відділення "скла"
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // backdropFilter: 'blur(10px)', // Це тільки для Web. Для нативних:
    ...Platform.select({
      ios: {
        // На iOS backdropFilter працює
        // Requires importing 'react-native-blur' or 'expo-blur' for a true blur effect
        // For simplicity, we're just using translucent background here
        // If you want a real blur, you'd integrate `BlurView` from `expo-blur`
        // and wrap the content of dayContainerInner with it.
      },
      android: {
        // Android не підтримує backdropFilter нативно.
        // Ефект імітується напівпрозорим градієнтом та тінями.
      },
    }),
  },
  dayHeader: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 15,
    textAlign: 'center', // Center the day header
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Use space-around for better distribution
  },
  timeSlotWrapper: {
    width: ITEM_WIDTH,
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden', // Crucial for gradient on selected slots
    shadowColor: '#000', // General shadow for all slots
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  timeSlotButtonUnavailable: {
    backgroundColor: 'rgba(240, 240, 240, 0.7)', // Lighter, slightly transparent background for unavailable slots
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
    // Shadow is applied to the wrapper to make it consistent
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotTextUnavailable: {
    color: '#888888', // Softer color for unavailable text
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold', // Make selected text bolder
  },
});

export default ConsultationTime;