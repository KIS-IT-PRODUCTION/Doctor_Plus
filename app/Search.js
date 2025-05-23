import React from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";

// --- ВАЖЛИВО: Імпортуємо useTranslation з react-i18next ---
import { useTranslation } from "react-i18next";

const Search = () => {
  const navigation = useNavigation();
  // --- Отримуємо функцію t для перекладів ---
  const { t } = useTranslation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Визначення всіх категорій
  // Тепер ми використовуємо ключі, які відповідають перекладам у ваших .json файлах
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
            placeholder={t("search_placeholder")} // Використовуємо t() для перекладу плейсхолдера
            placeholderTextColor="#888"
          />
        </View>
      </View>
      {/* Горизонтальний ScrollView для категорій */}
      <ScrollView
        horizontal // Вмикаємо горизонтальну прокрутку
        showsHorizontalScrollIndicator={false} // Приховуємо індикатор прокрутки
        contentContainerStyle={styles.categoryScrollContainer} // Застосовуємо стилі до контейнера всередині ScrollView
      >
        {categories.map(
          (
            categoryKey,
            index // Використовуємо categoryKey для перекладу
          ) => (
            <TouchableOpacity key={index} style={styles.categoryButton}>
              {/* --- ВИПРАВЛЕНО: Використовуємо повний шлях до ключа спеціалізації --- */}
              <Text style={styles.categoryButtonText}>
                {String(t("categories." + categoryKey))}
              </Text>{" "}
              {/* Перекладаємо категорію за її ключем */}
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Constants.statusBarHeight,
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
    width: "85%", // Змінено на відсотки для адаптивності
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
  // Стиль для контейнера всередині горизонтального ScrollView
  categoryScrollContainer: {
    paddingHorizontal: 15, // Забезпечуємо відступ зліва та справа для прокрутки
    paddingVertical: 10, // Додамо трохи вертикального відступу
  },
  categoryButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10, // Відступ між кнопками
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
