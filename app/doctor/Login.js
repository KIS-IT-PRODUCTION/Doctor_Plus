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
import { supabase } from "../../providers/supabaseClient"; // Ваш Supabase клієнт
import { useAuth } from "../../providers/AuthProvider"; // Ваш AuthProvider для отримання сесії

// --- ВАЖЛИВО: Використовуємо хук useTranslation з react-i18next ---
import { useTranslation } from "react-i18next";

// ВИДАЛЕНО:
// - const translations = {...}; (більше не потрібно, переклади у .json файлах)
// - import { getLocales } from "expo-localization";
// - import { I18n } from "i18n-js";
// - Ініціалізація i18n = new I18n(...) та setInitialLocale() (все це робиться глобально в i18n.js)

const Login = () => {
  const navigation = useNavigation();
  const { session } = useAuth(); // Отримуємо сесію з вашого AuthProvider
  // --- Використовуємо хук useTranslation для доступу до t ---
  const { t } = useTranslation();

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
      navigation.replace("Anketa_Settings");
    }
  }, [session, navigation]);

  const handleLogin = async () => {
    setLoginError(""); // Очистити попередні помилки

    // Валідація полів
    if (!email.trim()) {
      setLoginError(t("error_empty_email")); // Використовуємо t()
      return;
    }
    if (!password.trim()) {
      setLoginError(t("error_empty_password")); // Використовуємо t()
      return;
    }

    setIsLoggingIn(true); // Встановити стан входу в true
    if (setIsLoggingIn == true) {
      navigation.navigate("Anketa_Settings");
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Помилка входу Supabase:", error.message);
        // Зверніть увагу: ми передаємо об'єкт з 'error' для динамічного значення в перекладі
        setLoginError(t("error_login_failed", { error: error.message }));
      } else {
        console.log("Вхід Supabase успішний. Дані користувача:", data.user?.id);
        // Сесія оновиться в AuthProvider, і useEffect тут спрацює для навігації
        // Очистити поля вводу після успішного входу
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      console.error("Загальна помилка входу:", err);
      setLoginError(t("error_general_login_failed")); // Використовуємо t()
    } finally {
      setIsLoggingIn(false); // Завжди повертати стан входу в false
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width)}>
        <StatusBar style="auto" />
        <Text style={styles.title(isLargeScreen)}>{t("login_greeting")}</Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          {t("login_subtitle")}
        </Text>

        <Text style={styles.subtitle2}>{t("email")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.subtitle2}>{t("password")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_password")}
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
            {isLoggingIn ? t("logging_in") : t("login_button")}{" "}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("RegisterScreen")}
        >
          <Text style={styles.registerLinkText}>
            {t("not_registered")}
            <Text style={{ fontWeight: "bold" }}> {t("register_link")}</Text>
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

export default Login;
