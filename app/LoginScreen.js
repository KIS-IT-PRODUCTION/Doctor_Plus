import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient"; // Ваш Supabase клієнт
import { useAuth } from "../providers/AuthProvider"; // Ваш AuthProvider для отримання сесії
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

// Встановіть пари ключ-значення для різних мов, які ви хочете підтримувати.
const translations = {
  en: {
    login_greeting: "Log In",
    login_subtitle: "Welcome back! Log in to continue.",
    email: "Email",
    placeholder_email: "Enter Your Email",
    password: "Password",
    placeholder_password: "Enter Your Password",
    login_button: "Log In",
    logging_in: "Logging In...",
    not_registered: "Not registered yet?",
    register_link: "Sign Up",
    error_empty_email: "Please enter your email.",
    error_empty_password: "Please enter your password.",
    error_login_failed: "Failed to log in: %{error}",
    error_general_login_failed:
      "Failed to log in. Check your network connection.",
    // Ці помилки специфічні для Clerk, їх можна адаптувати або видалити для Supabase
    // clerk_error_base: "Clerk error: %{error}",
    // clerk_invalid_credentials: "Invalid email or password.",
    // clerk_email_verification_needed: "Please check your email to verify your account.",
    // clerk_password_too_short: "Password is too short. Minimum 8 characters.",
  },
  ua: {
    login_greeting: "Увійти",
    login_subtitle: "Ласкаво просимо назад! Увійдіть, щоб продовжити.",
    email: "Пошта",
    placeholder_email: "Введіть Вашу електронну пошту",
    password: "Пароль",
    placeholder_password: "Введіть Ваш пароль",
    login_button: "Увійти",
    logging_in: "Вхід...",
    not_registered: "Ще не зареєстровані?",
    register_link: "Зареєструватися",
    error_empty_email: "Будь ласка, введіть вашу електронну пошту.",
    error_empty_password: "Будь ласка, введіть пароль.",
    error_login_failed: "Не вдалося увійти: %{error}",
    error_general_login_failed:
      "Не вдалося увійти. Перевірте підключення до мережі.",
    // clerk_error_base: "Помилка Clerk: %{error}",
    // clerk_invalid_credentials: "Неправильна електронна пошта або пароль.",
    // clerk_email_verification_needed: "Будь ласка, перевірте свою пошту, щоб підтвердити обліковий запис.",
    // clerk_password_too_short: "Пароль занадто короткий. Мінімум 8 символів.",
  },
};

// Ініціалізація i18n
const i18n = new I18n(translations);
i18n.enableFallback = true;

// Встановлюємо початкову мову на основі локалі пристрою
const setInitialLocale = () => {
  const deviceLocale = getLocales()[0].languageCode;
  if (translations[deviceLocale]) {
    i18n.locale = deviceLocale;
  } else {
    i18n.locale = "ua"; // Мова за замовчуванням, якщо локаль пристрою не підтримується
  }
};
setInitialLocale();

const LoginScreen = () => {
  const navigation = useNavigation();
  const { session } = useAuth(); // Отримуємо сесію з вашого AuthProvider

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // Перевірка, чи користувач вже увійшов, і перенаправлення
  useEffect(() => {
    if (session && session.user) {
      // Перевіряємо також session.user, щоб бути впевненими, що це дійсно активна сесія
      navigation.replace("Patsient_Home");
    }
  }, [session, navigation]);

  const handleLogin = async () => {
    setLoginError(""); // Очистити попередні помилки

    // Валідація полів
    if (!email.trim()) {
      setLoginError(i18n.t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setLoginError(i18n.t("error_empty_password"));
      return;
    }

    setIsLoggingIn(true); // Встановити стан входу в true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Помилка входу Supabase:", error.message);
        setLoginError(i18n.t("error_login_failed", { error: error.message }));
      } else {
        console.log("Вхід Supabase успішний. Дані користувача:", data.user?.id);
        // Сесія оновиться в AuthProvider, і useEffect тут спрацює для навігації
        // Очистити поля вводу після успішного входу
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      console.error("Загальна помилка входу:", err);
      setLoginError(i18n.t("error_general_login_failed"));
    } finally {
      setIsLoggingIn(false); // Завжди повертати стан входу в false
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width)}>
        <StatusBar style="auto" />
        <Text style={styles.title(isLargeScreen)}>
          {i18n.t("login_greeting")}
        </Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          {i18n.t("login_subtitle")}
        </Text>

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

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButton(width)}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          <Text style={styles.loginButtonText}>
            {isLoggingIn ? i18n.t("logging_in") : i18n.t("login_button")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("RegisterScreen")}
        >
          <Text style={styles.registerLinkText}>
            {i18n.t("not_registered")}
            <Text style={{ fontWeight: "bold" }}>
              {" "}
              {i18n.t("register_link")}
            </Text>
          </Text>
        </TouchableOpacity>
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
  container: (width) => ({
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: Dimensions.get("window").height * 0.2,
    paddingHorizontal: width * 0.05,
    width: "100%",
  }),
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 36 : 32,
    marginBottom: 9,
    fontFamily: "Mont-Bold", // Переконайтеся, що ці шрифти завантажені
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular", // Переконайтеся, що ці шрифти завантажені
    marginBottom: 24,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium", // Переконайтеся, що ці шрифти завантажені
    paddingHorizontal: 35,
    marginBottom: 8,
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
    fontFamily: "Mont-Regular", // Переконайтеся, що ці шрифти завантажені
  },
  loginButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center", // Щоб текст або індикатор був по центру
  }),
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold", // Якщо використовується Mont-Bold, можна замінити
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  registerLink: {
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular", // Переконайтеся, що ці шрифти завантажені
  },
});

export default LoginScreen;
