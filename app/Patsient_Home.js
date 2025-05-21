import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../assets/icon.svg";
import People from "../assets/Main/people.svg";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider";
import TabBar from "../components/TopBar.js"; // Переконайтеся, що шлях правильний

// --- Імпорти для i18n ---
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

const { width } = Dimensions.get("window");
const containerWidth = width * 0.9;

// --- Об'єкт з перекладами для Patsient_Home ---
const translations = {
  en: {
    selectLanguage: "Select Language",
    ukrainian: "🇺🇦 Ukrainian",
    english: "🇬🇧 English",
    chooseDoctorSpecialization: "Choose Doctor's Specialization",
    search: "Search",
    notifications: "Notifications",
    home: "Home",
    questions: "Questions",
    support: "Support",
    favorites: "Favorites",
    error: "Error",
    pleaseEnterText: "Please enter text to save.",
    loadingUserData: "Loading user data...",
    notAuthorized: "You are not authorized. Please log in.",
    saveError: "Failed to save information: %{error}",
    saveSuccess: "Information successfully successfully saved!",
    unknownError: "An unknown error occurred.",
    signOut: "Sign Out",
    signOutError: "Failed to sign out: %{error}",
    signOutSuccess: "You have successfully signed out.",
    // Додано переклади для спеціалізацій (мінімум 20)
    traumatologist: "Traumatologist",
    pediatrician: "Pediatrician",
    gynecologist: "Gynecologist",
    ent: "ENT",
    surgeon: "Surgeon",
    cardiologist: "Cardiologist",
    dentist: "Dentist",
    dermatologist: "Dermatologist",
    ophthalmologist: "Ophthalmologist",
    neurologist: "Neurologist",
    endocrinologist: "Endocrinologist",
    gastroenterologist: "Gastroenterologist",
    urologist: "Urologist",
    pulmonologist: "Pulmonologist",
    nephrologist: "Nephrologist",
    rheumatologist: "Rheumatologist",
    oncologist: "Oncologist",
    allergist: "Allergist",
    infectiousDiseasesSpecialist: "Infectious Diseases Specialist",
    psychiatrist: "Psychiatrist",
    psychologist: "Psychologist",
    physiotherapist: "Physiotherapist",
    nutritionist: "Nutritionist",
    radiologist: "Radiologist",
    anesthesiologist: "Anesthesiologist",
    goTo: "Go to",
    selectSpecialization: "Select Specialization",
    cancel: "Cancel", // Переклад для кнопки "Скасувати"
  },
  ua: {
    selectLanguage: "Оберіть мову",
    ukrainian: "🇺🇦 Українська",
    english: "🇬🇧 English",
    chooseDoctorSpecialization: "Оберіть спеціалізацію лікаря",
    search: "Пошук",
    notifications: "Сповіщення",
    home: "Головна",
    questions: "Питання",
    support: "Підтримка",
    favorites: "Вибране",
    error: "Помилка",
    pleaseEnterText: "Будь ласка, введіть текст для збереження.",
    loadingUserData: "Завантаження даних користувача...",
    notAuthorized: "Ви не авторизовані. Будь ласка, увійдіть.",
    saveError: "Не вдалося зберегти інформацію: %{error}",
    saveSuccess: "Інформація успішно збережена!",
    unknownError: "Виникла невідома помилка.",
    signOut: "Вихід",
    signOutError: "Не вдалося вийти: %{error}",
    signOutSuccess: "Ви успішно вийшли.",
    // Додано переклади для спеціалізацій (мінімум 20)
    traumatologist: "Травматолог",
    pediatrician: "Педіатр",
    gynecologist: "Гінеколог",
    ent: "Лор",
    surgeon: "Хірург",
    cardiologist: "Кардіолог",
    dentist: "Стоматолог",
    dermatologist: "Дерматолог",
    ophthalmologist: "Офтальмолог",
    neurologist: "Невролог",
    endocrinologist: "Ендокринолог",
    gastroenterologist: "Гастроентеролог",
    urologist: "Уролог",
    pulmonologist: "Пульмонолог",
    nephrologist: "Нефролог",
    rheumatologist: "Ревматолог",
    oncologist: "Онколог",
    allergist: "Алерголог",
    infectiousDiseasesSpecialist: "Інфекціоніст",
    psychiatrist: "Психіатр",
    psychologist: "Психолог",
    physiotherapist: "Фізіотерапевт",
    nutritionist: "Дієтолог",
    radiologist: "Радіолог",
    anesthesiologist: "Анестезіолог",
    goTo: "Перейти",
    selectSpecialization: "Оберіть спеціалізацію",
    cancel: "Скасувати", // Переклад для кнопки "Скасувати"
  },
};

// Ініціалізація i18n
const i18n = new I18n(translations);
i18n.enableFallback = true; // Використовувати резервну мову, якщо переклад відсутній

// Встановлюємо початкову мову з налаштувань пристрою або за замовчуванням
const getDeviceLanguage = () => {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    const deviceLanguageCode = locales[0].languageCode;
    // Перевіряємо, чи підтримуємо ми цю мову, інакше встановлюємо 'ua'
    return translations[deviceLanguageCode] ? deviceLanguageCode : "ua";
  }
  return "ua"; // За замовчуванням українська
};

i18n.locale = getDeviceLanguage();

// Список спеціалізацій лікарів (мінімум 20)
const doctorSpecializations = [
  { key: "traumatologist", nameKey: "traumatologist" },
  { key: "pediatrician", nameKey: "pediatrician" },
  { key: "gynecologist", nameKey: "gynecologist" },
  { key: "ent", nameKey: "ent" },
  { key: "surgeon", nameKey: "surgeon" },
  { key: "cardiologist", nameKey: "cardiologist" },
  { key: "dentist", nameKey: "dentist" },
  { key: "dermatologist", nameKey: "dermatologist" },
  { key: "ophthalmologist", nameKey: "ophthalmologist" },
  { key: "neurologist", nameKey: "neurologist" },
  { key: "endocrinologist", nameKey: "endocrinologist" },
  { key: "gastroenterologist", nameKey: "gastroenterologist" },
  { key: "urologist", nameKey: "urologist" },
  { key: "pulmonologist", nameKey: "pulmonologist" },
  { key: "nephrologist", nameKey: "nephrologist" },
  { key: "rheumatologist", nameKey: "rheumatologist" },
  { key: "oncologist", nameKey: "oncologist" },
  { key: "allergist", nameKey: "allergist" },
  {
    key: "infectiousDiseasesSpecialist",
    nameKey: "infectiousDiseasesSpecialist",
  },
  { key: "psychiatrist", nameKey: "psychiatrist" },
  { key: "psychologist", nameKey: "psychologist" },
  { key: "physiotherapist", nameKey: "physiotherapist" },
  { key: "nutritionist", nameKey: "nutritionist" },
  { key: "radiologist", nameKey: "radiologist" },
  { key: "anesthesiologist", nameKey: "anesthesiologist" },
];

const Patsient_Home = () => {
  const navigation = useNavigation();
  const { session, loading: authLoading } = useAuth();
  const [personalInfoText, setPersonalInfoText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Home"); // Початкова активна вкладка
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setSpecializationModalVisible] =
    useState(false);

  // Стан для відображення поточної вибраної мови на кнопці
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.locale.toUpperCase()
  );

  useEffect(() => {
    const updateDimensions = () => {};
    updateDimensions();
    if (Platform.OS === "web") {
      const handleResize = () => updateDimensions();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      const subscription = Dimensions.addEventListener(
        "change",
        updateDimensions
      );
      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, []);

  // Оновлюємо мову i18n та текст на кнопці, коли користувач змінює мову через модальне вікно
  useEffect(() => {
    setDisplayedLanguageCode(i18n.locale.toUpperCase());
  }, [i18n.locale]);

  const handleSaveInfo = async () => {
    if (!personalInfoText.trim()) {
      Alert.alert(i18n.t("error"), i18n.t("pleaseEnterText"));
      return;
    }

    if (authLoading) {
      Alert.alert(i18n.t("loadingUserData"));
      return;
    }

    if (!session?.user) {
      Alert.alert(i18n.t("error"), i18n.t("notAuthorized"));
      navigation.navigate("LoginScreen"); // Можливо, "Auth" або "Welcome"
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("user_notes").insert([
        {
          user_id: session.user.id,
          note_text: personalInfoText.trim(),
        },
      ]);

      if (error) {
        console.error("Помилка збереження інформації:", error);
        Alert.alert(
          i18n.t("error"),
          i18n.t("saveError", { error: error.message })
        );
      } else {
        Alert.alert(i18n.t("saveSuccess"));
        setPersonalInfoText("");
      }
    } catch (err) {
      console.error("Загальна помилка при збереженні інформації:", err);
      Alert.alert(i18n.t("error"), i18n.t("unknownError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Помилка виходу:", error.message);
      Alert.alert(
        i18n.t("error"),
        i18n.t("signOutError", { error: error.message })
      );
    } else {
      Alert.alert(i18n.t("signOut"), i18n.t("signOutSuccess"));
      navigation.navigate("LoginScreen"); // Перенаправлення на екран входу
    }
  };

  const openLanguageModal = () => {
    setLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setLanguageModalVisible(false);
  };

  const handleLanguageSelect = (langCode) => {
    i18n.locale = langCode; // Змінюємо поточну локаль i18n
    setDisplayedLanguageCode(langCode.toUpperCase()); // Оновлюємо код мови на кнопці
    closeLanguageModal();
  };

  // Функції для модального вікна спеціалізацій
  const openSpecializationModal = () => {
    setSpecializationModalVisible(true);
  };

  const closeSpecializationModal = () => {
    setSpecializationModalVisible(false);
  };

  const handleSpecializationSelect = (specializationKey) => {
    Alert.alert("Обрано спеціалізацію", i18n.t(specializationKey));
    closeSpecializationModal();
    // Тут можна додати логіку для переходу до відповідного екрана або фільтрації лікарів
  };

  return (
    <View style={styles.fullScreenContainer}>
      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              {/* Логотип */}
              <View style={styles.logoContainer}>
                <Icon width={50} height={50} />
              </View>
              {/* Кнопка вибору мови */}
              <TouchableOpacity
                style={styles.languageButton}
                onPress={openLanguageModal}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.languageText}>
                    {displayedLanguageCode}
                  </Text>
                  <Ionicons
                    name="chevron-down-outline"
                    size={16}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
              {/* Іконка сповіщень */}
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationNumber}>5</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Main Content Section */}
            <View style={styles.mainContent}>
              {/* Кнопка вибору спеціалізації лікаря */}
              <TouchableOpacity
                style={styles.specializationButton}
                onPress={openSpecializationModal}
              >
                <Text style={styles.specializationText}>
                  {i18n.t("chooseDoctorSpecialization")}
                </Text>
              </TouchableOpacity>

              {/* Зображення лікарів */}
              <View style={styles.doctorsImageContainer}>
                <People style={styles.peopleImage} />
              </View>

              {/* Поле пошуку */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#BDBDBD"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={i18n.t("search")}
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* TabBar внизу екрана */}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} i18n={i18n} />

      {/* Модальне вікно для вибору мови */}
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
                /* Залишаємо порожньою, щоб не закривати модалку при натисканні всередині */
              }}
            >
              <View style={styles.languageModalContent}>
                <Text style={styles.modalTitle}>
                  {i18n.t("selectLanguage")}
                </Text>
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageSelect("ua")}
                >
                  <Text style={styles.languageOptionText}>
                    {i18n.t("ukrainian")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, { borderBottomWidth: 0 }]}
                  onPress={() => handleLanguageSelect("en")}
                >
                  <Text style={styles.languageOptionText}>
                    {i18n.t("english")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Модальне вікно для вибору спеціалізації лікаря */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSpecializationModalVisible}
        onRequestClose={closeSpecializationModal}
      >
        {/* Зовнішній TouchableWithoutFeedback для закриття модального вікна при натисканні поза ним */}
        <TouchableWithoutFeedback onPress={closeSpecializationModal}>
          <View style={styles.modalOverlay}>
            {/* Внутрішній TouchableWithoutFeedback, щоб натискання на вміст модального вікна не закривало його.
                ВАЖЛИВО: додаємо onPress={() => {}} */}
            <TouchableWithoutFeedback
              onPress={() => {
                /* Залишаємо порожньою, щоб не закривати модалку */
              }}
            >
              <View style={styles.specializationModalContent}>
                <View style={styles.specializationModalHeader}>
                  <Text style={styles.specializationModalTitle}>
                    {i18n.t("selectSpecialization")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeSpecializationModal}
                  >
                    <Text style={styles.modalCloseButtonText}>
                      {i18n.t("cancel")}
                    </Text>
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="#0EB3EB"
                      style={{ marginLeft: 5 }}
                    />
                  </TouchableOpacity>
                </View>
                {/* ScrollView для прокрутки списку спеціалізацій */}
                <ScrollView
                  style={styles.specializationScrollView}
                  contentContainerStyle={styles.specializationScrollViewContent}
                  // Додано для Android, щоб прокрутка працювала за межами вмісту
                  // removeClippedSubviews={false} // Може бути корисним, але потенційно знижує продуктивність
                  // scrollEnabled={true} // Явно вмикаємо прокрутку (за замовчуванням true)
                >
                  {doctorSpecializations.map((spec) => (
                    <View key={spec.key} style={styles.specializationItem}>
                      <Text style={styles.specializationItemText}>
                        {i18n.t(spec.nameKey)}
                      </Text>
                      <TouchableOpacity
                        style={styles.goToButton}
                        onPress={() => handleSpecializationSelect(spec.nameKey)}
                      >
                        <Text style={styles.goToButtonText}>
                          {i18n.t("goTo")}
                        </Text>
                        <Ionicons
                          name="play"
                          size={14}
                          color="white"
                          style={{ marginLeft: 5 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 90,
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // Розподіляє елементи по ширині
    alignItems: "center",
    width: containerWidth,
    height: 60,
    marginTop: 10,
    zIndex: 10,
  },
  logoContainer: {
    paddingLeft: 5,
  },
  languageButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    width: 71,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center", // Центрування в межах row
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginHorizontal: 5,
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
  mainContent: {
    flex: 1,
    alignItems: "center",
    width: containerWidth,
    paddingTop: 20,
    paddingBottom: 20,
  },
  specializationButton: {
    marginTop: 30,
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "90%",
    height: 52,
    alignItems: "center",
    marginBottom: 50,
  },
  specializationText: {
    fontSize: 18,
    fontFamily: "Mont-Bold",
    color: "white",
  },
  doctorsImageContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: "100%",
    marginBottom: 10,
  },
  peopleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    height: 52,
    marginTop: 50,
  },
  searchIcon: {
    marginRight: 10,
    color: "#BDBDBD",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingLeft: 0,
    borderWidth: 0,
    color: "#212121",
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
    padding: 20,
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
    color: "#333333",
  },

  // Стилі для модального вікна спеціалізацій
  specializationModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.75,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  specializationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  specializationModalTitle: {
    fontSize: 22,
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
    marginLeft: 40,
  },
  modalCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: "#0EB3EB",
  },
  // *** Ключові стилі для ScrollView в модальному вікні ***
  specializationScrollView: {
    width: "100%", // Дозволяє ScrollView займати всю доступну ширину
  },
  specializationScrollViewContent: {
    flexGrow: 1, // Не потрібно, якщо flex: 1 на specializationScrollView
  },
  specializationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  specializationItemText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
    flex: 1,
    marginRight: 10,
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goToButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Mont-Bold",
  },
});

export default Patsient_Home;
