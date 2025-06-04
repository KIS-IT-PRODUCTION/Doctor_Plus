import React, { useState, useEffect, useRef } from "react"; // useRoute НЕ імпортуємо з React
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
  ActivityIndicator, // Import ActivityIndicator for loading
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Ось звідки імпортуємо useRoute
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg";

import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient"; // Import Supabase client

const LanguageFlags = ({ languages }) => {
  const getFlag = (code) => {
    switch (code) {
      case "UK":
        return "🇺🇦";
      case "DE":
        return "🇩🇪";
      case "PL":
        return "🇵🇱";
      case "EN":
        return "🇬🇧";
      case "FR":
        return "🇫🇷"; // Added France flag
      case "ES":
        return "🇪🇸"; // Added Spain flag
    }
    // За замовчуванням, якщо мова не розпізнана, повертаємо порожній рядок або інший знак
    return "";
  };

  return (
    <View style={styles.flagsContainer}>
      {languages.map(
        (lang, index) =>
          // Ensure lang is a string before rendering, as parsing might result in non-strings
          typeof lang === "string" && (
            <Text key={index} style={styles.flagText}>
              {getFlag(lang.toUpperCase())}
            </Text>
          )
      )}
    </View>
  );
};

const DoctorCard = ({ doctor }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleGoToDoctor = () => {
    console.log(`Перейти до лікаря: ${doctor.full_name}`);
    // Pass doctor.user_id to the Profile screen
    navigation.navigate("Profile_doctor", { doctorId: doctor.user_id });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri:
              doctor.avatar_url ||
              "https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo",
          }}
          style={styles.avatar}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.full_name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{t("rating")}: </Text>
            {/* Display a placeholder for rating if not available */}
            <Text style={styles.ratingValue}>{doctor.rating || "N/A"}</Text>
          </View>
          <View style={styles.languageRow}>
            <Text style={styles.languageText}>
              {t("communication_language")}:{" "}
            </Text>
            {/* Pass the parsed array of languages */}
            <LanguageFlags languages={doctor.communication_languages || []} />
          </View>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("specialization")}: </Text>
        {/* Specialization is already joined into a string during data fetching */}
        <Text style={styles.detailValue}>
          {doctor.specialization || t("not_specified")}
        </Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("time_in_app")}: </Text>
        <Text style={styles.detailValue}>
          {doctor.time_in_app || t("not_specified")}
        </Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("consultations_count")}: </Text>
        <Text style={styles.detailValue}>
          {doctor.consultations_count || "0"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.goToButton} onPress={handleGoToDoctor}>
          <Text style={styles.goToButtonText}>{t("go_to")}</Text>
        </TouchableOpacity>
        {/* Відображення ціни з supabase, тепер використовуємо consultation_cost */}
        <Text style={styles.priceText}>
          {t("price")}:{" "}
          {doctor.consultation_cost
            ? `${doctor.consultation_cost}$`
            : t("not_specified")}
        </Text>
      </View>
    </View>
  );
};

const ChooseSpecial = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Правильний імпорт useRoute
  // Деструктуруємо params, додаємо || {} для безпеки, якщо params немає.
  // specialization буде ключем, який ми передали з Patsient_Home.js
  const { specialization } = route.params || {};

  const { t } = useTranslation();
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  console.log("Вибрана спеціалізація:", specialization); // Для дебагу

  // State to store fetched doctors
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("anketa_doctor").select("*, consultation_cost");

      // Якщо спеціалізація передана, додаємо фільтр
      if (specialization) {
        // Змінено з .contains на .cs (contains, або @>) для JSONB типів
        // `specialization` - це рядок (наприклад, "dentist").
        // Ми обгортаємо його в JSON.stringify, щоб він був коректним JSON-масивом для фільтрації.
        // Це скаже Supabase шукати записи, де JSON-масив 'specialization'
        // містить елемент, який точно відповідає JSON-рядку, який ми передаємо.
        query = query.filter('specialization', 'cs', `["${specialization}"]`);
        // АБО, якщо вам потрібен старий оператор @>, то так:
        // query = query.contains('specialization', `["${specialization}"]`); // Це також може спрацювати, але синтаксис `cs` більш явний для JSONB
      }

      const { data, error } = await query; // Виконуємо запит

      if (error) {
        console.error("Помилка отримання лікарів:", error);
        setError(t("error_fetching_doctors") + ": " + error.message);
      } else {
      const parsedDoctors = data.map((doctor) => {
          let parsedCommunicationLanguages = [];
          if (doctor.communication_languages) {
            // Перевіряємо, чи вже масив, інакше намагаємося парсити
            if (Array.isArray(doctor.communication_languages)) {
              parsedCommunicationLanguages = doctor.communication_languages;
            } else {
              try {
                parsedCommunicationLanguages = JSON.parse(doctor.communication_languages);
              } catch (e) {
                console.warn(
                  "Warning: Invalid communication_languages format for doctor:",
                  doctor.user_id,
                  doctor.communication_languages,
                  e
                );
              }
            }
          }

          let joinedSpecializations = "";
          if (doctor.specialization) {
            // Перевіряємо, чи вже масив, інакше намагаємося парсити
            if (Array.isArray(doctor.specialization)) {
              joinedSpecializations = doctor.specialization.join(", ");
            } else {
              try {
                joinedSpecializations = JSON.parse(doctor.specialization).join(", ");
              } catch (e) {
                console.warn(
                  "Warning: Invalid specialization format for doctor:",
                  doctor.user_id,
                  doctor.specialization,
                  e
                );
              }
            }
          }

          return {
            ...doctor,
            communication_languages: parsedCommunicationLanguages,
            specialization: joinedSpecializations,
            avatar_url:
              doctor.avatar_url ||
              "https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo",
          };
        });
        setDoctors(parsedDoctors);
      }
    } catch (e) {
      console.error("Неочікувана помилка:", e);
      setError(t("unexpected_error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  };

  fetchDoctors();
}, [t, specialization]); // Додаємо specialization до залежностей useEffect

  const sortOptions = [
    { label: t("sort_by_rating_desc"), value: "rating_desc" },
    { label: t("sort_by_rating_asc"), value: "rating_asc" },
    { label: t("sort_by_experience_desc"), value: "experience_desc" },
    { label: t("sort_by_experience_asc"), value: "experience_asc" },
    { label: t("sort_by_price_asc"), value: "price_asc" },
    { label: t("sort_by_price_desc"), value: "price_desc" },
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
      }),
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
      }),
    ]).start(() => setSortModalVisible(false));
  };

  const handleSortOptionSelect = (option) => {
    console.log("Обрано опцію сортування:", option.label);
    // Тут буде логіка сортування, якщо потрібно
    closeSortModal();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t("loading_doctors")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setLoading(true)}
        >
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        {/* Заголовок може відображати вибрану спеціалізацію */}
        <Text style={styles.headerTitle}>
          {specialization ? t(`categories.${specialization}`) : t("doctors")}
        </Text>
        <View style={styles.rightIcon}>
          <Icon width={50} height={50} />
        </View>
      </View>

      <TouchableOpacity style={styles.sortButton} onPress={openSortModal}>
        <Text style={styles.sortButtonText}>{t("sort")}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollViewContent}>
        {doctors.length > 0 ? (
          doctors.map((doctor) => (
            <DoctorCard key={doctor.user_id} doctor={doctor} />
          ))
        ) : (
          <Text style={styles.noDoctorsFound}>{t("no_doctors_found")}</Text>
        )}
      </ScrollView>

      <Modal
        animationType="none"
        transparent={true}
        visible={isSortModalVisible}
        onRequestClose={closeSortModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.sortModalContainer,
              { transform: [{ translateY: slideAnim }] },
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
            <TouchableOpacity
              style={styles.closeSortButton}
              onPress={closeSortModal}
            >
              <Text style={styles.closeSortButtonText}>{t("close")}</Text>
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
    backgroundColor: "#f5f5f5",
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffebee",
  },
  errorText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  noDoctorsFound: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#777",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  rightIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  sortButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sortButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollViewContent: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#E3F2FD",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#3498DB",
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 14,
    color: "#555",
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageText: {
    fontSize: 14,
    color: "#555",
  },
  flagsContainer: {
    flexDirection: "row",
    marginLeft: 5,
  },
  flagText: {
    fontSize: 16,
    marginRight: 3,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: "#777",
    marginRight: 5,
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  goToButton: {
    backgroundColor: "#4DD0E1",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  goToButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sortModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxHeight: "70%",
  },
  sortOptionsList: {
    marginBottom: 10,
  },
  sortOptionButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "flex-start",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#0EB3EB",
    fontWeight: "500",
  },
  closeSortButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  closeSortButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChooseSpecial;