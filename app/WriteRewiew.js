// app/WriteReview.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import Icon from "../assets/icon.svg";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../providers/supabaseClient"; // *** Перевірте цей шлях ***

const WriteReview = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Змінено 'title' на 'userFullName' для вводу ПІБ
  const [userFullName, setUserFullName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={loading}>
          <Text style={i <= rating ? styles.starFilled : styles.starEmpty}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const handleSubmit = async () => {
    // Валідація: перевіряємо, що ПІБ та відгук не порожні, і оцінка поставлена
    if (!userFullName.trim() || !reviewText.trim() || rating === 0) {
      Alert.alert(t("writeReview.validationErrorTitle"), t("writeReview.validationErrorMessage"));
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user session:", userError?.message || "User not found");
        Alert.alert(t("writeReview.error"), t("writeReview.loginRequired"));
        setLoading(false);
        return;
      }

      // Отримання імені користувача з профілю, але його ми вже не використовуємо для відображення
      // Це може бути корисно для внутрішніх перевірок, але не обов'язково зберігати в user_name
      // оскільки userFullName буде використовуватись для відображення
      // Якщо ви все ще хочете зберігати full_name з таблиці profiles в user_name, залиште цей блок.
      // Якщо ні, його можна видалити, і user_name буде просто user.id
      let userNameFromProfile = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Could not fetch user profile name:", profileError.message);
      } else if (profileData && profileData.full_name) {
        userNameFromProfile = profileData.full_name;
      }

      const { data, error } = await supabase
        .from('app_reviews') // Ваша таблиця відгуків
        .insert([
          {
            user_id: user.id,
            // user_name: userNameFromProfile || user.email || `User_${user.id.substring(0, 8)}`, // Це поле тепер може бути необов'язковим або використовуватись для іншого
            user_name: userFullName.trim(), // Зберігаємо введене користувачем ПІБ в user_name
            description: reviewText.trim(),
            rating: rating,
          },
        ]);

      if (error) {
        console.error("Error submitting review:", error.message);
        Alert.alert(t("writeReview.error"), `${t("writeReview.submitError")} ${error.message}`);
      } else {
        console.log("Review submitted successfully:", data);
        Alert.alert(t("writeReview.success"), t("writeReview.submitSuccess"));
        // Очистити форму
        setUserFullName("");
        setReviewText("");
        setRating(0);
        navigation.goBack();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert(t("writeReview.error"), `${t("writeReview.unexpectedError")} ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Icon width={50} height={50} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Поле для вводу ПІБ */}
        <Text style={styles.label}>{t("writeReview.fullNameLabel")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("writeReview.fullNamePlaceholder")}
          value={userFullName}
          onChangeText={setUserFullName}
          placeholderTextColor="#aaa"
          editable={!loading}
        />

        {/* Поле для опису відгуку */}
        <Text style={styles.label}>{t("writeReview.reviewTextLabel")}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={t("writeReview.reviewTextPlaceholder")}
          value={reviewText}
          onChangeText={setReviewText}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor="#aaa"
          editable={!loading}
        />

        {/* Поле для рейтингу */}
        <Text style={styles.label}>{t("writeReview.yourRatingLabel")}</Text>
        {renderStars()}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t("writeReview.submitButton")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
    marginTop: 20,
  },
  input: {
    backgroundColor: "#E0F2F7",
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 30,
  },
  starFilled: {
    color: "#FFD700",
    fontSize: 30,
    marginRight: 5,
  },
  starEmpty: {
    color: "#D3D3D3",
    fontSize: 30,
    marginRight: 5,
  },
  submitButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: 15,
    borderRadius: 18,
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