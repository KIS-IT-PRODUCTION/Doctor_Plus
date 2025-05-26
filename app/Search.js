import React from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView,
  Dimensions, // Додаємо Dimensions для адаптивності
  Platform, // Додаємо Platform для специфічних стилів
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Отримання розмірів екрану
const { width, height } = Dimensions.get("window");

// Функції для масштабування розмірів (як приклад, можна використовувати бібліотеки)
const scale = (size) => (width / 375) * size; // Масштабування відносно ширини екрану 375dp
const verticalScale = (size) => (height / 812) * size; // Масштабування відносно висоти екрану 812dp
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor; // Для шрифтів та іконок

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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color="black" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={moderateScale(20)}
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
    // Додаємо paddingTop для Android, якщо SafeAreaView не дає достатнього відступу
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(15), // Масштабуємо відступи
    paddingVertical: verticalScale(10), // Масштабуємо відступи
  },
  backButton: {
    marginRight: scale(15),
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(25), // Масштабуємо радіус
    width: moderateScale(48), // Масштабуємо ширину
    height: moderateScale(48), // Масштабуємо висоту
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(555), // Дуже велике значення для круглих кутів
    paddingHorizontal: scale(15),
    width: "85%", // Залишаємо відсотки, вони вже адаптивні
    height: verticalScale(50), // Масштабуємо висоту
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16), // Масштабуємо розмір шрифту
    color: "#333",
  },
  categoryScrollContainer: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
  },
  categoryButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    borderRadius: moderateScale(20),
    // paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    marginRight: scale(10),
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 16, // Масштабуємо розмір шрифту
    fontWeight: "bold",
  },
});

export default Search;