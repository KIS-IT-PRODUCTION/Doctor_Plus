import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  TouchableWithoutFeedback, // Додано для закриття модального вікна при дотику до фону
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// Svg та Path більше не потрібні для кнопки мови, якщо використовуємо Ionicons
import { Svg, Path } from "react-native-svg";
import { supabase } from "../providers/supabaseClient"; // Переконайтеся, що цей файл правильно налаштований
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

// Встановіть пари ключ-значення для різних мов, які ви хочете підтримувати.
const translations = {
  en: {
    greeting: "Registration",
    registration_subtitle: "Start taking care of yourself — by registering",
    select_country: "Select your country of residence",
    fullname: "Full Name",
    placeholder_fullname: "Enter Your Name",
    email: "Email",
    placeholder_email: "Enter Your Email",
    password: "Password",
    placeholder_password: "Enter Your Password",
    phone: "Phone",
    placeholder_optional: "Optional",
    register: "Sign Up",
    registering: "Signing Up...",
    already_registered: "Already registered?",
    login: "Log In",
    select_country_modal_title: "Select Country",
    cancel: "Cancel",
    select_language_modal_title: "Select Language",
    language: "Language", // Це більше не буде використовуватися як основний текст кнопки, але можна залишити
    error_empty_fullname: "Please enter your full name.",
    error_empty_email: "Please enter your email.",
    error_empty_password: "Please enter your password.",
    error_short_password: "Password must be at least 6 characters.",
    error_registration_failed: "Failed to register: %{error}",
    error_profile_save_failed: "Failed to save additional information.",
    success_title: "Success",
    success_registration_message:
      "Your registration will be completed! Please check your email for confirmation.",
    error_general_registration_failed: "Failed to complete registration.",
    error_email_in_use: "This email is already in use.",
    error_invalid_email: "Invalid email.",
    error_weak_password: "Password is too weak.",
    // Додаємо переклади для модального вікна мови, як у Patsient_Home
    selectLanguage: "Select Language",
    ukrainian: "🇺🇦 Ukrainian",
    english: "🇬🇧 English",
  },
  ua: {
    greeting: "Реєстрація",
    registration_subtitle: "Почніть піклуватися про себе — з реєстрації",
    select_country: "Обрати країну проживання",
    fullname: "Повне Ім’я",
    placeholder_fullname: "Введіть Ваше Ім'я",
    email: "Пошта",
    placeholder_email: "Введіть Вашу електронну пошту",
    password: "Пароль",
    placeholder_password: "Введіть Ваш пароль",
    phone: "Телефон",
    placeholder_optional: "Необов'язково",
    register: "Зареєструватися",
    registering: "Реєстрація...",
    already_registered: "Вже зареєстровані?",
    login: "Увійти",
    select_country_modal_title: "Виберіть країну",
    cancel: "Скасувати",
    select_language_modal_title: "Виберіть мову",
    language: "Мова", // Це більше не буде використовуватися як основний текст кнопки, але можна залишити
    error_empty_fullname: "Будь ла ласка, введіть ваше повне ім'я.",
    error_empty_email: "Будь ла ласка, введіть вашу електронну пошту.",
    error_empty_password: "Будь ла ласка, введіть пароль.",
    error_short_password: "Пароль повинен містити щонайменше 6 символів.",
    error_registration_failed: "Не вдалося зареєструватися: %{error}",
    error_profile_save_failed: "Не вдалося зберегти додаткову інформацію.",
    success_title: "Успішно",
    success_registration_message:
      "Вашу реєстрацію буде завершено! Будь ласка, перевірте свою пошту для підтвердження.",
    error_general_registration_failed: "Не вдалося завершити реєстрацію.",
    error_email_in_use: "Ця електронна пошта вже використовується.",
    error_invalid_email: "Недійсна електронна пошта.",
    error_weak_password: "Пароль занадто слабкий.",
    // Додаємо переклади для модального вікна мови, як у Patsient_Home
    selectLanguage: "Оберіть мову",
    ukrainian: "🇺🇦 Українська",
    english: "🇬🇧 Англійська",
  },
};

// Ініціалізація i18n
const i18n = new I18n(translations);
i18n.enableFallback = true;

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

const countries = [
  { name: "Ukraine", code: "UA", emoji: "🇺🇦" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
  { name: "United States", code: "US", emoji: "🇺🇸" },
  { name: "Canada", code: "CA", emoji: "🇨🇦" },
  { name: "Germany", code: "DE", emoji: "🇩🇪" },
  { name: "France", code: "FR", emoji: "🇫🇷" },
  { name: "Poland", code: "PL", emoji: "🇵🇱" },
  { name: "Italy", code: "IT", emoji: "🇮🇹" },
  { name: "Spain", code: "ES", emoji: "🇪🇸" },
  { name: "Japan", code: "JP", emoji: "🇯🇵" },
  { name: "China", code: "CN", emoji: "🇨🇳" },
  { name: "India", code: "IN", emoji: "🇮🇳" },
  { name: "Australia", code: "AU", emoji: "🇦🇺" },
  { name: "Brazil", code: "BR", emoji: "🇧🇷" },
  { name: "Turkey", code: "TR", emoji: "🇹🇷" },
  { name: "Sweden", code: "SE", emoji: "🇸🇪" },
  { name: "Switzerland", code: "CH", emoji: "🇨🇭" },
  { name: "Netherlands", code: "NL", emoji: "🇳🇱" },
  { name: "Norway", code: "🇳🇴" },
  { name: "Denmark", code: "DK", emoji: "🇩🇰" },
  { name: "Finland", code: "FI", emoji: "🇫🇮" },
  { name: "South Africa", code: "ZA", emoji: "🇿🇦" },
  { name: "Mexico", code: "MX", emoji: "🇲🇽" },
  { name: "South Korea", code: "KR", emoji: "🇰🇷" },
  { name: "Argentina", code: "AR", emoji: "🇦🇷" },
  { name: "Ireland", code: "IE", emoji: "🇮🇪" },
  { name: "New Zealand", code: "NZ", emoji: "🇳🇿" },
  { name: "Singapore", code: "SG", emoji: "🇸🇬" },
  { name: "Israel", code: "IL", emoji: "🇮🇱" },
  { name: "Malaysia", code: "MY", emoji: "🇲🇾" },
  { name: "Thailand", code: "TH", emoji: "🇹🇭" },
  { name: "Vietnam", code: "VN", emoji: "🇻🇳" },
  { name: "Indonesia", code: "ID", emoji: "🇮🇩" },
  { name: "Egypt", code: "EG", emoji: "🇪🇬" },
  { name: "Nigeria", code: "NG", emoji: "🇳🇬" },
  { name: "Saudi Arabia", code: "SA", emoji: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", emoji: "🇦🇪" },
  { name: "Kuwait", code: "KW", emoji: "🇰🇼" },
  { name: "Qatar", code: "QA", emoji: "🇶🇦" },
];

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [country, setCountry] = useState(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  // Ми більше не зберігаємо вибрану мову як окремий об'єкт 'language'
  // i18n.locale буде керувати поточною мовою
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null);
  // Стан для відображення поточної вибраної мови на кнопці
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.locale.toUpperCase()
  );

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
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
      setDimensionsSubscription(subscription);

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, []);

  // Оновлюємо displayedLanguageCode при зміні i18n.locale
  useEffect(() => {
    setDisplayedLanguageCode(i18n.locale.toUpperCase());
  }, [i18n.locale]);

  const handleRegistration = async () => {
    setRegistrationError("");

    if (!fullName.trim()) {
      setRegistrationError(i18n.t("error_empty_fullname"));
      return;
    }
    if (!email.trim()) {
      setRegistrationError(i18n.t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setRegistrationError(i18n.t("error_empty_password"));
      return;
    }
    if (password.length < 6) {
      setRegistrationError(i18n.t("error_short_password"));
      return;
    }

    setIsRegistering(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Помилка реєстрації Supabase:", authError.message);
        if (authError.message.includes("already registered")) {
          setRegistrationError(i18n.t("error_email_in_use"));
        } else if (authError.message.includes("invalid email")) {
          setRegistrationError(i18n.t("error_invalid_email"));
        } else if (authError.message.includes("weak password")) {
          setRegistrationError(i18n.t("error_weak_password"));
        } else {
          setRegistrationError(
            i18n.t("error_registration_failed", { error: authError.message })
          );
        }
        return;
      }

      // Перевіряємо, чи користувач успішно зареєстрований
      if (data.user) {
        console.log("Supabase user registered. User ID:", data.user.id);

        // Збереження додаткових даних профілю в таблицю "profiles"
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id, // ID користувача з Supabase Auth
            full_name: fullName.trim(), // Повне ім'я з поля вводу
            phone: phone.trim() || null, // Номер телефону (або null, якщо поле пусте)
            country: country?.name || null, // Назва обраної країни (або null, якщо не обрано)
            language: i18n.locale || null, // Поточна мова інтерфейсу
          },
        ]);

        if (profileError) {
          console.error(
            "Помилка збереження профілю в Supabase:",
            profileError.message
          );
          setRegistrationError(i18n.t("error_profile_save_failed"));
        } else {
          // Успішна реєстрація та збереження профілю
          Alert.alert(
            i18n.t("success_title"),
            i18n.t("success_registration_message")
          );
          // Очищення полів форми
          setFullName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setCountry(null);
          // Перехід на екран входу
          navigation.navigate("LoginScreen");
        }
      } else {
        // Якщо реєстрація Supabase Auth завершилася, але об'єкт користувача відсутній (рідкісний випадок)
        console.warn("Supabase signUp completed, but user object is missing.");
        Alert.alert(
          i18n.t("success_title"),
          i18n.t("success_registration_message")
        );
        navigation.navigate("LoginScreen");
      }
    } catch (err) {
      console.error("Загальна помилка при реєстрації:", err);
      setRegistrationError(i18n.t("error_general_registration_failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  const openCountryModal = () => {
    setIsCountryModalVisible(true);
  };

  const closeCountryModal = () => {
    setIsCountryModalVisible(false);
  };

  const openLanguageModal = () => {
    setIsLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setIsLanguageModalVisible(false);
  };

  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  // Оновлена функція вибору мови
  const handleLanguageSelect = (langCode) => {
    i18n.locale = langCode; // Змінюємо поточну локаль i18n
    setDisplayedLanguageCode(langCode.toUpperCase()); // Оновлюємо код мови на кнопці
    closeLanguageModal();
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  // Оновлені languages для модального вікна
  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "ua", emoji: "🇺🇦" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width, height)}>
        <StatusBar style="auto" />
        {/* Оновлена кнопка вибору мови */}
        <View style={styles.languageContainerRegister}>
          <TouchableOpacity
            style={styles.languageButtonRegister}
            onPress={openLanguageModal}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.languageTextRegister}>
                {displayedLanguageCode}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title(isLargeScreen)}>{i18n.t("greeting")}</Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          {i18n.t("registration_subtitle")}
        </Text>
        <TouchableOpacity
          style={styles.selectCountryButton(width)}
          onPress={openCountryModal}
        >
          <Text style={styles.selectCountryText}>
            {country
              ? `${country.emoji} ${country.name}`
              : i18n.t("select_country")}
          </Text>
        </TouchableOpacity>

        {/* Поле вводу для повного імені з іконкою */}
        <Text style={styles.subtitle2}>{i18n.t("fullname")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="person-outline" // Іконка для імені
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={i18n.t("placeholder_fullname")}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Поле вводу для електронної пошти з іконкою */}
        <Text style={styles.subtitle2}>{i18n.t("email")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline" // Іконка для пошти
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={i18n.t("placeholder_email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Поле вводу для пароля з іконкою */}
        <Text style={styles.subtitle2}>{i18n.t("password")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline" // Іконка для пароля
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={i18n.t("placeholder_password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        {/* Поле вводу для телефону з іконкою */}
        <Text style={styles.subtitle2}>{i18n.t("phone")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="call-outline" // Іконка для телефону
            size={20}
            color="black"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={i18n.t("placeholder_optional")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {registrationError ? (
          <Text style={styles.errorText}>{registrationError}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.registerButton(width)}
          onPress={handleRegistration}
          disabled={isRegistering}
        >
          <Text style={styles.registerButtonText}>
            {isRegistering ? i18n.t("registering") : i18n.t("register")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Text style={styles.loginLinkText}>
            {i18n.t("already_registered")}
            <Text style={{ fontWeight: "bold" }}> {i18n.t("login")}</Text>
          </Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCountryModalVisible}
          onRequestClose={closeCountryModal}
        >
          <ScrollView>
            <View style={styles.centeredView}>
              <View style={styles.modalView(width)}>
                <Text style={styles.modalTitle}>
                  {i18n.t("select_country_modal_title")}
                </Text>
                {countries.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.countryItem}
                    onPress={() => selectCountry(item)}
                  >
                    <Text style={styles.countryEmoji}>{item.emoji}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={closeCountryModal}
                >
                  <Text style={styles.textStyle}>{i18n.t("cancel")}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Modal>

        {/* Оновлене модальне вікно для вибору мови */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
        >
          <TouchableWithoutFeedback onPress={closeLanguageModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.languageModalContent}>
                  <Text style={styles.modalTitle}>
                    {i18n.t("selectLanguage")}
                  </Text>
                  {languagesForModal.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.languageOption}
                      onPress={() => handleLanguageSelect(item.code)}
                    >
                      <Text style={styles.languageOptionText}>
                        {i18n.t(item.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: (width, height) => ({
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: height * 0.15,
    paddingHorizontal: width * 0.05,
    width: "100%",
  }),
  // Оновлені стилі для кнопки мови
  languageContainerRegister: {
    flexDirection: "row",
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
    paddingVertical: 70,
  },
  languageButtonRegister: {
    backgroundColor: "#0EB3EB", // Синій фон
    borderRadius: 10,
    width: 71, // Фіксована ширина
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  languageTextRegister: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginHorizontal: 5,
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 36 : 32,
    marginBottom: 9,
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
    marginBottom: 14,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 35,
  },
  selectCountryButton: (width) => ({
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  }),
  selectCountryText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },

  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    height: 52,
  }),
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
  registerButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 8,
  }),
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: (width) => ({
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.9,
  }),
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  loginLink: {
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
  // Стилі для нового модального вікна мови (як у Patsient_Home)
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
    width: Dimensions.get("window").width * 0.8, // Використовуємо Dimensions.get("window").width
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
    borderBottomColor: "#ECECEC",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
  },
});

export default RegisterScreen;
