// components/TabBar_doctor.js
import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Додаємо useRoute для отримання інформації про поточний маршрут
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Зміни тут: прибираємо state та navigation з пропсів, використовуємо хуки
const TabBar_doctor = () => {
  const navigation = useNavigation(); // Отримуємо об'єкт навігації
  const route = useRoute();           // Отримуємо об'єкт поточного маршруту
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Використовуємо route.name для визначення активної вкладки
  const currentRouteName = route.name;

  const handlePress = (screenName) => {
    if (currentRouteName !== screenName) {
      // Використовуємо replace для навігації
      navigation.replace(screenName);
    }
  };

  return (
    <View style={[styles.tabBar_doctorContainer, { bottom: 10 + insets.bottom }]}>
      {/* Кнопка "Профіль" */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          currentRouteName === "Profile_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Profile_doctor")}
      >
        <Ionicons
          name="person-outline"
          size={28}
          color={currentRouteName === "Profile_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentRouteName === "Profile_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("profile")}
        </Text>
      </TouchableOpacity>

      {/* Кнопка "Питання" (FAQ) */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          currentRouteName === "Faq_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Faq_doctor")}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={28}
          color={currentRouteName === "Faq_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentRouteName === "Faq_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("questions")}
        </Text>
      </TouchableOpacity>

      {/* Кнопка "Підтримка" */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          currentRouteName === "Support_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Support_doctor")}
      >
        <Ionicons
          name="headset-outline"
          size={28}
          color={currentRouteName === "Support_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentRouteName === "Support_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("support")}
        </Text>
      </TouchableOpacity>

      {/* Кнопка "Відгуки" */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          currentRouteName === "Rewiew_app" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Rewiew_app")}
      >
        <Ionicons
          name="star-outline"
          size={28}
          color={currentRouteName === "Rewiew_app" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentRouteName === "Rewiew_app" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("Review")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar_doctorContainer: {
    position: "fixed", // Або "absolute"
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgb(14, 180, 235)",
    height: 70,
    width: Dimensions.get("window").width * 0.9,
    borderRadius: 555,
    position: "absolute", // Змінив на "absolute" для надійності
    alignSelf: "center",
    paddingHorizontal: 10,
    zIndex: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    paddingVertical: 5,
  },
  activeTabButton: {
    borderRadius: 555,
    backgroundColor: "white",
    width: 60,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Mont-Regular",
    textAlign: "center",
  },
});

export default TabBar_doctor;