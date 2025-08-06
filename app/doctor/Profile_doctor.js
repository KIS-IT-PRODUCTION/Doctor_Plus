import React, { useState, useEffect, useCallback, useRef } from "react";
import {
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
  View,
  Text,
  StatusBar,
  Animated,
  Easing,
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
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
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
    // Alert.alert(
    //   "Помилка",
    //   "Push-сповіщення працюють лише на фізичних пристроях!"
    // );
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
  "DE": "🇩🇪", // Germany/German
  "PH": "🇵🇭", // Philippines
  "HR": "🇭🇷", // Croatia
  "CF": "🇨🇫", // Central African Republic
  "TD": "🇹🇩", // Chad
  "CZ": "🇨🇿", // Czechia
  "CL": "🇨🇱", // Chile
  "ME": "🇲🇪", // Montenegro
  "LK": "🇱🇰", // Sri Lanka
  "JM": "🇯🇲", // Jamaica
  "UA": "🇺🇦", // Ukraine
  "GB": "🇬🇧", // United Kingdom
  "US": "🇺🇸", // United States
  "CA": "🇨🇦", // Canada
  "FR": "🇫🇷", // France
  "PL": "🇵🇱", // Poland
  "IT": "🇮🇹", // Italy
  "ES": "🇪🇸", // Spain
  "JP": "🇯🇵", // Japan
  "CN": "🇨🇳", // China
  "IN": "🇮🇳", // India
  "AU": "🇦🇺", // Australia
  "BR": "🇧🇷", // Brazil
  "TR": "🇹🇷", // Turkey
  "SE": "🇸🇪", // Sweden
  "CH": "🇨🇭", // Switzerland
  "NL": "🇳🇱", // Netherlands
  "NO": "🇳🇴", // Norway
  "DK": "🇩🇰", // Denmark
  "FI": "🇫🇮", // Finland
  "ZA": "🇿🇦", // South Africa
  "MX": "🇲🇽", // Mexico
  "KR": "🇰🇷", // South Korea
  "AR": "🇦🇷", // Argentina
  "IE": "🇮🇪", // Ireland
  "NZ": "🇳🇿", // New Zealand
  "SG": "🇸🇬", // Singapore
  "IL": "🇮🇱", // Israel
  "MY": "🇲🇾", // Malaysia
  "TH": "🇹🇭", // Thailand
  "VN": "🇻🇳", // Vietnam
  "ID": "🇮🇩", // Indonesia
  "EG": "🇪🇬", // Egypt
  "NG": "🇳🇬", // Nigeria
  "SA": "🇸🇦", // Saudi Arabia
  "AE": "🇦🇪", // United Arab Emirates
  "KW": "🇰🇼", // Kuwait
  "QA": "🇶🇦", // Qatar
  "AT": "🇦🇹", // Austria
  "AZ": "🇦🇿", // Azerbaijan
  "AL": "🇦🇱", // Albania
  "DZ": "🇩🇿", // Algeria
  "AO": "🇦🇴", // Angola
  "AD": "🇦🇩", // Andorra
  "AG": "🇦🇬", // Antigua and Barbuda
  "AF": "🇦🇫", // Afghanistan
  "BS": "🇧🇸", // Bahamas
  "BD": "🇧🇩", // Bangladesh
  "BB": "🇧🇧", // Barbados
  "BH": "🇧🇭", // Bahrain
  "BZ": "🇧🇿", // Belize
  "BE": "🇧🇪", // Belgium
  "BJ": "🇧🇯", // Benin
  "BY": "🇧🇾", // Belarus
  "BG": "🇧🇬", // Bulgaria
  "BO": "🇧🇴", // Bolivia
  "BA": "🇧🇦", // Bosnia and Herzegovina
  "BW": "🇧🇼", // Botswana
  "BN": "🇧🇳", // Brunei
  "BF": "🇧🇫", // Burkina Faso
  "BI": "🇧🇮", // Burundi
  "BT": "🇧🇹", // Bhutan
  "VU": "🇻🇺", // Vanuatu
  "VE": "🇻🇪", // Venezuela
  "AM": "🇦🇲", // Armenia
  "GA": "🇬🇦", // Gabon
  "HT": "🇭🇹", // Haiti
  "GM": "🇬🇲", // Gambia
  "GH": "🇬🇭", // Ghana
  "GY": "🇬🇾", // Guyana
  "GT": "🇬🇹", // Guatemala
  "GN": "🇬🇳", // Guinea
  "GW": "🇬🇼", // Guinea-Bissau
  "HN": "🇭🇳", // Honduras
  "GD": "🇬🇩", // Grenada
  "GR": "🇬🇷", // Greece
  "GE": "🇬🇪", // Georgia
  "DJ": "🇩🇯", // Djibouti
  "DM": "🇩🇲", // Dominica
  "DO": "🇩🇴", // Dominican Republic
  "CD": "🇨🇩", // DR Congo
  "EC": "🇪🇨", // Ecuador
  "GQ": "🇬🇶", // Equatorial Guinea
  "ER": "🇪🇷", // Eritrea
  "SZ": "🇸🇿", // Eswatini
  "EE": "🇪🇪", // Estonia
  "ET": "🇪🇹", // Ethiopia
  "YE": "🇾🇪", // Yemen
  "ZM": "🇿🇲", // Zambia
  "ZW": "🇿🇼", // Zimbabwe
  "IR": "🇮🇷", // Iran
  "IS": "🇮🇸", // Iceland
  "IQ": "🇮🇶", // Iraq
  "JO": "🇯🇴", // Jordan
  "CV": "🇨🇻", // Cape Verde
  "KZ": "🇰🇿", // Kazakhstan
  "KH": "🇰🇭", // Cambodia
  "CM": "🇨🇲", // Cameroon
  "KE": "🇰🇪", // Kenya
  "KG": "🇰🇬", // Kyrgyzstan
  "CY": "🇨🇾", // Cyprus
  "KI": "🇰🇮", // Kiribati
  "CO": "🇨🇴", // Colombia
  "KM": "🇰🇲", // Comoros
  "CR": "🇨🇷", // Costa Rica
  "CI": "🇨🇮", // Ivory Coast
  "CU": "🇨🇺", // Cuba
  "LA": "🇱🇦", // Laos
  "LV": "🇱🇻", // Latvia
  "LS": "🇱🇸", // Lesotho
  "LT": "🇱🇹", // Lithuania
  "LR": "🇱🇷", // Liberia
  "LB": "🇱🇧", // Lebanon
  "LY": "🇱🇾", // Libya
  "LI": "🇱🇮", // Liechtenstein
  "LU": "🇱🇺", // Luxembourg
  "MM": "🇲🇲", // Myanmar
  "MU": "🇲🇺", // Mauritius
  "MR": "🇲🇷", // Mauritania
  "MG": "🇲🇬", // Madagascar
  "MW": "🇲🇼", // Malawi
  "ML": "🇲🇱", // Mali
  "MV": "🇲🇻", // Maldives
  "MT": "🇲🇹", // Malta
  "MA": "🇲🇦", // Morocco
  "MH": "🇲🇭", // Marshall Islands
  "MZ": "🇲🇿", // Mozambique
  "MD": "🇲🇩", // Moldova
  "MC": "🇲🇨", // Monaco
  "MN": "🇲🇳", // Mongolia
  "NA": "🇳🇦", // Namibia
  "NR": "🇳🇷", // Nauru
  "NP": "🇳🇵", // Nepal
  "NE": "🇳🇪", // Niger
  "NI": "🇳🇮", // Nicaragua
  "OM": "🇴🇲", // Oman
  "PK": "🇵🇰", // Pakistan
  "PW": "🇵🇼", // Palau
  "PA": "🇵🇦", // Panama
  "PG": "🇵🇬", // Papua New Guinea
  "PY": "🇵🇾", // Paraguay
  "PE": "🇵🇪", // Peru
  "SS": "🇸🇸", // South Sudan
  "KP": "🇰🇵", // North Korea
  "MK": "🇲🇰", // North Macedonia
  "PT": "🇵🇹", // Portugal
  "CG": "🇨🇬", // Republic of the Congo
  "RU": "🇷🇺", // Russia
  "RW": "🇷🇼", // Rwanda
  "RO": "🇷🇴", // Romania
  "SV": "🇸🇻", // El Salvador
  "WS": "🇼🇸", // Samoa
  "SM": "🇸🇲", // San Marino
  "ST": "🇸🇹", // Sao Tome and Principe
  "SC": "🇸🇨", // Seychelles
  "SN": "🇸🇳", // Senegal
  "VC": "🇻🇨", // Saint Vincent and the Grenadines
  "KN": "🇰🇳", // Saint Kitts and Nevis
  "LC": "🇱🇨", // Saint Lucia
  "RS": "🇷🇸", // Serbia
  "SY": "🇸🇾", // Syria
  "SK": "🇸🇰", // Slovakia
  "SI": "🇸🇮", // Slovenia
  "SB": "🇸🇧", // Solomon Islands
  "SO": "🇸🇴", // Somalia
  "SD": "🇸🇩", // Sudan
  "SR": "🇸🇷", // Suriname
  "TL": "🇹🇱", // East Timor
  "SL": "🇸🇱", // Sierra Leone
  "TJ": "🇹🇯", // Tajikistan
  "TZ": "🇹🇿", // Tanzania
  "TG": "🇹🇬", // Togo
  "TO": "🇹🇴", // Tonga
  "TT": "🇹🇹", // Trinidad and Tobago
  "TV": "🇹🇻", // Tuvalu
  "TN": "🇹🇳", // Tunisia
  "TM": "🇹🇲", // Turkmenistan
  "UG": "🇺🇬", // Uganda
  "HU": "🇭🇺", // Hungary
  "UZ": "🇺🇿", // Uzbekistan
  "UY": "🇺🇾", // Uruguay
  "FM": "🇫🇲", // Federated States of Micronesia
  "FJ": "🇫🇯", // Fiji
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

  const [currentLoggedInDoctorId, setCurrentLoggedInDoctorId] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
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

  const [isProfileCompletionModalVisible, setIsProfileCompletionModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState("Profile_doctor");

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
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      setCurrentLoggedInDoctorId(userId);
      registerForPushNotificationsAsync(userId);
    } else {
      setCurrentLoggedInDoctorId(null);
    }
  }, [session]);

  // --- FIX ---
  // Логіка повністю перероблена згідно з вашим поясненням.
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
      // 1. Спочатку завжди шукаємо повну анкету в `anketa_doctor`
      const { data: anketaData, error: anketaError } = await supabase
        .from('anketa_doctor')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Перевіряємо помилку. Ігноруємо 'PGRST116', яка означає "рядок не знайдено".
      if (anketaError && anketaError.code !== 'PGRST116') {
        throw anketaError;
      }

      if (anketaData) {
        // 2. Успіх: повна анкета знайдена, використовуємо її
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDoctorData(anketaData);
      } else {
        // 3. Повної анкети немає. Завантажуємо базові дані з `profile_doctor`
        const { data: profileData, error: profileError } = await supabase
          .from('profile_doctor')
          .select(`
            user_id,
            full_name,
            email,
            phone,
            country,
            doctor_points
          `)
          .eq('user_id', userId)
          .single();

        if (profileError) {
          throw profileError;
        }
        
        if (profileData) {
          // 4. Створюємо мінімальний об'єкт профілю.
          // Поля, що існують тільки в `anketa_doctor`, встановлюються в null.
          // `checkProfileCompleteness` правильно визначить його як неповний.
          const minimalProfile = {
            ...profileData, // Дані з profile_doctor
            // Явно встановлюємо поля з anketa_doctor в null, щоб UI не показував старі дані
            avatar_url: null, 
            communication_languages: null,
            specialization: null,
            experience_years: null,
            education: null,
            achievements: null,
            about_me: null,
            consultation_cost: null,
            diploma_url: null,
            certificate_photo_url: null,
            work_location: null,
            doctor_check: false, 
          };
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setDoctorData(minimalProfile);
        } else {
          // 5. Не знайдено навіть базового профілю
          setError('Не вдалося знайти профіль лікаря.');
        }
      }
    } catch (err) {
      console.error("Помилка при завантаженні профілю лікаря:", err);
      setError(err.message);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  }, [setLoadingAvatar, setLoadingDiploma, setLoadingCertificate]);


  const checkProfileCompleteness = useCallback((profile) => {
    if (!profile) return false;
    // Ця перевірка тепер працює коректно, оскільки вона завжди
    // аналізує дані, що прийшли з `anketa_doctor`.
    const isComplete =
      profile.full_name &&
      profile.avatar_url &&
      profile.consultation_cost !== null &&
      profile.consultation_cost !== undefined &&
      profile.experience_years !== null &&
      profile.experience_years !== undefined &&
      profile.work_location &&
      profile.achievements &&
      profile.about_me &&
      (profile.communication_languages && profile.communication_languages.length > 0) &&
      (profile.specialization && profile.specialization.length > 0) &&
      profile.diploma_url &&
      profile.certificate_photo_url;
    return isComplete;
  }, []);

  useEffect(() => {
    // Показуємо модальне вікно, тільки якщо це власник профілю і анкета не заповнена
    if (!isLoading && !error && isProfileOwner && !checkProfileCompleteness(doctorData)) {
      setIsProfileCompletionModalVisible(true);
    } else {
      setIsProfileCompletionModalVisible(false);
    }
  }, [doctorData, isLoading, error, isProfileOwner, checkProfileCompleteness]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Profile_doctor");
      const targetId = doctorIdFromParams || session?.user?.id;
      if (targetId && (!doctorData || doctorData.user_id !== targetId)) {
        fetchDoctorProfile(targetId);
      }
      return () => {};
    }, [doctorIdFromParams, session?.user?.id, doctorData, fetchDoctorProfile])
  );

  const fetchUnreadNotificationsCount = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const { count, error: countError } = await supabase
        .from("doctor_notifications")
        .select("id", { count: "exact" })
        .eq("doctor_id", userId)
        .eq("is_read", false);

      if (countError) {
        console.error(
          "Error fetching unread notifications count:",
          countError.message
        );
        setUnreadNotificationsCount(0);
      } else {
        setUnreadNotificationsCount(count || 0);
      }
    } catch (err)      {
      console.error(
        "Unexpected error fetching unread notifications count:",
        err
      );
      setUnreadNotificationsCount(0);
    }
  }, [session?.user?.id]);

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

  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
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
      case "Support_doctor":
        navigation.navigate("Support_doctor");
        break;
      case "Profile_doctor":
        // Already here, do nothing
        break;
      default:
        break;
    }
  };

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
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
      console.warn(
        "Warning: Invalid JSON format for array:",
        value,
        err
      );
      return [];
    }
  }, []);

  const getLanguages = useCallback(
    (languagesData) => {
      const parsedLanguages = getParsedArray(languagesData);
      return parsedLanguages.map((lang) => {
        if (typeof lang === 'object' && lang !== null && lang.code) {
          return String(lang.code).toUpperCase();
        }
        return String(lang).toUpperCase();
      }).filter(code => COUNTRY_FLAGS_MAP[code]);
    },
    [getParsedArray]
  );

  const getSpecializations = useCallback(
    (specializationData) => {
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
    },
    [getParsedArray, t]
  );

  const onRetry = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsProfileCompletionModalVisible(false);

    const targetId = doctorIdFromParams || session?.user?.id;
    if (targetId) {
      fetchDoctorProfile(targetId);
    } else {
      console.warn("Retry failed: Doctor ID missing.");
    }
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
    } else {
      console.warn("Cannot refresh: Doctor ID missing.");
    }
    setRefreshing(false);
  }, [fetchDoctorProfile, fetchUnreadNotificationsCount, doctorIdFromParams, session?.user?.id]);

  const finalDoctorData = doctorData || {};
  const defaultAvatarUrl = "https://placehold.co/100x100/E3F2FD/3498DB?text=No+Photo";

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
              {!isConnected
                ? t("check_connection")
                : error || t("error_fetching_doctor_data_general")}
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
            <Text style={styles.noDoctorText}>
              {t("doctor_not_found")}
            </Text>
            <TouchableOpacity
                style={styles.backToHomeButton}
                onPress={onBackToHome}
            >
                <Text style={styles.backToHomeButtonText}>{t("back_to_home")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showProfileContent ? (
        <>
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
            {isProfileOwner && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate("Messege")}
              >
                  <Ionicons name="notifications" size={moderateScale(24)} color="white" />
                  {unreadNotificationsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationNumber}>
                        {unreadNotificationsCount}
                      </Text>
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
                      style={styles.avatar}
                      onLoad={() => setLoadingAvatar(false)}
                      onError={() => {
                        setLoadingAvatar(false);
                        setAvatarError(true);
                        console.error("Error loading avatar image:", finalDoctorData.avatar_url);
                      }}
                    />
                    {loadingAvatar && !avatarError && (
                      <ActivityIndicator
                        size="large"
                        color="#0EB3EB"
                        style={styles.avatarLoadingIndicator}
                      />
                    )}
                  </>
                ) : (
                  <Image
                    source={{ uri: defaultAvatarUrl }}
                    style={styles.avatar}
                  />
                )}
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>
                  {finalDoctorData.full_name || t("not_specified")}
                </Text>
                <View style={styles.infoRowDynamic}>
                  <Text style={styles.label}>{t("rating")}:</Text>
                  <ValueBox t={t}>
                    {Array.from({ length: getStarRating(finalDoctorData.doctor_points) }).map((_, i) => (
                      <Ionicons key={`star-full-${i}`} name="star" size={18} color="#FFD700" />
                    ))}
                    {Array.from({ length: 5 - getStarRating(finalDoctorData.doctor_points) }).map((_, i) => (
                      <Ionicons key={`star-outline-${i}`} name="star-outline" size={18} color="#ccc" />
                    ))}
                  </ValueBox>
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
                <Text style={styles.actionButtonText}>
                  {t("choose_consultation_time")}
                </Text>
            </TouchableOpacity>
            
            {isProfileOwner && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleProfileDoctorSettingsPress}
              >
                  <Animated.View style={{ transform: [{ rotate: settingsIconRotate }] }}>
                      <Ionicons name="settings-outline" size={24} color="white" style={styles.buttonIcon} />
                  </Animated.View>
                  <Text style={styles.actionButtonText}>
                    {t("profile_doctor_settings")}
                  </Text>
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

            {finalDoctorData.diploma_url ? (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
                <View style={styles.imageWrapper}>
                  {loadingDiploma && !diplomaError && (
                    <ActivityIndicator
                      size="large"
                      color="#0EB3EB"
                      style={styles.imageLoadingIndicator}
                    />
                  )}
                  <Image
                    key={finalDoctorData.diploma_url}
                    source={{ uri: finalDoctorData.diploma_url }}
                    style={styles.documentImage}
                    onLoad={() => setLoadingDiploma(false)}
                    onError={() => {
                      setLoadingDiploma(false);
                      setDiplomaError(true);
                      console.error("Error loading diploma image:", finalDoctorData.diploma_url);
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>{t("diploma_photo")}</Text>
                <View style={styles.imageWrapper}>
                  <Text style={styles.noImageText}>{t("no_diploma_photo")}</Text>
                </View>
              </View>
            )}
            
            {finalDoctorData.certificate_photo_url ? (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>{t("certificate_photo")}</Text>
                <View style={styles.imageWrapper}>
                  {loadingCertificate && !certificateError && (
                    <ActivityIndicator
                      size="large"
                      color="#0EB3EB"
                      style={styles.imageLoadingIndicator}
                    />
                  )}
                  <Image
                    key={finalDoctorData.certificate_photo_url}
                    source={{ uri: finalDoctorData.certificate_photo_url }}
                    style={styles.documentImage}
                    onLoad={() => setLoadingCertificate(false)}
                    onError={() => {
                      setLoadingCertificate(false);
                      setCertificateError(true);
                      console.error("Error loading certificate image:", finalDoctorData.certificate_photo_url);
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>{t("certificate_photo")}</Text>
                <View style={styles.imageWrapper}>
                  <Text style={styles.noImageText}>{t("no_certificate_photo")}</Text>
                </View>
              </View>
            )}
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
                  onPress={() => {}}
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

          {isProfileOwner && !checkProfileCompleteness(doctorData) && (
            <Modal
              animationType="fade"
              transparent={true}
              visible={isProfileCompletionModalVisible}
              onRequestClose={() => {
                setIsProfileCompletionModalVisible(false);
              }}
            >
              <Pressable
                style={styles.modalOverlay}
                onPressOut={() => setIsProfileCompletionModalVisible(false)}
              >
                <TouchableWithoutFeedback>
                  <View style={styles.modalView}>
                    <Ionicons
                      name="information-circle-outline"
                      size={scale(60)}
                      color="#0EB3EB"
                      style={styles.modalIcon}
                    />
                    <Text style={styles.modalTitle}>{t("complete_profile_title")}</Text>
                    <Text style={styles.modalText}>{t("complete_profile_message")}</Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={onGoToAnketa}
                    >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ? 5 : 10) : 0,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 20,
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
    fontFamily: "Mont-Regular",
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
    fontFamily: "Mont-SemiBold",
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
    fontFamily: "Mont-Bold",
  },
  goToAnketaButton: {
    borderRadius: 30,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: "#28A745",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  goToAnketaButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  noDoctorContainer: {
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
  noDoctorText: {
    fontSize: 20,
    textAlign: "center",
    color: "#000000",
    marginTop: 25,
    fontWeight: "600",
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
  },
  header: {
  flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 5,
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
    fontWeight: "bold",
    color: "white",
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(22),
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 0,
    paddingVertical: 10,
    right: 0,
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
    fontWeight: "bold",
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
    fontWeight: "600",
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
    fontWeight: "400",
  },
  noValueText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    fontWeight: "400",
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
    textAlign: "center",
    flex: 1,
  },
  buttonIcon: {
    // Стилі для іконки
  },
  sectionTitleLink: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0EB3EB",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    fontWeight: "bold",
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
    fontWeight: "600",
    borderBottomWidth: 0,
    paddingBottom: 0,
    textAlign: 'center',
  },
  sectionContent: {
    fontSize: 16,
    color: "#555",
    lineHeight: 26,
    fontWeight: "400",
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
  noImageText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "400",
    paddingVertical: 25,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalView: {
    margin: moderateScale(20),
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    padding: moderateScale(35),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: isLargeScreen ? "50%" : "90%",
    maxWidth: 400,
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
    width: width * 0.8,
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
    fontSize: 22,
    fontFamily: "Mont-Bold",
    marginBottom: 20,
    color: "#0EB3EB",
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.3)",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
    textAlign: 'center',
    flexWrap: 'wrap',
  },
   modalButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(20),
    elevation: 2,
    minWidth: moderateScale(80),
    marginBottom: moderateScale(10),
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: moderateScale(16),
    fontFamily: "Mont-SemiBold",

  },
  modalText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Regular",
    color: "#555",
    marginBottom: moderateScale(25),
    textAlign: "center",
    lineHeight: moderateScale(22),
  },
  modalCancelButton: {
    marginTop: moderateScale(10),
  },
  modalCancelButtonText: {
    color: '#6c757d',
    fontSize: moderateScale(14),
    fontFamily: 'Mont-Regular',
  },
  modalIcon: {
    marginBottom: moderateScale(15),
  },
});

export default Profile_doctor;
