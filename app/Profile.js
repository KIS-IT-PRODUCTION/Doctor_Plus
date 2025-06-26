import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  SafeAreaView, // Added SafeAreaView for consistent padding
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import Icon from "../assets/icon.svg";
// Reusable component for displaying values in a styled box
// Updated ValueBox to apply styling for displayValueContainer
const ValueBox = ({ children, isTextValue = true }) => {
  const isEmpty =
    !children ||
    (typeof children === "string" && children.trim() === "") ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return (
      <View style={styles.displayValueContainer}>
        <Text style={[styles.valueText, styles.noValueText]}>
          Not specified
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.displayValueContainer}>
      {isTextValue && typeof children === "string" ? (
        <Text style={styles.valueText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

// Функція для відображення прапорів мов
const LanguageFlags = ({ languages }) => {
  const getFlag = (code) => {
    switch (String(code).toUpperCase()) {
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
        return "❓";
    }
  };

  if (!languages || languages.length === 0) {
    return null;
  }

  return (
    <View style={styles.flagsContainer}>
      {languages.map(
        (lang, index) =>
          typeof lang === "string" && (
            <Text key={index} style={styles.flagText}>
              {getFlag(lang)}
            </Text>
          )
      )}
    </View>
  );
};

const Profile = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const doctorId = route.params?.doctorId
    ? String(route.params.doctorId)
    : null;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [loadingDiploma, setLoadingDiploma] = useState(true);

  const [avatarError, setAvatarError] = useState(false);
  const [certificateError, setCertificateError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  // State for image modal
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
      }
      // Assuming t("years_experience") handles pluralization correctly
      // based on count. If not, you'd need a more complex logic as in Anketa_Settings.
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

  const fetchDoctorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDoctor(null);

    if (!doctorId) {
      console.warn("Profile: doctorId is undefined/null, cannot fetch data.");
      setError(t("doctor_id_missing"));
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("anketa_doctor")
        .select(
          "*, diploma_url, certificate_photo_url, consultation_cost, experience_years"
        )
        .eq("user_id", doctorId)
        .single();

      if (fetchError) {
        console.error("Error fetching doctor data from Supabase:", fetchError);
        if (fetchError.code === "PGRST116") {
          setError(t("doctor_not_found"));
        } else {
          setError(
            `${t("error_fetching_doctor_data")}: ${fetchError.message}`
          );
        }
      } else {
        setDoctor(data);
        setLoadingAvatar(true);
        setLoadingCertificate(true);
        setLoadingDiploma(true);
        setAvatarError(false);
        setCertificateError(false);
        setDiplomaError(false);
      }
    } catch (err) {
      console.error("Unexpected error during data fetch:", err);
      setError(`${t("unexpected_error")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleChooseConsultationTime = () => {
    if (doctorId) {
      // Fix: Use the 'doctorId' constant that is already extracted from route.params
      navigation.navigate('ConsultationTimePatient', { doctorId: doctorId });
    } else {
      Alert.alert(t("error"), t("doctor_id_missing_for_consultation"));
    }
  };

  const getParsedArray = useCallback((value) => {
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
  }, []);

  const getLanguages = useCallback(
    (languagesData) => {
      const parsedLanguages = getParsedArray(languagesData);
      return consultationLanguages
        .filter((lang) => parsedLanguages.includes(lang.code))
        .map((lang) => t(lang.nameKey))
        .join(", ");
    },
    [getParsedArray, t]
  );

  const getSpecializations = useCallback(
    (specializationData) => {
      const parsedSpecs = getParsedArray(specializationData);
      if (parsedSpecs.length > 0) {
        // Assume specializations array contains { value: "key", nameKey: "translation_key" }
        const mappedSpecs = specializations
          .filter((spec) => parsedSpecs.includes(spec.value))
          .map((spec) => t(spec.nameKey));
        return mappedSpecs.join(", ");
      }
      return t("not_specified");
    },
    [getParsedArray, t]
  );

  const openImageModal = (uri) => {
    setSelectedImageUri(uri);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImageUri(null);
    setIsImageModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchDoctorData()}
        >
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDoctorText}>{t("doctor_not_found")}</Text>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    full_name,
    avatar_url,
    communication_languages,
    specialization,
    experience_years,
    work_location,
    consultation_cost,
    about_me,
    achievements,
    certificate_photo_url,
    diploma_url,
    country, // Added country
  } = doctor;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("profile")}</Text>
       <View style={styles.logoContainer}>
                      <Icon width={50} height={50} />
                    </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.doctorMainInfo}>
          <View style={styles.avatarContainer}>
            {avatar_url && !avatarError ? (
              <>
                {loadingAvatar && (
                  <ActivityIndicator
                    size="large"
                    color="#0EB3EB"
                    style={styles.avatarLoadingIndicator}
                  />
                )}
                <Image
                  source={{ uri: avatar_url }}
                  style={styles.avatar}
                  onLoad={() => setLoadingAvatar(false)}
                  onError={() => {
                    setLoadingAvatar(false);
                    setAvatarError(true);
                    console.error("Error loading avatar image:", avatar_url);
                  }}
                />
              </>
            ) : (
              <View style={styles.emptyAvatar}>
                <Ionicons
                  name="person-circle-outline"
                  size={80}
                  color="#3498DB"
                />
                <Text style={styles.emptyAvatarText}>{t("no_photo")}</Text>
              </View>
            )}
          </View>

          <Text style={styles.doctorName}>
            {full_name || t("not_specified")}
          </Text>

          {/* New layout for information fields */}
          <Text style={styles.inputLabel}>{t("country")}</Text>
          <ValueBox>{country || t("not_specified")}</ValueBox>

          <Text style={styles.inputLabel}>{t("communication_language")}</Text>
          <ValueBox>{getLanguages(communication_languages)}</ValueBox>

          <Text style={styles.inputLabel}>{t("specialization")}</Text>
          <ValueBox>{getSpecializations(specialization)}</ValueBox>

          <Text style={styles.inputLabel}>{t("work_experience")}</Text>
          <ValueBox>{formatYearsText(experience_years)}</ValueBox>

          <Text style={styles.inputLabel}>{t("work_location")}</Text>
          <ValueBox>{work_location || t("not_specified")}</ValueBox>

          <Text style={styles.inputLabel}>{t("consultation_cost")}</Text>
          <ValueBox>
            {consultation_cost ? `$${consultation_cost}` : t("not_specified")}
          </ValueBox>

          {/* Removed Rating for now as it's not in Anketa_Settings, can add later */}
          {/*
          <Text style={styles.inputLabel}>{t("rating")}</Text>
          <ValueBox>🌟🌟</ValueBox>
          */}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChooseConsultationTime}
        >
          <Text style={styles.actionButtonText}>
            {t("choose_consultation_time")}
          </Text>
        </TouchableOpacity>

        {/* --- More About Doctor Section --- */}
        <Text style={styles.sectionTitleLink}>{t("more_about_doctor")}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("about_me")}</Text>
          <Text style={styles.sectionContent}>
            {about_me || t("not_specified")}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("achievements")}</Text>
          <Text style={styles.sectionContent}>
            {achievements || t("not_specified")}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("place_of_work")}</Text>
          <Text style={styles.sectionContent}>
            {work_location || t("not_specified")}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("certificate_photo")}</Text>
          {certificate_photo_url && !certificateError ? (
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => openImageModal(certificate_photo_url)}
            >
              {loadingCertificate && (
                <ActivityIndicator
                  size="small"
                  color="#0EB3EB"
                  style={styles.imageLoadingIndicator}
                />
              )}
              <Image
                source={{ uri: certificate_photo_url }}
                style={styles.certificateImage}
                onLoad={() => setLoadingCertificate(false)}
                onError={() => {
                  setLoadingCertificate(false);
                  setCertificateError(true);
                  console.error(
                    "Error loading certificate image:",
                    certificate_photo_url
                  );
                }}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons name="image-outline" size={60} color="#A7D9EE" />
              <Text style={styles.emptyImageText}>
                {t("no_certificate_photo")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
          {diploma_url && !diplomaError ? (
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => openImageModal(diploma_url)}
            >
              {loadingDiploma && (
                <ActivityIndicator
                  size="small"
                  color="#0EB3EB"
                  style={styles.imageLoadingIndicator}
                />
              )}
              <Image
                source={{ uri: diploma_url }}
                style={styles.certificateImage}
                onLoad={() => setLoadingDiploma(false)}
                onError={() => {
                  setLoadingDiploma(false);
                  setDiplomaError(true);
                  console.error("Error loading diploma image:", diploma_url);
                }}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons name="image-outline" size={60} color="#A7D9EE" />
              <Text style={styles.emptyImageText}>{t("no_diploma_photo")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Modal for fullscreen view */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={closeImageModal}
      >
        <TouchableWithoutFeedback onPress={closeImageModal}>
          <View style={styles.fullScreenImageModalOverlay}>
            <TouchableWithoutFeedback>
              {selectedImageUri && (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </TouchableWithoutFeedback>
            <TouchableOpacity
              style={styles.closeImageModalButton}
              onPress={closeImageModal}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const consultationLanguages = [
  { nameKey: "english", code: "en", emoji: "" },
  { nameKey: "ukrainian", code: "uk", emoji: "" },
  { nameKey: "polish", code: "pl", emoji: "🇵🇱" },
  { nameKey: "german", code: "de", emoji: "🇩🇪" },
];

const specializations = [
  { nameKey: "general_practitioner", value: "general_practitioner" },
  { nameKey: "pediatrician", value: "pediatrician" },
  { nameKey: "cardiologist", value: "cardiologist" },
  { nameKey: "dermatologist", value: "dermatologist" },
  { nameKey: "neurologist", value: "neurologist" },
  { nameKey: "surgeon", value: "surgeon" },
  { nameKey: "psychiatrist", value: "psychiatrist" },
  { nameKey: "dentist", value: "dentist" },
  { nameKey: "ophthalmologist", value: "ophthalmologist" },
  { nameKey: "ent_specialist", value: "ent_specialist" },
  { nameKey: "gastroenterologist", value: "gastroenterologist" },
  { nameKey: "endocrinologist", value: "endocrinologist" },
  { nameKey: "oncologist", value: "oncologist" },
  { nameKey: "allergist", value: "allergist" },
  { nameKey: "physiotherapist", value: "physiotherapist" },
];

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
  noDoctorText: {
    fontSize: 18,
    textAlign: "center",
    color: "#000000",
    marginTop: 50,
    fontFamily: "Mont-Regular",
  },
  backToHomeButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 20,
  },
  backToHomeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
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
    color: "#000000",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
    fontFamily: "Mont-Bold",
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  doctorMainInfo: {
    backgroundColor: "#E3F2FD", // Light blue background
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Ensures content stays within bounds
    borderWidth: 1, // Added border for consistency
    borderColor: "#0EB3EB", // Border color from doctor profile
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60, // Use 60 for 120x120 to make it perfectly round
  },
  emptyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyAvatarText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontFamily: "Mont-Regular",
  },
  doctorDetails: {
    width: "100%",
  },
  doctorName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 20, // Increased margin for better separation
    fontFamily: "Mont-Bold",
  },
  // New styles for consistent display
  inputLabel: {
    fontSize: 14,
    alignSelf: "flex-start", // Align to left like doctor's profile
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 15, // Adjusted padding
    marginTop: 10,
    marginBottom: 5,
    width: "100%", // Take full width
  },
  displayValueContainer: {
    backgroundColor: "rgba(14, 179, 235, 0.2)", // Background from doctor's profile inputs
    borderRadius: 20, // Rounded corners
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "100%", // Take full width
    minHeight: 52, // Min height like doctor's inputs
    justifyContent: "center",
    alignItems: "flex-start", // Align text to start
    marginBottom: 14, // Spacing
  },
  valueText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
    flexWrap: "wrap", // Allow text to wrap
  },
  noValueText: {
    color: "#777",
    fontStyle: "italic",
    fontFamily: "Mont-Regular",
  },
  flagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  flagText: {
    fontSize: 18,
    marginRight: 5,
  },
  actionButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  sectionTitleLink: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 15,
    textDecorationLine: "underline",
    fontFamily: "Mont-Bold",
  },
  sectionContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: 5,
    fontFamily: "Mont-Bold",
  },
  sectionContent: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
    fontFamily: "Mont-Regular",
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1, // Added border for consistency
    borderColor: "#0EB3EB", // Border color from doctor profile
  },
  certificateImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  emptyImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyImageText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontFamily: "Mont-Regular",
  },
  imageLoadingIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
  },
  avatarLoadingIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 60, // Half of 120 width/height
  },
  fullScreenImageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "95%",
    height: "95%",
  },
  closeImageModalButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 1,
  },
});

export default Profile;