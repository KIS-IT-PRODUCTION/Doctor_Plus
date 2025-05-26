// app/SupportScreen.js
import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "../assets/icon.svg";
import TabBar from "../components/TopBar.js";
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider";

const { width } = Dimensions.get("window");

// *** ВИПРАВЛЕНО ТУТ: Змінено ім'я компонента на SupportScreen для консистентності ***
const Support = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [email, setEmail] = useState(session?.user?.email || "");
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState(null); // 'doctor' або 'patient'
  const [activeTab, setActiveTab] = useState("Headphones");

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Headphones");
      // Якщо ви хочете автоматично встановлювати email після завантаження сесії
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    }, [session?.user?.email]) // Додано залежність від session.user.email
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !message.trim() || !userType) {
      Alert.alert(t("error_title"), t("support_screen.fillAllFields"));
      return;
    }

    // Додаємо статус для запиту
    const requestData = {
      user_id: session?.user?.id || null, // Може бути null, якщо користувач не увійшов
      email: email.trim(),
      message: message.trim(),
      user_type: userType,
      // created_at буде автоматично заповнено Supabase, якщо встановлено DEFAULT now()
      // status: 'new', // Додайте, якщо у вас є колонка status
    };

    console.log("Відправлення форми підтримки:", requestData);

    try {
      const { data, error } = await supabase
        .from("user_help") // *** ПЕРЕВІРТЕ: ЦЯ НАЗВА ТАБЛИЦІ ПОВИННА ЗБІГАТИСЯ З ВАШОЮ В SUPABASE ***
        .insert([requestData]);
      // .select(); // Використовуємо .select() для отримання повернених даних

      if (error) {
        console.error("Помилка надсилання запиту в Supabase:", error);
        Alert.alert(
          t("error_title"),
          t("support_screen.sendError", { error: error.message })
        );
      } else {
        console.log("Запит на підтримку успішно надіслано:", data);
        Alert.alert(
          t("support_screen.successTitle"),
          t("support_screen.successMessage")
        );
        // Очистити поля форми після успішного надсилання
        setEmail(session?.user?.email || ""); // Залишаємо email, якщо користувач авторизований
        setMessage("");
        setUserType(null);
      }
    } catch (err) {
      console.error("Загальна помилка надсилання запиту:", err);
      Alert.alert(t("error_title"), t("support_screen.unknownError"));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            {/* *** ЗАКОМЕНТОВАНО ТУТ: Кнопка назад, якщо вона не потрібна за дизайном ***
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            */}
            <Text style={styles.headerTitle}>{t("support_screen.title")}</Text>
            <View>
              <Icon width={50} height={50} />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.instructionText}>
              {t("support_screen.instruction")}
            </Text>

            <Text style={styles.label}>{t("support_screen.emailLabel")}</Text>
            <View style={styles.inputField}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#BDBDBD"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.emailInput}
                placeholder="john.doe@domain.com"
                placeholderTextColor="#BDBDBD"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>{t("support_screen.messageLabel")}</Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder={t("support_screen.messagePlaceholder")}
                placeholderTextColor="#BDBDBD"
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
              <View style={styles.messageTips}>
                <Text style={styles.messageTipItem}>
                  • {t("support_screen.tip1")}
                </Text>
                <Text style={styles.messageTipItem}>
                  • {t("support_screen.tip2")}
                </Text>
                <Text style={styles.messageTipItem}>
                  • {t("support_screen.tip3")}
                </Text>
                {/* <Text style={styles.messageTipItem}>
                  • {t("support_screen.tip4")}
                </Text> */}
              </View>
            </View>

            <Text style={styles.label}>
              {t("support_screen.selectUserType")}
            </Text>
            <View style={styles.userTypeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === "doctor" && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType("doctor")}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === "doctor" && styles.userTypeButtonTextActive,
                  ]}
                >
                  {t("support_screen.doctor")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === "patient" && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType("patient")}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === "patient" && styles.userTypeButtonTextActive,
                  ]}
                >
                  {t("support_screen.patient")}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {t("support_screen.send")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* TabBar внизу екрана */}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 90, // Додаємо відступ для TabBar
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Mont-Bold",
    color: "#333",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
  },
  instructionText: {
    fontSize: 20,
    fontFamily: "Mont-SemiBold",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    width: "90%",
  },
  label: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    color: "#333",
    alignSelf: "flex-start",
    marginLeft: width * 0.025,
    marginBottom: 10,
    marginTop: 20,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 15,
    width: "95%",
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: "#212121",
  },
  messageInputContainer: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: "95%",
    minHeight: 180,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: "#212121",
    minHeight: 100, // Мінімальна висота для поля вводу
  },
  messageTips: {
    marginTop: 10,
  },
  messageTipItem: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#555",
    marginBottom: 5,
  },
  userTypeButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "95%",
    marginTop: 20,
    marginBottom: 30,
  },
  userTypeButton: {
    flex: 1,
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "transparent",
  },
  userTypeButtonActive: {
    backgroundColor: "#0EB3EB",
    borderColor: "#0EB3EB",
  },
  userTypeButtonText: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    color: "#0EB3EB",
  },
  userTypeButtonTextActive: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: "95%",
    alignItems: "center",
    marginBottom: 70,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: "Mont-Bold",
    color: "white",
  },
});

// *** ВИПРАВЛЕНО ТУТ: Експорт компонента як SupportScreen ***
export default Support;
