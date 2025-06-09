import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert, // Using Alert for simple messages as per previous context
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // For localization

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3; // For 3 columns: total width - horizontal padding / 3

const ConsultationTime = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const doctorId = route.params?.doctorId; // Assuming doctorId is passed via route params

  const [scheduleData, setScheduleData] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // State to hold the currently selected slot

  // Function to generate the schedule for the next 14 days
  const generateSchedule = useCallback(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) { // Generate for 14 days
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);

      // Format date for display (e.g., "Понеділок 1 травня")
      // Using 'uk-UA' locale for Ukrainian formatting
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const displayDate = new Intl.DateTimeFormat('uk-UA', options).format(currentDay);

      const slots = [];
      // Generate hourly slots from 9 AM to 5 PM (inclusive of 5 PM start, ending at 6 PM)
      for (let hour = 9; hour <= 17; hour++) {
        const startHour = String(hour).padStart(2, '0');
        const endHour = String(hour + 1).padStart(2, '0');
        slots.push({
          time: `${startHour}:00-${endHour}:00`,
          // Simulate availability: roughly 70% available
          available: Math.random() > 0.3,
          // Unique ID for each slot
          id: `${currentDay.toDateString()}-${startHour}:00`,
          date: currentDay.toISOString().split('T')[0], // YYYY-MM-DD for easier handling
          rawTime: `${startHour}:00`, // Store raw time for selection
        });
      }
      days.push({
        date: currentDay,
        displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1), // Capitalize first letter
        slots: slots,
      });
    }
    return days;
  }, []);

  useEffect(() => {
    setScheduleData(generateSchedule());
  }, [generateSchedule]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSlotPress = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      Alert.alert(
        t('confirm_appointment'),
        `${t('you_selected')}: ${slot.displayDate || ''} ${slot.time}\n${t('for_doctor')}: ${doctorId || t('unknown_doctor')}`,
        [
          {
            text: t('cancel'),
            onPress: () => setSelectedSlot(null),
            style: 'cancel',
          },
          {
            text: t('confirm'),
            onPress: () => {
              // Here you would typically send this booking information to your backend
              console.log('Confirmed booking:', slot);
              Alert.alert(t('booking_confirmed'), t('your_appointment_is_booked'));
              // Navigate back or to a confirmation screen
              // navigation.navigate('ConfirmationScreen', { selectedSlot: slot, doctorId });
            },
          },
        ]
      );
    } else {
      Alert.alert(t('slot_unavailable'), t('this_time_slot_is_already_booked'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appointment')}</Text>
        <View style={{ width: 48 }} /> {/* Placeholder to keep title centered */}
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {scheduleData.map((dayData, dayIndex) => (
          <View key={dayIndex} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>{dayData.displayDate}</Text>
            <View style={styles.slotsContainer}>
              {dayData.slots.map((slot, slotIndex) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotButton,
                    !slot.available && styles.timeSlotButtonUnavailable,
                    selectedSlot?.id === slot.id && styles.timeSlotButtonSelected,
                  ]}
                  onPress={() => handleSlotPress({ ...slot, displayDate: dayData.displayDate })}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.timeSlotText,
                    !slot.available && styles.timeSlotTextUnavailable,
                    selectedSlot?.id === slot.id && styles.timeSlotTextSelected,
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
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
    fontFamily: 'Mont-Bold', // Assuming you have this font
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
    fontFamily: 'Mont-Bold',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // alignContent: 'flex-start', // Align content to the start of the cross axis
  },
  timeSlotButton: {
    width: ITEM_WIDTH,
    backgroundColor: '#90CAF9', // Light blue
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSlotButtonUnavailable: {
    backgroundColor: '#E0E0E0', // Grey for unavailable
    borderColor: '#BDBDBD',
  },
  timeSlotButtonSelected: {
    backgroundColor: '#0EB3EB', // A darker blue for selected
    borderColor: '#0A8BA6',
    shadowColor: '#0EB3EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#1A237E', // Dark blue text
    fontWeight: '600',
    fontFamily: 'Mont-Medium',
  },
  timeSlotTextUnavailable: {
    color: '#757575', // Darker grey text for unavailable
  },
  timeSlotTextSelected: {
    color: '#FFFFFF', // White text for selected
  },
});

export default ConsultationTime;