import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  View,
  Text,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { SafeAreaView } from "react-native-safe-area-context";
import TabBar_doctor from "../../components/TopBar_doctor";
import { useAuth } from "../../providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { specializations } from './constant/specializations.js';
import styles from "./ProfileDoctorStyles";

// Налаштування анімацій для Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Налаштування сповіщень
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
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
        "Не вдалося отримати токен для push-сповіщень! Перевірте дозволи."
      );
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "e2619b61-6ef5-4958-90bc-a400bbc8c50a",
        })
      ).data;
    } catch (e) {
      console.error("Error getting Expo push token:", e);
      return;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
    return;
  }

  if (token && userId) {
    const { error } = await supabase
      .from("profile_doctor")
      .update({ notification_token: token })
      .eq("user_id", userId);

    if (error) {
      console.error("Error saving notification token:", error.message);
    }
  }

  return token;
}

const getStarRating = (points) => {
  if (points === null || points === undefined || isNaN(points)) return 0;
  if (points >= 1000) return 5;
  if (points >= 800) return 4;
  if (points >= 600) return 3;
  if (points >= 400) return 2;
  if (points >= 200) return 1;
  return 0;
};

const ValueBox = ({ children, t }) => {
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

const COUNTRY_FLAGS_MAP = {
  "EN": "🇬🇧",
  "UK": "🇺🇦",
  "DE": "🇩🇪",
  "PH": "🇵🇭",
  "HR": "🇭🇷",
  "CF": "🇨🇫",
  "TD": "🇹🇩",
  "CZ": "🇨🇿",
  "CL": "🇨🇱",
  "ME": "🇲🇪",
  "LK": "🇱🇰",
  "JM": "🇯🇲",
  "UA": "🇺🇦",
  "GB": "🇬🇧",
  "US": "🇺🇸",
  "CA": "🇨🇦",
  "FR": "🇫🇷",
  "PL": "🇵🇱",
  "IT": "🇮🇹",
  "ES": "🇪🇸",
  "JP": "🇯🇵",
  "CN": "🇨🇳",
  "IN": "🇮🇳",
  "AU": "🇦🇺",
  "BR": "🇧🇷",
  "TR": "🇹🇷",
  "SE": "🇸🇪",
  "CH": "🇨🇭",
  "NL": "🇳🇱",
  "NO": "🇳🇴",
  "DK": "🇩🇰",
  "FI": "🇫🇮",
  "ZA": "🇿🇦",
  "MX": "🇲🇽",
  "KR": "🇰🇷",
  "AR": "🇦🇷",
  "IE": "🇮🇪",
  "NZ": "🇳🇿",
  "SG": "🇸🇬",
  "IL": "🇮🇱",
  "MY": "🇲🇾",
  "TH": "🇹🇭",
  "VN": "🇻🇳",
  "ID": "🇮🇩",
  "EG": "🇪🇬",
  "NG": "🇳🇬",
  "SA": "🇸🇦",
  "AE": "🇦🇪",
  "KW": "🇰🇼",
  "QA": "🇶🇦",
  "AT": "🇦🇹",
  "AZ": "🇦🇿",
  "AL": "🇦🇱",
  "DZ": "🇩🇿",
  "AO": "🇦🇴",
  "AD": "🇦🇩",
  "AG": "🇦🇬",
  "AF": "🇦🇫",
  "BS": "🇧🇸",
  "BD": "🇧🇩",
  "BB": "🇧🇧",
  "BH": "🇧🇭",
  "BZ": "🇧🇿",
  "BE": "🇧🇪",
  "BJ": "🇧🇯",
  "BY": "🇧🇾",
  "BG": "🇧🇬",
  "BO": "🇧🇴",
  "BA": "🇧🇦",
  "BW": "🇧🇼",
  "BN": "🇧🇳",
  "BF": "🇧🇫",
  "BI": "🇧🇮",
  "BT": "🇧🇹",
  "VU": "🇻🇺",
  "VE": "🇻🇪",
  "AM": "🇦🇲",
  "GA": "🇬🇦",
  "HT": "🇭🇹",
  "GM": "🇬🇲",
  "GH": "🇬🇭",
  "GY": "🇬🇾",
  "GT": "🇬🇹",
  "GN": "🇬🇳",
  "GW": "🇬🇼",
  "HN": "🇭🇳",
  "GD": "🇬🇩",
  "GR": "🇬🇷",
  "GE": "🇬🇪",
  "DJ": "🇩🇯",
  "DM": "🇩🇲",
  "DO": "🇩🇴",
  "CD": "🇨🇩",
  "EC": "🇪🇨",
  "GQ": "🇬🇶",
  "ER": "🇪🇷",
  "SZ": "🇸🇿",
  "EE": "🇪🇪",
  "ET": "🇪🇹",
  "YE": "🇾🇪",
  "ZM": "🇿🇲",
  "ZW": "🇿🇼",
  "IR": "🇮🇷",
  "IS": "🇮🇸",
  "IQ": "🇮🇶",
  "JO": "🇯🇴",
  "CV": "🇨🇻",
  "KZ": "🇰🇿",
  "KH": "🇰🇭",
  "CM": "🇨🇲",
  "KE": "🇰🇪",
  "KG": "🇰🇬",
  "CY": "🇨🇾",
  "KI": "🇰🇮",
  "CO": "🇨🇴",
  "KM": "🇰🇲",
  "CR": "🇨🇷",
  "CI": "🇨🇮",
  "CU": "🇨🇺",
  "LA": "🇱🇦",
  "LV": "🇱🇻",
  "LS": "🇱🇸",
  "LT": "🇱🇹",
  "LR": "🇱🇷",
  "LB": "🇱🇧",
  "LY": "🇱🇾",
  "LI": "🇱🇮",
  "LU": "🇱🇺",
  "MM": "🇲🇲",
  "MU": "🇲🇺",
  "MR": "🇲🇷",
  "MG": "🇲🇬",
  "MW": "🇲🇼",
  "ML": "🇲🇱",
  "MV": "🇲🇻",
  "MT": "🇲🇹",
  "MA": "🇲🇦",
  "MH": "🇲🇭",
  "MZ": "🇲🇿",
  "MD": "🇲🇩",
  "MC": "🇲🇨",
  "MN": "🇲🇳",
  "NA": "🇳🇦",
  "NR": "🇳🇷",
  "NP": "🇳🇵",
  "NE": "🇳🇪",
  "NI": "🇳🇮",
  "OM": "🇴🇲",
  "PK": "🇵🇰",
  "PW": "🇵🇼",
  "PA": "🇵🇦",
  "PG": "🇵🇬",
  "PY": "🇵🇾",
  "PE": "🇵🇪",
  "SS": "🇸🇸",
  "KP": "🇰🇵",
  "MK": "🇲🇰",
  "PT": "🇵🇹",
  "CG": "🇨🇬",
  "RU": "🇷🇺",
  "RW": "🇷🇼",
  "RO": "🇷🇴",
  "SV": "🇸🇻",
  "WS": "🇼🇸",
  "SM": "🇸🇲",
  "ST": "🇸🇹",
  "SC": "🇸🇨",
  "SN": "🇸🇳",
  "VC": "🇻🇨",
  "KN": "🇰🇳",
  "LC": "🇱🇨",
  "RS": "🇷🇸",
  "SY": "🇸🇾",
  "SK": "🇸🇰",
  "SI": "🇸🇮",
  "SB": "🇸🇧",
  "SO": "🇸🇴",
  "SD": "🇸🇩",
  "SR": "🇸🇷",
  "TL": "🇹🇱",
  "SL": "🇸🇱",
  "TJ": "🇹🇯",
  "TZ": "🇹🇿",
  "TG": "🇹🇬",
  "TO": "🇹🇴",
  "TT": "🇹🇹",
  "TV": "🇹🇻",
  "TN": "🇹🇳",
  "TM": "🇹🇲",
  "UG": "🇺🇬",
  "HU": "🇭🇺",
  "UZ": "🇺🇿",
  "UY": "🇺🇾",
  "FM": "🇫🇲",
  "FJ": "🇫🇯",
};

const LanguageFlags = ({ languages }) => {
  const getFlag = (code) => {
    return COUNTRY_FLAGS_MAP[String(code).toUpperCase()] || "❓";
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

// --- КОМПОНЕНТ СЛАЙД-ШОУ ---
const DocumentSlideshow = ({ title, data, placeholderText, loading, error, setLoading, setError }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const getImages = () => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (typeof data === 'string' && data.startsWith('http')) return [data];
    }
    return typeof data === 'string' ? [data] : [];
  };

  const images = getImages();
  const hasMultiple = images.length > 1;

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const windowWidth = Dimensions.get("window").width;
    // Враховуємо margin/padding (приблизно 80)
    const index = Math.round(scrollPosition / (windowWidth - 80));
    setActiveIndex(index);
  };

  if (images.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.imageWrapperPlaceholder}>
          <Text style={styles.noImageText}>{placeholderText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.slideshowWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.slideshowContent}
        >
          {images.map((url, index) => (
            <View key={index} style={styles.slideContainer}>
              <Image
                source={{ uri: url }}
                style={styles.slideImage}
                resizeMode="cover"
                onLoad={() => setLoading && setLoading(false)}
                onError={() => {
                  setLoading && setLoading(false);
                  setError && setError(true);
                }}
              />
              {loading && !error && index === 0 && (
                <ActivityIndicator
                  size="large"
                  color="#0EB3EB"
                  style={styles.imageLoadingIndicator}
                />
              )}
            </View>
          ))}
        </ScrollView>
        
        {hasMultiple && (
          <View style={styles.paginationContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// --- ГОЛОВНИЙ КОМПОНЕНТ ---
const Profile_doctor = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { session } = useAuth();

  const [doctorData, setDoctorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const doctorIdFromParams = route.params?.doctorId ? String(route.params.doctorId) : null;
  const isProfileOwner = !doctorIdFromParams || (session?.user?.id === doctorIdFromParams);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isProfileCompletionModalVisible, setIsProfileCompletionModalVisible] = useState(false);

  // Стани завантаження фото
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const [loadingDiploma, setLoadingDiploma] = useState(true);

  const [avatarError, setAvatarError] = useState(false);
  const [certificateError, setCertificateError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  const [activeTab, setActiveTab] = useState("Profile_doctor");

  // Анімації
  const timeIconRotateAnim = useRef(new Animated.Value(0)).current;
  const settingsIconRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = (animatedValue) => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation(animatedValue));
    };

    startRotation(timeIconRotateAnim);
    startRotation(settingsIconRotateAnim);
  }, []);

  const timeIconRotate = timeIconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const settingsIconRotate = settingsIconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      registerForPushNotificationsAsync(userId);
    }
  }, [session]);

  const fetchDoctorProfile = useCallback(async (userId, isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
      setLoadingAvatar(true);
      setLoadingDiploma(true);
      setLoadingCertificate(true);
    }
    setError(null);
    setAvatarError(false);
    setCertificateError(false);
    setDiplomaError(false);

    try {
      const { data: anketaData, error: anketaError } = await supabase
        .from('anketa_doctor')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (anketaError && anketaError.code !== 'PGRST116') throw anketaError;

      const { data: profileData, error: profileError } = await supabase
          .from('profile_doctor')
          .select(`user_id, full_name, email, phone, country, doctor_points, language`)
          .eq('user_id', userId)
          .single();

      if (profileError) throw profileError;
      
      const combinedData = { ...profileData, ...anketaData };

      if (anketaData || profileData) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDoctorData(combinedData);
      } else {
        setError('Не вдалося знайти профіль лікаря.');
      }

    } catch (err) {
      console.error("Помилка при завантаженні профілю лікаря:", err);
      setError(err.message);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, []);

  const checkProfileCompleteness = useCallback((profile) => {
    if (!profile) return false;
    return (
      profile.full_name &&
      profile.avatar_url &&
      profile.consultation_cost != null &&
      profile.experience_years != null &&
      profile.work_location &&
      profile.achievements &&
      profile.about_me &&
      (profile.communication_languages?.length > 0) &&
      (profile.specialization?.length > 0) &&
      profile.diploma_url &&
      profile.certificate_photo_url
    );
  }, []);

  useEffect(() => {
    if (!isLoading && !error && isProfileOwner && !checkProfileCompleteness(doctorData)) {
      setIsProfileCompletionModalVisible(true);
    } else {
      setIsProfileCompletionModalVisible(false);
    }
  }, [doctorData, isLoading, error, isProfileOwner, checkProfileCompleteness]);

  useEffect(() => {
    const targetId = doctorIdFromParams || session?.user?.id;
    if (targetId && (!doctorData || doctorData.user_id !== targetId)) {
      fetchDoctorProfile(targetId);
    }
  }, [doctorIdFromParams, session?.user?.id, doctorData, fetchDoctorProfile]);
  
  useFocusEffect(
    useCallback(() => {
      setActiveTab("Profile_doctor");
    }, [])
  );

  const fetchUnreadNotificationsCount = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const { count, error } = await supabase
        .from("doctor_notifications")
        .select("id", { count: "exact" })
        .eq("doctor_id", userId)
        .eq("is_read", false);

      if (!error) setUnreadNotificationsCount(count || 0);
    } catch (err) {
      console.error(err);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadNotificationsCount();
    }, [fetchUnreadNotificationsCount])
  );

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !isProfileOwner) return;

    const channel = supabase
      .channel(`doctor_notifications:${userId}`)
      .on('postgres_changes', { 
          event: '*', schema: 'public', table: 'doctor_notifications', filter: `doctor_id=eq.${userId}`
        },
        () => fetchUnreadNotificationsCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, isProfileOwner, fetchUnreadNotificationsCount]);

  const formatYearsText = useCallback((years) => {
    if (years == null || isNaN(years) || years < 0) return t("not_specified");
    return t("years_experience", { count: years });
  }, [t]);

  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);

  const handleLanguageSelect = async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      await AsyncStorage.setItem('user_language', langCode);
      closeLanguageModal();

      if (isProfileOwner && session?.user?.id) {
        setDoctorData(prev => ({ ...prev, language: langCode }));
        await supabase.from('profile_doctor').update({ language: langCode }).eq('user_id', session.user.id);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("error_title"), t("error_updating_language"));
      closeLanguageModal();
    }
  };

  const handleProfileDoctorSettingsPress = () => {
    setIsProfileCompletionModalVisible(false);
    navigation.navigate("Anketa_Settings");
  };

  const handleChooseConsultationTime = () => {
    const targetDoctorId = doctorIdFromParams || session?.user?.id;
    if (targetDoctorId) {
      navigation.navigate("ConsultationTime", { doctorId: targetDoctorId });
    } else {
      Alert.alert(t("error_title"), t("doctor_id_missing_for_consultation"));
    }
  };

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName !== "Profile_doctor") navigation.navigate(tabName);
  };

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  const getParsedArray = useCallback((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const getLanguages = useCallback((languagesData) => {
    const parsedLanguages = getParsedArray(languagesData);
    return parsedLanguages.map((lang) => {
      if (typeof lang === 'object' && lang?.code) return String(lang.code).toUpperCase();
      return String(lang).toUpperCase();
    }).filter(code => COUNTRY_FLAGS_MAP[code]);
  }, [getParsedArray]);

  const getSpecializations = useCallback((specializationData) => {
    const parsedSpecs = getParsedArray(specializationData);
    if (parsedSpecs.length > 0) {
      if (typeof parsedSpecs[0] === "string") {
        return parsedSpecs
          .map((specValue) => {
            const specObj = specializations.find((s) => s.value === specValue);
            return specObj ? t(specObj.nameKey) : specValue;
          })
          .join(", ");
      } else if (typeof parsedSpecs[0] === "object" && parsedSpecs[0].nameKey) {
        return parsedSpecs.map((specObj) => t(`categories.${specObj.nameKey}`)).join(", ");
      }
    }
    return t("not_specified");
  }, [getParsedArray, t]);

  const onRetry = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsProfileCompletionModalVisible(false);
    const targetId = doctorIdFromParams || session?.user?.id;
    if (targetId) fetchDoctorProfile(targetId);
  }, [doctorIdFromParams, session?.user?.id, fetchDoctorProfile]);

  const onBackToHome = useCallback(() => {
    navigation.navigate("HomeScreen");
  }, [navigation]);

  const onGoToAnketa = useCallback(() => {
    setIsProfileCompletionModalVisible(false);
    navigation.navigate("Anketa_Settings");
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsProfileCompletionModalVisible(false);
    const idToRefresh = doctorIdFromParams || session?.user?.id;
    if (idToRefresh) {
      await fetchDoctorProfile(idToRefresh, true);
      await fetchUnreadNotificationsCount();
    }
    setRefreshing(false);
  }, [fetchDoctorProfile, fetchUnreadNotificationsCount, doctorIdFromParams, session?.user?.id]);

  const finalDoctorData = doctorData || {};
  const defaultAvatarUrl = "https://yslchkbmupuyxgidnzrb.supabase.co/storage/v1/object/public/public-images/avatar-default-icon.png";

  const showLoading = isLoading && !doctorData;
  const showGenericError = !isLoading && error && !doctorData;
  const showDoctorNotFound = !isLoading && !doctorData && !error && !isProfileOwner;
  const showProfileContent = !isLoading && doctorData;

  return (
    <SafeAreaView style={styles.container}>
      {showLoading ? (
        <View style={styles.fullscreenContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0EB3EB" />
            <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
          </View>
        </View>
      ) : showGenericError ? (
        <View style={styles.fullscreenContainer}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
            <Text style={styles.errorText}>
              {!isConnected ? t("check_connection") : error || t("error_fetching_doctor_data_general")}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>{t("retry")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backToHomeButton} onPress={onBackToHome}>
              <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showDoctorNotFound ? (
        <View style={styles.fullscreenContainer}>
          <View style={styles.noDoctorContainer}>
            <Ionicons name="information-circle-outline" size={50} color="#0EB3EB" />
            <Text style={styles.noDoctorText}>{t("doctor_not_found")}</Text>
            <TouchableOpacity style={styles.backToHomeButton} onPress={onBackToHome}>
                <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showProfileContent ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.languageSelectButton} onPress={openLanguageModal}>
                <Text style={styles.languageButtonText}>
                  {(finalDoctorData.language || i18n.language).toUpperCase()}
                </Text>
              <Ionicons name="globe-outline" size={16} color="#0EB3EB" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t("profile_doctor")}</Text>
            {isProfileOwner && (
              <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Messege")}>
                 <Ionicons name="mail-outline" size={24} color="#0EB3EB" />
                  {unreadNotificationsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationNumber}>{unreadNotificationsCount}</Text>
                    </View>
                  )}
              </TouchableOpacity>
            )}
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
              <View style={styles.avatarContainer}>
                {finalDoctorData.avatar_url ? (
                  <>
                    <Image
                      key={finalDoctorData.avatar_url}
                      source={{ uri: finalDoctorData.avatar_url }}
                      defaultAvatarUrl={defaultAvatarUrl}
                      style={styles.avatar}
                      onLoad={() => setLoadingAvatar(false)}
                      onError={() => {
                        setLoadingAvatar(false);
                        setAvatarError(true);
                      }}
                    />
                    {loadingAvatar && !avatarError && (
                      <ActivityIndicator size="large" color="#0EB3EB" style={styles.avatarLoadingIndicator} />
                    )}
                  </>
                ) : (
                  <Image source={{ uri: defaultAvatarUrl }} style={styles.avatar} />
                )}
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>
                  {finalDoctorData.full_name || t("not_specified")}
                </Text>
                
                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("rating")}:</Text>
                  <View style={styles.valueBox}>
                    <Text style={styles.pointsText}>
                      {finalDoctorData.doctor_points || 0} {t("points")}
                    </Text>
                    <View style={styles.starContainer}>
                      {Array.from({ length: getStarRating(finalDoctorData.doctor_points) }).map((_, i) => (
                        <Ionicons key={`star-full-${i}`} name="star" size={18} color="#FFD700" />
                      ))}
                      {Array.from({ length: 5 - getStarRating(finalDoctorData.doctor_points) }).map((_, i) => (
                        <Ionicons key={`star-outline-${i}`} name="star-outline" size={18} color="#ccc" />
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("communication_language")}:</Text>
                  <ValueBox t={t}>
                    <LanguageFlags languages={getLanguages(finalDoctorData.communication_languages)} />
                  </ValueBox>
                </View>

                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("specialization")}:</Text>
                  <ValueBox t={t}>{getSpecializations(finalDoctorData.specialization)}</ValueBox>
                </View>

                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("work_experience")}:</Text>
                  <ValueBox t={t}>{formatYearsText(finalDoctorData.experience_years)}</ValueBox>
                </View>

                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("work_location")}:</Text>
                  <ValueBox t={t}>{finalDoctorData.work_location || t("not_specified")}</ValueBox>
                </View>

                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("consultation_cost")}:</Text>
                  <ValueBox t={t}>
                    {finalDoctorData.consultation_cost ? `$${finalDoctorData.consultation_cost}` : t("not_specified")}
                  </ValueBox>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleChooseConsultationTime}
            >
                <Animated.View style={{ transform: [{ rotate: timeIconRotate }] }}>
                    <Ionicons name="time-outline" size={24} color="white" style={styles.buttonIcon} />
                </Animated.View>
                <Text style={styles.actionButtonText}>{t("choose_consultation_time")}</Text>
            </TouchableOpacity>
            
            {isProfileOwner && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleProfileDoctorSettingsPress}
              >
                  <Animated.View style={{ transform: [{ rotate: settingsIconRotate }] }}>
                      <Ionicons name="settings-outline" size={24} color="white" style={styles.buttonIcon} />
                  </Animated.View>
                  <Text style={styles.actionButtonText}>{t("profile_doctor_settings")}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitleLink}>{t("more_about_doctor")}</Text>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{t("about_me")}</Text>
              <Text style={styles.sectionContent}>
                {finalDoctorData.about_me || t("not_specified_full")}
              </Text>
            </View>

            {finalDoctorData.achievements && finalDoctorData.achievements.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>{t("achievements")}</Text>
                <Text style={styles.sectionContent}>
                  {finalDoctorData.achievements}
                </Text>
              </View>
            )}

            {/* Слайд-шоу дипломів */}
            <DocumentSlideshow 
              title={t("diploma_photo")}
              data={finalDoctorData.diploma_url}
              placeholderText={t("no_diploma_photo")}
              loading={loadingDiploma}
              error={diplomaError}
              setLoading={setLoadingDiploma}
              setError={setDiplomaError}
            />

            {/* Слайд-шоу сертифікатів */}
            <DocumentSlideshow 
              title={t("certificate_photo")}
              data={finalDoctorData.certificate_photo_url}
              placeholderText={t("no_certificate_photo")}
              loading={loadingCertificate}
              error={certificateError}
              setLoading={setLoadingCertificate}
              setError={setCertificateError}
            />

          </ScrollView>

          {/* Модальне вікно мови */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={isLanguageModalVisible}
            onRequestClose={closeLanguageModal}
          >
            <TouchableWithoutFeedback onPress={closeLanguageModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
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

          {/* Модальне вікно заповнення профілю */}
          {isProfileOwner && !checkProfileCompleteness(doctorData) && (
            <Modal
              animationType="fade"
              transparent={true}
              visible={isProfileCompletionModalVisible}
              onRequestClose={() => setIsProfileCompletionModalVisible(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPressOut={() => setIsProfileCompletionModalVisible(false)}
              >
                <TouchableWithoutFeedback>
                  <View style={styles.modalView}>
                    <Ionicons name="information-circle-outline" style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>{t("complete_profile_title")}</Text>
                    <Text style={styles.modalText}>{t("complete_profile_message")}</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={onGoToAnketa}>
                      <Text style={styles.modalButtonText}>{t("go_to_profile_settings")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => setIsProfileCompletionModalVisible(false)}
                    >
                      <Text style={styles.modalCancelButtonText}>{t("maybe_later")}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </Pressable>
            </Modal>
          )}

          <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
        </>
      ) : null }
    </SafeAreaView>
  );
};

export default React.memo(Profile_doctor);