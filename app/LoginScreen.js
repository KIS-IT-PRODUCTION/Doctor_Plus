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
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider"; // Це все ще потрібно для доступу до signIn функції, якщо ми її використовуємо
import { useTranslation } from "react-i18next";

const LoginScreen = () => {
  const navigation = useNavigation();
  // Використовуємо функції signIn з useAuth. Це дозволяє AuthProvider контролювати setLoading та isRoleDetermined
  const { signIn, loading: authLoading, session, userRole } = useAuth(); // Отримуємо signIn функцію та authLoading
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  // isLoggingIn тепер буде синхронізуватися з authLoading з AuthProvider,
  // або можна залишити окремо для локальних станів UI.
  // Для простоти та консистентності, давайте покладатися на authLoading.
  // const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // *** ВАЖЛИВА ЗМІНА: ВИДАЛЯЄМО ЦЕЙ useEffect ***
  // Логіка перенаправлення після успішного входу тепер повністю
  // контролюється RootNavigator на основі `session`, `userRole` та `isRoleDetermined`.
  // useEffect(() => {
  //   if (session && session.user) {
  //     console.log("LoginScreen.js: Сесія активна, перенаправлення на Patsient_Home.");
  //     navigation.replace("Patsient_Home");
  //   }
  // }, [session, navigation]);

  const handleLogin = async () => {
    setLoginError("");

    if (!email.trim()) {
      setLoginError(t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setLoginError(t("error_empty_password"));
      return;
    }

    // setIsLoggingIn(true); // Більше не потрібен, якщо використовуємо authLoading
    console.log("LoginScreen.js: Спроба входу для пацієнта з email:", email);

    // *** ЗМІНА: Використовуємо signIn з AuthProvider ***
    const { success, error } = await signIn(email, password);

    if (!success) {
      console.error("LoginScreen.js: Помилка входу через AuthProvider:", error?.message || "Невідома помилка.");
      setLoginError(t("error_login_failed", { error: error?.message || "Невідома помилка." }));
    } else {
      console.log("LoginScreen.js: Вхід успішний. AuthProvider керує перенаправленням.");
      setEmail("");
      setPassword("");
      // Після успішного входу AuthProvider оновить `session`, `loading` та `userRole`.
      // `RootNavigator` потім перенаправить куди потрібно.
      // Не викликаємо navigation.replace тут!
    }
    // setIsLoggingIn(false); // Більше не потрібен
  };

  const handleForgotPasswordPress = () => {
    setLoginError("");
    console.log("LoginScreen.js: Перехід на екран ResetPasswordScreen.");
    navigation.navigate("ResetPasswordScreen", { email: email });
  };

  // Використовуємо authLoading для керування станом кнопки та полів
  const isDisabled = authLoading;

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
            editable={!isDisabled} // Деактивуємо поле під час входу
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
            editable={!isDisabled} // Деактивуємо поле під час входу
          />
        </View>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButton(width)}
          onPress={handleLogin}
          disabled={isDisabled} // Кнопка вимкнена під час завантаження
        >
          {isDisabled ? ( // Використовуємо isDisabled (тобто authLoading)
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>
              {t("login_button")}
            </Text>
          )}
        </TouchableOpacity>

        {/* Кнопка "Забули пароль?" */}
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPasswordPress}
          disabled={isDisabled} // Деактивуємо під час входу
        >
          <Text style={styles.forgotPasswordText}>
            {t("forgot_password_link")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("RegisterScreen")}
          disabled={isDisabled} // Деактивуємо під час входу
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
    flex: 1,
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
  forgotPasswordLink: {
    marginTop: 10,
    marginBottom: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#757575",
    textDecorationLine: "underline",
  },
  registerLink: {
  },
  registerLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
});

export default LoginScreen;