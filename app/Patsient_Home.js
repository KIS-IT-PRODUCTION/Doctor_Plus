import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "../assets/icon.svg";
import { supabase } from "../supabaseClient";
// Змінено шлях імпорту AuthProvider. Якщо у вас папка providers, то шлях має бути "../providers/AuthProvider"
// Якщо AuthProvider.js знаходиться безпосередньо в корені проекту, тоді './AuthProvider' або '../AuthProvider'
// Я припускаю, що він знаходиться в папці `providers`, яка є сусідом `app`
import { useAuth } from "../AuthProvider"; // <-- Виправлено шлях до AuthProvider

const { width } = Dimensions.get("window");
const containerWidth = width * 0.9;

const Patsient_Home = () => {
  const navigation = useNavigation();
  const { session, loading: authLoading } = useAuth(); // Отримайте сесію та стан завантаження автентифікації
  const [personalInfoText, setPersonalInfoText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    updateDimensions();
    // Dimensions.addEventListener повертає об'єкт Subscription, який має метод remove()
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );
    setDimensionsSubscription(subscription);

    return () => {
      // Перевіряємо, чи існує підписка, перш ніж її видаляти
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const handleSaveInfo = async () => {
    if (!personalInfoText.trim()) {
      Alert.alert("Помилка", "Будь ласка, введіть текст для збереження.");
      return;
    }

    // Додано перевірку authLoading, щоб не робити запити до завершення завантаження сесії
    if (authLoading) {
      Alert.alert("Зачекайте", "Завантаження даних користувача...");
      return;
    }

    if (!session?.user) {
      Alert.alert("Помилка", "Ви не авторизовані. Будь ласка, увійдіть.");
      navigation.navigate("LoginScreen");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("user_notes").insert([
        {
          user_id: session.user.id,
          note_text: personalInfoText.trim(),
        },
      ]);

      if (error) {
        console.error("Помилка збереження інформації:", error);
        Alert.alert(
          "Помилка",
          "Не вдалося зберегти інформацію: " + error.message
        );
      } else {
        Alert.alert("Успіх", "Інформація успішно збережена!");
        setPersonalInfoText("");
      }
    } catch (err) {
      console.error("Загальна помилка при збереженні інформації:", err);
      Alert.alert("Помилка", "Виникла невідома помилка.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Помилка виходу:", error.message);
      Alert.alert("Помилка", "Не вдалося вийти: " + error.message);
    } else {
      Alert.alert("Вихід", "Ви успішно вийшли.");
      navigation.navigate("LoginScreen");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            {/* Логотип */}
            <View style={styles.logoContainer}>
              <Icon width={50} height={50} />
            </View>
            {/* Кнопка вибору мови */}
            <TouchableOpacity style={styles.languageButton}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    fill="#4285F4"
                    d="M12 4v4l-3-3-3 3V4c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2z"
                  />
                  <Path
                    fill="#34A853"
                    d="M12 20v-4l3 3 3-3v4c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2z"
                  />
                  <Path
                    fill="#FBBC05"
                    d="M4 12h4l-3 3 3 3h-4c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2z"
                  />
                  <Path
                    fill="#EA4335"
                    d="M20 12h-4l3-3-3-3h4c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2z"
                  />
                </Svg>
                <Text style={styles.languageText}>UA</Text>
                <Ionicons name="chevron-down-outline" size={16} color="black" />
              </View>
            </TouchableOpacity>
            {/* Іконка сповіщень */}
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#81D4FA"
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationNumber}>5</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Main Content Section */}
          <View style={styles.mainContent}>
            {/* Кнопка вибору спеціалізації лікаря */}
            <TouchableOpacity style={styles.specializationButton}>
              <Text style={styles.specializationText}>
                Оберіть спеціалізацію лікаря
              </Text>
            </TouchableOpacity>

            {/* Зображення лікарів */}
            <View style={styles.doctorsImageContainer}>
              <Image
                source={{ uri: "https://via.placeholder.com/300x200" }}
                style={styles.doctorImage}
                resizeMode="contain"
              />
            </View>

            {/* Поле пошуку */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#BDBDBD"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Пошук"
                placeholderTextColor="#BDBDBD"
              />
            </View>

            {/* НОВЕ ПОЛЕ ДЛЯ ІНФОРМАЦІЇ */}
            <Text style={styles.infoTitle}>Ваша особиста інформація:</Text>
            <TextInput
              style={styles.infoInput}
              placeholder="Введіть важливу інформацію тут..."
              multiline={true}
              numberOfLines={6}
              value={personalInfoText}
              onChangeText={setPersonalInfoText}
            />
            <TouchableOpacity
              style={styles.saveInfoButton}
              onPress={handleSaveInfo}
              disabled={isSaving || authLoading} // Заборонити натискання, якщо зберігаємо або завантажуємо автентифікацію
            >
              <Text style={styles.saveInfoButtonText}>
                {isSaving
                  ? "Збереження..."
                  : authLoading
                  ? "Завантаження..."
                  : "Зберегти інформацію"}
              </Text>
            </TouchableOpacity>
            {/* Кнопка виходу */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Вийти</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <LinearGradient
            colors={["#FFFFFF00", "rgba(255,255,255,0.9)", "#FFFFFF"]}
            style={styles.footerGradient}
          >
            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="home-outline" size={24} color="#757575" />
                <Text style={styles.footerButtonText}>Головна</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="#757575"
                />
                <Text style={styles.footerButtonText}>Питання</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="headset-outline" size={24} color="#757575" />
                <Text style={styles.footerButtonText}>Записи</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="star-outline" size={24} color="#757575" />
                <Text style={styles.footerButtonText}>Чат</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: containerWidth,
    marginTop: 10,
    zIndex: 10,
  },
  logoContainer: {},
  languageButton: {
    backgroundColor: "rgba(14, 179, 235, 0.69)",
    borderRadius: 10,
    width: 71,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#757575",
    marginHorizontal: 5,
  },
  notificationButton: {
    position: "relative",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4500",
    color: "white",
    fontSize: 10,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  notificationNumber: {
    color: "white",
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    width: containerWidth,
    paddingTop: 20,
    paddingBottom: 20,
  },
  specializationButton: {
    backgroundColor: "#42A5F5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  specializationText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  doctorsImageContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: "100%",
    marginBottom: 10,
  },
  doctorImage: {
    width: "90%",
    height: "100%",
    resizeMode: "contain",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
    color: "#BDBDBD",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingLeft: 0,
    borderWidth: 0,
    outline: "none",
    color: "#212121",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
    width: "100%",
  },
  infoInput: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: "100%",
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    borderColor: "#0EB3EB",
    borderWidth: 1,
    marginBottom: 20,
  },
  saveInfoButton: {
    backgroundColor: "#28A745",
    borderRadius: 555,
    paddingVertical: 15,
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  saveInfoButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signOutButton: {
    backgroundColor: "#FF5733",
    borderRadius: 555,
    paddingVertical: 15,
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  footerGradient: {
    width: "100%",
    paddingBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingTop: 10,
  },
  footerButton: {
    alignItems: "center",
  },
  footerButtonText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 5,
  },
});

export default Patsient_Home;
