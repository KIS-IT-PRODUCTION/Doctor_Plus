// Patsient_Home.js
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

// --- ВАЖЛИВО: ВИКОРИСТОВУЄМО ХУК useTranslation З react-i18next ---
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const containerWidth = width * 0.9;

// Список спеціалізацій лікарів (ключі повинні відповідати ключам у файлах перекладів)
// Цей список можна також винести у окремий файл або навіть завантажувати динамічно.
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
  // --- ВИКОРИСТОВУЄМО ХУК useTranslation ДЛЯ ДОСТУПУ ДО t ТА i18n ---
  const { t, i18n } = useTranslation();

  const [personalInfoText, setPersonalInfoText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setSpecializationModalVisible] =
    useState(false);

  // Стан для відображення поточної вибраної мови на кнопці.
  // Завдяки i18next і React, цей стан буде автоматично оновлюватися,
  // коли змінюється i18n.language.
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase() // i18n.language містить поточний код мови
  );

  // Оновлюємо код мови на кнопці, коли змінюється мова i18n
  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]); // Залежність від i18n.language

  // Обробка розмірів екрана (залишаємо без змін, оскільки це не стосується i18n)
  useEffect(() => {
    const updateDimensions = () => {
      // Додано логіку оновлення розмірів, якщо потрібно
      // setDimensions({ width: Dimensions.get("window").width, height: Dimensions.get("window").height });
    };
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

  const handleSaveInfo = async () => {
    if (!personalInfoText.trim()) {
      Alert.alert(t("error_title"), t("pleaseEnterText")); // Використовуємо t()
      return;
    }

    if (authLoading) {
      Alert.alert(t("loadingUserData")); // Використовуємо t()
      return;
    }

    if (!session?.user) {
      Alert.alert(t("error_title"), t("notAuthorized")); // Використовуємо t()
      navigation.navigate("LoginScreen");
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
          t("error_title"), // Використовуємо t()
          t("saveError", { error: error.message }) // Використовуємо t()
        );
      } else {
        Alert.alert(t("saveSuccessTitle"), t("saveSuccessMessage")); // Використовуємо t()
        setPersonalInfoText("");
      }
    } catch (err) {
      console.error("Загальна помилка при збереженні інформації:", err);
      Alert.alert(t("error_title"), t("unknownError")); // Використовуємо t()
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    // Підтвердження виходу
    Alert.alert(
      t("logout_confirm_title"), // Заголовок
      t("logout_confirm_message"), // Повідомлення
      [
        {
          text: t("no"), // Кнопка "Ні"
          style: "cancel",
        },
        {
          text: t("yes"), // Кнопка "Так"
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Помилка виходу:", error.message);
              Alert.alert(
                t("error_title"), // Використовуємо t()
                t("signOutError", { error: error.message }) // Використовуємо t()
              );
            } else {
              Alert.alert(t("signOutSuccessTitle"), t("signOutSuccessMessage")); // Використовуємо t()
              navigation.navigate("LoginScreen");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const openLanguageModal = () => {
    setLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setLanguageModalVisible(false);
  };

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode); // --- ВАЖЛИВО: Правильний метод для i18next ---
    closeLanguageModal();
  };

  const openSpecializationModal = () => {
    setSpecializationModalVisible(true);
  };

  const closeSpecializationModal = () => {
    setSpecializationModalVisible(false);
  };

  const handleSpecializationSelect = (specializationKey) => {
    // --- ВИПРАВЛЕНО: Використовуємо повний шлях до ключа спеціалізації ---
    Alert.alert(
      t("selectSpecialization"),
      t("categories." + specializationKey)
    ); // Використовуємо t()
    closeSpecializationModal();
    // Тут можна додати логіку для переходу до відповідного екрана або фільтрації лікарів
  };

  // Оновлені languages для модального вікна
  const languagesForModal = [
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" }, // Змінено "ua" на "uk"
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
  ];

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
                  {t("chooseDoctorSpecialization")} {/* Використовуємо t() */}
                </Text>
              </TouchableOpacity>

              {/* Зображення лікарів */}
              <View style={styles.doctorsImageContainer}>
                <People style={styles.peopleImage} />
              </View>

              {/* Поле пошуку */}
              <TouchableOpacity
                style={styles.searchContainer}
                onPress={() => navigation.navigate("Search")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="#BDBDBD"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("search_placeholder")} // Використовуємо t()
                  placeholderTextColor="#BDBDBD"
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* TabBar внизу екрана */}
      {/* Передаємо i18n до TabBar, якщо він також використовує переклади */}
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
                <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
                {languagesForModal.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.languageOption,
                      {
                        borderBottomWidth: item.code === "en" ? 0 : 1, // Останній елемент без нижньої лінії
                      },
                    ]}
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

      {/* Модальне вікно для вибору спеціалізації лікаря */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSpecializationModalVisible}
        onRequestClose={closeSpecializationModal}
      >
        <TouchableWithoutFeedback onPress={closeSpecializationModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                /* Залишаємо порожньою, щоб не закривати модалку */
              }}
            >
              <View style={styles.specializationModalContent}>
                <View style={styles.specializationModalHeader}>
                  <Text style={styles.specializationModalTitle}>
                    {t("selectSpecialization")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeSpecializationModal}
                  >
                    <Text style={styles.modalCloseButtonText}>
                      {t("cancel")}
                    </Text>
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="#0EB3EB"
                      style={{ marginLeft: 5 }}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.specializationScrollView}
                  contentContainerStyle={styles.specializationScrollViewContent}
                >
                  {doctorSpecializations.map((spec) => (
                    <View key={spec.key} style={styles.specializationItem}>
                      {/* --- ВИПРАВЛЕНО: Використовуємо повний шлях до ключа спеціалізації --- */}
                      <Text style={styles.specializationItemText}>
                        {t("categories." + spec.nameKey)}
                      </Text>
                      <TouchableOpacity
                        style={styles.goToButton}
                        onPress={() => handleSpecializationSelect(spec.nameKey)}
                      >
                        <Text style={styles.goToButtonText}>{t("goTo")}</Text>
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
    justifyContent: "space-between",
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
    alignSelf: "center",
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Regular", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Regular", // Переконайтеся, що цей шрифт завантажено
    color: "#333333",
  },

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
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Regular", // Переконайтеся, що цей шрифт завантажено
    color: "#0EB3EB",
  },
  specializationScrollView: {
    width: "100%",
  },
  specializationScrollViewContent: {
    flexGrow: 1,
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
    fontFamily: "Mont-Regular", // Переконайтеся, що цей шрифт завантажено
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
    fontFamily: "Mont-Bold", // Переконайтеся, що цей шрифт завантажено
  },
});

export default Patsient_Home;
