import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
// Переконайтеся, що шлях до TopBar_doctor.js є правильним
import TabBar_doctor from "../../components/TopBar_doctor"; 

// Для анімації LayoutAnimation на Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Компонент одного запитання з відповіддю (AccordionItem)
const AccordionItem = ({ title, content, isExpanded, onToggleExpand }) => {
  const rotateAnimation = new Animated.Value(isExpanded ? 1 : 0);

  // Анімація обертання стрілки
  Animated.timing(rotateAnimation, {
    toValue: isExpanded ? 1 : 0,
    duration: 300,
    useNativeDriver: true,
  }).start();

  const arrowTransform = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity onPress={onToggleExpand} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowTransform }] }}>
          <Ionicons name="chevron-down-outline" size={20} color="#000" />
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && ( // Залежить від isExpanded
        <View style={styles.accordionContent}>
          <Text style={styles.accordionText}>{content}</Text>
        </View>
      )}
    </View>
  );
};

export default function Faq_doctor() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  // Встановлюємо початкову активну вкладку для цього екрану
  const [activeTab, setActiveTab] = useState("Questions_doctor"); 
  const [expandedItemId, setExpandedItemId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      // При фокусі на екрані "Questions_doctor" встановлюємо його як активну вкладку
      setActiveTab("Questions_doctor");
    }, [])
  );

  // Функція для обробки натискань на вкладки TabBar_doctor
  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Використовуйте navigation.navigate для переходу між екранами.
    // Назви екранів повинні відповідати тим, що ви визначили у вашому навігаторі.
    switch (tabName) {
      case "Home_doctor":
        navigation.navigate("Home_doctor"); // Припустимо, у вас є екран "Home_doctor"
        break;
      case "Records_doctor":
        navigation.navigate("Records_doctor"); // Припустимо, у вас є екран "Records_doctor"
        break;
      case "Chat_doctor":
        navigation.navigate("Chat_doctor"); // Припустимо, у вас є екран "Chat_doctor"
        break;
      case "Headphones_doctor":
        navigation.navigate("Support_doctor"); // Припустимо, у вас є екран "Support_doctor"
        break;
      case "Stars_doctor": // Можливо, "Reviews_doctor" або схоже
        navigation.navigate("Rewiew_app"); // Припустимо, у вас є екран "Rewiew_app"
        break;
      case "Questions_doctor": // Цей екран FAQ
        // Якщо ми вже на цьому екрані, не потрібно навігувати знову
        break;
      case "Profile_doctor":
        navigation.navigate("Profile_doctor"); // Припустимо, у вас є екран "Profile_doctor"
        break;
      default:
        break;
    }
  };

  const faqData = [
    { id: "q1", title: t("faq_screen.q1_title"), content: t("faq_screen.q1_answer") },
    { id: "q2", title: t("faq_screen.q2_title"), content: t("faq_screen.q2_answer") },
    { id: "q3", title: t("faq_screen.q3_title"), content: t("faq_screen.q3_answer") },
    { id: "q4", title: t("faq_screen.q4_title"), content: t("faq_screen.q4_answer") },
    { id: "q5", title: t("faq_screen.q5_title"), content: t("faq_screen.q5_answer") },
    { id: "q6", title: t("faq_screen.q6_title"), content: t("faq_screen.q6_answer") },
    { id: "q7", title: t("faq_screen.q7_title"), content: t("faq_screen.q7_answer") },
    { id: "q8", title: t("faq_screen.q8_title"), content: t("faq_screen.q8_answer") },
    { id: "q9", title: t("faq_screen.q9_title"), content: t("faq_screen.q9_answer") },
  ];

  const handleToggleExpand = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId((prevId) => (prevId === id ? null : id));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("faq_screen.header_title")}</Text>
        <View>
          <Icon width={50} height={50} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.faqList}>
        {faqData.map((item) => (
          <AccordionItem
            key={item.id}
            title={item.title}
            content={item.content}
            isExpanded={expandedItemId === item.id}
            onToggleExpand={() => handleToggleExpand(item.id)}
          />
        ))}
      </ScrollView>

      {/* TabBar_doctor внизу екрана Faq */}
      {/* Передаємо handleTabPress як onTabPress */}
      <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 50, // Відступ зверху для вмісту
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
  faqList: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingBottom: 100, // Додаємо відступ для TabBar_doctor, щоб він не перекривав вміст
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    overflow: "hidden", // Важливо для коректного відображення згортання
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  accordionTitle: {
    flex: 1, // Дозволяє заголовку займати доступний простір
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    color: "#333",
    marginRight: 10,
  },
  accordionContent: {
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  accordionText: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#555",
  },
});