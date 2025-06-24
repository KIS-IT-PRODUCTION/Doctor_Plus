// app/doctor/ResetPasswordScreen.js

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
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email: initialEmail } = route.params || {};
  const { signIn } = useAuth();

  const { t } = useTranslation();

  const [email, setEmail] = useState(initialEmail || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [resetError, setResetError] = useState("");

  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  const clearForm = useCallback(() => { // Використовуємо useCallback для clearForm
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setEmail(initialEmail || ""); // Зберігаємо початковий email, якщо він є
    setResetError("");
  }, [initialEmail]);

  const handleSendPasswordResetOtp = useCallback(async (emailToSend) => {
    setResetError("");
    if (!emailToSend.trim()) {
      Alert.alert(t("forgot_password_title"), t("forgot_password_enter_email"));
      console.log("ResetPasswordScreen (handleSendPasswordResetOtp): Email is empty. Aborting OTP send.");
      setIsProcessingReset(false); // Завжди встановлюємо false, якщо не відправляємо
      return;
    }

    setIsProcessingReset(true);
    console.log("ResetPasswordScreen (handleSendPasswordResetOtp): Attempting to send OTP to:", emailToSend);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: false,
          channel: 'email'
        }
      });

      if (error) {
        console.error("ResetPasswordScreen (handleSendPasswordResetOtp): Supabase OTP send error:", error.message, "Error code:", error.code);
        Alert.alert(t("error_title"), t("forgot_password_send_otp_error", { error: error.message }));
        setOtpSent(false);
      } else {
        console.log("ResetPasswordScreen (handleSendPasswordResetOtp): Supabase OTP send successful. Data:", data);
        Alert.alert(
          t("forgot_password_title"),
          t("forgot_password_check_email_for_otp", { email: emailToSend })
        );
        setOtpSent(true);
        console.log("ResetPasswordScreen (handleSendPasswordResetOtp): OTP sent successfully. otpSent is now TRUE.");
      }
    } catch (err) {
      console.error("ResetPasswordScreen (handleSendPasswordResetOtp): Unexpected error during OTP send:", err.message);
      Alert.alert(t("error_title"), t("error_general_send_otp"));
      setOtpSent(false);
    } finally {
      setIsProcessingReset(false);
      console.log("ResetPasswordScreen (handleSendPasswordResetOtp): Finished sending OTP. isProcessingReset set to FALSE.");
    }
  }, [t]);

  useEffect(() => {
    console.log("ResetPasswordScreen: useEffect for OTP auto-send triggered.");
    if (initialEmail && !otpSent && !isProcessingReset) {
      console.log("ResetPasswordScreen: initialEmail present, OTP not yet sent. Auto-sending OTP.");
      setEmail(initialEmail);
      handleSendPasswordResetOtp(initialEmail);
    } else if (!initialEmail && !isProcessingReset) { // Додано !isProcessingReset, щоб не конфліктувати з поточною операцією
      Alert.alert(t("error_title"), t("reset_password_no_email_provided"), [
        { text: t("ok_button"), onPress: () => navigation.goBack() }
      ]);
    }
  }, [initialEmail, otpSent, isProcessingReset, handleSendPasswordResetOtp, navigation, t]);


  const handleVerifyOtpAndSetNewPassword = async () => {
    console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): FUNCTION STARTED. isProcessingReset is:", isProcessingReset);
    setResetError("");

    if (!otp.trim()) {
      setResetError(t("error_empty_otp"));
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): OTP is empty.");
      return;
    }
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setResetError(t("error_empty_password_fields"));
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Password fields are empty.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError(t("error_passwords_match"));
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError(t("error_password_too_short"));
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): New password is too short.");
      return;
    }

    setIsProcessingReset(true);
    console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Starting OTP verification and password update.");

    try {
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Verifying OTP with email:", email, "and OTP:", otp);
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });

      if (otpError) {
        console.error("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): OTP verification error:", otpError.message);
        setResetError(t("error_otp_verification_failed", { error: otpError.message }));
        return;
      }
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): OTP verified successfully. Updating password.");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Password update error:", updateError.message);
        setResetError(t("error_password_update_failed", { error: updateError.message }));
      } else {
        console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Password updated successfully. Attempting auto-sign-in...");

        // Тут ми покладаємося на AuthProvider, який слухає зміни стану авторизації.
        // Замість прямого signIn тут, ми даємо supabase.auth.updateUser завершити
        // і дозволяємо onAuthStateChange в AuthProvider виявити, що користувач тепер
        // авторизований, і перенаправити його.

        Alert.alert(t("success_title"), t("success_password_updated_and_logged_in"), [
          {
            text: t("ok_button"),
            onPress: () => {
              // Просто переходимо на екран Auth, який має логіку перенаправлення
              // на Profile_doctor.js, якщо користувач авторизований.
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
              // Очищення форми після успішної навігації
              clearForm(); 
            },
          },
        ]);
        // Важливо: після Alert і навігації, не робіть тут signIn
        // бо це може викликати гонку станів.
      }
    } catch (err) {
      console.error("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Unexpected error during OTP verification or password update:", err.message);
      setResetError(t("error_general_otp_reset"));
    } finally {
      setIsProcessingReset(false);
      console.log("ResetPasswordScreen (handleVerifyOtpAndSetNewPassword): Finished reset process. isProcessingReset set to FALSE.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width)}>
        <StatusBar style="auto" />
        <Text style={styles.title(isLargeScreen)}>{t("reset_password_screen_title")}</Text>
        <Text style={styles.subtitle(isLargeScreen)}>{t("reset_password_screen_subtitle")}</Text>

        {!otpSent ? (
          <>
            <Text style={styles.subtitle2}>{t("email")}</Text>
            <View style={styles.inputContainer(width)}>
              <Ionicons name="mail-outline" size={20} color="#B0BEC5" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder={t("placeholder_email")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isProcessingReset}
              />
            </View>
            <TouchableOpacity
              style={styles.button(width)}
              onPress={() => handleSendPasswordResetOtp(email)}
              disabled={isProcessingReset}
            >
              {isProcessingReset ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t("send_otp_button")}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle2}>{t("otp_code")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("placeholder_otp")}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isProcessingReset}
              />
            </View>

            <Text style={styles.subtitle2}>{t("new_password")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("placeholder_new_password")}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!isProcessingReset}
              />
            </View>

            <Text style={styles.subtitle2}>{t("confirm_password")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("placeholder_confirm_password")}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                editable={!isProcessingReset}
              />
            </View>

            <TouchableOpacity
              style={styles.button(width)}
              onPress={handleVerifyOtpAndSetNewPassword}
              disabled={isProcessingReset}
            >
              {isProcessingReset ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t("reset_password_button")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => {
            clearForm();
            navigation.goBack();
          }}
          disabled={isProcessingReset}
        >
          <Text style={styles.backLinkText}>{t("back_to_login")}</Text>
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
  button: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  }),
  buttonText: {
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
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    fontSize: 14,
    color: "#757575",
    textDecorationLine: "underline",
  },
});

export default ResetPasswordScreen;