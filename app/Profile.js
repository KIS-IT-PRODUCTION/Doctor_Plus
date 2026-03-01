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
  Modal,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import Icon from "../assets/icon.svg";

// ВАЖЛИВО: npm install react-native-image-zoom-viewer
import ImageViewer from "react-native-image-zoom-viewer";

// ---
// ### Утиліти
// ---

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const COUNTRY_FLAGS_MAP = {
  "EN": "🇬🇧",
  "UK": "🇺🇦",
};


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

const LanguageFlags = ({ languages }) => {
  const { t } = useTranslation();
  const getFlag = (code) => COUNTRY_FLAGS_MAP[String(code).toUpperCase()] || "❓";

  if (!languages || languages.length === 0) {
    return <Text style={[styles.valueText, styles.noValueText]}>{t("not_specified")}</Text>;
  }

  const flagsToDisplay = languages.filter(
    (langCode) => COUNTRY_FLAGS_MAP[String(langCode).toUpperCase()]
  );

  if (flagsToDisplay.length === 0) {
    return <Text style={[styles.valueText, styles.noValueText]}>{t("not_specified")}</Text>;
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

  // Лоадери фото (для аватара)
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  // Viewer
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageUrls, setCurrentImageUrls] = useState([]);
  const [startImageIndex, setStartImageIndex] = useState(0);

  // --- Утиліта для отримання масиву URL ---
  // Вона розпізнає і JSON-масиви, і звичайні рядки
  const extractImageUrls = useCallback((data) => {
    if (!data) return [];
    
    // Якщо це масив (хоча з Supabase приходить string/json)
    if (Array.isArray(data)) return data.filter(url => typeof url === 'string' && url.includes('http'));

    try {
      // Спробуємо розпарсити JSON
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(url => typeof url === 'string' && url.includes('http'));
      }
    } catch (e) {
      // Якщо це не JSON, а просто рядок URL
      if (typeof data === 'string' && data.includes('http')) {
        return [data];
      }
    }
    return [];
  }, []);

  // --- Форматування ---
  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
      }
      return `${years} ${t("years_experience")}`; 
    },
    [t]
  );

  // --- Завантаження даних ---
  const fetchDoctorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDoctor(null);

    if (!doctorId) {
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
        if (fetchError.code === "PGRST116") {
          setError(t("doctor_not_found"));
        } else {
          setError(`${t("error_fetching_doctor_data")}: ${fetchError.message}`);
        }
      } else {
        setDoctor(data);
        setLoadingAvatar(true);
        setAvatarError(false);
      }
    } catch (err) {
      setError(`${t("unexpected_error")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  const handleBackPress = () => navigation.goBack();

  const handleChooseConsultationTime = () => {
    if (doctorId) {
      navigation.navigate("ConsultationTimePatient", { doctorId: doctorId });
    } else {
      Alert.alert(t("error"), t("doctor_id_missing_for_consultation"));
    }
  };

  const getParsedArray = useCallback((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, []);

  const processCommunicationLanguages = useCallback(
    (languagesData) => {
      const parsed = getParsedArray(languagesData);
      return parsed.map((lang) => String(lang.code || lang).toUpperCase());
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
        return mappedSpecs.length > 0 ? mappedSpecs.join(", ") : parsedSpecs.join(", ");
      }
      return t("not_specified");
    },
    [getParsedArray, t]
  );

  // --- Відкриття Viewer ---
  const openImageViewer = (urls, startIndex = 0) => {
    if (urls && urls.length > 0) {
      const formattedUrls = urls.map(url => ({ url }));
      setCurrentImageUrls(formattedUrls);
      setStartImageIndex(startIndex);
      setIsImageViewerVisible(true);
    }
  };

  // --- Компонент для секції з документами (Галерея) ---
  const DocumentSection = ({ title, data, placeholder }) => {
    const urls = extractImageUrls(data);

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {urls.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
            {urls.map((url, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.imageWrapper}
                onPress={() => openImageViewer(urls, index)}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.certificateImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyImage}>
            <Ionicons name="image-outline" size={moderateScale(60)} color="#A7D9EE" />
            <Text style={styles.emptyImageText}>{placeholder}</Text>
          </View>
        )}
      </View>
    );
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchDoctorData}>
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backToHomeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!doctor) return null;

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
          
          {/* АВАТАР */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => !avatarError && avatar_url && openImageViewer([avatar_url])}
            disabled={!avatar_url}
          >
            {avatar_url && !avatarError ? (
              <>
                {loadingAvatar && (
                  <ActivityIndicator size="large" color="#0EB3EB" style={styles.avatarLoadingIndicator} />
                )}
                <Image
                  source={{ uri: avatar_url }}
                  style={styles.avatar}
                  onLoadEnd={() => setLoadingAvatar(false)}
                  onError={() => {
                    setLoadingAvatar(false);
                    setAvatarError(true);
                  }}
                />
              </>
            ) : (
              <View style={styles.emptyAvatar}>
                <Ionicons name="person-circle-outline" size={moderateScale(80)} color="#3498DB" />
                <Text style={styles.emptyAvatarText}>{t("no_photo")}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.doctorName}>{full_name || t("not_specified")}</Text>
          <Text style={styles.inputLabel}>{t("country")}</Text>
          <ValueBox>{country || t("not_specified")}</ValueBox>
          <Text style={styles.inputLabel}>{t("communication_language")}</Text>
          <ValueBox isTextValue={false}>
            <LanguageFlags languages={processCommunicationLanguages(communication_languages)} />
          </ValueBox>
          <Text style={styles.inputLabel}>{t("specialization")}</Text>
          <ValueBox>{getSpecializations(specialization)}</ValueBox>
          <Text style={styles.inputLabel}>{t("work_experience")}</Text>
          <ValueBox>{experience_years ? `${experience_years} ${t("years_plural_genitive")}` : t("not_specified")}</ValueBox>
          <Text style={styles.inputLabel}>{t("work_location")}</Text>
          <ValueBox>{work_location || t("not_specified")}</ValueBox>
          <Text style={styles.inputLabel}>{t("consultation_cost")}</Text>
          <ValueBox>{consultation_cost ? `$${consultation_cost}` : t("not_specified")}</ValueBox>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleChooseConsultationTime}>
          <Text style={styles.actionButtonText}>{t("book_consultation")}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitleLink}>{t("more_about_doctor")}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("about_me")}</Text>
          <Text style={styles.sectionContent}>{about_me || t("not_specified")}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("achievements")}</Text>
          <Text style={styles.sectionContent}>{achievements || t("not_specified")}</Text>
        </View>

        {/* СЕРТИФІКАТИ (Галерея) */}
        <DocumentSection 
          title={t("certificate_photo")} 
          data={certificate_photo_url} 
          placeholder={t("no_certificate_photo")} 
        />

        {/* ДИПЛОМИ (Галерея) */}
        <DocumentSection 
          title={t("diploma_photo")} 
          data={diploma_url} 
          placeholder={t("no_diploma_photo")} 
        />

      </ScrollView>

      {/* MODAL Viewer */}
      <Modal 
        visible={isImageViewerVisible} 
        transparent={true} 
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <ImageViewer
          imageUrls={currentImageUrls}
          index={startImageIndex}
          enableSwipeDown={true}
          onSwipeDown={() => setIsImageViewerVisible(false)}
          loadingRender={() => <ActivityIndicator size="large" color="white" />}
          renderHeader={() => (
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={() => setIsImageViewerVisible(false)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      </Modal>

    </SafeAreaView>
  );
};

// --- Спеціалізації ---
const specializations = [
  { value: "general_practitioner", nameKey: "general_practitioner" },
  { value: "pediatrician", nameKey: "pediatrician" },
  { value: "therapist", nameKey: "therapist" },
  { value: "surgeon", nameKey: "surgeon" },
  { value: "cardiologist", nameKey: "cardiologist" },
  { value: "neurologist", nameKey: "neurologist" },
];

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, fontFamily: "Mont-Regular" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#ffebee" },
  errorText: { fontSize: 16, textAlign: "center", marginBottom: 15, fontFamily: "Mont-Regular" },
  retryButton: { backgroundColor: "#0EB3EB", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  retryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold", fontFamily: "Mont-Bold" },
  backToHomeButton: { backgroundColor: "#0EB3EB", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, marginTop: 20 },
  backToHomeButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold", fontFamily: "Mont-Bold" },
  noDoctorText: { fontSize: 18, textAlign: "center", marginTop: 50, fontFamily: "Mont-Regular" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 25, width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Mont-SemiBold", fontSize: 20, color: "#333" },
  scrollViewContent: { paddingHorizontal: 15, paddingBottom: 20 },
  doctorMainInfo: { backgroundColor: "#E3F2FD", borderRadius: 15, padding: 20, marginTop: 20, alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "#0EB3EB", backgroundColor: "#fff" },
  avatar: { width: "100%", height: "100%", borderRadius: 60, resizeMode: 'cover' },
  emptyAvatar: { width: "100%", height: "100%", borderRadius: 60, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  emptyAvatarText: { fontSize: 12, color: "#666", marginTop: 5, fontFamily: "Mont-Regular" },
  doctorName: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20, fontFamily: "Mont-Bold" },
  inputLabel: { fontSize: 14, alignSelf: "flex-start", color: "#2A2A2A", fontFamily: "Mont-Medium", paddingHorizontal: 15, marginTop: 10, marginBottom: 5, width: "100%" },
  displayValueContainer: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 20, paddingVertical: 15, paddingHorizontal: 20, width: "100%", minHeight: 52, justifyContent: "center", alignItems: "flex-start", marginBottom: 14 },
  valueText: { color: "black", fontSize: 16, fontFamily: "Mont-Medium", flexWrap: "wrap" },
  noValueText: { color: "#777", fontStyle: "italic", fontFamily: "Mont-Regular" },
  flagsContainer: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-start" },
  flagText: { fontSize: 18, marginRight: 5 },
  actionButton: { backgroundColor: "#0EB3EB", paddingVertical: 15, borderRadius: 25, alignItems: "center", marginTop: 20, marginHorizontal: 15, elevation: 2 },
  actionButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold", fontFamily: "Mont-Bold" },
  sectionTitleLink: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 25, marginBottom: 15, textDecorationLine: "underline", fontFamily: "Mont-Bold" },
  sectionContainer: { backgroundColor: "#E3F2FD", borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#CFD8DC", paddingBottom: 5, fontFamily: "Mont-Bold" },
  sectionContent: { fontSize: 14, lineHeight: 20, fontFamily: "Mont-Regular" },
  
  // Стилі для галереї
  galleryContent: { flexDirection: 'row', alignItems: 'center' },
  imageWrapper: { 
    width: moderateScale(280), // Фіксована ширина для слайду
    height: moderateScale(160), 
    borderRadius: 10, 
    marginTop: 10, 
    marginRight: 10,
    justifyContent: "center", 
    alignItems: "center", 
    overflow: "hidden", 
    borderWidth: 1, 
    borderColor: "#0EB3EB", 
    backgroundColor: "#fff" 
  },
  certificateImage: { width: "100%", height: "100%", resizeMode: "cover" },
  emptyImage: { width: "100%", height: 200, borderRadius: 10, marginTop: 10, backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  emptyImageText: { fontSize: 14, color: "#666", marginTop: 5, fontFamily: "Mont-Regular" },
  avatarLoadingIndicator: { position: "absolute", zIndex: 1 },
  logoContainer: {},
  imageViewerHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, right: 20, zIndex: 100 },
  imageViewerCloseButton: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});

export default Profile;