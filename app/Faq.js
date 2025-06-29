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
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import TabBar from "../components/TopBar.js"; // Переконайтеся, що шлях правильний

// Для анімації LayoutAnimation на Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Компонент одного запитання з відповіддю (AccordionItem)
const AccordionItem = ({ title, content, isExpanded, onToggleExpand }) => {
  // `isExpanded` і `onToggleExpand` тепер передаються з батьківського компонента
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

export default function Faq() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Questions");
  // Стан для відстеження, який AccordionItem розгорнуто (за його ID)
  const [expandedItemId, setExpandedItemId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      // При фокусі на екрані "Questions" встановлюємо його як активну вкладку
      setActiveTab("Questions");
    }, [])
  );

  // Дані для FAQ. Кожен об'єкт має унікальний `id`.
  // Забезпечуємо, що немає дублюючих питань, а також відповідності ключам перекладів.
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
            key={item.id} // Використовуємо унікальний id як key
            title={item.title}
            content={item.content}
            isExpanded={expandedItemId === item.id} // Передаємо стан розгортання
            onToggleExpand={() => handleToggleExpand(item.id)} // Передаємо функцію для зміни стану
          />
        ))}
      </ScrollView>

      {/* TabBar внизу екрана Faq */}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "ios" ? StatusBar.currentHeight + 5 : 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
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
    paddingBottom: 100, // Додаємо відступ для TabBar, щоб він не перекривав вміст
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