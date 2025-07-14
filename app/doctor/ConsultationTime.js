import "react-native-url-polyfill/auto";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  Alert, ActivityIndicator, Platform, StatusBar, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime } from 'luxon';

const { width } = Dimensions.get('window');
const CONSULTATION_DURATION_MINUTES = 45;

const ConsultationTime = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const doctorId = route.params?.doctorId;

  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorTimezone, setDoctorTimezone] = useState(null);

  const fetchDoctorTimezone = useCallback(async () => {
    const systemTimezone = DateTime.local().zoneName;
    if (!doctorId) {
      setDoctorTimezone(systemTimezone);
      return systemTimezone;
    }
    try {
      const { data, error } = await supabase
        .from('anketa_doctor').select('country_timezone').eq('user_id', doctorId).single();

      if (error && error.code !== "PGRST116") throw error;
      
      let tz = data?.country_timezone;
      if (!tz || !DateTime.local().setZone(tz).isValid) {
        tz = systemTimezone;
      }
      
      setDoctorTimezone(tz);
      return tz;
    } catch (err) {
      setDoctorTimezone(systemTimezone);
      return systemTimezone;
    }
  }, [doctorId]);

  const generateSchedule = useCallback((tz) => {
    if (!tz) return [];
    const schedule = [];
    const now = DateTime.local();
    const startOfToday = now.startOf('day');

    for (let i = 0; i < 14; i++) {
      const currentDay = startOfToday.plus({ days: i });
      const displayDate = currentDay.setZone(tz).toLocaleString(DateTime.DATE_FULL);
      const daySlots = [];

      for (let hour = 0; hour < 24; hour++) {
        const startTimeInDoctorTZ = currentDay.set({ hour, minute: 0, second: 0, millisecond: 0 }).setZone(tz, { keepLocalTime: true });

        if (!startTimeInDoctorTZ.isValid || startTimeInDoctorTZ < now) continue;

        const endTimeInDoctorTZ = startTimeInDoctorTZ.plus({ minutes: CONSULTATION_DURATION_MINUTES });
        const utcTime = startTimeInDoctorTZ.toUTC();
        const dateStringForDB = utcTime.toFormat('yyyy-MM-dd');
        const rawTimeForDB = utcTime.toFormat('HH:mm:ss');
        const slotId = `${dateStringForDB}-${rawTimeForDB}`;
        const displayTime = `${startTimeInDoctorTZ.toFormat('HH:mm')} - ${endTimeInDoctorTZ.toFormat('HH:mm')}`;

        daySlots.push({ time: displayTime, id: slotId, date: dateStringForDB, rawTime: rawTimeForDB });
      }
      if (daySlots.length > 0) {
        schedule.push({ displayDate: displayDate, slots: daySlots });
      }
    }
    return schedule;
  }, []);

  const fetchDoctorSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const timezone = await fetchDoctorTimezone();
      if (!timezone) throw new Error("Timezone could not be determined.");
      if (!doctorId) {
        setScheduleData(generateSchedule(timezone));
        return;
      }
      
      const todayDateStringUTC = DateTime.utc().toFormat('yyyy-MM-dd');
      const { data, error } = await supabase
        .from('doctor_availability').select('date, time_slot').eq('doctor_id', doctorId)
        .gte('date', todayDateStringUTC);

      if (error) throw error;

      const fetchedSlots = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.date && item.time_slot) {
            fetchedSlots[`${item.date}-${item.time_slot}`] = true;
          }
        });
      }
      
      setDoctorAvailableSlots(fetchedSlots);
      setScheduleData(generateSchedule(timezone));
    } catch (err) {
      console.error("Error fetching doctor schedule:", err.message);
      Alert.alert(t('error_title'), t('failed_to_load_schedule'));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t, generateSchedule, fetchDoctorTimezone]);
  
  useEffect(() => { fetchDoctorSchedule() }, [fetchDoctorSchedule]);

  const handleSlotPress = (slot) => {
    setDoctorAvailableSlots(prevSlots => {
      const newSlots = { ...prevSlots };
      if (newSlots[slot.id]) {
        delete newSlots[slot.id];
      } else {
        newSlots[slot.id] = true;
      }
      return newSlots;
    });
  };

  const saveDoctorAvailability = async () => {
    if (!doctorId) return Alert.alert(t('error_title'), t('doctor_id_missing'));
    setSaving(true);
    try {
      const slotsToInsert = Object.keys(doctorAvailableSlots).map(slotId => {
        const [date, time] = slotId.split(/-(?=[^-]*$)/);
        return { doctor_id: doctorId, date, time_slot: time };
      });

      const todayDateStringUTC = DateTime.utc().toFormat('yyyy-MM-dd');
      
      const { error: deleteError } = await supabase
        .from('doctor_availability').delete().eq('doctor_id', doctorId).gte('date', todayDateStringUTC);
      if (deleteError) throw deleteError;

      if (slotsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('doctor_availability').insert(slotsToInsert);
        if (insertError) throw insertError;
      }

      Alert.alert(t('success_title'), t('schedule_saved_successfully'));
    } catch (err) {
      console.error("Error saving doctor availability:", err.message);
      Alert.alert(t('error_title'), `${t('failed_to_save_schedule')}: ${err.message}`);
    } finally {
      setSaving(false);
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
          <Text style={styles.headerTitle}>{t('my_schedule')}</Text>
          <View style={{ width: 48 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {scheduleData.map((dayData, dayIndex) => (
            <View key={dayIndex} style={styles.dayCard}>
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {dayData.slots.map((slot) => {
                  const isSlotSelected = doctorAvailableSlots[slot.id];
                  return (
                    <TouchableOpacity 
                      key={slot.id} 
                      style={[
                          styles.timeSlotButton,
                          isSlotSelected ? styles.selectedSlot : styles.availableSlot,
                      ]}
                      onPress={() => handleSlotPress(slot)} 
                    >
                      <Text style={[
                          styles.timeSlotText,
                          isSlotSelected ? styles.selectedText : styles.availableText,
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
        
        <View style={styles.footer}>
          <TouchableOpacity onPress={saveDoctorAvailability} disabled={saving}>
            <LinearGradient
                colors={['#0EB3EB', '#0A8BC2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : 
              <Text style={styles.saveButtonText}>{t('save_schedule')}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Схожі стилі, адаптовані для екрану лікаря
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
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
    paddingBottom: 120, // Залишаємо місце для кнопки
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
    width: '31%', // Триколонкова сітка
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
  // Стилі для двох станів: доступний (не обраний) і обраний
  availableSlot: {
    backgroundColor: '#F0F9FF',
    borderColor: '#B3E5FC',
  },
  availableText: {
    color: '#0288D1',
  },
  selectedSlot: {
    backgroundColor: '#0EB3EB',
    borderColor: '#0A8BC2',
    transform: [{ scale: 1.05 }],
  },
  selectedText: {
    color: '#FFFFFF',
  },
  // Футер з кнопкою
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'rgba(247, 248, 250, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  saveButton: {
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
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConsultationTime;