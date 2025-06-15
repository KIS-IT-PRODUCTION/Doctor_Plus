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
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

// Вмикаємо LayoutAnimation для Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
      console.error(
        "Failed to get push token for push notification: Permissions not granted!"
      );
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
      let errorMessage = "Unknown error";
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === "string") {
        errorMessage = e;
      } else if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof e.message === "string"
      ) {
        errorMessage = e.message;
      }
      console.error("Error getting Expo push token:", errorMessage, e);
      Alert.alert(
        "Помилка",
        `Не вдалося отримати токен сповіщень: ${errorMessage}. Перевірте підключення.`
      );
      return;
    }
  } else {
    Alert.alert(
      "Помилка",
      "Push-сповіщення працюють лише на фізичних пристроях!"
    );
    console.log("Must use physical device for Push Notifications");
    return;
  }

  if (token && userId) {
    const { data, error } = await supabase
      .from("profile_doctor")
      .update({ notification_token: token })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "Error saving notification token to Supabase:",
        error.message
      );
      Alert.alert("Помилка", `Не вдалося зберегти токен сповіщень: ${error.message}`);
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
    return <Text style={[styles.value, styles.noValueText]}>Not specified</Text>;
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

  const doctorIdRef = useRef(
    route.params?.doctorId ? String(route.params.doctorId) : null
  );

  const [doctor, setDoctor] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
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

  const [refreshing, setRefreshing] = useState(false); // Для RefreshControl

  // Для відстеження, чи була вже спроба завантаження даних для поточного ID сесії
  const hasFetchedDataForSessionId = useRef(false);

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  // Отримуємо user session один раз при монтуванні або при фокусі екрану,
  useFocusEffect(
    useCallback(() => {
      console.log("Profile_doctor: useFocusEffect triggered. Fetching user session.");
      const getDoctorSession = async () => {
        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (sessionError) {
          console.error("Error getting doctor user session:", sessionError.message);
          setError(t("session_error") + sessionError.message);
          setLoadingInitial(false);
          setCurrentDoctorUserId(null);
          return;
        }

        if (user) {
          console.log("Profile_doctor: Current logged-in user ID:", user.id);
          if (currentDoctorUserId !== user.id) {
            setCurrentDoctorUserId(user.id);
            hasFetchedDataForSessionId.current = false;
          }
          if (!doctorIdRef.current) {
            doctorIdRef.current = user.id;
          }
        } else {
          console.log("Profile_doctor: No doctor user session found.");
          if (!doctorIdRef.current) {
            setError(t("doctor_id_missing"));
            setLoadingInitial(false);
            setCurrentDoctorUserId(null);
          }
        }
      };
      getDoctorSession();
    }, [t, currentDoctorUserId])
  );

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
        console.log(
          `Unread notifications count for ${currentDoctorUserId}: ${count}`
        );
      }
    } catch (err) {
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        errorMessage = err.message;
      }
      console.error(
        "Unexpected error fetching unread notifications count:",
        errorMessage,
        err
      );
      setUnreadNotificationsCount(0);
    }
  }, [currentDoctorUserId]);

  useEffect(() => {
    fetchUnreadNotificationsCount();
  }, [currentDoctorUserId, fetchUnreadNotificationsCount]);

  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
      }
      return t("years_experience", { count: years });
    },
    [t]
  );

  // Функція для завантаження даних доктора, використовується для початкового завантаження та оновлення
  const fetchDoctorData = useCallback(
    async (idToFetch) => {
      if (!idToFetch) {
        console.warn(
          "Profile_doctor: No doctor ID available to fetch data in fetchDoctorData."
        );
        setError(t("doctor_id_missing"));
        setLoadingInitial(false); // Забезпечуємо, що індикатор зникне, якщо ID немає
        return;
      }

      // Використовуємо LayoutAnimation для плавних змін у UI
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setDoctor(null);
      setLoadingAvatar(true);
      setLoadingCertificate(true);
      setLoadingDiploma(true);
      setAvatarError(false);
      setCertificateError(false);
      setDiplomaError(false);
      setError(null);

      // Встановлюємо loadingInitial на TRUE ПЕРЕД початком запиту, якщо це НЕ pull-to-refresh
      if (!refreshing) {
        console.log(
          `Profile_doctor: Setting loadingInitial to TRUE for ID: ${idToFetch}`
        );
        setLoadingInitial(true);
      }

      console.log(`Profile_doctor: Fetching data for doctor ID: ${idToFetch}`);

      try {
        const { data, error: fetchError } = await supabase
          .from("anketa_doctor")
          .select(
            "*, diploma_url, certificate_photo_url, consultation_cost, experience_years"
          )
          .eq("user_id", idToFetch)
          .single();

        if (fetchError) {
          console.error("Error fetching doctor data from Supabase:", fetchError);
          if (fetchError.code === "PGRST116") {
            setError(t("doctor_not_found"));
          } else {
            setError(`${t("error_fetching_doctor_data")}: ${fetchError.message}`);
          }
          setDoctor(null);
        } else {
          setDoctor(data);
          console.log("Profile_doctor: Doctor data fetched successfully.");
        }
      } catch (err) {
        let errorMessage = "Unknown error";
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        } else if (
          typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof err.message === "string"
        ) {
          errorMessage = err.message;
        }
        console.error("Unexpected error during data fetch:", errorMessage, err);
        setError(`${t("unexpected_error")}: ${errorMessage}`);
        setDoctor(null);
      } finally {
        console.log(
          `Profile_doctor: Setting loadingInitial to FALSE for ID: ${idToFetch}`
        );
        setLoadingInitial(false);
        setRefreshing(false); // Завжди зупиняємо індикатор оновлення
      }
    },
    [t, refreshing] // Додаємо refreshing до залежностей
  );

  // Цей useEffect буде викликати fetchDoctorData, коли doctorIdRef.current або currentDoctorUserId зміниться
  useEffect(() => {
    const finalIdToFetch = doctorIdRef.current || currentDoctorUserId;
    console.log(
      "Profile_doctor: Main data fetch useEffect triggered. finalIdToFetch:",
      finalIdToFetch
    );

    if (finalIdToFetch && !hasFetchedDataForSessionId.current) {
      console.log(
        `Profile_doctor: Initiating fetchDoctorData for finalIdToFetch: ${finalIdToFetch}`
      );
      fetchDoctorData(finalIdToFetch);
      hasFetchedDataForSessionId.current = true; // Встановлюємо, що завантаження почалося
    } else if (!finalIdToFetch) {
      setLoadingInitial(false); // Якщо немає ID, то завантаження завершено
    } else if (finalIdToFetch && hasFetchedDataForSessionId.current) {
      console.log("Profile_doctor: Data already fetched for this session ID, skipping re-fetch.");
      // Якщо дані вже були завантажені для цього ID сесії, і вони присутні,
      // то можна одразу встановити loadingInitial в false.
      // Важливо: це запобігає постійному "блиманню" завантаження при поверненні на екран.
      if (doctor && doctor.user_id === finalIdToFetch) {
        setLoadingInitial(false);
      }
    }
  }, [currentDoctorUserId, fetchDoctorData, doctor]); // Додаємо doctor до залежностей

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
    const targetDoctorId = doctorIdRef.current || currentDoctorUserId;

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
      let errorMessage = "Invalid JSON format";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        errorMessage = err.message;
      }
      console.warn(
        "Warning: Invalid JSON format for array (expected array or parsable JSON string):",
        value,
        errorMessage,
        err
      );
      return [];
    }
  }, []);

  const getLanguages = useCallback(
    (languagesData) => {
      return getParsedArray(languagesData).map((lang) =>
        String(lang).toUpperCase()
      );
    },
    [getParsedArray]
  );

  const getSpecializations = useCallback(
    (specializationData) => {
      const parsedSpecs = getParsedArray(specializationData);
      if (parsedSpecs.length > 0) {
        if (typeof parsedSpecs[0] === "string") {
          return parsedSpecs.map((specValue) => t(`categories.${specValue}`)).join(", ");
        } else if (typeof parsedSpecs[0] === "object" && parsedSpecs[0].nameKey) {
          return parsedSpecs.map((specObj) => t(`categories.${specObj.nameKey}`)).join(", ");
        }
      }
      return t("not_specified");
    },
    [getParsedArray, t]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // При оновленні, примусово встановлюємо hasFetchedDataForSessionId.current в false,
    // щоб гарантувати перезавантаження даних.
    hasFetchedDataForSessionId.current = false;
    await fetchDoctorData(doctorIdRef.current || currentDoctorUserId);
    await fetchUnreadNotificationsCount();
    // setRefreshing(false) викликається в fetchDoctorData, коли дані завантажені
  }, [fetchDoctorData, fetchUnreadNotificationsCount, doctorIdRef, currentDoctorUserId]);

  // Тут зміни: індикатор завантаження відображається лише при `loadingInitial` і якщо це не `refreshing`
  if (loadingInitial && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
      </View>
    );
  }

  // Якщо `loadingInitial` false, але є помилка
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#E04D53" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            hasFetchedDataForSessionId.current = false; // Примусове перезавантаження
            const idToRetry = doctorIdRef.current || currentDoctorUserId;
            if (idToRetry) {
              fetchDoctorData(idToRetry);
            } else {
              setError(t("doctor_id_missing_after_retry"));

              setLoadingInitial(false);
            }
          }}
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

  // Якщо `loadingInitial` false, немає помилки, але `doctor` все ще null
  if (!doctor ) {    return (
      <View style={styles.noDoctorContainer}>
        <Ionicons name="information-circle-outline" size={60} color="#0EB3EB" />
        <Text style={styles.noDoctorText}>{t("doctor_not_found")}</Text>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => navigation.navigate("HomeScreen")}
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
      {/* HEADER */}
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
          <Ionicons name="notifications-outline" size={24} color="white" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationNumber}>
                {unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0EB3EB", "#3F51B5"]} // Кольори індикатора оновлення
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
                onLoadStart={() => setLoadingAvatar(true)}
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
            <Text style={styles.doctorName}>
              {full_name || t("not_specified")}
            </Text>

            <View style={styles.infoRowDynamic}>
              <Text style={styles.label}>{t("rating")}:</Text>
              <ValueBox>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Ionicons name="star" size={18} color="#FFD700" />
                <Ionicons name="star" size={18} color="#FFD700" />
                <Ionicons name="star" size={18} color="#FFD700" />
                <Ionicons name="star-half" size={18} color="#FFD700" />
              </ValueBox>
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
              <ValueBox>{formatYearsText(experience_years)}</ValueBox>
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

        {/* Action Buttons */}
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

        {/* ABOUT ME SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("about_me")}</Text>
          <Text style={styles.sectionContent}>
            {about_me || t("not_specified")}
          </Text>
        </View>

        {/* ACHIEVEMENTS SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("achievements")}</Text>
          <Text style={styles.sectionContent}>
            {achievements || t("not_specified")}
          </Text>
        </View>

        {/* WORK LOCATION SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t("place_of_work")}</Text>
          <Text style={styles.sectionContent}>
            {work_location || t("not_specified")}
          </Text>
        </View>

        {/* CERTIFICATE PHOTO SECTION */}
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
                style={styles.documentImage}
                onLoadStart={() => setLoadingCertificate(true)}
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
            </View>
          ) : (
            <Text style={styles.noImageText}>{t("no_certificate_photo")}</Text>
          )}
        </View>

        {/* DIPLOMA PHOTO SECTION */}
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
                style={styles.documentImage}
                onLoadStart={() => setLoadingDiploma(true)}
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
        <View style={{ height: 30 }} />{/* Додатковий відступ знизу */}
      </ScrollView>

      {/* Language Selection Modal */}
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
    backgroundColor: "#F0F2F5", // Light background for modern feel
    paddingTop: Platform.OS === 'android' ? 30 : 10, // Адаптивний paddingTop для Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Mont-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FCE4EC", // Lighter error background
    borderRadius: 15,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  errorText: {
    fontSize: 17,
    color: "#D32F2F", // Darker error text
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Mont-SemiBold",
  },
  retryButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30, // More rounded
    marginTop: 10,
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  noDoctorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#E0F7FA", // Light blue background
    borderRadius: 15,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  noDoctorText: {
    fontSize: 18,
    textAlign: "center",
    color: "#000000",
    marginTop: 20,
    fontFamily: "Mont-SemiBold",
  },
  backToHomeButton: {
    backgroundColor: "#607D8B", // Slightly darker, more neutral color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 15,
    shadowColor: "#607D8B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: "transparent", // Прозорий фон
    paddingTop: Platform.OS === 'android' ? 30 : 50, // Адаптивний paddingTop
    paddingBottom: 15,
    paddingHorizontal: 20,
    // Прибрані borderBottomLeftRadius, borderBottomRightRadius, shadow, elevation
    // якщо хедер прозорий, ці властивості краще застосовувати до елементів всередині
  },
  languageSelectButton: {
    backgroundColor: "#0EB3EB", // Повернуто синій колір
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0EB3EB", // Тінь під колір кнопки
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white", // Білий текст
    marginRight: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121", // Темний текст для прозорого фону
    flex: 1, // Важливо для центрування
    textAlign: "center", // Важливо для центрування
    marginHorizontal: 10,
    fontFamily: "Mont-Bold",
  },
  notificationButton: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: "#0EB3EB", // Повернуто синій колір
    borderRadius: width * 0.06,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0EB3EB", // Тінь під колір кнопки
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#E04D53",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: 12,
    fontFamily: "Mont-Bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    paddingBottom: 50,
  },
  doctorMainInfo: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0EB3EB",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarLoadingIndicator: {
    position: "absolute",
  },
  doctorDetails: {
    width: "100%",
    paddingHorizontal: 5,
  },
  doctorName: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#212121",
    fontFamily: "Mont-Bold",
  },
  infoRowDynamic: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  label: {
    fontSize: 16,
    color: "#555",
    fontFamily: "Mont-SemiBold",
    flexShrink: 0,
    marginRight: 10,
  },
  valueBox: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
    fontSize: 20,
    marginLeft: 5,
  },
  actionButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    marginHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
    marginLeft: 10,
  },
  buttonIcon: {
    // Вже задано розмір та колір в JSX, тут можна додати інші стилі, якщо потрібно
  },
  sectionTitleLink: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0EB3EB",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 18,
    fontFamily: "Mont-Bold",
    textDecorationLine: "none",
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    fontFamily: "Mont-SemiBold",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    fontFamily: "Mont-Regular",
    marginTop: 5,
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    backgroundColor: "#F0F8FF",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3E0F2",
    marginTop: 10,
  },
  documentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageLoadingIndicator: {
    position: "absolute",
  },
  noImageText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "Mont-Regular",
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
     borderColor: "#0EB3EB", // Колір рамки
    borderWidth: 1, // Товщина рамки
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
    fontFamily: "Mont-Bold",
  },
  modalScrollView: {
    maxHeight: 250,
    width: "100%",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.1)",
    width: "100%",
    justifyContent: "center",
  },
  languageOptionText: {
    fontSize: 18,
    color: "#444",
    fontFamily: "Mont-Regular",
    marginLeft: 10,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 2,
    marginTop: 25,
    width: "70%",
  },
  buttonClose: {
    backgroundColor: "#0EB3EB",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Mont-Bold",
  },
});
export default Profile_doctor;