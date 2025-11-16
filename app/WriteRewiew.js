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
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import Icon from "../assets/icon.svg";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../providers/supabaseClient";

const WriteReview = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

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
        .from('app_reviews')
        .insert([
          {
            user_id: user.id,
            user_name: userFullName.trim(),
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
    <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="#0EB3EB" />
        </TouchableOpacity>
        <Icon width={50} height={50} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.label}>{t("writeReview.fullNameLabel")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("writeReview.fullNamePlaceholder")}
          value={userFullName}
          onChangeText={setUserFullName}
          placeholderTextColor="#aaa"
          editable={!loading}
        />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android"
      ? StatusBar.currentHeight
        ? StatusBar.currentHeight + 5
        : 10
      : Platform.OS === "ios"
      ? (StatusBar.currentHeight || 0) + 5
      : 10,
  },
  header: {
  flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 15,
    backgroundColor: "#F0F0F0",
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