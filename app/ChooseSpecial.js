import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from "../assets/icon.svg";

import { useTranslation } from 'react-i18next';
const doctorsData = [
  {
    id: '1',
    avatar: require('../assets/Doctor Photo/doctor.png'),
    name: 'Слобоженко Іван Сергійович',
    rating: '100%',
    languages: ['UA', 'DE'],
    specialization: 'кардіолог, хірург',
    achievements: 'старший лікар',
    timeInApp: '1 рік',
    consultations: '74',
    price: '20$',
  },
  {
    id: '2',
    avatar: require('../assets/Doctor Photo/doctor.png'),
    name: 'Слобоженко Іван Сергійович',
    rating: '100%',
    languages: ['UA', 'DE'],
    specialization: 'кардіолог, хірург',
    achievements: 'старший лікар',
    timeInApp: '1 рік',
    consultations: '74',
    price: '20$',
  },
  {
    id: '3',
    avatar: require('../assets/Doctor Photo/doctor.png'),
    name: 'Слобоженко Іван Сергійович',
    rating: '100%',
    languages: ['UA', 'DE'],
    specialization: 'кардіолог, хірург',
    achievements: 'старший лікар',
    timeInApp: '1 рік',
    consultations: '74',
    price: '20$',
  },
];

const LanguageFlags = ({ languages }) => {
    // Немає потреби перекладати прапори, вони універсальні
    const getFlag = (code) => {
        switch (code) {
          case 'UA': return '🇺🇦';
          case 'DE': return '🇩🇪';
          default: return '🏳️';
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

const DoctorCard = ({ doctor }) => {
  const navigation = useNavigation();
  const { t } = useTranslation(); // --- ВИКОРИСТОВУЄМО ХУК ПЕРЕКЛАДУ ТУТ ---

  const handleGoToDoctor = () => {
    console.log(`Перейти до лікаря: ${doctor.name}`);
    navigation.navigate('Profile', { doctorId: doctor.id });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={doctor.avatar} style={styles.avatar} />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{t('rating')}: </Text> 
            <Text style={styles.ratingValue}>{doctor.rating}</Text>
          </View>
          <View style={styles.languageRow}>
            <Text style={styles.languageText}>{t('communication_language')}: </Text> 
            <LanguageFlags languages={doctor.languages} />
          </View>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t('specialization')}: </Text> 
        <Text style={styles.detailValue}>{doctor.specialization}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t('achievements')}: </Text> 
        <Text style={styles.detailValue}>{doctor.achievements}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t('time_in_app')}: </Text> 
        <Text style={styles.detailValue}>{doctor.timeInApp}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t('consultations_count')}: </Text> 
        <Text style={styles.detailValue}>{doctor.consultations}</Text>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.goToButton} onPress={handleGoToDoctor}>
          <Text style={styles.goToButtonText}>{t('go_to')}</Text> 
        </TouchableOpacity>
        <Text style={styles.priceText}>{t('price')}: {doctor.price}</Text> 
      </View>
    </View>
  );
};

const ChooseSpecial = () => {
  const navigation = useNavigation();
  const { t } = useTranslation(); // --- ВИКОРИСТОВУЄМО ХУК ПЕРЕКЛАДУ ТУТ ---
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Опції сортування, тепер використовують переклад
  const sortOptions = [
    { label: t('sort_by_rating_desc'), value: 'rating_desc' },
    { label: t('sort_by_rating_asc'), value: 'rating_asc' },
    { label: t('sort_by_experience_desc'), value: 'experience_desc' },
    { label: t('sort_by_experience_asc'), value: 'experience_asc' },
    { label: t('sort_by_price_asc'), value: 'price_asc' },
    { label: t('sort_by_price_desc'), value: 'price_desc' },
  ];


  const handleBackPress = () => {
    navigation.goBack();
  };

  const openSortModal = () => {
    setSortModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeSortModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start(() => setSortModalVisible(false));
  };

  const handleSortOptionSelect = (option) => {
    console.log('Обрано опцію сортування:', option.label);
    closeSortModal();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('therapist')}</Text> 
        <View style={styles.rightIcon}>
          <Icon width={50} height={50} />
        </View>
      </View>

      <TouchableOpacity style={styles.sortButton} onPress={openSortModal}>
        <Text style={styles.sortButtonText}>{t('sort')}</Text> 
      </TouchableOpacity>

      <ScrollView style={styles.scrollViewContent}>
        {doctorsData.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </ScrollView>

      
      <Modal
        animationType="none"
        transparent={true}
        visible={isSortModalVisible}
        onRequestClose={closeSortModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.sortModalContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.sortOptionsList}>
              {sortOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.sortOptionButton}
                  onPress={() => handleSortOptionSelect(option)}
                >
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.closeSortButton} onPress={closeSortModal}>
              <Text style={styles.closeSortButtonText}>{t('close')}</Text> 
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
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
  sortButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sortButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 14,
    color: '#555',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#555',
  },
  flagsContainer: {
    flexDirection: 'row',
    marginLeft: 5,
  },
  flagText: {
    fontSize: 16,
    marginRight: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
    marginRight: 5,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  goToButton: {
    backgroundColor: '#4DD0E1',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  goToButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxHeight: '70%',
  },
  sortOptionsList: {
    marginBottom: 10,
  },
  sortOptionButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-start',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#0EB3EB',
    fontWeight: '500',
  },
  closeSortButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  closeSortButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChooseSpecial;