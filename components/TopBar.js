// components/TabBar.js
import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const TabBar = ({ activeTab, onTabPress }) => {
  const navigation = useNavigation();

  const handlePress = (tabName) => {
    onTabPress(tabName); // Оновлюємо активну вкладку
    // Тут можна додати логіку навігації, якщо кожен таб веде на окремий екран
    // Наприклад:
    // if (tabName === 'Home') navigation.navigate('Patsient_Home');
    // else if (tabName === 'Questions') navigation.navigate('QuestionsScreen'); // Припустимо, є такий екран
  };

  return (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Home" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Home")}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={activeTab === "Home" ? "#0EB3EB" : "white"} // Колір іконки
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Questions" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Questions")}
      >
        <Ionicons
          name="chatbubble-ellipses-outline" // Або інша іконка, схожа на питання
          size={28}
          color={activeTab === "Questions" ? "#0EB3EB" : "white"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Headphones" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Headphones")}
      >
        <Ionicons
          name="headset-outline" // Іконка для навушників
          size={28}
          color={activeTab === "Headphones" ? "#0EB3EB" : "white"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Stars" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Stars")}
      >
        <Ionicons
          name="star-outline" // Іконка для зірки
          size={28}
          color={activeTab === "Stars" ? "#0EB3EB" : "white"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.69)", // Основний синій колір фону панелі
    height: 71, // Висота панелі
    width: width * 0.9, // Ширина панелі, як на зображенні
    borderRadius: 555, // Округлені кути
    position: "absolute", // Для позиціонування внизу екрану
    bottom: 30, // Відступ від низу
    alignSelf: "center", // Центрування по горизонталі
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 50, // Ширина кнопки
    height: 50, // Висота кнопки
    borderRadius: 555, // Круглі кнопки, якщо активні
    marginHorizontal: 10, // Відступи між кнопками
  },
  activeTabButton: {
    borderRadius: 555, // Круглі кнопки
    backgroundColor: "white", // Активний синій колір
    width: 50, // Розмір активної круглої кнопки
    height: 50, // Розмір активної круглої кнопки
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBar;
