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
  // Alert, // Не використовуємо Alert, оскільки це блокує UI
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "react-i18next";

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
  // Додаємо новий стан для відстеження, чи була успішна автентифікація через форму
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  useEffect(() => {
    console.log("-----------------------------------------");
    console.log("LOGIN_NAV_EFFECT: Triggered.");
    console.log(`  - authLoading: ${authLoading}`);
    console.log(`  - session: ${session ? "Present" : "Null"}`);
    console.log(`  - session.user: ${session && session.user ? "Present" : "Null"}`);
    console.log(`  - userRole: ${userRole}`);
    console.log(`  - isAuthenticated (Effect): ${isAuthenticated}`);

    // Навігація повинна відбуватися, якщо сесія дійсна І користувач успішно автентифікований
    if (!authLoading && session && session.user && isAuthenticated) {
      console.log("LOGIN_NAV_EFFECT: All conditions for navigation met.");
      if (userRole === "doctor") {
        console.log("LOGIN_NAV_EFFECT: User is a doctor, navigating to Profile_doctor.");
        navigation.replace("Profile_doctor");
      } else if (userRole === "patient") {
        console.log("LOGIN_NAV_EFFECT: User is a patient. Logging out and showing error.");
        signOut();
        setLoginError(t("error_doctors_only_login"));
        setEmail("");
        setPassword("");
        setIsAuthenticated(false); // Скидаємо прапор, якщо це не лікар
      } else if (userRole === null) {
        console.log("LOGIN_NAV_EFFECT: Session active, but userRole is null. Waiting for role to be set or defaulting to HomeScreen.");
      }
    } else if (!authLoading && !session && isAuthenticated) {
        // Це може статися, якщо signIn повернув success=true, але session ще не оновилась
        // або якщо є якась аномалія. В цьому випадку, скидаємо isAuthenticated
        // щоб не застрягти в стані очікування, якщо сесія не встановилася
        console.log("LOGIN_NAV_EFFECT: isAuthenticated True, but session is NULL. Resetting isAuthenticated.");
        setIsAuthenticated(false);
    }
    else {
      console.log("LOGIN_NAV_EFFECT: Navigation condition NOT met. Staying on Login screen.");
    }
    console.log("-----------------------------------------");
  }, [session, navigation, authLoading, userRole, signOut, t, isAuthenticated]); // Додаємо isAuthenticated до залежностей

  useEffect(() => {
    if (authError) {
      console.error("Login (useEffect - AuthError): AuthProvider error:", authError.message);
      setLoginError(t("error_login_failed", { error: authError.message }));
      setIsLoggingIn(false);
      setIsAuthenticated(false); // Скидаємо прапор, якщо є помилка автентифікації
      console.log("Login (useEffect - AuthError): isAuthenticated set to false due to authError.");
    }
  }, [authError, t]);

  const handleLogin = async () => {
    setLoginError(""); // Очищаємо попередні помилки
    setIsAuthenticated(false); // Скидаємо перед кожною спробою входу
    console.log("handleLogin: Starting login attempt. isAuthenticated set to false.");

    if (!email.trim()) {
      setLoginError(t("error_empty_email"));
      console.log("handleLogin: Email is empty.");
      return;
    }
    if (!password.trim()) {
      setLoginError(t("error_empty_password"));
      console.log("handleLogin: Password is empty.");
      return;
    }

    setIsLoggingIn(true);
    console.log("handleLogin: Attempting sign in with email:", email);
  
    const { success, error } = await signIn(email, password);
    console.log(`handleLogin: signIn completed. Success: ${success}, Error: ${error ? error.message : 'None'}`);

    if (error) {
      console.error("handleLogin: Помилка входу:", error.message);
      setLoginError(t("error_login_failed", { error: error.message }));
      // В цьому випадку, isAuthenticated залишається false, і навігація не відбудеться
      console.log("handleLogin: Login failed. Error message set. isAuthenticated remains false.");
    } else if (success) {
      console.log("handleLogin: Вхід успішний. AuthProvider тепер відповідає за навігацію.");
      setIsAuthenticated(true); // Встановлюємо прапор тільки при успішному вході
      // Навігація тепер буде викликана через useEffect, коли сесія оновиться і userRole буде визначено.
      console.log("handleLogin: Login successful. isAuthenticated set to true. Expect useEffect to navigate.");
    }
    setIsLoggingIn(false);
    console.log("handleLogin: Login attempt finished. isLoggingIn set to false.");
  };

  const handleForgotPasswordPress = () => {
    setLoginError("");
    navigation.navigate("ResetPasswordScreen", { email: email });
  };


  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width)}>
        <StatusBar style="auto" />
        <Text style={styles.title(isLargeScreen)}>
          {t("login_greeting")}
        </Text>
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

        <>
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
          </>


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
