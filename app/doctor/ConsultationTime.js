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
import { supabase } from '../../providers/supabaseClient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const ConsultationTime = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId;
  console.log("Current doctorId (on load):", doctorId);

  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [scheduleData, setScheduleData] = useState([]); // Початковий стан - порожній масив
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
    return days; // Завжди повертає масив
  }, []);

  const fetchDoctorSchedule = useCallback(async () => {
    if (!doctorId) {
      console.warn("No doctorId provided to fetch schedule. Cannot fetch.");
      setLoading(false);
      setScheduleData(generateSchedule()); // Забезпечуємо ініціалізацію scheduleData
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
        setScheduleData(generateSchedule()); // Забезпечуємо ініціалізацію scheduleData
        return;
      }

      const fetchedSlots = {};
      // *** Важлива зміна: Перевірка, чи data є масивом ***
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
      setScheduleData(generateSchedule()); // Забезпечуємо ініціалізацію scheduleData
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
      // Додамо перевірку Array.isArray для scheduleData
      if (Array.isArray(scheduleData)) { 
        scheduleData.forEach(dayData => {
          // Додамо перевірку Array.isArray для dayData.slots
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
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('save_schedule')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* *** Ключова зміна: Перевірка Array.isArray перед .map *** */}
        {Array.isArray(scheduleData) && scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
            <View style={styles.slotsContainer}>
              {/* *** Ключова зміна: Перевірка Array.isArray перед .map *** */}
              {Array.isArray(dayData.slots) && dayData.slots.map((slot) => {
                const isSlotSelected = doctorAvailableSlots[slot.id];
                console.log(`Slot ID: ${slot.id}, isSlotSelected: ${isSlotSelected}`);
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlotButton,
                      isSlotSelected && styles.timeSlotButtonSelected,
                      !isSlotSelected && styles.timeSlotButtonUnavailable,
                    ]}
                    onPress={() => handleSlotPress(slot)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      isSlotSelected && styles.timeSlotTextSelected,
                      !isSlotSelected && styles.timeSlotTextUnavailable,
                    ]}>
                      {slot.time}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    // fontFamily: 'Mont-Bold',
  },
  saveButton: {
    backgroundColor: '#0EB3EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    // fontFamily: 'Mont-Medium',
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
    // fontFamily: 'Mont-Bold',
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
  },
  timeSlotButtonUnavailable: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BDBDBD',
  },
  timeSlotButtonSelected: {
    backgroundColor: '#0EB3EB',
    borderColor: '#0A8BA6',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    // fontFamily: 'Mont-Medium',
  },
  timeSlotTextUnavailable: {
    color: '#757575',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
});

export default ConsultationTime;
