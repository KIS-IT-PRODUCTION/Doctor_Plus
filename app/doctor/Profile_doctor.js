import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator, // Імпортуємо ActivityIndicator для індикатора завантаження
  Modal, // Імпортуємо Modal для модального вікна
  Pressable, // Імпортуємо Pressable для фону модального вікна
  TouchableWithoutFeedback, // Імпортуємо TouchableWithoutFeedback для закриття модального вікна при натисканні поза ним
  Dimensions, // Для отримання розмірів екрану
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg"; // Переконайтеся, що шлях до SVG іконки правильний
import { useTranslation } from "react-i18next"; // Імпорт для перекладів
import { supabase } from "../../providers/supabaseClient"; // Ваш клієнт Supabase

// Reusable component for displaying values in a styled box
const ValueBox = ({ children }) => {
  if (!children || (typeof children === "string" && children.trim() === "")) {
    return (
      <Text style={[styles.value, styles.noValueText]}>Not specified</Text>
    );
  }
  return (
    <View style={styles.valueBox}>
      {typeof children === "string" ? (
        <Text style={styles.valueText}>{children}</Text>
      ) : (
        children // Render React elements directly if not a string
      )}
    </View>
  );
};

// Функція для відображення прапорів мов
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
    }
  };

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

const Profile_doctor = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const doctorId = route.params?.doctorId;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );
  // СТАНІ ДЛЯ ЗАВАНТАЖЕННЯ ЗОБРАЖЕНЬ
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [loadingDiploma, setLoadingDiploma] = useState(true);

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      setError(null);

      if (!doctorId) {
        console.warn(
          "Profile_doctor: doctorId is undefined, cannot fetch data."
        );
        setError(t("doctor_id_missing"));
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("anketa_doctor")
          .select("*, diploma_url, certificate_photo_url, consultation_cost")
          .eq("user_id", doctorId)
          .single();

        if (fetchError) {
          console.error("Error fetching doctor data:", fetchError);
          setError(t("error_fetching_doctor_data") + ": " + fetchError.message);
        } else {
          setDoctor(data);
          setLoadingAvatar(true);
          setLoadingCertificate(true);
          setLoadingDiploma(true);
        }
      } catch (err) {
        console.error("Unexpected error fetching doctor data:", err);
        setError(t("unexpected_error") + ": " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId, t]);

  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const handleProfileDoctorSettingsPress = () => {
    navigation.navigate("Anketa_Settings");
  };

  const handleChooseConsultationTime = () => {
    navigation.navigate("ConsultationTime", { doctorId: doctorId });
  };

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
    { nameKey: "polish", code: "pl", emoji: "🇵🇱" },
    { nameKey: "german", code: "de", emoji: "🇩🇪" },
    { nameKey: "french", code: "fr", emoji: "🇫🇷" },
    { nameKey: "spanish", code: "es", emoji: "🇪🇸" },
  ];

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
          onPress={() => {
            setLoading(true);
            setError(null);
          }}
        >
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
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

  const getLanguages = (languagesString) => {
    try {
      const languagesArray = JSON.parse(languagesString || "[]");
      return languagesArray.map((lang) => lang.toUpperCase());
    } catch (e) {
      console.error("Error parsing languages:", e);
      return [];
    }
  };

  const getSpecializations = (specializationString) => {
    try {
      const specializationsArray = JSON.parse(specializationString || "[]");
      return specializationsArray.join(", ");
    } catch (e) {
      console.error("Error parsing specializations:", e);
      return "";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.languageSelectButton}
          onPress={openLanguageModal}
        >
          <View style={styles.languageButtonContent}>
            <Text style={styles.languageButtonText}>
              {displayedLanguageCode}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("profile_doctor")}</Text>
        <View style={styles.rightIcon}>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        {/* Основна інформація про лікаря */}
        <View style={styles.doctorMainInfo}>
          {doctor.avatar_url ? (
            // Контейнер для аватару та його індикатора
            <View style={styles.avatarContainer}>
              {loadingAvatar && (
                <ActivityIndicator
                  size="large"
                  color="#0EB3EB"
                  style={styles.avatarLoadingIndicator}
                />
              )}
              <Image
                source={{ uri: doctor.avatar_url }}
                style={styles.avatar}
                onLoad={() => setLoadingAvatar(false)}
                onError={() => {
                  setLoadingAvatar(false);
                  console.error("Error loading avatar image");
                }}
              />
            </View>
          ) : (
            // Якщо немає аватару, показуємо заглушку
            <Image
              source={{
                uri: "https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo",
              }}
              style={styles.avatar}
            />
          )}

          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.full_name}</Text>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("rating")}:</Text>
              <ValueBox>🌟🌟</ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("communication_language")}:</Text>
              <ValueBox>
                <LanguageFlags
                  languages={getLanguages(doctor.communication_languages)}
                />
              </ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("specialization")}:</Text>
              <ValueBox>{getSpecializations(doctor.specialization)}</ValueBox>
            </View>

            {/* Досягнення прибрано з основної картки */}
            {/* <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("achievements")}:</Text>
              <ValueBox>{doctor.achievements || t("not_specified")}</ValueBox>
            </View> */}

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("work_experience")}:</Text>
              <ValueBox>
                {doctor.work_experience || t("not_specified")}
              </ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("work_location")}:</Text>
              <ValueBox>{doctor.work_location || t("not_specified")}</ValueBox>
            </View>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("consultation_cost")}:</Text>
              <ValueBox>
                {doctor.consultation_cost
                  ? `${doctor.consultation_cost}$`
                  : t("not_specified")}
              </ValueBox>
            </View>
          </View>
        </View>

        {/* Кнопки дій */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChooseConsultationTime}
        >
          <Text style={styles.actionButtonText}>
            {t("choose_consultation_time")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleProfileDoctorSettingsPress}
        >
          <Text style={styles.actionButtonText}>
            {t("profile_doctor_settings")}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitleLink}>{t("more_about_doctor")}</Text>

        {/* Секція "Про себе" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("about_me")}</Text>
          <Text style={styles.sectionContent}>
            {doctor.about_me || t("not_specified")}
          </Text>
        </View>
        {/* Секція "Досягнення" - залишилася тут */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("achievements")}</Text>
          <Text style={styles.sectionContent}>
            {doctor.achievements || t("not_specified")}
          </Text>
        </View>

        {/* Секція "Місце роботи" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("place_of_work")}</Text>
          <Text style={styles.sectionContent}>
            {doctor.work_location || t("not_specified")}
          </Text>
        </View>
        {/* Секція "Фото сертифіката" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("certificate_photo")}</Text>
          {doctor.certificate_photo_url ? (
            <View style={styles.imageWrapper}>
              {loadingCertificate && (
                <ActivityIndicator
                  size="small"
                  color="#0EB3EB"
                  style={styles.imageLoadingIndicator}
                />
              )}
              <Image
                source={{ uri: doctor.certificate_photo_url }}
                style={styles.certificateImage}
                onLoad={() => setLoadingCertificate(false)}
                onError={() => {
                  setLoadingCertificate(false);
                  console.error("Error loading certificate image");
                }}
              />
            </View>
          ) : (
            <Text style={styles.noImageText}>{t("no_certificate_photo")}</Text>
          )}
        </View>

        {/* Секція: "Фото диплома" */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
          {doctor.diploma_url ? (
            <View style={styles.imageWrapper}>
              {loadingDiploma && (
                <ActivityIndicator
                  size="small"
                  color="#0EB3EB"
                  style={styles.imageLoadingIndicator}
                />
              )}
              <Image
                source={{ uri: doctor.diploma_url }}
                style={styles.certificateImage}
                onLoad={() => setLoadingDiploma(false)}
                onError={() => {
                  setLoadingDiploma(false);
                  console.error("Error loading diploma image");
                }}
              />
            </View>
          ) : (
            <Text style={styles.noImageText}>{t("no_diploma_photo")}</Text>
          )}
        </View>
      </ScrollView>

      {/* Модальне вікно для вибору мови */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLanguageModalVisible}
        onRequestClose={closeLanguageModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeLanguageModal}>
          <TouchableWithoutFeedback>
            <View style={styles.languageModalContent}>
              <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
              <ScrollView style={styles.modalScrollView}>
                {languagesForModal.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.languageOption}
                    onPress={() => handleLanguageSelect(item.code)}
                  >
                    <Text style={styles.languageOptionText}>
                      {item.emoji} {t(item.nameKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeLanguageModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
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
  languageSelectButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
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
  rightIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
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
  },
  avatar: {
    width: 115,
    height: 115,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#3498DB",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000000",
    fontFamily: "Mont-Bold",
  },
  modalScrollView: {
    maxHeight: Dimensions.get("window").height * 0.5,
    width: "100%",
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#000000",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    backgroundColor: "#2196F3",
  },
  buttonClose: {},
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Mont-Bold",
  },
});

export default Profile_doctor;
