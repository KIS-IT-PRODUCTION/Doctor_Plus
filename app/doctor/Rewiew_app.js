// app/Rewiew_app.js
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
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "../../assets/icon.svg";
import TabBar_doctor from "../../components/TopBar_doctor";
import { supabase } from "../../providers/supabaseClient";

const Rewiew_app = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState("Stars_doctor");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функція для завантаження відгуків з бази даних
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("app_reviews")
        .select("id, user_name, description, rating, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err.message);
      setError(t("reviews.fetchError", { error: err.message }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Завантажуємо відгуки при відкритті екрана
  useFocusEffect(
    useCallback(() => {
      setActiveTab("Stars_doctor");
      fetchReviews();
    }, [fetchReviews])
  );

  // Обробка навігації через нижню панель
  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName !== "Stars_doctor") {
        navigation.navigate(tabName);
    }
  };

  // Функція для відображення зірочок рейтингу
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

  // Функція для форматування дати
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
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
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centeredMessage}>
          <Text style={styles.noReviewsText}>{t("reviews.noReviews")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.reviewsList} contentContainerStyle={{ paddingBottom: 20 }}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                {renderStars(review.rating)}
                <Text style={styles.authorName}>{review.user_name || t("reviews.anonymousUser")}</Text>
              </View>
              <View style={styles.authorDateContainer}>
                <Text style={styles.reviewDate}>({formatDate(review.created_at)})</Text>
              </View>
              <Text style={styles.reviewText}>{review.description}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    flexWrap: 'wrap',
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 10,
  },
  starFilled: {
    color: "#FFD700",
    fontSize: 20,
  },
  starEmpty: {
    color: "#D3D3D3",
    fontSize: 20,
  },
  authorName: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    color: "#333",
    flexShrink: 1,
  },
  authorDateContainer: {
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: "Mont-Regular",
    color: "#777",
  },
  reviewText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    fontFamily: "Mont-Regular",
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
    fontFamily: 'Mont-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#E04D53',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Mont-SemiBold',
  },
  noReviewsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    fontFamily: 'Mont-Regular',
  },
});

export default Rewiew_app;
