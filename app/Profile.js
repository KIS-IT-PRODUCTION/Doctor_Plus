import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
  Modal, StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import Icon from "../assets/icon.svg";

// ВАЖЛИВО: Встановіть цю бібліотеку: npm install react-native-image-zoom-viewer
import ImageViewer from "react-native-image-zoom-viewer";

// ---
// ### Утиліти та дані для прапорів та перекладу
// ---

const { width, height } = Dimensions.get("window"); // Оновлено: додано height

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size; // Використовуємо height для вертикального масштабування
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const COUNTRY_FLAGS_MAP = {
  "EN": "🇬🇧",
  "UK": "🇺🇦",
  "DE": "🇩🇪",
  "PL": "🇵🇱",
  "FR": "🇫🇷",
  "ES": "🇪🇸",
  "IT": "🇮🇹",
  "PT": "🇵🇹",
  "RU": "🇷🇺",
  "JP": "🇯🇵",
  "CN": "🇨🇳",
  "AR": "🇦🇪",
  "HI": "🇮🇳",
  "KO": "🇰🇷",
  "TR": "🇹🇷",
  "NL": "🇳🇱",
  "SE": "🇸🇪",
  "NO": "🇳🇴",
  "DK": "🇩🇰",
  "FI": "🇫🇮",
  "GR": "🇬🇷",
  "HE": "🇮🇱",
  "HU": "🇭🇺",
  "CZ": "🇨🇿",
  "SK": "🇸🇰",
  "RO": "🇷🇴",
  "BG": "🇧🇬",
  "HR": "🇭🇷",
  "SR": "🇷🇸",
  "LT": "🇱🇹",
  "LV": "🇱🇻",
  "EE": "🇪🇪",
  "AL": "🇦🇱",
  "AZ": "🇦🇿",
  "KA": "🇬🇪",
  "AM": "🇦🇲",
  "TH": "🇹🇭",
  "VN": "🇻🇳",
  "ID": "🇮🇩",
  "MS": "🇲🇾",
  "PH": "🇵🇭",
  "DA": "🇩🇰",
  "IS": "🇮🇸",
  "GA": "🇮🇪",
  "AF": "🇿🇦",
  "ZU": "🇿🇦",
  "XH": "🇿🇦",
  "SW": "🇰🇪",
  "AM": "🇪🇹",
  "SO": "🇸🇴",
  "HA": "🇳🇬",
  "YO": "🇳🇬",
  "IG": "🇳🇬",
  "WO": "🇸🇳",
  "RW": "🇷🇼",
  "SN": "🇸🇳",
  "UZ": "🇺🇿",
  "KK": "🇰🇿",
  "TG": "🇹🇯",
  "BN": "🇧🇩",
  "GU": "🇮🇳",
  "KN": "🇮🇳",
  "ML": "🇮🇳",
  "MR": "🇮🇳",
  "PA": "🇮🇳",
  "TA": "🇮🇳",
  "TE": "🇮🇳",
  "UR": "🇵🇰",
  "NE": "🇳🇵",
  "SI": "🇱🇰",
  "KM": "🇰🇭",
  "LO": "🇱🇦",
  "DZ": "🇧🇹",
  "MN": "🇲🇳",
  "MY": "🇲🇲",
  "UG": "🇺🇬",
  "RW": "🇷🇼",
  "RN": "🇧🇮",
  "NY": "🇲🇼",
  "MG": "🇲🇬",
  "GD": "🇬🇩",
  "HT": "🇭🇹",
  "FJ": "🇫🇯",
  "SM": "🇼🇸",
  "TO": "🇹🇴",
  "TL": "🇵🇭",
};

// ---
// ### Компонент ValueBox
// ---

const ValueBox = ({ children, isTextValue = true }) => {
  const { t } = useTranslation();

  const isEmpty =
    !children ||
    (typeof children === "string" && children.trim() === "") ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return (
      <View style={styles.displayValueContainer}>
        <Text style={[styles.valueText, styles.noValueText]}>
          {t("not_specified")}
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

// ---
// ### Оновлений компонент LanguageFlags
// ---

const LanguageFlags = ({ languages }) => {
  const { t } = useTranslation();

  const getFlag = (code) => {
    return COUNTRY_FLAGS_MAP[String(code).toUpperCase()] || "❓";
  };

  if (!languages || languages.length === 0) {
    return (
      <Text style={[styles.valueText, styles.noValueText]}>
        {t("not_specified")}
      </Text>
    );
  }

  const flagsToDisplay = languages.filter(
    (langCode) => COUNTRY_FLAGS_MAP[String(langCode).toUpperCase()]
  );

  if (flagsToDisplay.length === 0) {
    return (
      <Text style={[styles.valueText, styles.noValueText]}>
        {t("not_specified")}
      </Text>
    );
  }

  return (
    <View style={styles.flagsContainer}>
      {flagsToDisplay.map((langCode, index) => (
        <Text key={index} style={styles.flagText}>
          {getFlag(langCode)}
        </Text>
      ))}
    </View>
  );
};

// ---
// ### Основний компонент Profile
// ---

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

  // Новий стан для модального вікна перегляду зображень
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageUrls, setCurrentImageUrls] = useState([]);

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
      console.warn(
        "Warning: Invalid JSON format for array (expected array or parsable JSON string):",
        value,
        e
      );
      return [];
    }
  }, []);

  const processCommunicationLanguages = useCallback(
    (languagesData) => {
      const parsedLanguages = getParsedArray(languagesData);
      return parsedLanguages.map((lang) =>
        String(lang.code || lang).toUpperCase()
      );
    },
    [getParsedArray]
  );

  const getSpecializations = useCallback(
    (specializationData) => {
      const parsedSpecs = getParsedArray(specializationData);
      if (parsedSpecs.length > 0) {
        const mappedSpecs = specializations
          .filter((spec) => parsedSpecs.includes(spec.value))
          .map((spec) => t(spec.nameKey));
        return mappedSpecs.join(", ");
      }
      return t("not_specified");
    },
    [getParsedArray, t]
  );

  // Функція для відкриття модального вікна з зображенням
  const openImageViewer = (imageUrl) => {
    setCurrentImageUrls([{ url: imageUrl }]);
    setIsImageViewerVisible(true);
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
    country,
  } = doctor;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("profile")}</Text>
        <View style={styles.logoContainer}>
          <Icon width={moderateScale(50)} height={moderateScale(50)} />
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
                  size={moderateScale(80)}
                  color="#3498DB"
                />
                <Text style={styles.emptyAvatarText}>{t("no_photo")}</Text>
              </View>
            )}
          </View>

          <Text style={styles.doctorName}>
            {full_name || t("not_specified")}
          </Text>

          <Text style={styles.inputLabel}>{t("country")}</Text>
          <ValueBox>{country || t("not_specified")}</ValueBox>

          <Text style={styles.inputLabel}>{t("communication_language")}</Text>
          <ValueBox isTextValue={false}>
            <LanguageFlags
              languages={processCommunicationLanguages(communication_languages)}
            />
          </ValueBox>

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
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChooseConsultationTime}
        >
          <Text style={styles.actionButtonText}>
            {t("book_consultation")}
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
            <TouchableOpacity // Обгортаємо в TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => openImageViewer(certificate_photo_url)}
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
              <Ionicons
                name="image-outline"
                size={moderateScale(60)}
                color="#A7D9EE"
              />
              <Text style={styles.emptyImageText}>
                {t("no_certificate_photo")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
          {diploma_url && !diplomaError ? (
            <TouchableOpacity // Обгортаємо в TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => openImageViewer(diploma_url)}
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
              <Ionicons
                name="image-outline"
                size={moderateScale(60)}
                color="#A7D9EE"
              />
              <Text style={styles.emptyImageText}>{t("no_diploma_photo")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Модальне вікно для перегляду зображень */}
      <Modal visible={isImageViewerVisible} transparent={true}>
        <ImageViewer
          imageUrls={currentImageUrls}
          enableSwipeDown={true} // Дозволяє закривати свайпом вниз
          onSwipeDown={() => setIsImageViewerVisible(false)} // Обробник свайпу
          renderHeader={() => ( // Кастомний заголовок для кнопки закриття
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={() => setIsImageViewerVisible(false)}
              >
                <Ionicons name="close-circle" size={moderateScale(30)} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      </Modal>
    </SafeAreaView>
  );
};

// ---
// ### Статичні дані для спеціалізацій (для цього файлу)
// Цей список має бути повним, як у Search.js
// ---

const specializations = [
  { value: "general_practitioner", nameKey: "general_practitioner" },
  { value: "pediatrician", nameKey: "pediatrician" },
  { value: "cardiologist", nameKey: "cardiologist" },
  { value: "dermatologist", nameKey: "dermatologist" },
  { value: "neurologist", nameKey: "neurologist" },
  { value: "surgeon", nameKey: "surgeon" },
  { value: "psychiatrist", nameKey: "psychiatrist" },
  { value: "dentist", nameKey: "dentist" },
  { value: "ophthalmologist", nameKey: "ophthalmologist" },
  { value: "ent_specialist", nameKey: "categories.ent_specialist" },
  { value: "gastroenterologist", nameKey: "gastroenterologist" },
  { value: "endocrinologist", nameKey: "endocrinologist" },
  { value: "oncologist", nameKey: "oncologist" },
  { value: "allergist", nameKey: "allergist" },
  { value: "physiotherapist", nameKey: "physiotherapist" },
  { value: "traumatologist", nameKey: "traumatologist" },
  { value: "gynecologist", nameKey: "gynecologist" },
  { value: "urologist", nameKey: "urologist" },
  { value: "pulmonologist", nameKey: "pulmonologist" },
  { value: "nephrologist", nameKey: "nephrologist" },
  { value: "rheumatologist", nameKey: "rheumatologist" },
  { value: "infectiousDiseasesSpecialist", nameKey: "infectiousDiseasesSpecialist" },
  { value: "psychologist", nameKey: "psychologist" },
  { value: "nutritionist", nameKey: "nutritionist" },
  { value: "radiologist", nameKey: "radiologist" },
  { value: "anesthesiologist", nameKey: "anesthesiologist" },
  { value: "oncologist_radiation", nameKey: "oncologist_radiation" },
  { value: "endoscopy_specialist", nameKey: "endoscopy_specialist" },
  { value: "ultrasound_specialist", nameKey: "ultrasound_specialist" },
  { value: "laboratory_diagnostician", nameKey: "laboratory_diagnostician" },
  { value: "immunologist", nameKey: "immunologist" },
  { value: "genetics_specialist", nameKey: "genetics_specialist" },
  { value: "geriatrician", nameKey: "geriatrician" },
  { value: "toxicologist", nameKey: "toxicologist" },
  { value: "forensic_expert", nameKey: "forensic_expert" },
  { value: "epidemiologist", nameKey: "epidemiologist" },
  { value: "pathologist", nameKey: "pathologist" },
  { value: "rehabilitologist", nameKey: "rehabilitologist" },
  { value: "manual_therapist", nameKey: "manual_therapist" },
  { value: "chiropractor", nameKey: "chiropractor" },
  { value: "reflexologist", nameKey: "reflexologist" },
  { value: "massage_therapist", nameKey: "massage_therapist" },
  { value: "dietitian", nameKey: "dietitian" },
  { value: "sexologist", nameKey: "sexologist" },
  { value: "phlebologist", nameKey: "phlebologist" },
  { value: "mammologist", nameKey: "mammologist" },
  { value: "proctologist", nameKey: "proctologist" },
  { value: "andrologist", nameKey: "andrologist" },
  { value: "reproductive_specialist", nameKey: "reproductive_specialist" },
  { value: "transfusiologist", nameKey: "transfusiologist" },
  { value: "balneologist", nameKey: "balneologist" },
  { value: "infectious_disease_specialist_pediatric", nameKey: "infectious_disease_specialist_pediatric" },
  { value: "pediatric_gastroenterologist", nameKey: "pediatric_gastroenterologist" },
  { value: "pediatric_cardiologist", nameKey: "pediatric_cardiologist" },
  { value: "pediatric_neurologist", nameKey: "pediatric_neurologist" },
  { value: "pediatric_surgeon", nameKey: "pediatric_surgeon" },
  { value: "neonatologist", nameKey: "neonatologist" },
  { value: "speech_therapist", nameKey: "speech_therapist" },
  { value: "ergotherapist", nameKey: "ergotherapist" },
  { value: "osteopath", nameKey: "osteopath" },
  { value: "homeopath", nameKey: "homeopath" },
  { value: "acupuncturist", nameKey: "acupuncturist" },
];


// ---
// ### Стилі
// ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
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
    marginTop: moderateScale(10),
    fontSize: moderateScale(16),
    color: "#000000",
    fontFamily: "Mont-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
    backgroundColor: "#ffebee",
  },
  errorText: {
    fontSize: moderateScale(16),
    color: "#000000",
    textAlign: "center",
    marginBottom: moderateScale(15),
    fontFamily: "Mont-Regular",
  },
  retryButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  noDoctorText: {
    fontSize: moderateScale(18),
    textAlign: "center",
    color: "#000000",
    marginTop: moderateScale(50),
    fontFamily: "Mont-Regular",
  },
  backToHomeButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(25),
    borderRadius: moderateScale(25),
    marginTop: moderateScale(20),
  },
  backToHomeButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(25),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
    textAlign: "center",
    marginHorizontal: moderateScale(10),
    fontFamily: "Mont-Bold",
  },
  scrollViewContent: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  doctorMainInfo: {
    backgroundColor: "#E3F2FD",
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    marginTop: moderateScale(20),
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  avatarContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    marginBottom: moderateScale(15),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#0EB3EB",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(60),
  },
  emptyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(60),
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyAvatarText: {
    fontSize: moderateScale(12),
    color: "#666",
    marginTop: moderateScale(5),
    fontFamily: "Mont-Regular",
  },
  doctorDetails: {
    width: "100%",
  },
  doctorName: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: moderateScale(20),
    fontFamily: "Mont-Bold",
  },
  inputLabel: {
    fontSize: moderateScale(14),
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(5),
    width: "100%",
  },
  displayValueContainer: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    width: "100%",
    minHeight: moderateScale(52),
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: moderateScale(14),
  },
  valueText: {
    color: "black",
    fontSize: moderateScale(16),
    fontFamily: "Mont-Medium",
    flexWrap: "wrap",
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
    fontSize: moderateScale(18),
    marginRight: moderateScale(5),
  },
  actionButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(25),
    alignItems: "center",
    marginTop: moderateScale(20),
    marginHorizontal: moderateScale(15),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  sectionTitleLink: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginTop: moderateScale(25),
    marginBottom: moderateScale(15),
    textDecorationLine: "underline",
    fontFamily: "Mont-Bold",
  },
  sectionContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
  },
  sectionHeader: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#000000",
    marginBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: moderateScale(5),
    fontFamily: "Mont-Bold",
  },
  sectionContent: {
    fontSize: moderateScale(14),
    color: "#000000",
    lineHeight: moderateScale(20),
    fontFamily: "Mont-Regular",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 16 / 9, // Задаємо співвідношення сторін 16:9
    borderRadius: moderateScale(10),
    marginTop: moderateScale(10),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#0EB3EB",
  },
  certificateImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain", // Зображення вміщується в контейнер, зберігаючи пропорції
    borderRadius: moderateScale(10),
  },
  emptyImage: {
    width: "100%",
    height: moderateScale(200), // Залишимо мінімальну висоту для порожнього стану
    borderRadius: moderateScale(10),
    marginTop: moderateScale(10),
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyImageText: {
    fontSize: moderateScale(14),
    color: "#666",
    marginTop: moderateScale(5),
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
    borderRadius: moderateScale(10),
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
    borderRadius: moderateScale(60),
  },
  logoContainer: {
    // Стилі для контейнера вашого логотипу, якщо потрібно
  },
  // Стилі для модального вікна перегляду зображень
  imageViewerHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? moderateScale(50) : moderateScale(20),
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'flex-end',
    paddingHorizontal: moderateScale(20),
  },
  imageViewerCloseButton: {
    padding: moderateScale(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: moderateScale(20),
  },
});

export default Profile;