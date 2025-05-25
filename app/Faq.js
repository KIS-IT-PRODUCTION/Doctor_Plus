import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated, // Для анімацій
  LayoutAnimation, // Для плавної анімації розгортання/згортання
  Platform,
  UIManager,
  // Dimensions, // Dimensions не потрібен тут, оскільки використовується в TabBar.js
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../assets/icon.svg"; // Переконайтеся, що шлях до SVG правильний
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Додано useFocusEffect
import { useTranslation } from "react-i18next";
import TabBar from "../components/TopBar.js"; // *** ВИПРАВЛЕНО ТУТ: ЗМІНЕНО НА TabBar.js ***

// Для анімації LayoutAnimation на Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Компонент одного запитання з відповіддю
const AccordionItem = ({ title, content }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnimation = new Animated.Value(expanded ? 1 : 0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);

    Animated.timing(rotateAnimation, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const arrowTransform = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity onPress={toggleExpand} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowTransform }] }}>
          <Ionicons name="chevron-down-outline" size={20} color="#000" />
        </Animated.View>
      </TouchableOpacity>
      {expanded && (
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
  // Встановлюємо "Questions" як активну вкладку для Faq.
  // Цей початковий стан буде встановлений при першому рендерингу компонента.
  const [activeTab, setActiveTab] = useState("Questions");

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Questions");
    }, [])
  );

  const faqData = [
    { title: t("faq_screen.q1_title"), content: t("faq_screen.q1_answer") },
    { title: t("faq_screen.q2_title"), content: t("faq_screen.q2_answer") },
    { title: t("faq_screen.q3_title"), content: t("faq_screen.q3_answer") },
    { title: t("faq_screen.q4_title"), content: t("faq_screen.q4_answer") },
    { title: t("faq_screen.q5_title"), content: t("faq_screen.q5_answer") },
    { title: t("faq_screen.q6_title"), content: t("faq_screen.q6_answer") },
    { title: t("faq_screen.q7_title"), content: t("faq_screen.q7_answer") },
    { title: t("faq_screen.q8_title"), content: t("faq_screen.q8_answer") },
    { title: t("faq_screen.q9_title"), content: t("faq_screen.q9_answer") },
    { title: t("faq_screen.q4_title"), content: t("faq_screen.q4_answer") },
    { title: t("faq_screen.q1_title"), content: t("faq_screen.q1_answer") },
    { title: t("faq_screen.q7_title"), content: t("faq_screen.q7_answer") },
    { title: t("faq_screen.q8_title"), content: t("faq_screen.q8_answer") },
    { title: t("faq_screen.q1_title"), content: t("faq_screen.q1_answer") },
    { title: t("faq_screen.q4_title"), content: t("faq_screen.q4_answer") },
  ];

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
        {faqData.map((item, index) => (
          <AccordionItem
            key={index}
            title={item.title}
            content={item.content}
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
    paddingTop: 30,
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
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  accordionTitle: {
    flex: 1,
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
