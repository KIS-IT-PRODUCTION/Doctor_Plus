import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable, // You used Pressable, keeping it
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  View,
  Text,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { SafeAreaView } from "react-native-safe-area-context";
import TabBar_doctor from "../../components/TopBar_doctor";
import NetInfo from "@react-native-community/netinfo";

const { width, height } = Dimensions.get("window");
const isLargeScreen = width > 768;
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

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

const getStarRating = (points) => {
  if (points === null || points === undefined || isNaN(points)) {
    return 0;
  }
  if (points >= 1000) {
    return 5;
  } else if (points >= 800) {
    return 4;
  } else if (points >= 600) {
    return 3;
  } else if (points >= 400) {
    return 2;
  } else if (points >= 200) {
    return 1;
  } else {
    return 0;
  }
};

const ValueBox = ({ children }) => {
  const { t } = useTranslation();
  const isEmpty =
    !children ||
    (typeof children === "string" && children.trim() === "") ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return <Text style={[styles.value, styles.noValueText]}>{t("not_specified")}</Text>;
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

  const doctorIdFromParams = route.params?.doctorId ? String(route.params.doctorId) : null;

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

  const [currentLoggedInDoctorId, setCurrentLoggedInDoctorId] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeoutExpired, setLoadingTimeoutExpired] = useState(false);
  const timeoutRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Profile_doctor");
  const [isConnected, setIsConnected] = useState(true);

  const hasLoadedInitialData = useRef(false);
  const lastFetchedDoctorId = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      console.log("Is connected?", state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Profile_doctor");
    }, [])
  );

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    switch (tabName) {
      case "Home_doctor":
        navigation.navigate("Home_doctor");
        break;
      case "Records_doctor":
        navigation.navigate("Records_doctor");
        break;
      case "Chat_doctor":
        navigation.navigate("Chat_doctor");
        break;
      case "Headphones_doctor":
        navigation.navigate("Support_doctor");
        break;
      case "Profile_doctor":
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  useEffect(() => {
    console.log("Profile_doctor: Main useEffect triggered.");
    const getDoctorSessionAndFetch = async () => {
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError) {
        console.error("Error getting doctor user session:", sessionError.message);
        setError(t("session_error") + sessionError.message);
        setLoadingInitial(false);
        setCurrentLoggedInDoctorId(null);
        return;
      }

      let targetId = doctorIdFromParams;

      if (user) {
        console.log("Profile_doctor: Current logged-in user ID:", user.id);
        setCurrentLoggedInDoctorId(user.id);

        if (!targetId) {
          targetId = user.id;
        }
      } else {
        console.log("Profile_doctor: No doctor user session found.");
        setCurrentLoggedInDoctorId(null);
        if (!targetId) {
          setError(t("doctor_id_missing"));
          setLoadingInitial(false);
          return;
        }
      }

      const shouldFetch =
        (targetId && !hasLoadedInitialData.current) ||
        (targetId && targetId !== lastFetchedDoctorId.current) ||
        refreshing;

      console.log(`Profile_doctor: Fetch check - targetId: ${targetId}, hasLoadedInitialData: ${hasLoadedInitialData.current}, lastFetchedDoctorId: ${lastFetchedDoctorId.current}, refreshing: ${refreshing}`);

      if (shouldFetch) {
        console.log(`Profile_doctor: Initiating fetchDoctorData for ID: ${targetId}`);
        fetchDoctorData(targetId, refreshing);
        hasLoadedInitialData.current = true;
      } else if (doctor && doctor.user_id === targetId) {
        setLoadingInitial(false);
        setError(null);
      } else {
        setLoadingInitial(false);
        setError(null);
      }
    };

    getDoctorSessionAndFetch();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    t,
    doctorIdFromParams,
    refreshing,
  ]);

  useEffect(() => {
    if (currentLoggedInDoctorId) {
      console.log("Profile_doctor: Registering for push notifications for user:", currentLoggedInDoctorId);
      registerForPushNotificationsAsync(currentLoggedInDoctorId);
    }
  }, [currentLoggedInDoctorId]);


  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!currentLoggedInDoctorId) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const { count, error: countError } = await supabase
        .from("doctor_notifications")
        .select("id", { count: "exact" })
        .eq("doctor_id", currentLoggedInDoctorId)
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
          `Unread notifications count for ${currentLoggedInDoctorId}: ${count}`
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
  }, [currentLoggedInDoctorId]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadNotificationsCount();
    }, [fetchUnreadNotificationsCount])
  );


  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
      }
      return t("years_experience", { count: years });
    },
    [t]
  );

  const fetchDoctorData = useCallback(
    async (idToFetch, isRefresh = false) => {
      if (!idToFetch) {
        console.warn(
          "Profile_doctor: No doctor ID available to fetch data in fetchDoctorData."
        );
        if (!isRefresh) {
          setError(t("doctor_id_missing"));
          setLoadingInitial(false);
        }
        setRefreshing(false);
        return;
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setLoadingAvatar(true);
      setLoadingCertificate(true);
      setLoadingDiploma(true);
      setAvatarError(false);
      setCertificateError(false);
      setDiplomaError(false);
      setLoadingTimeoutExpired(false);

      if (!isRefresh) {
        setDoctor(null);
        setError(null);
        setLoadingInitial(true);
      } else {
        setError(null);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (loadingInitial && !isRefresh) {
          setLoadingTimeoutExpired(true);
          console.log("Loading timeout expired. Showing retry/back buttons.");
        }
      }, 30000);

      console.log(`Profile_doctor: Fetching data for doctor ID: ${idToFetch}, isRefresh: ${isRefresh}`);

      try {
        const { data, error: fetchError } = await supabase
          .from("anketa_doctor")
          .select(
            "*, diploma_url, certificate_photo_url, consultation_cost, experience_years, profile_doctor(doctor_points)"
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
          if (!isRefresh) {
            setDoctor(null);
            lastFetchedDoctorId.current = null;
          }
        } else {
          setDoctor(data);
          lastFetchedDoctorId.current = idToFetch;
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
        if (!isRefresh) {
          setDoctor(null);
          lastFetchedDoctorId.current = null;
        }
      } finally {
        console.log(
          `Profile_doctor: Setting loadingInitial to FALSE after fetch for ID: ${idToFetch}`
        );
        setLoadingInitial(false);
        setRefreshing(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setLoadingTimeoutExpired(false);
      }
    },
    [t, loadingInitial]
  );

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
    const targetDoctorId = doctorIdFromParams || currentLoggedInDoctorId;

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

  const onRetry = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setError(null);
    setLoadingTimeoutExpired(false);
    hasLoadedInitialData.current = false;
    lastFetchedDoctorId.current = null;
    setLoadingInitial(true);
    const targetId = doctorIdFromParams || currentLoggedInDoctorId;
    if (targetId) {
      fetchDoctorData(targetId, false);
    } else {
      setLoadingInitial(false);
      setError(t("doctor_id_missing"));
    }
  }, [doctorIdFromParams, currentLoggedInDoctorId, t, fetchDoctorData]);


  const onBackToHome = useCallback(() => {
    navigation.navigate("HomeScreen");
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setLoadingTimeoutExpired(false);

    const idToRefresh = doctorIdFromParams || currentLoggedInDoctorId;
    if (idToRefresh) {
      await fetchDoctorData(idToRefresh, true);
      await fetchUnreadNotificationsCount();
    } else {
      setRefreshing(false);
      console.warn("Cannot refresh: Doctor ID missing.");
    }
  }, [fetchDoctorData, fetchUnreadNotificationsCount, doctorIdFromParams, currentLoggedInDoctorId, t]);

  const shouldShowFullScreenState =
    (loadingInitial && !doctor) ||
    error ||
    loadingTimeoutExpired ||
    !isConnected ||
    (!doctor && !loadingInitial && !refreshing);


  if (shouldShowFullScreenState) {
    return (
        <SafeAreaView style={styles.fullscreenContainer}>
            {loadingInitial && !error && !loadingTimeoutExpired && isConnected && !doctor ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EB3EB" />
                    <Text style={styles.loadingText}>{t("loading_profile")}</Text>
                </View>
            ) : (
                <View style={styles.errorContainer}>
                    {(!isConnected || error || !doctor) && (
                        <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
                    )}
                    <Text style={styles.errorText}>
                        {!isConnected
                            ? t("no_internet_connection")
                            : error || t("doctor_not_found")}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                    >
                        <Text style={styles.retryButtonText}>{t("retry")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.backToHomeButton}
                        onPress={onBackToHome}
                    >
                        <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
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
    profile_doctor
  } = doctor;

  const doctorPoints = profile_doctor?.doctor_points;

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.languageSelectButton}
            onPress={openLanguageModal}
          >
              <Text style={styles.languageButtonText}>
                {displayedLanguageCode}
              </Text>
            <Ionicons name="globe-outline" size={16} color="white" />
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0EB3EB", "#3F51B5"]}
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
                  {Array.from({ length: getStarRating(doctorPoints) }).map((_, i) => (
                    <Ionicons key={`star-full-${i}`} name="star" size={18} color="#FFD700" />
                  ))}
                  {Array.from({ length: 5 - getStarRating(doctorPoints) }).map((_, i) => (
                    <Ionicons key={`star-outline-${i}`} name="star-outline" size={18} color="#ccc" />
                  ))}
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
                  style={styles.documentImage}
                  resizeMode="contain" // Added resizeMode="contain" based on previous context
                  onLoadStart={() => setLoadingCertificate(true)}
                  onLoad={() => setLoadingCertificate(false)}
                  onError={() => {
                    setLoadingCertificate(false);
                    setCertificateError(true);
                    console.error("Error loading certificate image:", certificate_photo_url);
                  }}
                />
              </View>
            ) : (
              <Text style={styles.noImageText}>{certificateError ? t("error_loading_image") : t("not_provided")}</Text>
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
                  style={styles.documentImage}
                  resizeMode="contain" // Added resizeMode="contain"
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
              <Text style={styles.noImageText}>{diplomaError ? t("error_loading_image") : t("not_provided")}</Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
        >
          <TouchableWithoutFeedback onPress={closeLanguageModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback
                onPress={() => {
                  /* Залишаємо порожнім, щоб не закривати модалку при натисканні всередині */
                }}
              >
                <View style={styles.languageModalContent}>
                  <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
                  {languagesForModal.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.languageOption}
                      onPress={() => handleLanguageSelect(item.code)}
                    >
                      <Text style={styles.languageOptionText}>
                        {t(item.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingTop: Platform.OS === 'android' ? 30 : 10,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 19,
    color: "#444",
    // fontFamily: "Mont-Regular",
    fontWeight: "500",
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: "#FFEBEE",
    borderRadius: 20,
    marginHorizontal: 25,
    shadowColor: "#EF5350",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  errorText: {
    fontSize: 19,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 30,
    // fontFamily: "Mont-SemiBold",
    lineHeight: 28,
  },
  retryButton: {
    borderRadius: 30,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#0EB3EB',
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    // fontFamily: "Mont-Bold",
  },
  noDoctorContainer: { // This style is not used in the current render logic, but kept for completeness
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#E0F7FA",
    borderRadius: 20,
    margin: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#B2EBF2',
  },
  noDoctorText: { // This style is not used in the current render logic, but kept for completeness
    fontSize: 20,
    textAlign: "center",
    color: "#000000",
    marginTop: 25,
    // fontFamily: "Mont-SemiBold",
    lineHeight: 28,
  },
  backToHomeButton: {
    borderRadius: 30,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: "#607D8B",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 7,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  backToHomeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    // fontFamily: "Mont-Bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: 20,
    position: "relative",
    zIndex: 1,
    height: 70,
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  languageSelectButton: {
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgb(14, 180, 235)",
    flexDirection: "row",
    zIndex: 1,
    alignItems: "center",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButtonText: {
    fontSize: 15,
    // fontFamily: "Mont-Bold",
    color: "white",
    marginRight: 8,
  },
  headerTitle: {
    // fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(20),
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 0,
    top: 0,
    paddingVertical: 10,
    right: 0,
    bottom: 0,
  },
  notificationButton: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: "rgb(14, 180, 235)",
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
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingVertical: 25,
    paddingBottom: 70,
  },
  doctorMainInfo: {
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0EB3EB",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
    resizeMode: "cover",
  },
  avatarLoadingIndicator: {
    position: "absolute",
  },
  doctorDetails: {
    width: "100%",
    paddingHorizontal: 10,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#212121",
    // fontFamily: "Mont-Bold",
  },
  infoRowDynamic: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "white",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: "#555",
    // fontFamily: "Mont-SemiBold",
    flexShrink: 0,
    marginRight: 5,
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
    // fontFamily: "Mont-Regular",
  },
  noValueText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    // fontFamily: "Mont-Regular",
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  flagText: {
    fontSize: 22,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
    height: 60,
    borderRadius: 18,
    marginBottom: 18,
    marginHorizontal: 20,
    backgroundColor: "#0EB3EB",
    shadowColor: "#0EB3EB",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    // fontFamily: "Mont-Bold",
    marginLeft: 10,
    textAlign: "center",
    flex: 1,
  },
  buttonIcon: {
    // Стилі для іконки, якщо потрібно, але колір і розмір зазвичай передаються в JSX
  },
  sectionTitleLink: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0EB3EB",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    // fontFamily: "Mont-Bold",
    textDecorationLine: "none",
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 0,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    // fontFamily: "Mont-SemiBold",
    borderBottomWidth: 0,
    paddingBottom: 0,
    textAlign: 'center',
  },
  sectionContent: {
    fontSize: 16,
    color: "#555",
    lineHeight: 26,
    // fontFamily: "Mont-Regular",
    marginTop: 10,
  },
  imageWrapper: {
    width: "100%",
    height: 250,
    backgroundColor: "#F0F8FF",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3E0F2",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageLoadingIndicator: {
    position: "absolute",
  },
  noImageText: { // Changed from sectionContent to a specific style for no image
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    // fontFamily: "Mont-Regular",
    paddingVertical: 25, // Added padding
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    padding: 20,
    borderColor: "#0EB3EB",
    borderWidth: 1,
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
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#rgba(14, 179, 235, 0.1)",
  },
  languageOptionText: {
    fontSize: 18,
    // fontFamily: "Mont-Regular",
    color: "#333333",
  },
  modalTitle: {
    fontSize: 20,
    // fontFamily: "Mont-SemiBold",
    marginBottom: 15,
  },
});

export default Profile_doctor;