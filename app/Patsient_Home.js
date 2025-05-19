import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import People from "../assets/Main/people.svg"; // Зображення лікарів
import { useNavigation } from "@react-navigation/native";
import Icon from "../assets/icon.svg";

const { width } = Dimensions.get("window");
const containerWidth = width * 0.9;

const Patsient_Home = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Ionicons name="notifications-outline" size={24} color="#81D4FA" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: containerWidth,
    marginTop: 10,
  },

  languageButton: {
    backgroundColor: "rgba(14, 179, 235, 0.69)",
    borderRadius: 10,
    width: 71,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    width: containerWidth,
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
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 250,
    width: "100%",
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
    marginTop: 20,
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
