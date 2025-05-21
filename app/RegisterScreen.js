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
  Platform, // Додано для перевірки платформи
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Svg, Path } from "react-native-svg";
import { supabase } from "../supabaseClient"; // Шлях до вашого supabaseClient.js
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

// Clerk більше не використовується, тому імпорт видалено

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
    language: "Language",
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
    // Clerk-специфічні переклади видалено
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
    language: "Мова",
    error_empty_fullname: "Будь ласка, введіть ваше повне ім'я.",
    error_empty_email: "Будь ласка, введіть вашу електронну пошту.",
    error_empty_password: "Будь ласка, введіть пароль.",
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
    // Clerk-специфічні переклади видалено
  },
};

// Ініціалізація i18n
const i18n = new I18n(translations);
i18n.enableFallback = true;

const languages = [
  { name: "English", code: "en", emoji: "🇬🇧" },
  { name: "Українська", code: "ua", emoji: "🇺🇦" },
];

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
  const [language, setLanguage] = useState(
    languages.find((lang) => lang.code === getLocales()[0].languageCode) ||
      languages[1]
  );
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    updateDimensions();
    // Dimensions.addEventListener повертає об'єкт Subscription, який має метод remove()
    // Для веб-платформи (React Native for Web) addEventListener може бути відсутнім
    if (Platform.OS === 'web') {
        const handleResize = () => updateDimensions();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    } else {
        const subscription = Dimensions.addEventListener(
            "change",
            updateDimensions
        );
        setDimensionsSubscription(subscription);

        return () => {
            // Перевіряємо, чи існує підписка, перш ніж її видаляти
            if (subscription) {
                subscription.remove();
            }
        };
    }
  }, []);

  useEffect(() => {
    i18n.locale = language.code;
  }, [language]);

  const handleRegistration = async () => {
    setRegistrationError(""); // Очистити попередні помилки

    // Валідація полів
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
    // Supabase за замовчуванням вимагає мінімум 6 символів для пароля
    if (password.length < 6) {
      setRegistrationError(i18n.t("error_short_password"));
      return;
    }

    setIsRegistering(true); // Встановити стан реєстрації в true

    try {
      // 1. Реєстрація користувача через Supabase Auth
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

      // 2. Якщо реєстрація в Supabase Auth успішна, зберегти додаткові дані профілю
      // Перевіряємо, чи є користувач у даних відповіді
      if (data.user) {
        console.log("Supabase user registered. User ID:", data.user.id);

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id, // Використовуємо ID користувача від Supabase Auth
            full_name: fullName.trim(),
            phone: phone.trim() || null, // Залишаємо null, якщо порожнє
            country: country?.name || null, // Залишаємо null, якщо не вибрано
            language: language?.name || null, // Залишаємо null, якщо не вибрано
          },
        ]);

        if (profileError) {
          console.error(
            "Помилка збереження профілю в Supabase:",
            profileError.message
          );
          setRegistrationError(i18n.t("error_profile_save_failed"));
          // У реальному додатку тут потрібно подумати про відкат або додаткову логіку обробки
          // Наприклад, видалити користувача з Supabase Auth, якщо профіль не вдалося зберегти.
        } else {
          // Успішна реєстрація та збереження профілю
          Alert.alert(
            i18n.t("success_title"),
            i18n.t("success_registration_message")
          );
          // Очистити поля форми
          setFullName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setCountry(null);
          setLanguage(languages[1]); // Повернути мову за замовчуванням
          // Перенаправити користувача на екран входу (або головний екран, якщо авто-вхід)
          navigation.navigate("LoginScreen"); // Зазвичай перенаправляють на вхід, щоб користувач підтвердив пошту
        }
      } else {
        // Це може статися, якщо signUp повертає успіх, але user об'єкт відсутній
        // (наприклад, якщо використовується потік без підтвердження пошти, але без автоматичного входу)
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
      setIsRegistering(false); // Завжди повертати стан реєстрації в false
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

  const selectLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    closeLanguageModal();
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width, height)}>
        <StatusBar style="auto" />
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={styles.selectLanguageButton}
            onPress={openLanguageModal}
          >
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></Path>
              <Path d="M10 11l-5-5 5-5"></Path>
              <Path d="M19 6h-14"></Path>
            </Svg>
            <Text style={styles.selectLanguageText}>
              {language
                ? `${language.emoji} ${language.name}`
                : i18n.t("language")}
            </Text>
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
        <Text style={styles.subtitle2}>{i18n.t("fullname")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="person-outline"
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
        <Text style={styles.subtitle2}>{i18n.t("email")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline"
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
        <Text style={styles.subtitle2}>{i18n.t("password")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline"
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
        <Text style={styles.subtitle2}>{i18n.t("phone")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#B0BEC5"
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView(width)}>
              <Text style={styles.modalTitle}>
                {i18n.t("select_language_modal_title")}
              </Text>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.countryItem}
                  onPress={() => selectLanguage(item)}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeLanguageModal}
              >
                <Text style={styles.textStyle}>{i18n.t("cancel")}</Text>
              </Pressable>
            </View>
          </View>
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
  languageContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    alignItems: "center",
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
  selectLanguageButton: {
    backgroundColor: "transparent",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 0,
    width: "auto",
    height: "auto",
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  selectLanguageText: {
    color: "#00ACC1",
    fontSize: 16,
    fontFamily: "Mont-Medium",
    marginLeft: 8,
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
  icon: { marginRight: 10 },
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
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
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
});

export default RegisterScreen;
