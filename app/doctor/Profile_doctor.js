import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator, // Імпортуємо ActivityIndicator для індикатора завантаження
  Modal, // Імпортуємо Modal для модального вікна
  Pressable, // Імпортуємо Pressable для фону модального вікна
  TouchableWithoutFeedback, // Імпортуємо TouchableWithoutFeedback для закриття модального вікна при натисканні поза ним
  Dimensions, // Для отримання розмірів екрану
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from "../../assets/icon.svg"; // Переконайтеся, що шлях до SVG іконки правильний
import { useTranslation } from 'react-i18next'; // Імпорт для перекладів
import { supabase } from "../../providers/supabaseClient"; // Ваш клієнт Supabase

// Функція для відображення прапорів мов
const LanguageFlags = ({ languages }) => {
  const getFlag = (code) => {
    switch (code) {
      case 'UA': return '🇺🇦';
      case 'DE': return '🇩🇪';
      case 'PL': return '🇵🇱';
      case 'EN': return '🇬🇧';
      case 'FR': return '🇫🇷'; // Додано прапор Франції
      case 'ES': return '🇪🇸'; // Додано прапор Іспанії
      default: return '🏳️'; // Дефолтний прапор, якщо не знайдено
    }
  };

  return (
    <View style={styles.flagsContainer}>
      {languages.map((lang, index) => (
        // Перевіряємо, чи lang є рядком, щоб уникнути помилок, якщо дані непарні
        typeof lang === 'string' && <Text key={index} style={styles.flagText}>{getFlag(lang)}</Text>
      ))}
    </View>
  );
};

const Profile_doctor = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // Використання хука перекладу та i18n для зміни мови

  // Отримуємо doctorId з параметрів маршруту. Використовуємо optional chaining (?.)
  // щоб уникнути помилки, якщо route.params є undefined.
  const doctorId = route.params?.doctorId;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true); // Стан завантаження даних
  const [error, setError] = useState(null); // Стан для відстеження помилок
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false); // Стан для видимості модального вікна мови
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase() // Початковий код мови для відображення
  );

  // Оновлюємо displayedLanguageCode при зміні i18n.language
  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);


  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      setError(null); // Скидаємо попередні помилки

      // Якщо doctorId не визначений, ми не можемо отримати дані
      if (!doctorId) {
        console.warn("Profile_doctor: doctorId is undefined, cannot fetch data.");
        setError(t('doctor_id_missing'));
        setLoading(false);
        return; // Виходимо з useEffect
      }

      try {
        // Виконуємо запит до таблиці 'anketa_doctor' за user_id
        const { data, error: fetchError } = await supabase
          .from('anketa_doctor')
          // Додаємо diploma_url до запиту select
          .select('*, diploma_url')
          .eq('user_id', doctorId) // Запит за ідентифікатором користувача
          .single(); // Очікуємо один результат

        if (fetchError) {
          console.error('Error fetching doctor data:', fetchError);
          setError(t('error_fetching_doctor_data') + ': ' + fetchError.message);
        } else {
          setDoctor(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching doctor data:', err);
        setError(t('unexpected_error') + ': ' + err.message);
      } finally {
        setLoading(false); // Завершуємо завантаження незалежно від результату
      }
    };

    fetchDoctorData();
  }, [doctorId, t]); // Додаємо doctorId та t (для перекладів у повідомленнях) до залежностей

  // Функції для керування модальним вікном мови
  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);

  // Функція для зміни мови інтерфейсу
  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode); // Змінюємо мову за допомогою i18n
    closeLanguageModal(); // Закриваємо модальне вікно
  };

  const handleProfileDoctorSettingsPress = () => {
    navigation.navigate('Anketa_Settings');
  };

  const handleChooseConsultationTime = () => {
    navigation.navigate('ConsultationTime', { doctorId: doctorId });
  };

  // Визначення доступних мов для модального вікна
  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
    { nameKey: "polish", code: "pl", emoji: "🇵🇱" },
    { nameKey: "german", code: "de", emoji: "🇩🇪" },
    { nameKey: "french", code: "fr", emoji: "🇫🇷" },
    { nameKey: "spanish", code: "es", emoji: "🇪🇸" },
  ];

  // Відображення індикатора завантаження, поки дані завантажуються
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t('loading_profile_data')}</Text>
      </View>
    );
  }

  // Відображення повідомлення про помилку, якщо дані не вдалося завантажити
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          // Для повторної спроби, викликаємо fetchDoctorData знову
          setLoading(true); // Встановлюємо loading в true, щоб useEffect спрацював
          setError(null); // Скидаємо помилку
        }}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Відображення повідомлення, якщо дані лікаря відсутні після завантаження (наприклад, doctorId був, але запис не знайдено)
  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDoctorText}>{t('doctor_not_found')}</Text>
        <TouchableOpacity style={styles.backToHomeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backToHomeButtonText}>{t('back_to_home')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Функція для розбору рядка мов з JSON
  const getLanguages = (languagesString) => {
    try {
      const languagesArray = JSON.parse(languagesString || '[]');
      return languagesArray.map(lang => lang.toUpperCase()); // Конвертуємо в верхній регістр для відображення прапорів
    } catch (e) {
      console.error("Error parsing languages:", e);
      return [];
    }
  };

  // Функція для розбору рядка спеціалізацій з JSON
  const getSpecializations = (specializationString) => {
    try {
      const specializationsArray = JSON.parse(specializationString || '[]');
      return specializationsArray.join(', '); // Об'єднуємо спеціалізації в один рядок
    } catch (e) {
      console.error("Error parsing specializations:", e);
      return "";
    }
  };

  return (
    <View style={styles.container}>
      {/* Шапка екрана */}
      <View style={styles.header}>
        {/* Кнопка вибору мови інтерфейсу */}
        <TouchableOpacity style={styles.languageSelectButton} onPress={openLanguageModal}>
          <View style={styles.languageButtonContent}>
            <Text style={styles.languageButtonText}>{displayedLanguageCode}</Text>
            <Ionicons name="chevron-down-outline" size={16} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('profile_doctor')}</Text>
        <View style={styles.rightIcon}>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* Основна інформація про лікаря */}
        <View style={styles.doctorMainInfo}>
          <Image
            source={{ uri: doctor.avatar_url || 'https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo' }} // URL аватара з бази даних, або заглушка
            style={styles.avatar}
          />
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.full_name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('rating')}:</Text>
              <Text style={styles.value}>🌟🌟🌟🌟🌟</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('communication_language')}:</Text>
              <LanguageFlags languages={getLanguages(doctor.communication_languages)} />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('specialization')}:</Text>
              <Text style={styles.value}>{getSpecializations(doctor.specialization)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('achievements')}:</Text>
              <Text style={styles.value}>{doctor.achievements || t('not_specified')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('work_experience')}:</Text>
              <Text style={styles.value}>{doctor.work_experience || t('not_specified')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('work_location')}:</Text>
              <Text style={styles.value}>{doctor.work_location || t('not_specified')}</Text>
            </View>
          </View>
        </View>

        {/* Кнопки дій */}
        <TouchableOpacity style={styles.actionButton} onPress={handleChooseConsultationTime}>
          <Text style={styles.actionButtonText}>{t('choose_consultation_time')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleProfileDoctorSettingsPress}>
          <Text style={styles.actionButtonText}>{t('profile_doctor_settings')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitleLink}>{t('more_about_doctor')}</Text>

        {/* Секція "Про себе" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('about_me')}</Text>
          <Text style={styles.sectionContent}>{doctor.about_me || t('not_specified')}</Text>
        </View>

        {/* Секція "Фото сертифіката" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('certificate_photo')}</Text>
          {doctor.certificate_photo_url ? (
            <Image source={{ uri: doctor.certificate_photo_url }} style={styles.certificateImage} />
          ) : (
            <Text style={styles.noImageText}>{t('no_certificate_photo')}</Text>
          )}
        </View>

        {/* НОВА СЕКЦІЯ: "Фото диплома" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('diploma_photo')}</Text>
          {doctor.diploma_url ? (
            <Image source={{ uri: doctor.diploma_url }} style={styles.certificateImage} />
          ) : (
            <Text style={styles.noImageText}>{t('no_diploma_photo')}</Text>
          )}
        </View>

        {/* Секція "Досягнення" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('achievements')}</Text>
          <Text style={styles.sectionContent}>{doctor.achievements || t('not_specified')}</Text>
        </View>

        {/* Секція "Місце роботи" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('place_of_work')}</Text>
          <Text style={styles.sectionContent}>{doctor.work_location || t('not_specified')}</Text>
        </View>
      </ScrollView>

      {/* Модальне вікно для вибору мови */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLanguageModalVisible}
        onRequestClose={closeLanguageModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeLanguageModal}>
          <TouchableWithoutFeedback>
            <View style={styles.languageModalContent}>
              <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
              <ScrollView style={styles.modalScrollView}>
                {languagesForModal.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.languageOption}
                    onPress={() => handleLanguageSelect(item.code)}
                  >
                    <Text style={styles.languageOptionText}>
                      {item.emoji} {t(item.nameKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeLanguageModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffebee', // Light red background
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f', // Dark red text
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDoctorText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#777',
    marginTop: 50,
  },
  backToHomeButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 20,
  },
  backToHomeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Розподіляє елементи рівномірно
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Стилі для кнопки вибору мови в заголовку
  languageSelectButton: {
    backgroundColor: "#0EB3EB", // Синій фон
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 71, // Фіксована мінімальна ширина для коду мови
    height: 48, // Висота як у інших кнопок
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажений
    color: "white",
    marginRight: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, // Дозволяє займати доступний простір
    textAlign: 'center', // Центруємо заголовок
    marginHorizontal: 10, // Додаємо горизонтальний відступ від кнопок
  },
  rightIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  doctorMainInfo: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3498DB',
    marginBottom: 15,
  },
  doctorDetails: {
    width: '100%',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    paddingBottom: 5,
  },
  label: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'normal',
    flexShrink: 1,
    textAlign: 'right', // Вирівнювання значень праворуч для кращого вигляду
  },
  flagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 18,
    marginRight: 5,
  },
  actionButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitleLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0EB3EB',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 15,
    textDecorationLine: 'underline',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  sectionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  certificateImage: {
    width: '100%',
    height: 400, // Залишаємо висоту 400 для обох зображень, або можна створити окремий стиль для диплома, якщо потрібна інша висота.
    resizeMode: 'contain',
    borderRadius: 10,
    marginTop: 10,
  },
  noImageText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Стилі для модального вікна вибору мови (скопійовані з Register.js та адаптовані)
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.5, // Обмеження висоти для прокрутки
    width: '100%',
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular", // Переконайтеся, що цей шрифт завантажений
    color: "#333333",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    backgroundColor: "#2196F3", // Колір кнопки "Закрити"
  },
  buttonClose: {
    // Стиль для кнопки закриття
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Profile_doctor;