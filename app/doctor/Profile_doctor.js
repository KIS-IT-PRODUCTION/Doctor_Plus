import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Platform,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const { width } = Dimensions.get("window");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  let token;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert(
        "Помилка",
        "Не вдалося отримати токен для push-сповіщень! Перевірте дозволи в налаштуваннях вашого пристрою."
      );
      console.error("Failed to get push token for push notification: Permissions not granted!");
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "e2619b61-6ef5-4958-90bc-a400bbc8c50a",
        })
      ).data;
      console.log("Expo Push Token obtained:", token);
    } catch (e) {
      let errorMessage = 'Unknown error';
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === 'string') {
        errorMessage = e;
      } else if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
      }
      console.error("Error getting Expo push token:", errorMessage, e);
      Alert.alert("Помилка", `Не вдалося отримати токен сповіщень: ${errorMessage}. Перевірте підключення.`);
      return;
    }
  } else {
    Alert.alert("Помилка", "Push-сповіщення працюють лише на фізичних пристроях!");
    console.log("Must use physical device for Push Notifications");
    return;
  }

  if (token && userId) {
    const { data, error } = await supabase
      .from("profile_doctor")
      .update({ notification_token: token })
      .eq("user_id", userId);

    if (error) {
      console.error("Error saving notification token to Supabase:", error.message);
      Alert.alert('Помилка', `Не вдалося зберегти токен сповіщень: ${error.message}`);
    } else {
      console.log("Notification token saved successfully for doctor user_id:", userId);
      console.log("Saved token:", token);
    }
  }

  return token;
}

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

const Profile_doctor = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const doctorId = route.params?.doctorId ? String(route.params.doctorId) : null;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [loadingDiploma, setLoadingDiploma] = useState(true);

  const [avatarError, setAvatarError] = useState(false);
  const [certificateError, setCertificateError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  useEffect(() => {
    const getDoctorSession = async () => {
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();
      if (sessionError) {
        console.error("Error getting doctor user session:", sessionError.message);
        return;
      }
      if (user) {
        setCurrentDoctorUserId(user.id);
        console.log("Profile_doctor: Current logged-in user ID:", user.id);
      } else {
        console.log("Profile_doctor: No doctor user session found.");
      }
    };
    getDoctorSession();
  }, []);

  useEffect(() => {
    if (currentDoctorUserId) {
      console.log("Profile_doctor: Registering for push notifications...");
      registerForPushNotificationsAsync(currentDoctorUserId);
    }
  }, [currentDoctorUserId]);

  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!currentDoctorUserId) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const { count, error: countError } = await supabase
        .from("doctor_notifications")
        .select("id", { count: "exact" })
        .eq("doctor_id", currentDoctorUserId)
        .eq("is_read", false);

      if (countError) {
        console.error(
          "Error fetching unread notifications count:",
          countError.message
        );
        setUnreadNotificationsCount(0);
      } else {
        setUnreadNotificationsCount(count || 0);
        console.log(`Unread notifications count for ${currentDoctorUserId}: ${count}`);
      }
    } catch (err) {
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      console.error(
        "Unexpected error fetching unread notifications count:",
        errorMessage, err
      );
      setUnreadNotificationsCount(0);
    }
  }, [currentDoctorUserId]);

  useEffect(() => {
    fetchUnreadNotificationsCount();
  }, [currentDoctorUserId, fetchUnreadNotificationsCount]);

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

    const idToFetch = doctorId || currentDoctorUserId;

    if (!idToFetch) {
      console.warn("Profile_doctor: No doctor ID available to fetch data.");
      setError(t("doctor_id_missing"));
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("anketa_doctor")
        .select("*, diploma_url, certificate_photo_url, consultation_cost, experience_years")
        .eq("user_id", idToFetch)
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
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      console.error("Unexpected error during data fetch:", errorMessage, err);
      setError(`${t("unexpected_error")}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentDoctorUserId, t]);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

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
    const targetDoctorId = doctorId || currentDoctorUserId;

    if (targetDoctorId) {
      navigation.navigate("ConsultationTime", { doctorId: targetDoctorId });
    } else {
      Alert.alert(t("error"), t("doctor_id_missing_for_consultation"));
    }
  };

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "" },
    { nameKey: "ukrainian", code: "uk", emoji: "" },
  ];

  const getParsedArray = useCallback((value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value;
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      let errorMessage = 'Invalid JSON format';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      console.warn("Warning: Invalid JSON format for array (expected array or parsable JSON string):", value, errorMessage, err);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctorData();
    await fetchUnreadNotificationsCount();
    setRefreshing(false);
  }, [fetchDoctorData, fetchUnreadNotificationsCount]);

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
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Messege")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="white"
          />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationNumber}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0EB3EB"]}
            tintColor={"#0EB3EB"}
          />
        }
      >
        <View style={styles.doctorMainInfo}>
          {avatar_url && !avatarError ? (
            <View style={styles.avatarContainer}>
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
            </View>
          ) : (
            <Image
              source={{
                uri: "https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo",
              }}
              style={styles.avatar}
            />
          )}

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
          <Ionicons name="time-outline" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>
            {t("choose_consultation_time")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleProfileDoctorSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>
            {t("profile_doctor_settings")}
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
            <Text style={styles.noImageText}>{t("no_certificate_photo")}</Text>
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
            <Text style={styles.noImageText}>{t("no_diploma_photo")}</Text>
          )}
        </View>
      </ScrollView>

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
  notificationButton: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: "rgba(14, 179, 235, 0.69)",
    borderRadius: width * 0.06,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 10,
    backgroundColor: "#E04D53",
    borderRadius: 1000,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: 10,
    fontFamily: "Mont-Bold",
  },
  scrollViewContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  doctorMainInfo: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarLoadingIndicator: {
    position: "absolute",
  },
  doctorDetails: {
    width: "100%",
    paddingHorizontal: 10,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#000000",
    fontFamily: "Mont-Bold",
  },
  infoRowDynamic: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
  },
  label: {
    fontSize: 16,
    color: "#555",
    fontFamily: "Mont-SemiBold",
  },
  valueBox: {
    flexShrink: 1,
  },
  valueText: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
    fontFamily: "Mont-Regular",
  },
  noValueText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    fontFamily: "Mont-Regular",
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  flagText: {
    fontSize: 18,
    marginLeft: 5,
  },
  actionButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: 20,
    flexDirection: "row", // Додайте це для горизонтального вирівнювання іконки та тексту
    justifyContent: "center", // Центрування вмісту
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
    marginLeft: 5, // Додайте відступ між іконкою та текстом
  },
  buttonIcon: {
  },
  sectionTitleLink: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0EB3EB",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 15,
    fontFamily: "Mont-Bold",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    fontFamily: "Mont-SemiBold",
  },
  sectionContent: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    fontFamily: "Mont-Regular",
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  certificateImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageLoadingIndicator: {
    position: "absolute",
  },
  noImageText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "Mont-Regular",
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
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000000",
    fontFamily: "Mont-Bold",
  },
  modalScrollView: {
    maxHeight: 200,
    width: "100%",
  },
  languageOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
    alignItems: "center",
  },
  languageOptionText: {
    fontSize: 18,
    color: "#333",
    fontFamily: "Mont-Regular",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
  },
  buttonClose: {
    backgroundColor: "#0EB3EB",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Profile_doctor;