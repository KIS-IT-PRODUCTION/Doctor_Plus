// app/ReviewsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native"; // <--- ДОДАЙТЕ ЦЕЙ ІМПОРТ
import Icon from "../assets/icon.svg";
import TabBar from "../components/TopBar.js"; // Зверніть увагу: ви імпортуєте TopBar.js, а не TabBar.js, перевірте ім'я файлу

// Перейменуйте експортований компонент з "Review" на "ReviewsScreen"
// для кращої консистентності з назвою файлу та використанням у навігаторі.
// Якщо ви вирішите залишити "Review", то в навігаторі має бути Stack.Screen name="Review" component={Review}
const ReviewsScreen = () => {
  // Змінено Review на ReviewsScreen
  const { t } = useTranslation();
  const navigation = useNavigation(); // <--- ІНІЦІАЛІЗУЙТЕ navigation З useNavigation()
  const [activeTab, setActiveTab] = useState("Stars"); // Можливо, тут має бути ім'я першого екрана з таб-бару, наприклад 'Patsient_Home' або 'ReviewsScreen'

  const reviews = [
    {
      id: "1",
      author: t("reviews.authorName"),
      date: "2025-03-16, 19:25",
      rating: 5,
      text: t("reviews.reviewText"),
    },
    {
      id: "2",
      author: t("reviews.authorName"),
      date: "2025-03-16, 19:25",
      rating: 5,
      text: t("reviews.reviewText"),
    },
    {
      id: "3",
      author: t("reviews.authorName"),
      date: "2025-03-16, 19:25",
      rating: 5,
      text: t("reviews.reviewText"),
    },
    {
      id: "4",
      author: t("reviews.authorName"),
      date: "2025-03-16, 19:25",
      rating: 5,
      text: t("reviews.reviewText"),
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text key={i} style={i < rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("reviews.title")}</Text>
        <Icon width={50} height={50} />
      </View>

      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => navigation.navigate("WriteReview")} // <--- ВИКЛИКАЙТЕ navigation.navigate()
      >
        <Text style={styles.writeReviewButtonText}>
          {t("reviews.writeReviewButton")}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.reviewsList}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {renderStars(review.rating)}
              <Text style={styles.reviewOverallText}>
                {t("reviews.overallText")}
              </Text>
            </View>
            <View style={styles.authorDateContainer}>
              <Text style={styles.authorName}>{review.author}</Text>
              <Text style={styles.reviewDate}> ({review.date}) </Text>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  reviewOverallText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  authorDateContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5CACEE",
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
});

export default ReviewsScreen; // Змінено експорт на ReviewsScreen
