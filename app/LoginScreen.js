import React, { useState, useEffect, useCallback } from "react";
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
import { useAuth } from "../providers/AuthProvider";
import { useTranslation } from "react-i18next";
import { MotiView, AnimatePresence } from "moti";

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const styles = getStyles(Dimensions.get("window").width > 768);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    setServerError("");
    
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

    const { success, error } = await signIn(email.trim(), password);

    if (!success) {
      setServerError(t("error_login_failed", { error: error?.message || "Unknown error" }));
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

  const isDisabled = authLoading;

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
              
              <AnimatePresence>
                {serverError ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Text style={styles.errorText}>{serverError}</Text>
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
                  onPress={() => navigation.navigate("RegisterScreen")}
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
    },
    buttonDisabled: {
      backgroundColor: "#A0A0A0",
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    errorText: {
      color: "#D32F2F",
      textAlign: "center",
      marginTop: 10,
      fontFamily: "Mont-Bold",
      fontSize: 14,
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
    },
    registerLinkText: {
      fontSize: 16,
      color: "#757575",
      fontFamily: "Mont-Regular",
    },
  });

export default LoginScreen;