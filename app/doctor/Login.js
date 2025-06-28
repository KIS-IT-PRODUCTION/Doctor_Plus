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
import { useAuth } from "../../providers/AuthProvider"; // Використовуємо AuthProvider
import { useTranslation } from "react-i18next";

const Login = () => {
  const navigation = useNavigation();
  // Отримуємо необхідні стани та функції з useAuth
  const { session, loading: authLoading, userRole, signIn, signOut, authError } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(""); // Локальна помилка для відображення в UI
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Стан для індикатора завантаження кнопки

  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  // Цей useEffect буде реагувати на зміни сесії або ролі після спроби входу.
  // Він відповідає за логіку "якщо пацієнт увійшов через лікарський вхід".
  // Перехід до профілю лікаря або пацієнта тепер керується RootNavigator в App.js.
  useEffect(() => {
    // console.log("Login.js useEffect (Session/Role): Спрацював");
    // console.log(`  - session: ${session ? "Присутня" : "Відсутня"}`);
    // console.log(`  - authLoading: ${authLoading}`);
    // console.log(`  - userRole: ${userRole}`);
    // console.log(`  - authError: ${authError ? authError.message : "Немає"}`);

    if (!authLoading && session && session.user) {
      // Якщо сесія активна і AuthProvider закінчив завантаження
      if (userRole === "patient") {
        // Якщо це пацієнт, виходимо його і показуємо повідомлення про помилку
        console.log("Login.js: Пацієнт увійшов через лікарський вхід. Вихід...");
        signOut(); // Викликаємо signOut з AuthProvider
        setLoginError(t("error_doctors_only_login")); // Встановлюємо локальну помилку
        setEmail(""); // Очищаємо поля
        setPassword("");
      } else if (userRole === "doctor") {
        // Якщо це лікар, RootNavigator в App.js повинен перенаправити на Profile_doctor.
        // Цей екран сам не викликає navigation.replace, оскільки RootNavigator вже це зробить.
        console.log("Login.js: Лікар успішно увійшов. RootNavigator перенаправить.");
      }
      // Якщо userRole === null, це означає, що роль ще визначається.
      // Не робимо нічого, чекаємо, поки AuthProvider завершить визначення ролі.
    } else if (authError) {
      // Якщо AuthProvider повернув помилку (наприклад, "Invalid login credentials")
      console.error("Login.js useEffect (AuthError): Отримано помилку від AuthProvider:", authError.message);
      setLoginError(t("error_login_failed", { error: authError.message }));
      setIsLoggingIn(false); // Зупиняємо індикатор
    }
  }, [session, authLoading, userRole, authError, signOut, t]);


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
    console.log("Login.js: handleLogin - Виклик signIn з AuthProvider для email:", email);

    // Викликаємо функцію signIn з AuthProvider
    const { success, error } = await signIn(email, password);

    if (error) {
      console.error("Login.js: handleLogin - Помилка signIn:", error.message);
      // Якщо signIn повертає помилку, відображаємо її локально.
      // Користувач залишається на поточному екрані.
      setLoginError(t("error_login_failed", { error: error.message }));
    } else {
      console.log("Login.js: handleLogin - signIn успішний. AuthProvider оновлює сесію.");
      // Якщо успішно, AuthProvider оновить сесію, і useEffect вище або RootNavigator
      // візьмуть на себе подальшу логіку (навігацію або обробку ролі пацієнта).
      // Поля введення не очищаємо тут, щоб користувач міг бачити свої дані при помилці.
      // Якщо вхід успішний, вони все одно будуть скинуті при переході на інший екран.
    }
    setIsLoggingIn(false); // Вимикаємо індикатор завантаження
  };

  const handleForgotPasswordPress = () => {
    setLoginError(""); // Очищаємо помилку перед переходом
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
            editable={!isLoggingIn}
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
            editable={!isLoggingIn}
          />
        </View>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButton(width)}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>{t("login_button")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPasswordPress}
          disabled={isLoggingIn}
        >
          <Text style={styles.forgotPasswordText}>
            {t("forgot_password_link")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("RegisterScreen")} // Можливо, тут має бути Register для лікарів, а не RegisterScreen?
          disabled={isLoggingIn}
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
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
});

export default Login;
