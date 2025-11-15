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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "react-i18next";
import { MotiView, AnimatePresence } from "moti";

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const Login = () => {
  const navigation = useNavigation();
  const { session, userRole, loading: authLoading, isRoleDetermined, signIn } = useAuth();
  const { t } = useTranslation();
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;
  const styles = getStyles(isLargeScreen);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const isDisabled = authLoading;

  // Функція для перекладу технічних помилок Supabase на зрозумілу мову
  const getFriendlyErrorMessage = (errorMsg) => {
    if (!errorMsg) return t("error_unknown_login");

    const lowerMsg = errorMsg.toLowerCase();

    // Основні помилки Supabase / Auth
    if (lowerMsg.includes("invalid login credentials")) {
      return t("error_invalid_credentials"); // "Невірний email або пароль"
    }
    if (lowerMsg.includes("email not confirmed")) {
      return t("error_email_not_confirmed"); // "Ваш email не підтверджено. Перевірте пошту."
    }
    if (lowerMsg.includes("user not found")) {
      return t("error_user_not_found"); // "Користувача з таким email не знайдено"
    }
    if (lowerMsg.includes("too many requests")) {
      return t("error_too_many_requests"); // "Забагато спроб. Спробуйте пізніше."
    }
    if (lowerMsg.includes("network request failed")) {
      return t("error_network_failed"); // "Помилка мережі. Перевірте інтернет."
    }

    // Якщо помилка невідома, показуємо її або заглушку
    return errorMsg || t("error_general_login_failed");
  };

  useEffect(() => {
    if (authLoading || !isRoleDetermined) {
      return;
    }

    if (session && session.user) {
      if (userRole === "doctor") {
        navigation.replace("Profile_doctor", { doctorId: session.user.id });
      } else if (userRole === "patient") {
        navigation.replace("Patsient_Home", { patientId: session.user.id });
      } else {
        navigation.replace("HomeScreen");
      }
    }
  }, [session, userRole, authLoading, isRoleDetermined, navigation]);

  const validateForm = () => {
    const newErrors = {};
    setServerError(""); // Очищаємо помилку сервера перед валідацією
    
    if (!email.trim()) {
      newErrors.email = t("error_empty_email");
    } else if (!validateEmail(email.trim())) {
      newErrors.email = t("error_invalid_email");
    }
    
    if (!password.trim()) {
      newErrors.password = t("error_empty_password");
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      return;
    }

    // Очищаємо попередні помилки перед запитом
    setServerError("");
    
    const { success, error } = await signIn(email.trim(), password);

    if (!success) {
      // Обробляємо помилку через нашу функцію маппінгу
      const friendlyError = getFriendlyErrorMessage(error?.message);
      setServerError(friendlyError);
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const handleForgotPasswordPress = () => {
    setServerError("");
    setFieldErrors({});
    navigation.navigate("ResetPasswordScreen", { email: email });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              <MotiView
                from={{ opacity: 0, translateY: -30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400 }}
              >
                <Text style={styles.title}>{t("login_greeting")}</Text> 
                <Text style={styles.subtitle}>{t("login_subtitle")}</Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400, delay: 100 }}
              >
                <Text style={styles.label}>{t("email")}</Text>
                <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_email")}
                    placeholderTextColor="#B0BEC5"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: null }));
                      if (serverError) setServerError(""); // Очищення помилки сервера при введенні
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isDisabled}
                  />
                </View>
                {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}

                <Text style={styles.label}>{t("password")}</Text>
                <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_password")}
                    placeholderTextColor="#B0BEC5"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: null }));
                      if (serverError) setServerError(""); // Очищення помилки сервера при введенні
                    }}
                    secureTextEntry={!isPasswordVisible}
                    editable={!isDisabled}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color="#B0BEC5" />
                  </TouchableOpacity>
                </View>
                {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}
              </MotiView>

              {/* Блок відображення помилки сервера */}
              <AnimatePresence>
                {serverError ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.8, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, height: 0 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.serverErrorContainer}
                  >
                    <Ionicons name="alert-circle" size={24} color="#D32F2F" style={{ marginRight: 8 }} />
                    <Text style={styles.serverErrorText}>{serverError}</Text>
                  </MotiView>
                ) : null}
              </AnimatePresence>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400, delay: 200 }}
              >
                <TouchableOpacity
                  style={[styles.loginButton, isDisabled && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isDisabled}
                >
                  <AnimatePresence exitBeforeEnter>
                    {isDisabled ? (
                      <MotiView key="loader" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                        <ActivityIndicator color="#fff" />
                      </MotiView>
                    ) : (
                      <MotiView key="text" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                        <Text style={styles.loginButtonText}>{t("login_button")}</Text>
                      </MotiView>
                    )}
                  </AnimatePresence>
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
                  onPress={() => navigation.navigate("Register")}
                  disabled={isDisabled}
                >
                  <Text style={styles.registerLinkText}>
                    {t("not_registered")} 
                    <Text style={{ fontWeight: "bold" }}> {t("register_link")}</Text> 
                  </Text>
                </TouchableOpacity>
              </MotiView>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (isLargeScreen) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    innerContainer: {
      width: "100%",
      maxWidth: isLargeScreen ? 400 : "90%",
      padding: 20,
    },
    title: {
      fontSize: isLargeScreen ? 36 : 32,
      marginBottom: 9,
      fontFamily: "Mont-Bold",
      color: "#212121",
      textAlign: "center",
    },
    subtitle: {
      fontSize: isLargeScreen ? 18 : 16,
      color: "#757575",
      fontFamily: "Mont-Regular",
      marginBottom: 32,
      textAlign: "center",
    },
    label: {
      fontSize: 16,
      color: "#2A2A2A",
      fontFamily: "Mont-Medium",
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(14, 179, 235, 0.1)",
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 4,
      height: 52,
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputError: {
      borderColor: "#D32F2F",
      backgroundColor: "rgba(211, 47, 47, 0.05)", // Трохи червонуватий фон при помилці
    },
    icon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: "Mont-Regular",
      color: "#000",
    },
    eyeIcon: {
      padding: 5,
    },
    loginButton: {
      backgroundColor: "#0EB3EB",
      borderRadius: 12,
      paddingVertical: 15,
      width: "100%",
      height: 52,
      alignItems: "center",
      marginTop: 16,
      justifyContent: "center",
      shadowColor: "#0EB3EB",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    buttonDisabled: {
      backgroundColor: "#A0A0A0",
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 18,
      fontFamily: "Mont-Bold",
      textAlign: "center",
    },
    // Стилі для блоку помилки сервера
    serverErrorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFEBEE", // Світло-червоний фон
      borderRadius: 8,
      padding: 12,
      marginTop: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#FFCDD2",
    },
    serverErrorText: {
      color: "#D32F2F",
      fontFamily: "Mont-Medium",
      fontSize: 14,
      flex: 1, // Щоб текст переносився, якщо довгий
    },
    fieldErrorText: {
      color: "#D32F2F",
      fontSize: 13,
      fontFamily: "Mont-Regular",
      marginBottom: 10,
      marginLeft: 5,
    },
    forgotPasswordLink: {
      marginTop: 16,
      alignSelf: "center",
      padding: 5,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: "#757575",
      textDecorationLine: "underline",
      fontFamily: "Mont-Regular",
    },
    registerLink: {
      marginTop: 24,
      alignSelf: "center",
      padding: 5,
    },
    registerLinkText: {
      fontSize: 16,
      color: "#757575",
      fontFamily: "Mont-Regular",
    },
  });

export default Login;