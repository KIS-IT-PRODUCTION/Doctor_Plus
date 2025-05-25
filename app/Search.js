import React from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView, // Додаємо SafeAreaView для відступів на iOS
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const Search = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const categories = [
    "traumatologist",
    "pediatrician",
    "gynecologist",
    "ent",
    "surgeon",
    "cardiologist",
    "dentist",
    "dermatologist",
    "ophthalmologist",
    "neurologist",
    "endocrinologist",
    "gastroenterologist",
    "urologist",
    "pulmonologist",
    "nephrologist",
    "rheumatologist",
    "oncologist",
    "allergist",
    "infectiousDiseasesSpecialist",
    "psychiatrist",
    "psychologist",
    "physiotherapist",
    "nutritionist",
    "radiologist",
    "anesthesiologist",
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {" "}
      {/* Додаємо SafeAreaView тут */}
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("search_placeholder")}
              placeholderTextColor="#888"
            />
          </View>
        </View>
        {/* Горизонтальний ScrollView для категорій */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
        >
          {categories.map((categoryKey, index) => (
            <TouchableOpacity key={index} style={styles.categoryButton}>
              <Text style={styles.categoryButtonText}>
                {String(t("categories." + categoryKey))}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    // paddingTop: Constants.statusBarHeight, // Може бути не потрібен з SafeAreaView
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    width: "85%",
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoryScrollContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Search;
