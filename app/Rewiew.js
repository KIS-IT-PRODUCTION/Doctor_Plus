// app/ReviewsScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar, // Додаємо StatusBar для умовних стилів
  KeyboardAvoidingView, // Додаємо KeyboardAvoidingView для кращого UX
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "../assets/icon.svg";
import TabBar from "../components/TopBar";
import { supabase } from "../providers/supabaseClient"; // *** Перевірте цей шлях ***

const ReviewsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState("Stars");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("app_reviews")
        .select("id, user_name, description, rating, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err.message);
      setError(t("reviews.fetchError") + err.message);
      Alert.alert(t("reviews.error"), t("reviews.fetchError") + err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Stars");
      fetchReviews();
      return () => {
        // Очищення або скасування підписки, якщо потрібно
      };
    }, [fetchReviews])
  );

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    switch (tabName) {
      case "Home_doctor":
        navigation.navigate("Home_doctor");
        break;
      case "Records_doctor":
        navigation.navigate("Records_doctor");
        break;
      case "Chat_doctor":
        navigation.navigate("Chat_doctor");
        break;
      case "Headphones_doctor":
        navigation.navigate("Support_doctor");
        break;
      case "Stars":
        break;
      case "Profile_doctor":
        navigation.navigate("Profile_doctor");
        break;
      default:
        break;
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={i <= rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Додамо options для format options
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Використання 24-годинного формату
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("reviews.title")}</Text>
        <Icon width={50} height={50} />
      </View>

      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => navigation.navigate("WriteReview")}
      >
        <Text style={styles.writeReviewButtonText}>
          {t("reviews.writeReviewButton")}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#0EB3EB" />
          <Text style={styles.loadingText}>{t("reviews.loadingReviews")}</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
            <Text style={styles.retryButtonText}>{t("reviews.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centeredMessage}>
          <Text style={styles.noReviewsText}>{t("reviews.noReviews")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                {renderStars(review.rating)}
                <Text style={styles.authorName}>{review.user_name || t("reviews.anonymousUser")}</Text>
              </View>
              <View style={styles.authorDateContainer}>
                
              
                <Text style={styles.reviewDate}> ({formatDate(review.created_at)}) </Text>
              </View>
              <Text style={styles.reviewText}>{review.description}</Text>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
   safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? StatusBar.currentHeight + 5 : 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
  },
  container: {
    flex: 1,
    },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Mont-Bold",
  },
  writeReviewButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    width: "70%",
  },
  writeReviewButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Mont-Medium",
    textAlign: "center",
  },
  reviewsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reviewCard: {
    flex: 1, // Важливо для того, щоб картка могла розширюватися
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    // Додаємо flexWrap, щоб елементи могли переноситися
    flexWrap: 'wrap',
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 5,
  },
  starFilled: {
    color: "#FFD700",
    fontSize: 20,
  },
  starEmpty: {
    color: "#D3D3D3",
    fontSize: 20,
  },
  // Новий стиль для тексту ПІБ, що переноситься
  reviewOverallTextAdjustable: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1, // Дозволяє тексту стискатися
    // flex: 1, // Можна також спробувати flex: 1, якщо flexShrink недостатньо
  },
  authorDateContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
    // Також додаємо flexWrap для цього контейнера
    flexWrap: 'wrap',
  },
  // Новий стиль для імені автора, що переноситься
  authorNameAdjustable: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5CACEE",
    flexShrink: 1, // Дозволяє тексту стискатися
    // flex: 1, // Можна також спробувати flex: 1
    marginRight: 5, // Можливо, для кращого розділення з датою
  },
  reviewDate: {
    fontSize: 14,
    color: "#777",
  },
  reviewText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#E04D53',
    textAlign: 'center',
    marginBottom: 10,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewsScreen;