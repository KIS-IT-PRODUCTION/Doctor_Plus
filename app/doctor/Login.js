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
  // Alert, // Можна використовувати для налагодження
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// Хоча ми використовуємо signIn з AuthProvider, supabase також потрібен для resetPasswordForEmail
import { supabase } from "../../providers/supabaseClient";
import { useAuth } from "../../providers/AuthProvider"; // Для доступу до сесії, ролі та signIn/signOut
import { useTranslation } from "react-i18next";
const Login = () => { // Цей компонент - для входу лікарів
  const navigation = useNavigation();
  const { session, userRole, loading: authLoading, isRoleDetermined, signIn } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  // isLoggingIn тепер буде відображати стан завантаження AuthProvider
  const isDisabled = authLoading;

  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // Логіка перенаправлення на основі сесії та ролі
  useEffect(() => {
    // Чекаємо, поки AuthProvider завершить завантаження та визначення ролі
    if (authLoading || !isRoleDetermined) {
      console.log("Login.js: AuthProvider завантажується або роль не визначена. Чекаємо...");
      return;
    }

    if (session && session.user) {
      // Користувач вже увійшов, перенаправляємо його відповідно до ролі
      if (userRole === "doctor") {
        console.log("Login.js: Лікар вже увійшов. Перенаправлення на Profile_doctor.");
        navigation.replace("Profile_doctor", { doctorId: session.user.id });
      } else if (userRole === "patient") {
        console.log("Login.js: Пацієнт вже увійшов. Перенаправлення на Patsient_Home.");
        navigation.replace("Patsient_Home", { patientId: session.user.id });
      } else {
        // Якщо роль невідома, але сесія є, перенаправляємо на загальний HomeScreen
        console.warn("Login.js: Користувач увійшов з невідомою роллю. Перенаправлення на HomeScreen.");
        navigation.replace("HomeScreen");
      }
    } else {
      // Якщо сесії немає, залишаємо на екрані входу (це нормальна поведінка)
      console.log("Login.js: Сесії немає, залишаємо на екрані входу лікаря.");
    }
  }, [session, userRole, authLoading, isRoleDetermined, navigation]);

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

    console.log("Login.js: Спроба входу для лікаря з email:", email);

    // Використовуємо функцію signIn з AuthProvider, яка вже має логіку setLoading та визначення ролі
    const { success, error } = await signIn(email, password);

    if (!success) {
      console.error("Login.js: Помилка входу Supabase:", error?.message || "Невідома помилка.");
      setLoginError(t("error_login_failed", { error: error?.message || "Невідома помилка." }));
    } else {
      console.log("Login.js: Вхід Supabase успішний. AuthProvider керує перенаправленням.");
      setEmail("");
      setPassword("");
      // Навігація відбудеться через useEffect цього ж компонента, як тільки userRole буде визначено.
    }
  };

  const handleForgotPasswordPress = () => {
    setLoginError("");
    console.log("Login.js: Перехід на екран ResetPasswordScreen.");
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
            editable={!isDisabled}
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
            editable={!isDisabled}
          />
        </View>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButton(width)}
          onPress={handleLogin}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>
              {t("login_button")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPasswordPress}
          disabled={isDisabled}
        >
          <Text style={styles.forgotPasswordText}>
            {t("forgot_password_link")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")} // Перенаправляємо на Register для лікарів
          disabled={isDisabled}
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
    fontFamily: "Mont-Bold", // Залишаємо, якщо шрифт завантажено
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular", // Залишаємо, якщо шрифт завантажено
    marginBottom: 24,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium", // Залишаємо, якщо шрифт завантажено
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
    fontFamily: "Mont-Regular", // Залишаємо, якщо шрифт завантажено
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
    fontFamily: "Mont-Regular", // Залишаємо, якщо шрифт завантажено
  },
});

export default Login;
