import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg"; // Переконайтеся, що шлях до icon.svg правильний

import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";

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
        return "🇫🇷";
      case "ES":
        return "🇪🇸";
      default:
        return ""; // За замовчуванням, якщо мова не розпізнана
    }
  };

  return (
    <View style={styles.flagsContainer}>
      {languages.map(
        (lang, index) =>
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

  // Функція для форматування досвіду роботи
  const formatYearsText = (years) => {
    if (years === null || years === undefined || isNaN(years) || years < 0) {
      return t("not_specified");
    }
    // Використовуємо i18next для множини, тому просто передаємо число
    return t("years_experience", { count: years });
  };

  // Функція для форматування часу в додатку
  const formatTimeInApp = (timeInApp) => {
    if (!timeInApp) return t("not_specified");

    // Оскільки `timeInApp` вже є відформатованим рядком з `fetchDoctors`,
    // просто повертаємо його.
    return timeInApp;
  };

  const handleGoToDoctor = () => {
    console.log(`Перейти до лікаря: ${doctor.full_name}`);
    navigation.navigate("Profile_doctor", { doctorId: doctor.user_id });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {doctor.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.full_name}</Text>
          {/* Рейтинг прибрано, оскільки колонка відсутня */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{t("rating")}: </Text>
            {/* Відображаємо "N/A", оскільки рейтинг не вибирається */}
            <Text style={styles.ratingValue}>{"N/A"}</Text>
          </View>
          <View style={styles.languageRow}>
            <Text style={styles.languageText}>
              {t("communication_language")}:{" "}
            </Text>
            <LanguageFlags languages={doctor.communication_languages || []} />
          </View>
        </View>
      </View>

      {/* Specialization */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("specialization")}: </Text>
        <Text style={styles.detailValue}>
          {doctor.specialization || t("not_specified")}
        </Text>
      </View>

      {/* Work Experience */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("work_experience")}: </Text>
        <Text style={styles.detailValue}>
          {formatYearsText(doctor.experience_years)}
        </Text>
      </View>

      {/* Time in App (автоматично розраховується) */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>{t("time_in_app")}: </Text>
        <Text style={styles.detailValue}>
          {formatTimeInApp(doctor.time_in_app)}
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
  const route = useRoute();
  const { specialization } = route.params || {};

  const { t } = useTranslation();
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default sort by experience years descending, as rating is not available
  const [currentSortOption, setCurrentSortOption] = useState("experience_desc");

  useEffect(() => {
    let isActive = true; // Флаг для запобігання оновленню стану на розмонтованому компоненті
    let timer; // Оголошуємо timer тут, щоб він був доступний у функції очищення

    const fetchDataDelayed = async () => {
      // Невелика затримка, щоб переконатися, що компонент повністю змонтований
      // перед початком завантаження даних та оновлення стану.
      timer = setTimeout(async () => { // Присвоюємо значення timer
        if (!isActive) return; // Перевірка, чи компонент все ще активний після затримки

        setLoading(true);
        setError(null);
        try {
          // Видалено 'rating' із запиту, оскільки стовпця немає
          let query = supabase
            .from("anketa_doctor")
            .select("*, consultation_cost, experience_years, created_at");

          if (specialization) {
            query = query.filter('specialization', 'cs', `["${specialization}"]`);
          }

          // Додаємо console.log, щоб перевірити, яка опція сортування вибрана
          console.log("Current Sort Option:", currentSortOption);

          // Застосування сортування на основі currentSortOption
          switch (currentSortOption) {
            // Випадки для rating_desc та rating_asc видалено
            case "experience_desc":
              query = query.order("experience_years", { ascending: false, nullsFirst: false });
              break;
            case "experience_asc":
              query = query.order("experience_years", { ascending: true, nullsFirst: true });
              break;
            case "price_asc":
              query = query.order("consultation_cost", { ascending: true, nullsFirst: true });
              break;
            case "price_desc":
              // Важливо: ascending: false для спадання (від найбільшого до найменшого)
              query = query.order("consultation_cost", { ascending: false, nullsFirst: false });
              break;
            default:
              // Дефолтне сортування за досвідом, якщо опція невідома
              query = query.order("experience_years", { ascending: false, nullsFirst: false });
          }

          const { data, error: fetchError } = await query;

          if (isActive) { // Перевірка isActive перед оновленням стану
            if (fetchError) {
              console.error("Помилка отримання лікарів:", fetchError);
              setError(t("error_fetching_doctors") + ": " + fetchError.message);
            } else {
              const parsedDoctors = data.map((doctor) => {
                let parsedCommunicationLanguages = [];
                if (doctor.communication_languages) {
                  if (Array.isArray(doctor.communication_languages)) {
                    parsedCommunicationLanguages = doctor.communication_languages;
                  } else {
                    try {
                      parsedCommunicationLanguages = JSON.parse(
                        doctor.communication_languages
                      );
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
                  if (Array.isArray(doctor.specialization)) {
                    joinedSpecializations = doctor.specialization
                      .map((specKey) => t(`categories.${specKey}`))
                      .join(", ");
                  } else {
                    try {
                      joinedSpecializations = JSON.parse(doctor.specialization)
                        .map((specKey) => t(`categories.${specKey}`))
                        .join(", ");
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

                let timeInAppDisplay = t("not_specified");
                if (doctor.created_at) {
                  const joinedDate = new Date(doctor.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays < 30) {
                    timeInAppDisplay = t("days_in_app", { count: diffDays });
                  } else if (diffDays < 365) {
                    const diffMonths = Math.floor(diffDays / 30);
                    timeInAppDisplay = t("months_in_app", { count: diffMonths });
                  } else {
                    const diffYears = Math.floor(diffDays / 365);
                    timeInAppDisplay = t("years_in_app", { count: diffYears });
                  }
                }

                return {
                  ...doctor,
                  communication_languages: parsedCommunicationLanguages,
                  specialization: joinedSpecializations,
                  time_in_app: timeInAppDisplay,
                };
              });
              setDoctors(parsedDoctors);
            }
          }
        } catch (e) {
          if (isActive) { // Перевірка isActive перед оновленням стану
            console.error("Неочікувана помилка:", e);
            setError(t("unexpected_error") + ": " + e.message);
          }
        } finally {
          if (isActive) { // Перевірка isActive перед оновленням стану
            setLoading(false);
          }
        }
      }, 10); // Невелика затримка (10 мс)
    };

    fetchDataDelayed(); // Викликаємо функцію відкладеного завантаження даних

    return () => {
      isActive = false; // Очистка при розмонтуванні компонента
      clearTimeout(timer); // Очистити таймер, щоб уникнути витоків пам'яті
    };
  }, [t, specialization, currentSortOption]);

  const sortOptions = [
    // Опції сортування за рейтингом видалено
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
    setCurrentSortOption(option.value);
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
                  style={[
                    styles.sortOptionButton,
                    currentSortOption === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => handleSortOptionSelect(option)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      currentSortOption === option.value && styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
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
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
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
  sortOptionSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 8,
  },
  sortOptionTextSelected: {
    fontWeight: "bold",
    color: "#0EB3EB",
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
