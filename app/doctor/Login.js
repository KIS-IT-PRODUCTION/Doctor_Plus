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
  Alert, // Додано Alert для сповіщень користувачу
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider"; // Використовуємо функції з AuthProvider
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient"; // Імпортуємо supabase напряму для функції resetPasswordForEmail

const Login = () => {
  const navigation = useNavigation();
  const {
    session,
    loading: authLoading,
    userRole,
    signIn,
    signOut,
    authError,
  } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false); // Новий стан для індикатора скидання пароля

  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  useEffect(() => {
    if (!authLoading && session && session.user) {
      if (userRole === "doctor") {
        console.log("Login: User is a doctor, navigating to Profile_doctor.");
        navigation.replace("Profile_doctor");
      } else if (userRole === "patient") {
        console.log("Login: User is a patient. Logging out and showing error.");
        signOut();
        setLoginError(t("error_doctors_only_login"));
        setEmail("");
        setPassword("");
      }
    }
  }, [session, navigation, authLoading, userRole, signOut, t]);

  useEffect(() => {
    if (authError) {
      console.error("Login: AuthProvider error:", authError.message);
      setLoginError(t("error_login_failed", { error: authError.message }));
      setIsLoggingIn(false);
    }
  }, [authError, t]);

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

    setIsLoggingIn(true);

    const { success, error } = await signIn(email, password);

    if (error) {
      console.error("Login: Помилка входу:", error.message);
      setLoginError(t("error_login_failed", { error: error.message }));
    } else if (success) {
      console.log("Login: Вхід успішний. AuthProvider тепер відповідає за навігацію.");
      setEmail("");
      setPassword("");
    }
    setIsLoggingIn(false);
  };

  // Нова функція для обробки скидання пароля
 // Нова функція для обробки скидання пароля
const handleForgotPassword = async () => {
  setLoginError(""); // Очищаємо попередні помилки

  if (!email.trim()) {
    Alert.alert(t("forgot_password_title"), t("forgot_password_enter_email"));
    return;
  }

  setIsResettingPassword(true); // Встановлюємо стан для індикатора завантаження

  try {
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'doctor://reset-password', // <<<< ПЕРЕВІРТЕ ЦЕЙ ШЛЯХ
});

    if (error) {
      console.error("Forgot password error:", error.message);
      Alert.alert(
        t("error_title"),
        t("forgot_password_error", { error: error.message })
      );
    } else {
      Alert.alert(
        t("success_title"),
        t("forgot_password_success", { email: email })
      );
    }
  } catch (err) {
    console.error("Unexpected error during password reset:", err);
    Alert.alert(t("error_title"), t("error_general_forgot_password"));
  } finally {
    setIsResettingPassword(false); // Завершуємо індикатор завантаження
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
          disabled={isLoggingIn || isResettingPassword} // Деактивуємо кнопку, якщо відбувається скидання пароля
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>{t("login_button")}</Text>
          )}
        </TouchableOpacity>

        {/* Кнопка "Забули пароль?" */}
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPassword}
          disabled={isLoggingIn || isResettingPassword} // Деактивуємо, якщо відбувається вхід або скидання
        >
          {isResettingPassword ? (
            <ActivityIndicator color="#0EB3EB" /> // Індикатор для скидання пароля
          ) : (
            <Text style={styles.forgotPasswordText}>
              {t("forgot_password_link")}
            </Text>
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
  // Нові стилі для посилання "Забули пароль?"
  forgotPasswordLink: {
    marginTop: 10,
    marginBottom: 10, // Додаємо відступ, щоб не зливався з кнопкою
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#757575",
    fontFamily: "Mont-Regular",
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

export default Login;