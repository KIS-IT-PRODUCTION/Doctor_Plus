// app/WriteReview.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView, // Для уникнення перекриття клавіатурою
  Platform, // Для Platform-специфічних стилів
  ScrollView, // <--- ДОДАЙ ЦЕЙ ІМПОРТ
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native"; // Для навігації назад
import Icon from "../assets/icon.svg";
import { Ionicons } from "@expo/vector-icons";

const WriteReview = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0); // Оцінка від 0 до 5

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Text style={i <= rating ? styles.starFilled : styles.starEmpty}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const handleSubmit = () => {
    // Тут буде логіка відправлення відгуку
    console.log("Title:", title);
    console.log("Review Text:", reviewText);
    console.log("Rating:", rating);
    // Наприклад, відправити дані на сервер, потім повернутися на попередній екран
    // navigation.goBack(); // Або navigation.navigate('ReviewsScreen');
  };
  const handleBackPress = () => {
    navigation.goBack();
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Адаптація під iOS/Android
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Icon width={50} height={50} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.label}>{t("writeReview.titleLabel")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("writeReview.titlePlaceholder")}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>{t("writeReview.reviewTextLabel")}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={t("writeReview.reviewTextPlaceholder")}
          value={reviewText}
          onChangeText={setReviewText}
          multiline={true}
          numberOfLines={6} // Додаємо кілька рядків за замовчуванням
          textAlignVertical="top" // Вирівнювання тексту зверху для Android
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>{t("writeReview.yourRatingLabel")}</Text>
        {renderStars()}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {t("writeReview.submitButton")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", // Легкий фон
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, // Відступ зверху для статус-бару
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 15,
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 20, // Відступ між полями
  },
  input: {
    backgroundColor: "#E0F2F7", // Світло-блакитний фон, як на зображенні
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    backgroundColor: "#E0F2F7",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 120, // Мінімальна висота для текстового поля
    textAlignVertical: "top", // Вирівнювання тексту зверху для Android
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 30, // Відступ перед кнопкою
  },
  starFilled: {
    color: "#FFD700", // Золотий колір для заповнених зірок
    fontSize: 30, // Більший розмір зірок
    marginRight: 5,
  },
  starEmpty: {
    color: "#D3D3D3", // Сірий колір для порожніх зірок
    fontSize: 30,
    marginRight: 5,
  },
  submitButton: {
    backgroundColor: "#5CACEE", // Синій колір кнопки
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default WriteReview;
