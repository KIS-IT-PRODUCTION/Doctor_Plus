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
import { useNavigation } from "@react-navigation/native"; // useNavigation для доступу до навігації
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const TabBar_doctor = ({ activeTab, onTabPress }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handlePress = (tabName, screenName) => {
    // Оновлюємо активну вкладку в батьківському компоненті,
    // щоб він знав, яка вкладка зараз активна і міг її підсвітити.
    onTabPress(tabName);

    // Отримуємо поточний стан навігації
    const state = navigation.getState();
    // Отримуємо назву поточного активного маршруту
    const currentRouteName = state.routes[state.index].name;

    // Перевіряємо, чи поточний маршрут відрізняється від того,
    // на який ми хочемо перейти, щоб уникнути зайвої навігації.
    if (currentRouteName !== screenName) {
      // Використовуємо replace, щоб замінити поточний екран новим.
      // Це запобігає накопиченню дублікатів екранів у стеку навігації.
      navigation.replace(screenName);
    }
  };

  return (
    <View style={[styles.tabBar_doctorContainer, { bottom: 10 + insets.bottom }]}>
      {/* Кнопка "Домашня" */}
       
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Profile_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Profile_doctor", "Profile_doctor")}
      >
        <Ionicons
          name="person-outline"
          size={28}
          color={activeTab === "Profile_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Profile_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("profile")}
        </Text>
      </TouchableOpacity>
     

      {/* Кнопка "Питання" (FAQ) */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Questions_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Questions_doctor", "Faq_doctor")} // Переконайтеся, що "Faq_doctor" - це назва вашого екрану
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={28}
          color={activeTab === "Questions_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Questions_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("questions")}
        </Text>
      </TouchableOpacity>

      {/* Кнопка "Підтримка" */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Headphones_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Headphones_doctor", "Support_doctor")} // Переконайтеся, що "Support_doctor" - це назва вашого екрану
      >
        <Ionicons
          name="headset-outline"
          size={28}
          color={activeTab === "Headphones_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Headphones_doctor" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("support")}
        </Text>
      </TouchableOpacity>

      {/* Кнопка "Відгуки" */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Stars_doctor" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Stars_doctor", "Rewiew_app")} // Переконайтеся, що "Rewiew_app" - це назва вашого екрану
      >
        <Ionicons
          name="star-outline"
          size={28}
          color={activeTab === "Stars_doctor" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Stars_doctor" ? "#0EB3EB" : "white" },
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
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgb(14, 180, 235)",
    height: 70,
    width: Dimensions.get("window").width * 0.9,
    borderRadius: 555, // Створює "круглястий" вигляд
    position: "absolute",
    alignSelf: "center", // Вирівнює контейнер по центру горизонтально
    paddingHorizontal: 10,
    zIndex: 10, // Гарантує, що таббар буде поверх іншого контенту
    overflow: "hidden", // Обрізає вміст, якщо він виходить за межі borderRadius
    // Додаємо тіні для кращого візуального ефекту
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5, // Збільшуємо тінь, щоб таббар "плавав"
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10, // Для Android тіні
  },
  tabButton: {
    flex: 1, // Розподіляє простір між кнопками рівномірно
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2, // Невеликий відступ між кнопками
    paddingVertical: 5,
    // transition: 'all 0.3s ease-in-out', // CSS transition не працює в React Native Styles
  },
  activeTabButton: {
    borderRadius: 555, // Також "круглястий" вигляд для активної кнопки
    backgroundColor: "white",
    width: 60, // Фіксована ширина
    height: 55, // Фіксована висота
    justifyContent: "center",
    alignItems: "center",
    // Додаємо тінь для активної кнопки, щоб вона виділялась
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
    fontFamily: "Mont-Regular", // Переконайтеся, що шрифт завантажено
    textAlign: "center", // Вирівнювання тексту по центру
  },
});

export default TabBar_doctor;