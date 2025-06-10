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
  Platform, // <-- ДОДАНО
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from 'expo-notifications'; // <-- ДОДАНО
import * as Device from 'expo-device';     // <-- ДОДАНО


const { width } = Dimensions.get("window");

// ДОДАНО: Конфігурація обробника сповіщень для Expo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ДОДАНО: Функція для реєстрації push-сповіщень
async function registerForPushNotificationsAsync(userId) {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Помилка', 'Не вдалося отримати токен для push-сповіщень! Перевірте дозволи в налаштуваннях вашого пристрою.');
      console.error('Failed to get push token for push notification!');
      return;
    }

    try {
      // !!! ВАЖЛИВО: Замініть 'your-expo-project-id' на реальний ID вашого Expo проекту.
      // Його можна знайти в файлі app.json у полі 'extra.eas.projectId' або просто 'projectId'.
      // Якщо ви не використовуєте EAS build, то може бути і без projectId.
      token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-expo-project-id' })).data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      console.error("Error getting Expo push token:", e);
      Alert.alert('Помилка', 'Не вдалося отримати токен сповіщень. Перевірте підключення.');
      return;
    }

  } else {
    // Це повідомлення з'явиться, якщо ви запускаєте на емуляторі/симуляторі
    Alert.alert('Помилка', 'Push-сповіщення працюють лише на фізичних пристроях!');
    console.log('Must use physical device for Push Notifications');
    return; // Немає сенсу продовжувати, якщо не фізичний пристрій
  }

  // Зберігаємо токен у Supabase
  if (token && userId) {
    const { data, error } = await supabase
      .from('profile_doctor') // Ваша таблиця для профілів лікарів
      .update({ notification_token: token })
      .eq('user_id', userId); // Припускаємо, що у вас є 'user_id' як ідентифікатор користувача в цій таблиці.

    if (error) {
      console.error("Error saving notification token to Supabase:", error.message);
      // Можна відобразити Alert, але, можливо, це не критично для користувача, якщо токен не зберігся
      // Alert.alert('Помилка', `Не вдалося зберегти токен сповіщень: ${error.message}`);
    } else {
      console.log("Notification token saved successfully for doctor user_id:", userId);
    }
  }

  return token;
}


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

  // Забезпечте, що doctorId є числовим або рядковим і не undefined
  const doctorId = route.params?.doctorId ? String(route.params.doctorId) : null;

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

  // Стан для відстеження помилок завантаження зображень
  const [avatarError, setAvatarError] = useState(false);
  const [certificateError, setCertificateError] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);

  // !!! ДОДАНО: Стан для зберігання user_id поточного лікаря
  const [currentDoctorUserId, setCurrentDoctorUserId] = useState(null);

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);


  // ДОДАНО: useEffect для отримання user_id поточного лікаря
  useEffect(() => {
    const getDoctorSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting doctor user session:", error.message);
        // Можливо, перенаправити на екран входу, якщо сесія не дійсна
        // navigation.replace('Auth');
        return;
      }
      if (user) {
        setCurrentDoctorUserId(user.id);
      } else {
        // Якщо користувача немає, можливо, він не увійшов як лікар
        console.log("No doctor user session found.");
      }
    };
    getDoctorSession();
  }, []); // Пустий масив залежностей означає, що цей ефект запускається один раз при монтажі


  // ДОДАНО: useEffect для реєстрації push-токенів, коли user_id лікаря доступний
  useEffect(() => {
    if (currentDoctorUserId) {
      registerForPushNotificationsAsync(currentDoctorUserId);
    }
    // Зауваження: Слухачі сповіщень (addNotificationReceivedListener, addNotificationResponseReceivedListener)
    // тепер розміщені у файлі Messege.js, тому тут їх додавати не потрібно,
    // якщо Messege.js є постійно активним або викликається при старті додатку.
    // Якщо Messege.js викликається тільки тоді, коли користувач переходить на екран повідомлень,
    // то вам потрібно буде переконатися, що Messege.js монтується і слухачі активуються
    // при запуску додатку або що слухачі для фонового режиму/закритого додатку налаштовані в App.js.
    // Для простоти, ми вважаємо, що Messege.js достатньо активний, коли лікар відкриває додаток.

  }, [currentDoctorUserId]); // Цей ефект спрацює, коли currentDoctorUserId буде встановлено

  // Функція для форматування досвіду роботи (як у ChooseSpecial)
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

    // ВАЖЛИВО: Використовуйте `currentDoctorUserId`, якщо це профіль *поточного* увійшовшого лікаря
    // Якщо цей компонент використовується для перегляду профілю *будь-якого* лікаря (наприклад, з пошуку пацієнтом),
    // то використовуйте `doctorId` з `route.params`.
    // Якщо це профіль лікаря, який дивиться *свій власний* профіль, то `doctorId` з `route.params` може бути null,
    // і тоді треба використовувати `currentDoctorUserId`.
    // Я припускаю, що цей екран може бути як для перегляду власного профілю, так і чужого.
    // Тож, ID для запиту:
    const idToFetch = doctorId || currentDoctorUserId; // Спершу беремо з параметрів, потім з сесії

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
      console.error("Unexpected error during data fetch:", err);
      setError(`${t("unexpected_error")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentDoctorUserId, t]); // Додаємо currentDoctorUserId до залежностей

  // Важливо: перевірте, чи `fetchDoctorData` не викликається безкінечно
  // Якщо `doctorId` не змінюється, а `currentDoctorUserId` встановлюється тільки один раз,
  // то це повинно бути нормально. Якщо `fetchDoctorData` залежить від `doctor` або іншого стану,
  // це може створити циклічну залежність.
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
    // Якщо це власний профіль лікаря (тобто doctorId з route.params може бути null),
    // то для навігації в ConsultationTime потрібен user_id поточного лікаря.
    // Якщо це чужий профіль, використовуємо doctorId з route.params.
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
        {/* Іконка сповіщень */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Messege")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="white"
          />
          {/* Цей бейдж "5" статичний, його потрібно буде оновити динамічно */}
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationNumber}>5</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewContent}>
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