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
  Platform, // Import Platform for OS-specific styling
  SafeAreaView, // Import SafeAreaView for proper layout on iOS
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg"; // Make sure the path to icon.svg is correct

import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";

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

// Reusable component for displaying values in a styled box
const InfoBox = ({ label, value, children }) => {
  const isEmpty =
    !value && (!children || (Array.isArray(children) && children.length === 0));
  return (
    <View style={styles.infoBoxRow}>
      <Text style={styles.infoBoxLabel}>{label}:</Text>
      <View style={styles.infoBoxValueContainer}>
        {isEmpty ? (
          <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
            Not specified
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

// Data for specializations and languages (should ideally come from a central config/API)
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
];

const consultationLanguagesList = [
  { code: "UK", nameKey: "ukrainian", emoji: "🇺🇦" },
  { code: "DE", nameKey: "german", emoji: "🇩🇪" },
  { code: "PL", nameKey: "polish", emoji: "🇵🇱" },
  { code: "EN", nameKey: "english", emoji: "🇬🇧" },
  { code: "FR", nameKey: "french", emoji: "🇫🇷" },
  { code: "ES", nameKey: "spanish", emoji: "🇪🇸" },
];

// Функція для відображення прапорів мов
const LanguageFlags = ({ languages }) => {
  const getFlag = (code) => {
    const lang = consultationLanguagesList.find(
      (item) => item.code === code.toUpperCase()
    );
    return lang ? lang.emoji : "❓"; // Default to a question mark if not recognized
  };

  if (!languages || languages.length === 0) {
    return (
      <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
        Not specified
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {doctor.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
        )}
        <View style={styles.doctorSummary}>
          <Text style={styles.doctorName}>{doctor.full_name || t("not_specified")}</Text>
          <InfoBox label={t("rating")} value="N/A" />
          <InfoBox label={t("communication_language")}>
            <LanguageFlags languages={doctor.communication_languages || []} />
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
  const { specialization: initialSpecialization } = route.params || {};

  const { t } = useTranslation();
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default sort by experience years descending
  const [currentSortOption, setCurrentSortOption] = useState("experience_desc");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("anketa_doctor")
        .select("*, consultation_cost, experience_years, created_at, avatar_url");

      if (initialSpecialization) {
        // Use 'cs' (contains string) for array contains matching for JSONB columns
        // This assumes 'specialization' in DB is a JSONB array of strings e.g., ["cardiologist", "pediatrician"]
        query = query.filter(
          "specialization",
          "cs",
          `["${initialSpecialization}"]`
        );
      }

      switch (currentSortOption) {
        case "experience_desc":
          query = query.order("experience_years", {
            ascending: false,
            nullsFirst: false,
          }); // Nulls at the end
          break;
        case "experience_asc":
          query = query.order("experience_years", {
            ascending: true,
            nullsFirst: true,
          }); // Nulls at the beginning
          break;
        case "price_asc":
          query = query.order("consultation_cost", {
            ascending: true,
            nullsFirst: true,
          }); // Nulls at the beginning
          break;
        case "price_desc":
          query = query.order("consultation_cost", {
            ascending: false,
            nullsFirst: false,
          }); // Nulls at the end
          break;
        default:
          query = query.order("experience_years", {
            ascending: false,
            nullsFirst: false,
          });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching doctors:", fetchError);
        setError(`${t("error_fetching_doctors")}: ${fetchError.message}`);
        setDoctors([]); // Clear doctors on error
      } else {
        const processedDoctors = data.map((doctor) => {
          const parsedCommunicationLanguages = getParsedArray(
            doctor.communication_languages
          );

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
            // specialization is now handled by getTranslatedSpecializations in DoctorCard
            time_in_app: timeInAppDisplay,
          };
        });
        setDoctors(processedDoctors);
      }
    } catch (e) {
      console.error("Unexpected error during doctor fetch:", e);
      setError(`${t("unexpected_error")}: ${e.message}`);
      setDoctors([]); // Clear doctors on unexpected error
    } finally {
      setLoading(false);
    }
  }, [t, initialSpecialization, currentSortOption]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const sortOptions = [
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

  // Get translated specialization for header
  const getHeaderTitle = () => {
    if (initialSpecialization) {
      const spec = specializationsList.find(
        (s) => s.value === initialSpecialization
      );
      return spec ? t(spec.nameKey) : t("doctors");
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
          <Icon width={50} height={50} />
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
    fontFamily: "Mont-Regular",
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
    fontFamily: "Mont-Regular",
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
    fontFamily: "Mont-Bold",
  },
  noDoctorsFound: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#777",
    fontFamily: "Mont-Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 30 : 0, // Adjust for Android status bar
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
    fontFamily: "Mont-Bold",
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
    fontFamily: "Mont-Bold",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#E3F2FD", // Light blue background
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1, // Separator
    borderBottomColor: "#CFD8DC",
    paddingBottom: 10,
  },
  avatar: {
    width: 80, // Slightly larger avatar
    height: 80,
    borderRadius: 40, // Half of width/height for perfect circle
    marginRight: 15,
    borderWidth: 2, // More prominent border
    borderColor: "#0EB3EB", // Primary theme color
    backgroundColor: "#F5F5F5", // Placeholder background
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  doctorSummary: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8, // More space
    fontFamily: "Mont-Bold",
  },
  infoBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // Tighter spacing for info rows
  },
  infoBoxLabel: {
    fontSize: 13,
    color: "#555",
    marginRight: 5,
    fontFamily: "Mont-Medium",
  },
  infoBoxValueContainer: {
    flex: 1,
    flexDirection: "row", // Ensure flags display horizontally
    alignItems: "center",
    flexWrap: "wrap", // Allow content to wrap
  },
  infoBoxValueText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    fontFamily: "Mont-Regular",
    flexShrink: 1, // Allow text to shrink
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
  cardDetails: {
    paddingTop: 10,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    borderTopWidth: 1, // Separator
    borderTopColor: "#CFD8DC",
    paddingTop: 10,
  },
  goToButton: {
    backgroundColor: "#0EB3EB", // Use primary theme color
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
    fontFamily: "Mont-Bold",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB", // A distinct blue for price
    fontFamily: "Mont-Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Darker overlay
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
    paddingHorizontal: 10, // Added horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "flex-start",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#333", // Darker text for non-selected
    fontWeight: "500",
    fontFamily: "Mont-Regular",
  },
  sortOptionSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 8,
  },
  sortOptionTextSelected: {
    fontWeight: "bold",
    color: "#0EB3EB",
    fontFamily: "Mont-Bold",
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
    fontFamily: "Mont-Bold",
  },
});

export default ChooseSpecial;