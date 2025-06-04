// app/ConsultationTime.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Переконайтеся, що i18n налаштований

const ConsultationTime = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation(); // Використання хука перекладу

  // Отримуємо doctorId з параметрів маршруту.
  // Використовуємо деструктуризацію з дефолтним порожнім об'єктом,
  // щоб уникнути помилок, якщо params раптом не будуть передані.
  const { doctorId } = route.params || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('choose_consultation_time')}</Text> {/* Заголовок з перекладом */}
      </View>

      <View style={styles.content}>
        <Text style={styles.introText}>
          {t('consultation_time_screen_for_doctor')}: {doctorId || t('unknown_doctor')}
        </Text>
        <Text style={styles.instructionText}>
          {t('consultation_time_instructions')}
        </Text>
        {/* Тут буде логіка та компоненти для відображення та вибору вільних годин лікаря */}
        {/* Наприклад: CalendarPicker, список доступних слотів, кнопки для вибору, тощо. */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50, // Для відступу від "вирізу" в iPhone
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
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
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  introText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
  },
});

export default ConsultationTime;