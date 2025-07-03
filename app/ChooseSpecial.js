import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import Icon from "../assets/icon.svg"; // Залишаємо закоментованим, якщо не використовується напряму тут

// Отримання розмірів екрану
const { width, height } = Dimensions.get("window");

// Функції для масштабування розмірів
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;


// Helper for safe JSON parsing
const getParsedArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(
      "Warning: Invalid JSON format for array (expected array or parsable JSON string):",
      value,
      e
    );
    return [];
  }
};

// Data for specializations
const specializationsList = [
  { value: "general_practitioner", nameKey: "categories.general_practitioner" },
  { value: "pediatrician", nameKey: "categories.pediatrician" },
  { value: "cardiologist", nameKey: "categories.cardiologist" },
  { value: "dermatologist", nameKey: "categories.dermatologist" },
  { value: "neurologist", nameKey: "categories.neurologist" },
  { value: "surgeon", nameKey: "categories.surgeon" },
  { value: "psychiatrist", nameKey: "categories.psychiatrist" },
  { value: "dentist", nameKey: "categories.dentist" },
  { value: "ophthalmologist", nameKey: "categories.ophthalmologist" },
  { value: "ent_specialist", nameKey: "categories.ent_specialist" },
  { value: "gastroenterologist", nameKey: "categories.gastroenterologist" },
  { value: "endocrinologist", nameKey: "categories.endocrinologist" },
  { value: "oncologist", nameKey: "categories.oncologist" },
  { value: "allergist", nameKey: "categories.allergist" },
  { value: "physiotherapist", nameKey: "categories.physiotherapist" },
  { value: "traumatologist", nameKey: "categories.traumatologist" },
  { value: "gynecologist", nameKey: "categories.gynecologist" },
  { value: "urologist", nameKey: "categories.urologist" },
  { value: "pulmonologist", nameKey: "categories.pulmonologist" },
  { value: "nephrologist", nameKey: "categories.nephrologist" },
  { value: "rheumatologist", nameKey: "categories.rheumatologist" },
  { value: "infectiousDiseasesSpecialist", nameKey: "categories.infectiousDiseasesSpecialist" },
  { value: "psychologist", nameKey: "categories.psychologist" },
  { value: "nutritionist", nameKey: "categories.nutritionist" },
  { value: "radiologist", nameKey: "categories.radiologist" },
  { value: "anesthesiologist", nameKey: "categories.anesthesiologist" },
];


// --- Додаємо мапу прапорів (таку ж, як у Profile_doctor.js та Search.js) ---
const COUNTRY_FLAGS_MAP = {
  "EN": "🇬🇧", // Використовуємо для 'english'
  "UK": "🇺🇦", // Використовуємо для 'ukrainian'

};


// Reusable component for displaying values in a styled box
const InfoBox = ({ label, value, children }) => {
  const { t } = useTranslation();
  const isEmpty =
    !value && (!children || (Array.isArray(children) && children.length === 0));
  return (
    <View style={styles.infoBoxRow}>
      <Text style={styles.infoBoxLabel}>{label}:</Text>
      <View style={styles.infoBoxValueContainer}>
        {isEmpty ? (
          <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
            {t("not_specified")}
          </Text>
        ) : children ? (
          children
        ) : (
          <Text style={styles.infoBoxValueText}>{value}</Text>
        )}
      </View>
    </View>
  );
};

// Функція для відображення прапорів мов
const LanguageFlags = ({ languages }) => {
  const { t } = useTranslation();
  const getFlag = (code) => {
    return COUNTRY_FLAGS_MAP[String(code).toUpperCase()] || "❓";
  };

  if (!languages || languages.length === 0) {
    return (
      <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
        {t("not_specified")}
      </Text>
    );
  }

  return (
    <View style={styles.flagsContainer}>
      {languages.map(
        (langCode, index) =>
          typeof langCode === "string" && (
            <Text key={index} style={styles.flagText}>
              {getFlag(langCode)}
            </Text>
          )
      )}
    </View>
  );
};

// Функція для розрахунку кількості зірочок від 0 до 5
// де 1000 points = 5 зірочок
const calculateStarsFromPoints = (points) => {
  if (points === null || points === undefined || isNaN(points) || points < 0) {
    return 0; // Якщо балів немає або вони некоректні, повертаємо 0 зірок
  }
  // Максимально 1000 балів = 5 зірок. Кожна зірка = 200 балів.
  return Math.min(5, Math.floor(points / 200));
};


const DoctorCard = ({ doctor }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
      }
      const lastDigit = years % 10;
      const lastTwoDigits = years % 100;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return `${years} ${t("years_plural_genitive")}`;
      }
      if (lastDigit === 1) {
        return `${years} ${t("year_singular")}`;
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return `${years} ${t("years_plural_nominative")}`;
      }
      return `${years} ${t("years_plural_genitive")}`;
    },
    [t]
  );

  const handleGoToDoctor = () => {
    navigation.navigate("Profile", { doctorId: doctor.user_id });
  };

  const getTranslatedSpecializations = (specializationKeys) => {
    const parsedKeys = getParsedArray(specializationKeys);
    return parsedKeys
      .map((specKey) => {
        const spec = specializationsList.find((s) => s.value === specKey);
        return spec ? t(spec.nameKey) : specKey; // Fallback to key if not found
      })
      .join(", ");
  };

  // Отримуємо doctor_points з об'єкта doctor, який має вкладений profile_doctor
  // Завдяки нормалізації в fetchDoctors, profile_doctor завжди є масивом
  const doctorPoints = doctor.profile_doctor?.[0]?.doctor_points;
  const starRating = calculateStarsFromPoints(doctorPoints);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {doctor.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person-circle-outline" size={moderateScale(60)} color="#0EB3EB" />
          </View>
        )}
        <View style={styles.doctorSummary}>
          <Text style={styles.doctorName}>{doctor.full_name || t("not_specified")}</Text>
          <InfoBox label={t("rating")}>
            {/* Відображаємо повні зірочки */}
            {Array.from({ length: starRating }).map((_, i) => (
              <Ionicons key={`star-full-${i}`} name="star" size={moderateScale(18)} color="#FFD700" />
            ))}
            {/* Відображаємо пусті зірочки */}
            {Array.from({ length: 5 - starRating }).map((_, i) => (
              <Ionicons key={`star-outline-${i}`} name="star-outline" size={moderateScale(18)} color="#ccc" />
            ))}
              {doctorPoints !== undefined && doctorPoints !== null && !isNaN(doctorPoints) && (
              <Text style={styles.ratingPointsText}> ({doctorPoints} {t('points_short')})</Text>
            )}
          </InfoBox>
          <InfoBox label={t("communication_language")}>
            {/* Передаємо languages, як у Profile_doctor */}
            <LanguageFlags languages={getParsedArray(doctor.communication_languages)} />
          </InfoBox>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <InfoBox
          label={t("specialization")}
          value={getTranslatedSpecializations(doctor.specialization)}
        />
        <InfoBox
          label={t("work_experience")}
          value={formatYearsText(doctor.experience_years)}
        />
        {/* New InfoBox for `doctor_check` - assuming it exists and you want to display it */}
        {doctor.doctor_check && (
          <InfoBox label={t("status")} value={t("available_for_consultations")} />
        )}
        {/* InfoBox for doctor_check being true */}
        {doctor.doctor_check && (
          <InfoBox label={t("verification_status")} value={t("verified_doctor")} />
        )}
        <InfoBox label={t("time_in_app")} value={doctor.time_in_app || t("not_specified")} />
        <InfoBox
          label={t("consultations_count")}
          value={doctor.consultations_count?.toString() || "0"}
        />
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.goToButton} onPress={handleGoToDoctor}>
          <Text style={styles.goToButtonText}>{t("go_to")}</Text>
        </TouchableOpacity>
        <Text style={styles.priceText}>
          {t("price")}:{" "}
          {doctor.consultation_cost
            ? `${doctor.consultation_cost}$`
            : t("not_specified_price")}
        </Text>
      </View>
    </View>
  );
};


const ChooseSpecial = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { specialization: initialSpecialization, searchQuery } = route.params || {};

  const { t } = useTranslation();
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSortOption, setCurrentSortOption] = useState("rating_desc"); // Default sort by rating desc

  // --- Додано: Ефект для скидання сортування при зміні спеціалізації ---
  useEffect(() => {
    if (initialSpecialization) {
      setCurrentSortOption("rating_desc"); // Скидаємо до сортування за рейтингом (спадання)
    }
  }, [initialSpecialization]); // Запускається при зміні initialSpecialization


  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      let fetchError = null;

      // Base query for all doctors, always filtering by doctor_check = true
      let query = supabase
        .from("anketa_doctor")
        .select("*, profile_doctor(doctor_points), consultation_cost, experience_years, created_at, avatar_url, doctor_check") // Include doctor_check and doctor_check
        .eq("doctor_check", true); // Filter by doctor_check = true

      if (initialSpecialization) {
        // Add specialization filter if present
        const { data: categoryData, error: categoryError } = await query
          .filter("specialization", "cs", `["${initialSpecialization}"]`);

        data = categoryData;
        fetchError = categoryError;
      } else if (searchQuery) {
        // Special handling for RPC function which returns a flat structure
        // We'll filter doctor_check = true after fetching, if RPC doesn't support it directly
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_doctors_by_name_or_specialization', {
            p_search_query: searchQuery,
        });

        if (rpcError) {
            console.error("Error searching doctors with RPC:", rpcError);
            setError(`${t("error_fetching_doctors")}: ${rpcError.message}`);
            setDoctors([]);
            setLoading(false);
            return;
        }
        // Filter doctor_check on the client side for RPC results if not filtered by RPC
        data = rpcData.filter(doctor => doctor.doctor_check === true);
        fetchError = rpcError; // Although filtered, keep track of RPC errors
      } else {
          // If no specialization or search query, fetch all doctors with doctor_check = true
          const { data: allDoctorsData, error: allDoctorsError } = await query;
          data = allDoctorsData;
          fetchError = allDoctorsError;
      }

      if (fetchError) {
        console.error("Error fetching doctors:", fetchError);
        setError(`${t("error_fetching_doctors")}: ${fetchError.message}`);
        setDoctors([]);
      } else {
        const processedDoctors = data.map((doctor) => {
          let normalizedProfileDoctor = null;
          if (doctor.profile_doctor) {
            if (Array.isArray(doctor.profile_doctor)) {
              normalizedProfileDoctor = doctor.profile_doctor;
            } else {
              normalizedProfileDoctor = [doctor.profile_doctor];
            }
          }

          const parsedCommunicationLanguages = getParsedArray(doctor.communication_languages).map(lang => {
            if (typeof lang === 'object' && lang !== null && lang.code) {
              return String(lang.code).toUpperCase();
            }
            return String(lang).toUpperCase();
          }).filter(code => COUNTRY_FLAGS_MAP[code]);

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
            profile_doctor: normalizedProfileDoctor,
            communication_languages: parsedCommunicationLanguages,
            time_in_app: timeInAppDisplay,
          };
        });

        const sortedDoctors = [...processedDoctors].sort((a, b) => {
          const pointsA = a.profile_doctor?.[0]?.doctor_points || 0;
          const pointsB = b.profile_doctor?.[0]?.doctor_points || 0;

          switch (currentSortOption) {
            case "experience_desc":
              return (b.experience_years || 0) - (a.experience_years || 0);
            case "experience_asc":
              return (a.experience_years || 0) - (b.experience_years || 0);
            case "price_asc":
              return (a.consultation_cost || 0) - (b.consultation_cost || 0);
            case "price_desc":
              return (b.consultation_cost || 0) - (a.consultation_cost || 0);
            case "rating_desc":
              return pointsB - pointsA;
            case "rating_asc":
              return pointsA - pointsB;
            default:
              return 0;
          }
        });

        setDoctors(sortedDoctors);
      }
    } catch (e) {
      console.error("Unexpected error during doctor fetch:", e);
      setError(`${t("unexpected_error")}: ${e.message}`);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [t, initialSpecialization, searchQuery, currentSortOption]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

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
    setCurrentSortOption(option.value);
    closeSortModal();
  };

  const getHeaderTitle = () => {
    if (initialSpecialization) {
      const spec = specializationsList.find(
        (s) => s.value === initialSpecialization
      );
      return spec ? t(spec.nameKey) : t("doctors");
    }
    if (searchQuery) {
        return `${t("search_results_for")} "${searchQuery}"`;
    }
    return t("doctors");
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.rightIcon}>
          {/* <Icon width={50} height={50} /> */}
        </View>
      </View>

      <TouchableOpacity style={styles.sortButton} onPress={openSortModal}>
        <Text style={styles.sortButtonText}>{t("sort")}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
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
                    currentSortOption === option.value &&
                    styles.sortOptionSelected,
                  ]}
                  onPress={() => handleSortOptionSelect(option)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      currentSortOption === option.value &&
                      styles.sortOptionTextSelected,
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // Adjusted for Android StatusBar
  },
  container: {
    flex: 1,
    backgroundColor: "white",
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
    // fontFamily: "Mont-Regular",
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
    // fontFamily: "Mont-Regular",
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
    // fontFamily: "Mont-Bold",
  },
  noDoctorsFound: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#777",
    // fontFamily: "Mont-Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 30 : 0,
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
    // fontFamily: "Mont-Bold",
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
    // fontFamily: "Mont-Bold",
  },
  scrollViewContent: {
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
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#0EB3EB",
    backgroundColor: "#F5F5F5",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#B3E0F2',
  },
  doctorSummary: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    // fontFamily: "Mont-Bold",
  },
  infoBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoBoxLabel: {
    fontSize: 13,
    color: "#555",
    marginRight: 5,
    // fontFamily: "Mont-Medium",
  },
  infoBoxValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoBoxValueText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    // fontFamily: "Mont-Regular",
    flexShrink: 1,
  },
  notSpecifiedText: {
    fontStyle: "italic",
    color: "#777",
  },
  flagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  flagText: {
    fontSize: 18,
    marginRight: 5,
  },
  ratingPointsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    // fontFamily: 'Mont-Regular',
  },
  cardDetails: {
    paddingTop: 10,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#CFD8DC",
    paddingTop: 10,
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
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
    // fontFamily: "Mont-Bold",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB",
    // fontFamily: "Mont-Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "flex-start",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    // fontFamily: "Mont-Regular",
  },
  sortOptionSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 8,
  },
  sortOptionTextSelected: {
    fontWeight: "bold",
    color: "#0EB3EB",
    // fontFamily: "Mont-Bold",
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
    // fontFamily: "Mont-Bold",
  },
});

export default ChooseSpecial;