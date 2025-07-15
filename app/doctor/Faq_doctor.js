import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../../assets/icon.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import TabBar_doctor from "../../components/TopBar_doctor"; 
import { supabase } from "../../providers/supabaseClient"; // Імпортуємо клієнт Supabase

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Оптимізований компонент одного запитання
const AccordionItem = ({ title, content, isExpanded, onToggleExpand }) => {
  const rotateAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnimation]);

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
      {isExpanded && (
        <View style={styles.accordionContent}>
          <Text style={styles.accordionText}>{content}</Text>
        </View>
      )}
    </View>
  );
};

export default function Faq_doctor() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("Questions_doctor");
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Стани для завантаження даних
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функція для завантаження даних з Supabase
  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('faqs')
        .select('id, question_uk, answer_uk, question_en, answer_en')
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;

      setFaqData(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching FAQs:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Questions_doctor");
      fetchFaqs();
    }, [fetchFaqs])
  );

  // Форматуємо дані відповідно до поточної мови
  const formattedFaqData = useMemo(() => {
    const currentLang = i18n.language;
    return faqData.map(item => ({
      id: item.id,
      title: currentLang === 'en' ? item.question_en : item.question_uk,
      content: currentLang === 'en' ? item.answer_en : item.answer_uk,
    }));
  }, [faqData, i18n.language]);

  const handleToggleExpand = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId((prevId) => (prevId === id ? null : id));
  }, []);

  // Функція для навігації через TabBar
  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    navigation.navigate(tabName);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0EB3EB" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Помилка завантаження: {error}</Text>
          <TouchableOpacity onPress={fetchFaqs} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Спробувати ще</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.faqList}>
        {formattedFaqData.map((item) => (
          <AccordionItem
            key={item.id}
            title={item.title}
            content={item.content}
            isExpanded={expandedItemId === item.id}
            onToggleExpand={() => handleToggleExpand(item.id)}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("faq_screen.header_title")}</Text>
        <View>
          <Icon width={50} height={50} />
        </View>
      </View>

      {renderContent()}

      <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
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
    paddingBottom: 100,
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Mont-Regular',
    color: 'red',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#0EB3EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Mont-SemiBold',
    color: 'white',
  },
});