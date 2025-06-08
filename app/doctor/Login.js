import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider"; // Використовуємо функції з AuthProvider
import { useTranslation } from "react-i18next";

const Login = () => {
  const navigation = useNavigation();
  // Отримуємо session, loading, userRole, signIn, signOut, authError з AuthProvider
  const { session, loading: authLoading, userRole, signIn, signOut, authError } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // Перевірка, чи користувач вже увійшов, і перенаправлення (або блокування)
  useEffect(() => {
    // Чекаємо, поки AuthProvider завершить своє початкове завантаження
    if (!authLoading && session && session.user) {
      if (userRole === "doctor") {
        // Якщо користувач - лікар, перенаправляємо на Profile_doctor
        console.log("Login: User is a doctor, navigating to Profile_doctor.");
        navigation.replace("Profile_doctor");
      } else if (userRole === "patient") {
        // Якщо користувач - пацієнт, виходимо з системи та показуємо помилку
        console.log("Login: User is a patient. Logging out and showing error.");
        signOut(); // Виходимо з системи
        setLoginError(t("error_doctors_only_login")); // Повідомлення про помилку
        setEmail(""); // Очищуємо поля
        setPassword("");
      }
      // Якщо userRole === null (ще не визначено), чекаємо, useEffect знову спрацює після визначення ролі
    }
  }, [session, navigation, authLoading, userRole, signOut, t]); // Додано signOut та t до залежностей

  // Слідкуємо за помилками з AuthProvider
  useEffect(() => {
    if (authError) {
      console.error("Login: AuthProvider error:", authError.message);
      setLoginError(t("error_login_failed", { error: authError.message }));
      setIsLoggingIn(false); // Завершуємо індикатор завантаження
    }
  }, [authError, t]);


  const handleLogin = async () => {
    setLoginError(""); // Очистити попередні помилки

    // Валідація полів
    if (!email.trim()) {
      setLoginError(t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setLoginError(t("error_empty_password"));
      return;
    }

    setIsLoggingIn(true); // Встановити стан входу в true

    // Використовуємо функцію signIn з AuthProvider
    const { success, error } = await signIn(email, password);

    if (error) {
      console.error("Login: Помилка входу:", error.message);
      setLoginError(t("error_login_failed", { error: error.message }));
    } else if (success) {
      console.log("Login: Вхід успішний. AuthProvider тепер відповідає за навігацію.");
      // Сесія оновиться в AuthProvider, і useEffect тут спрацює для навігації
      // Поля вводу очистяться після успішного входу, якщо перенаправлення відбудеться
      setEmail("");
      setPassword("");
    }
    setIsLoggingIn(false); // Завжди повертати стан входу в false
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
          disabled={isLoggingIn} // Деактивуємо кнопку під час входу
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" /> // Показуємо індикатор під час входу
          ) : (
            <Text style={styles.loginButtonText}>{t("login_button")}</Text>
          )}
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
