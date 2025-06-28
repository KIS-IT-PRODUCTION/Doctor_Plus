import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  // Alert, // Можна використовувати для налагодження, але для продакшену краще кастомні UI
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient"; // Все ще використовується для прямого signInWithPassword
import { useAuth } from "../providers/AuthProvider"; // Для доступу до сесії та, можливо, інших функцій у майбутньому
import { useTranslation } from "react-i18next";

const LoginScreen = () => {
  const navigation = useNavigation();
  // Використовуємо session з useAuth для загальної логіки сесії.
  // Хоча signInWithPassword викликається напряму через supabase.auth,
  // AuthProvider все одно відстежує стан сесії та оновлює її.
  const { session } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // Цей useEffect буде автоматично перенаправляти на Patsient_Home
  // якщо сесія активна після завантаження або успішного входу.
  useEffect(() => {
    if (session && session.user) {
      console.log("LoginScreen.js: Сесія активна, перенаправлення на Patsient_Home.");
      navigation.replace("Patsient_Home");
    }
  }, [session, navigation]);

  const handleLogin = async () => {
    setLoginError(""); // Очищаємо попередні помилки

    if (!email.trim()) {
      setLoginError(t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setLoginError(t("error_empty_password"));
      return;
    }

    setIsLoggingIn(true); // Включаємо індикатор завантаження
    console.log("LoginScreen.js: Спроба входу для пацієнта з email:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("LoginScreen.js: Помилка входу Supabase:", error.message);
        // Відображаємо помилку локально на екрані входу
        setLoginError(t("error_login_failed", { error: error.message }));
      } else {
        console.log("LoginScreen.js: Вхід Supabase успішний. Користувач:", data.user?.id);
        // Поля введення можна очистити тут або залишити, оскільки успішна навігація
        // призведе до розмонтування компонента і скидання стану.
        setEmail("");
        setPassword("");
        // Навігація відбудеться через useEffect завдяки оновленню сесії в AuthProvider
      }
    } catch (err) {
      console.error("LoginScreen.js: Загальна помилка входу (try/catch):", err);
      setLoginError(t("error_general_login_failed"));
    } finally {
      setIsLoggingIn(false); // Вимикаємо індикатор завантаження
    }
  };

  const handleForgotPasswordPress = () => {
    setLoginError(""); // Очищаємо будь-яку поточну помилку перед переходом
    // Перенаправляємо на екран скидання пароля, передаючи email
    console.log("LoginScreen.js: Перехід на екран ResetPasswordScreen.");
    navigation.navigate("ResetPasswordScreen", { email: email });
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
            editable={!isLoggingIn} // Деактивуємо поле під час входу
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
            editable={!isLoggingIn} // Деактивуємо поле під час входу
          />
        </View>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButton(width)}
          onPress={handleLogin}
          disabled={isLoggingIn} // Кнопка вимкнена під час завантаження
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>
              {t("login_button")}
            </Text>
          )}
        </TouchableOpacity>

        {/* НОВЕ: Кнопка "Забули пароль?" */}
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPasswordPress}
          disabled={isLoggingIn} // Деактивуємо під час входу
        >
          <Text style={styles.forgotPasswordText}>
            {t("forgot_password_link")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("RegisterScreen")}
          disabled={isLoggingIn} // Деактивуємо під час входу
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
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
    marginBottom: 24,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
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
    fontFamily: "Mont-Regular",
  },
  loginButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  }),
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  forgotPasswordLink: { // Додано стиль для нового посилання
    marginTop: 10,
    marginBottom: 10,
  },
  forgotPasswordText: { // Додано стиль для нового посилання
    fontSize: 14,
    color: "#757575",
    textDecorationLine: "underline",
  },
  registerLink: {
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
});

export default LoginScreen;
