import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Для іконки стрілки назад
// import { MaterialCommunityIcons } from "@expo/vector-icons"; // Не використовується, якщо є Icon SVG
import Icon from "../assets/icon.svg"; // Переконайтеся, що шлях до SVG правильний
import { useNavigation } from "@react-navigation/native";

// Імпортуємо useTranslation
import { useTranslation } from "react-i18next";
// Важливо: переконайтеся, що i18n.js ініціалізується десь у корені вашого додатка,
// тут його імпортувати не потрібно, якщо він вже ініціалізований глобально.
// Якщо ні, то потрібно додати import '../i18n';

export default function Messege() {
  const navigation = useNavigation();
  const { t } = useTranslation(); // Отримуємо функцію перекладу 't'

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        {/* Використовуємо ключ з i18n */}
        <Text style={styles.headerTitle}>
          {t("messages_screen.header_title")}
        </Text>
        <View>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messageList}>
        {/* Сьогодні - Підтвердження консультації */}
        <View style={styles.messageGroup}>
          <View style={styles.dateAndTimestamp}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.dateText}>{t("messages_screen.today")}</Text>
            <Text style={styles.timestampText}>09:00</Text>
          </View>
          <View style={styles.messageCard}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.cardTitle}>
              {t("messages_screen.consultation_confirmation_title")}
            </Text>
            <Text style={styles.cardText}>
              {/* Використовуємо ключ з i18n */}
              {t("messages_screen.zoom_link_text")}
            </Text>
            <Text style={styles.zoomLink}>https://zoom.us/j/1234567890</Text>
          </View>
        </View>

        {/* Сьогодні - Оплата */}
        <View style={styles.messageGroup}>
          <View style={styles.dateAndTimestamp}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.dateText}>{t("messages_screen.today")}</Text>
            <Text style={styles.timestampText}>09:00</Text>
          </View>
          <View style={styles.messageCard}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.cardTitle}>
              {t("messages_screen.payment_title")}
            </Text>
            <Text style={styles.cardText}>
              {/* Використовуємо ключ з i18n */}
              {t("messages_screen.payment_needed_text")}
            </Text>
            <TouchableOpacity style={styles.payButton}>
              {/* Використовуємо ключ з i18n */}
              <Text style={styles.payButtonText}>
                {t("messages_screen.pay_button")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Вчора - Підтвердження консультації (Відмова) */}
        <View style={styles.messageGroup}>
          <View style={styles.dateAndTimestamp}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.dateText}>
              {t("messages_screen.yesterday")}
            </Text>
            <Text style={styles.timestampText}>09:00</Text>
          </View>
          <View style={styles.messageCard}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.cardTitle}>
              {t("messages_screen.consultation_confirmation_title")}
            </Text>
            <Text style={styles.cardText}>
              {/* Використовуємо ключ з i18n */}
              {t("messages_screen.consultation_denial_text")}
            </Text>
            <TouchableOpacity style={styles.chooseDoctorButton}>
              {/* Використовуємо ключ з i18n */}
              <Text style={styles.chooseDoctorButtonText}>
                {t("messages_screen.choose_another_doctor_button")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Вчора - Анкета */}
        <View style={styles.messageGroup}>
          <View style={styles.dateAndTimestamp}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.dateText}>
              {t("messages_screen.yesterday")}
            </Text>
            <Text style={styles.timestampText}>09:00</Text>
          </View>
          <View style={styles.messageCard}>
            {/* Використовуємо ключ з i18n */}
            <Text style={styles.cardTitle}>
              {t("messages_screen.questionnaire_title")}
            </Text>
            <Text style={styles.cardText}>
              {/* Використовуємо ключ з i18n */}
              {t("messages_screen.questionnaire_confirmed_text")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 50, 
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Mont-Bold", 
    color: "#333",
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  messageGroup: {
    marginBottom: 20,
  },
  dateAndTimestamp: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  timestampText: {
    fontSize: 14,
    color: "#666",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold", 
    marginBottom: 5,
    color: "#333",
  },
  cardText: {
    fontSize: 14,
    fontFamily: "Mont-Regular", 
    color: "#555",
    marginBottom: 10,
  },
  zoomLink: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
    fontFamily: "Mont-Regular", 
  },
  payButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-start", 
    marginTop: 10,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Mont-SemiBold", 
  },
  chooseDoctorButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-start", 
    marginTop: 10,
  },
  chooseDoctorButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Mont-SemiBold", 
  },
});
