// screens/ResetPasswordScreen.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient"; // Переконайтеся, що шлях правильний
import { useTranslation } from "react-i18next";

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Використовуємо useRoute для доступу до параметрів
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Supabase автоматично встановлює сесію при переході за посиланням скидання пароля.
  // Ми просто чекаємо на подію PASSWORD_RECOVERY або перевіряємо стан сесії.

  useEffect(() => {
    // Supabase emits a 'PASSWORD_RECOVERY' event when the user clicks the reset link.
    // We can listen for this to confirm the user is in a password reset state.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // Користувач перейшов за посиланням для скидання пароля.
          // Сесія вже встановлена Supabase.
          console.log("PASSWORD_RECOVERY event received. Session is active.");
          setError(""); // Очищуємо помилки, якщо були
        } else if (event === "SIGNED_IN" && session) {
            // Це може спрацювати, якщо користувач вже увійшов,
            // але також може бути спрацьовування після PASSWORD_RECOVERY.
            // Можливо, тут потрібно більш тонка логіка, якщо цей екран
            // має бути доступний тільки для скидання пароля.
            // Наприклад, перевіряти, чи є у URL певний параметр
            // або чи є сесія без `user_metadata.is_password_reset = true`
            console.log("SIGNED_IN event received on ResetPasswordScreen. Session:", session);
        } else if (!session && event !== "INITIAL_SESSION") {
            // Якщо сесії немає (наприклад, користувач просто спробував перейти на цей екран без токена)
            // або сесія закінчилася, можливо, потрібно перенаправити його.
            console.log("No active session on ResetPasswordScreen. Event:", event);
            // Тут можна додати логіку перенаправлення на екран входу
            // navigation.navigate("Login");
        }
      }
    );

    // Очищення слухача при розмонтуванні компонента
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("error_passwords_do_not_match"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("error_password_length"));
      return;
    }

    setLoading(true);
    try {
      // Supabase automatically authenticates the user when they click the reset link.
      // So, you just need to call updateUser with the new password.
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Error updating password:", updateError.message);
        setError(t("error_password_update_failed", { error: updateError.message }));
      } else {
        Alert.alert(t("success_title"), t("password_reset_success"));
        // Після успішної зміни пароля, можна перенаправити користувача на екран входу
        navigation.replace("Login"); // Або на інший екран, наприклад, "Home"
      }
    } catch (err) {
      console.error("Unexpected error during password update:", err);
      setError(t("error_general_password_reset"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("reset_password_title")}</Text>
      <Text style={styles.subtitle}>{t("reset_password_instructions")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("placeholder_new_password")}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder={t("placeholder_confirm_password")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("reset_password_button")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 8,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default ResetPasswordScreen;