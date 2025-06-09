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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";

// Reusable component for displaying values in a styled box
const ValueBox = ({ children }) => {
  const isEmpty =
    !children ||
    (typeof children === "string" && children.trim() === "") ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return (
      <Text style={[styles.value, styles.noValueText]}>Not specified</Text>
    );
  }
  return (
    <View style={styles.valueBox}>
      {typeof children === "string" ? (
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

  const doctorId = route.params?.doctorId ? String(route.params.doctorId) : null;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [loadingDiploma, setLoadingDiploma] = useState(true);

  const [avatarError, setAvatarError] = useState(false);
  const [certificateError, setCertificateError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  const formatYearsText = useCallback((years) => {
    if (years === null || years === undefined || isNaN(years) || years < 0) {
      return t("not_specified");
    }
    return t("years_experience", { count: years });
  }, [t]);

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
        .select("*, diploma_url, certificate_photo_url, consultation_cost, experience_years")
        .eq("user_id", doctorId)
        .single();

      if (fetchError) {
        console.error("Error fetching doctor data from Supabase:", fetchError);
        if (fetchError.code === "PGRST116") {
             setError(t("doctor_not_found"));
        } else {
             setError(`${t("error_fetching_doctor_data")}: ${fetchError.message}`);
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
      navigation.navigate("ConsultationTimePatient", { doctorId: doctorId });
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
      console.warn("Warning: Invalid JSON format for array (expected array or parsable JSON string):", value, e);
      return [];
    }
  }, []);

  const getLanguages = useCallback((languagesData) => {
    return getParsedArray(languagesData).map((lang) => String(lang).toUpperCase());
  }, [getParsedArray]);

  const getSpecializations = useCallback((specializationData) => {
    const parsedSpecs = getParsedArray(specializationData);
    if (parsedSpecs.length > 0) {
      if (typeof parsedSpecs[0] === 'string') {
        return parsedSpecs.map(specValue => t(`categories.${specValue}`)).join(", ");
      } else if (typeof parsedSpecs[0] === 'object' && parsedSpecs[0].nameKey) {
        return parsedSpecs.map(specObj => t(`categories.${specObj.nameKey}`)).join(", ");
      }
    }
    return t("not_specified");
  }, [getParsedArray, t]);

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
  } = doctor;

  return (
    <View style={styles.container}>
      {/* Header for patient view */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("profile")}</Text>

        <View style={{ width: 48 }} />
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
                <Ionicons name="person-circle-outline" size={80} color="#3498DB" />
                <Text style={styles.emptyAvatarText}>{t("no_photo")}</Text>
              </View>
            )}
          </View>

          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{full_name || t("not_specified")}</Text>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("rating")}:</Text>
              <ValueBox>🌟🌟</ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("communication_language")}:</Text>
              <ValueBox>
                <LanguageFlags languages={getLanguages(communication_languages)} />
              </ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("specialization")}:</Text>
              <ValueBox>{getSpecializations(specialization)}</ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("work_experience")}:</Text>
              <ValueBox>
                {formatYearsText(experience_years)}
              </ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("work_location")}:</Text>
              <ValueBox>{work_location || t("not_specified")}</ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("consultation_cost")}:</Text>
              <ValueBox>
                {consultation_cost ? `$${consultation_cost}` : t("not_specified")}
              </ValueBox>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChooseConsultationTime}
        >
          <Text style={styles.actionButtonText}>
            {t("choose_consultation_time")}
          </Text>
        </TouchableOpacity>

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
            <View style={styles.imageWrapper}>
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
                  console.error("Error loading certificate image:", certificate_photo_url);
                }}
              />
            </View>
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons name="image-outline" size={60} color="#A7D9EE" />
              <Text style={styles.emptyImageText}>{t("no_certificate_photo")}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
          {diploma_url && !diplomaError ? (
            <View style={styles.imageWrapper}>
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
            </View>
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons name="image-outline" size={60} color="#A7D9EE" />
              <Text style={styles.emptyImageText}>{t("no_diploma_photo")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingTop: 50,
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
    backgroundColor: "#E3F2FD",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  avatarContainer: {
    width: 115,
    height: 115,
    borderRadius: 50,
    marginBottom: 15,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden', // Ensures content stays within bounds
  },
  avatar: {
    width: 115,
    height: 115,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#3498DB",
  },
  emptyAvatar: {
    width: 115,
    height: 115,
    borderRadius: 50,
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
    marginBottom: 10,
    fontFamily: "Mont-Bold",
  },
  infoRowDynamic: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: 8,
  },
  label: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
    fontFamily: "Mont-Regular",
    marginBottom: 5,
  },
  valueBox: {
    backgroundColor: "#D1E8F6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "stretch",
  },
  valueText: {
    fontSize: 15,
    color: "#000000",
    fontFamily: "Mont-Medium",
    textAlign: "left",
  },
  noValueText: {
    color: "#777",
    fontStyle: "italic",
    fontFamily: "Mont-Regular",
    paddingTop: 0,
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
  },
  certificateImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  noImageText: {
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
    fontFamily: "Mont-Regular",
    color: "#000000",
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
    borderRadius: 50,
  },
});

export default Profile;