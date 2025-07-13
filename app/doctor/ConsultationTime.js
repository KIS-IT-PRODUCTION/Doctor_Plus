// ConsultationTime.js - FINAL VERSION with 45-min slots on the hour

import "react-native-url-polyfill/auto";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  Alert, ActivityIndicator, Platform, StatusBar, Animated, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../providers/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime } from 'luxon';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 70;
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

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      Animated.timing(rotateAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      }).start(() => startRotation());
    };
    startRotation();
  }, [rotateAnim]);

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
      // FIX: Loop through hours only, minutes are always 00
      for (let hour = 0; hour < 24; hour++) {
        // Create a DateTime object in the DOCTOR'S timezone, starting at 00 minutes
        const startTimeInDoctorTZ = currentDay.set({ hour, minute: 0, second: 0, millisecond: 0 }).setZone(tz, { keepLocalTime: true });

        if (!startTimeInDoctorTZ.isValid) continue;
        if (startTimeInDoctorTZ < now) continue;

        // FIX: End time is always 45 minutes after the start
        const endTimeInDoctorTZ = startTimeInDoctorTZ.plus({ minutes: CONSULTATION_DURATION_MINUTES });

        // Convert to UTC for database storage
        const utcTime = startTimeInDoctorTZ.toUTC();
        const dateStringForDB = utcTime.toFormat('yyyy-MM-dd');
        const rawTimeForDB = utcTime.toFormat('HH:mm:ss');
        const slotId = `${dateStringForDB}-${rawTimeForDB}`;
        
        // FIX: Display format is now HH:mm - HH:mm
        const displayTime = `${startTimeInDoctorTZ.toFormat('HH:mm')} - ${endTimeInDoctorTZ.toFormat('HH:mm')}`;

        daySlots.push({
          time: displayTime,
          id: slotId,
          date: dateStringForDB,
          rawTime: rawTimeForDB,
        });
      }
      if (daySlots.length > 0) {
        schedule.push({
          displayDate: displayDate,
          slots: daySlots,
        });
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
      setScheduleData([]);
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
      if (newSlots[slot.id]) delete newSlots[slot.id];
      else newSlots[slot.id] = true;
      return newSlots;
    });
  };

  const saveDoctorAvailability = async () => {
    if (!doctorId) {
      Alert.alert(t('error_title'), t('doctor_id_missing'));
      return;
    }
    setSaving(true);
    try {
      const slotsToInsert = Object.keys(doctorAvailableSlots).map(slotId => {
        const lastHyphenIndex = slotId.lastIndexOf('-');
        if (lastHyphenIndex === -1) return null;
        const date = slotId.substring(0, lastHyphenIndex);
        const time = slotId.substring(lastHyphenIndex + 1);
        return { doctor_id: doctorId, date, time_slot: time };
      }).filter(Boolean);

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
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
        <TouchableOpacity style={styles.saveButton} onPress={saveDoctorAvailability} disabled={saving}>
          <LinearGradient
            colors={['#0EB3EB', '#0A8BA6']} style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{t('save_schedule')}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayCardOuter}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.dayContainerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}>
                <Ionicons name="time-outline" size={32} color="#0EB3EB" />
              </Animated.View>
              <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
              <View style={styles.slotsContainer}>
                {dayData.slots.map((slot) => {
                  const isSlotSelected = doctorAvailableSlots[slot.id];
                  return (
                    <TouchableOpacity key={slot.id} onPress={() => handleSlotPress(slot)} style={styles.timeSlotWrapper}>
                      {isSlotSelected ? (
                        <LinearGradient
                          colors={['#0EB3EB', '#0A8BA6']} style={styles.timeSlotButtonSelected}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.timeSlotTextSelected}>{slot.time}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.timeSlotButtonUnavailable}>
                          <Text style={styles.timeSlotTextUnavailable}>{slot.time}</Text>
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
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 10) : 50, },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 25, width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  saveButton: { borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { paddingVertical: 12, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  scrollViewContent: { paddingHorizontal: 15, paddingBottom: 30 },
  dayCardOuter: { marginTop: 20, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, overflow: 'hidden' },
  dayContainerInner: { borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', alignItems: 'center' },
  iconContainer: { marginBottom: 10 },
  dayHeader: { fontSize: 19, fontWeight: 'bold', color: '#222', marginBottom: 15, textAlign: 'center' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  timeSlotWrapper: { width: ITEM_WIDTH, marginBottom: 12, borderRadius: 10, overflow: 'hidden' },
  timeSlotButtonUnavailable: { backgroundColor: 'rgba(240, 240, 240, 0.7)', borderColor: 'rgba(224, 224, 224, 0.7)', borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  timeSlotButtonSelected: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  timeSlotTextUnavailable: { color: '#888888', fontSize: 14, fontWeight: '600' },
  timeSlotTextSelected: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});

export default ConsultationTime;