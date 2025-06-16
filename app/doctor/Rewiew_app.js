// app/Rewiew_app.js
import React, { useState, useCallback } from "react"; // Додано useCallback
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image, // Image імпортовано, але не використовується, можна видалити якщо не потрібно
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Додано useFocusEffect
import Icon from "../../assets/icon.svg";
import TabBar_doctor from "../../components/TopBar_doctor"; // Переконайтеся, що шлях правильний

const Rewiew_app = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  // Можливо, тут має бути ім'я, яке відповідає цьому екрану в TabBar_doctor, наприклад 'Stars_doctor'
  const [activeTab, setActiveTab] = useState("Stars_doctor");

  useFocusEffect(
    useCallback(() => {
      // Встановлюємо активну вкладку при фокусуванні на цьому екрані
      setActiveTab("Stars_doctor"); // Встановіть назву вкладки, яка відповідає цьому екрану
    }, [])
  );

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Використовуйте navigation.navigate() для переходу на відповідний екран
    // Переконайтеся, що ці назви екранів відповідають назвам, які ви визначили у вашому навігаторі
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
        navigation.navigate("Support_doctor"); // Припустимо, що підтримка
        break;
      case "Stars_doctor": // Це екран відгуків
        // Якщо цей екран вже активний, не переходимо знову
        // navigation.navigate("Rewiew_app"); // Або назва вашого екрану відгуків
        break;
      case "Profile_doctor":
        navigation.navigate("Profile_doctor");
        break;
      default:
        break;
    }
  };

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

  const renderStars_doctor = (rating) => {
    const stars_doctor = [];
    for (let i = 0; i < 5; i++) {
      stars_doctor.push(
        <Text key={i} style={i < rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      );
    }
    return <View style={styles.stars_doctorContainer}>{stars_doctor}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("reviews.title")}</Text>
        <Icon width={50} height={50} />
      </View>

      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => navigation.navigate("WriteReview")} // Переконайтеся, що "WriteReview" є назвою вашого екрану для написання відгуку
      >
        <Text style={styles.writeReviewButtonText}>
          {t("reviews.writeReviewButton")}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.reviewsList}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {renderStars_doctor(review.rating)}
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
      {/* Передаємо handleTabPress як onTabPress */}
      <TabBar_doctor activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
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
  stars_doctorContainer: {
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

export default Rewiew_app;