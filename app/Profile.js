import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from "../assets/icon.svg"; // Переконайтеся, що шлях правильний

import { useTranslation } from 'react-i18next'; // Імпорт для перекладів

// Функція для відображення прапорів, така ж як і раніше
const LanguageFlags = ({ languages }) => {
    const getFlag = (code) => {
        switch (code) {
          case 'UA': return '🇺🇦';
          case 'DE': return '🇩🇪';
          default: return '🏳️'; // Дефолтний прапор, якщо не знайдено
        }
      };
    
      return (
        <View style={styles.flagsContainer}>
          {languages.map((lang, index) => (
            <Text key={index} style={styles.flagText}>{getFlag(lang)}</Text>
          ))}
        </View>
      );
    };

const Profile = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation(); // Використання хука перекладу

  // Приклад даних лікаря (повинні надходити з пропсів або API)
  // Для демонстрації, використовуємо дані схожі на ті, що у DoctorCard
  const doctor = {
    id: '1',
    avatar: require('../assets/Doctor Photo/doctor.png'),
    name: 'Слобоженко Іван Сергійович',
    rating: '🌟🌟🌟🌟🌟', // Або '100%', як у DoctorCard, але на зображенні зірки
    languages: ['UA', 'DE'],
    specialization: 'кардіолог, хірург',
    achievements: 'старший лікар',
    timeInApp: '1 рік',
    consultations: '74',
    aboutMe: 'Я маю багаторічний досвід у діагностиці та лікуванні різноманітних захворювань, що дозволяє мені чітко розуміти потреби пацієнтів та клінічні робочі процеси', // Приклад з зображення
    certificatePhoto: require('../assets/Doctor Photo/sertuficat.png'), // Додайте шлях до зображення сертифіката
    workExperience: 'Впровадив новий протокол лікування, що значно покращило результати пацієнтів з певним захворюванням, успішно провів складну операцію, врятувавши життя пацієнту. Очолив дослідницьку групу, яка зробила важливе відкриття у галузі медицини. Отримав нагороду за видатний внесок у охорону здоров’я та громади.', // Приклад з зображення
    workLocation: 'Кардіолог - у відділенні кардіології обласної лікарні в Києві.', // Приклад з зображення
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleChooseConsultationTime = () => {
    console.log('Обрати час консультації');
    // Тут логіка переходу на екран вибору часу консультації
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text> {/* Переклад "Профіль" */}
        <View style={styles.rightIcon}>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* Doctor Main Info */}
        <View style={styles.doctorMainInfo}>
          <Image source={doctor.avatar} style={styles.avatar} />
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('rating')}:</Text> {/* Переклад "Рейтинг" */}
              <Text style={styles.value}>{doctor.rating}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('communication_language')}:</Text> {/* Переклад "Мова спілкування" */}
              <LanguageFlags languages={doctor.languages} />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('specialization')}:</Text> {/* Переклад "Спеціалізація" */}
              <Text style={styles.value}>{doctor.specialization}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('achievements')}:</Text> {/* Переклад "Досягнення" */}
              <Text style={styles.value}>{doctor.achievements}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('time_in_app')}:</Text> {/* Переклад "Час в додатку" */}
              <Text style={styles.value}>{doctor.timeInApp}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('consultations_count')}:</Text> {/* Переклад "Кількість консультацій" */}
              <Text style={styles.value}>{doctor.consultations}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.consultationButton} onPress={handleChooseConsultationTime}>
          <Text style={styles.consultationButtonText}>{t('choose_consultation_time')}</Text> {/* Переклад "Обрати час консультації" */}
        </TouchableOpacity>

        <Text style={styles.sectionTitleLink}>{t('more_about_doctor')}</Text> {/* Переклад "Більше інформації про лікаря" */}

        {/* About Me Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('about_me')}</Text> {/* Переклад "Про себе" */}
          <Text style={styles.sectionContent}>{doctor.aboutMe}</Text>
        </View>

        {/* Certificate Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('certificate_photo')}</Text> {/* Переклад "Фото сертифіката" */}
          {doctor.certificatePhoto && (
            <Image source={doctor.certificatePhoto} style={styles.certificateImage} />
          )}
        </View>

        {/* Achievements / Work Experience Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('achievements')}</Text> {/* Переклад "Досягнення" (або "Досвід роботи" якщо це більш підходить) */}
          <Text style={styles.sectionContent}>{doctor.workExperience}</Text>
        </View>

        {/* Work Location Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('place_of_work')}</Text> {/* Переклад "Місце роботи" */}
          <Text style={styles.sectionContent}>{doctor.workLocation}</Text>
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 50,
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
    flexShrink: 1, // Дозволяє тексту переноситися
  },
  flagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 18,
    marginRight: 5,
  },
  consultationButton: {
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
  consultationButtonText: {
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
    height: 200, // Регулюйте висоту за потребою
    resizeMode: 'contain', // Або 'cover'
    borderRadius: 10,
    marginTop: 10,
  },
});

export default Profile;