// app/doctor/ResetPasswordScreen.js

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";

const { width, height } = Dimensions.get("window");
const isLargeScreen = width > 768;

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

  const otpSentRef = useRef(false);

  const clearForm = useCallback(() => {
    otpSentRef.current = false;
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setEmail(initialEmail || "");
    setResetError("");
  }, [initialEmail]);

  const handleSendPasswordResetOtp = useCallback(async (emailToSend) => {
    setResetError("");
    if (!emailToSend.trim()) {
      Alert.alert(t("forgot_password_title"), t("forgot_password_enter_email"));
      setIsProcessingReset(false);
      return;
    }

    setIsProcessingReset(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: false,
          channel: 'email'
        }
      });

      if (error) {
        Alert.alert(t("error_title"), t("forgot_password_send_otp_error", { error: error.message }));
        setOtpSent(false);
        otpSentRef.current = false;
      } else {
        Alert.alert(
          t("forgot_password_title"),
          t("forgot_password_check_email_for_otp", { email: emailToSend })
        );
        setOtpSent(true);
      }
    } catch (err) {
      Alert.alert(t("error_title"), t("error_general_send_otp"));
      setOtpSent(false);
      otpSentRef.current = false;
    } finally {
      setIsProcessingReset(false);
    }
  }, [t]);

  useEffect(() => {
    if (initialEmail && !otpSentRef.current) {
      otpSentRef.current = true;
      setEmail(initialEmail);
      handleSendPasswordResetOtp(initialEmail);
    } else if (!initialEmail) {
      Alert.alert(t("error_title"), t("reset_password_no_email_provided"), [
        { text: t("ok_button"), onPress: () => navigation.goBack() }
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerifyOtpAndSetNewPassword = useCallback(async () => {
    setResetError("");

    if (!otp.trim()) return setResetError(t("error_empty_otp"));
    if (!newPassword.trim() || !confirmNewPassword.trim()) return setResetError(t("error_empty_password_fields"));
    if (newPassword !== confirmNewPassword) return setResetError(t("error_passwords_match"));
    if (newPassword.length < 6) return setResetError(t("error_password_too_short"));

    setIsProcessingReset(true);

    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (otpError) {
        setResetError(t("error_otp_verification_failed", { error: otpError.message }));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setResetError(t("error_password_update_failed", { error: updateError.message }));
      } else {
        Alert.alert(t("success_title"), t("success_password_updated_and_logged_in"), [
          {
            text: t("ok_button"),
            onPress: () => {
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
              clearForm();
            },
          },
        ]);
      }
    } catch (err) {
      setResetError(t("error_general_otp_reset"));
    } finally {
      setIsProcessingReset(false);
    }
  }, [otp, newPassword, confirmNewPassword, email, t, navigation, clearForm]);

  const handleManualSendOtp = useCallback(() => {
    otpSentRef.current = true;
    handleSendPasswordResetOtp(email);
  }, [email, handleSendPasswordResetOtp]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar style="auto" />
        <View style={styles.container}>
          <Text style={styles.title}>{t("reset_password_screen_title")}</Text>
          <Text style={styles.subtitle}>{t("reset_password_screen_subtitle")}</Text>

          {!otpSent ? (
            <>
              <Text style={styles.subtitle2}>{t("email")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#B0BEC5" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("placeholder_email")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isProcessingReset}
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={handleManualSendOtp}
                disabled={isProcessingReset}
                activeOpacity={0.8}
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
              <View style={styles.inputContainer}>
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
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("placeholder_new_password")}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!isProcessingReset}
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.subtitle2}>{t("confirm_password")}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("placeholder_confirm_password")}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry
                  editable={!isProcessingReset}
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtpAndSetNewPassword}
                disabled={isProcessingReset}
                activeOpacity={0.8}
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
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>{t("back_to_login")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: height * 0.2,
    paddingHorizontal: width * 0.05,
    width: "100%",
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
    marginBottom: 24,
    textAlign: "center",
  },
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 35,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    height: 52,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Mont-Regular",
  },
  backLink: {
    marginTop: 20,
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: "#757575",
    textDecorationLine: "underline",
  },
});

export default ResetPasswordScreen;