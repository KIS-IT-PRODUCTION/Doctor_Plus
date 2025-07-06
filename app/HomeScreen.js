import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal, // <-- Імпортуємо Modal
  TouchableWithoutFeedback, // <-- Імпортуємо TouchableWithoutFeedback
  Dimensions, // <-- Імпортуємо Dimensions для адаптивності стилів
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next"; // <-- Імпортуємо useTranslation
import { Ionicons } from "@expo/vector-icons"; // <-- Імпортуємо Ionicons для іконки глобуса

import Icon from "../assets/icon.svg";
import Box from "../assets/Main/check_box.svg";
import Box2 from "../assets/Main/check_box_outline_blank.svg";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // <-- Отримуємо t та i18n

  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false); // <-- Стан для модалки мови
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState( // <-- Стан для відображення коду мови
    i18n.language.toUpperCase()
  );

  // Отримуємо розміри екрану для адаптивності
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  // Оновлюємо розміри при зміні орієнтації/розмірів екрану
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    if (Platform.OS === "web") {
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    } else {
      const subscription = Dimensions.addEventListener("change", updateDimensions);
      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, []);

  // Оновлюємо displayedLanguageCode при зміні мови i18n
  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const handlePatientSelect = () => {
    console.log("Patient selected");
    navigation.navigate("RegisterScreen");
  };

  const handleDoctorSelect = () => {
    console.log("Doctor selected");
    navigation.navigate("Register"); // Припускаємо, що це ваш Doctor Register Screen
  };

  const handlePrivacyPolicyToggle = () => {
    setPrivacyPolicyAgreed(!privacyPolicyAgreed);
  };

  const handlePrivacyPolicyPress = () => {
    console.log("Privacy Policy Clicked");
    // Тут можна відкрити WebView або новий екран з текстом політики конфіденційності
  };

  // Функції для керування модальним вікном вибору мови (скопійовано з RegisterScreen.js)
  const openLanguageModal = () => {
    setIsLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setIsLanguageModalVisible(false);
  };

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  // Мови для відображення у модальному вікні (скопійовано з RegisterScreen.js)
  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  const { width, height } = dimensions;
  const isLargeScreen = width > 768; // Визначення для адаптивного дизайну

  return (
    <SafeAreaView style={styles.container}>
      {/* Кнопка вибору мови - стиль adapted з languageContainerRegister */}
      <View style={styles.languageContainer}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={openLanguageModal}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.languageText}>
              {displayedLanguageCode}
            </Text>
            <Ionicons name="globe-outline" size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Icon width={190} height={190} />
      </View>
      <Text style={styles.title}>{t("online_doctor_consultations")}</Text>
      <Text style={styles.subtitle}>
        {t("health_treasure_slogan")}
      </Text>
      <Text style={styles.chooseText}>{t("choose_your_role")}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePatientSelect}>
          <Text style={styles.buttonText}>{t("patient_role")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleDoctorSelect}>
          <Text style={styles.buttonText}>{t("doctor_role")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.privacyPolicyContainer}>
        <TouchableOpacity onPress={handlePrivacyPolicyToggle}>
          {privacyPolicyAgreed ? (
            <Box width={24} height={24} />
          ) : (
            <Box2 width={24} height={24} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrivacyPolicyPress}>
          <Text style={styles.privacyPolicyText}>
            <Text>{t("i_agree_with")}</Text>
            <Text style={styles.privacyPolicyText2}>{t("privacy_policy")}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модальне вікно для вибору мови - скопійовано з RegisterScreen.js */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLanguageModalVisible}
        onRequestClose={closeLanguageModal}
      >
        <TouchableWithoutFeedback onPress={closeLanguageModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                /* Залишаємо порожнім, щоб не закривати модалку при натисканні всередині */
              }}
            >
              <View style={styles.languageModalContent}>
                <Text style={styles.modalTitle}>
                  {t("selectLanguage")}
                </Text>
                {languagesForModal.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.languageOption}
                    onPress={() => handleLanguageSelect(item.code)}
                  >
                    <Text style={styles.languageOptionText}>
                      {t(item.nameKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  // Стилі для кнопки вибору мови (адаптовані з RegisterScreen.js)
  languageContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
  },
  languageButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    width: 71, // Фіксована ширина
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginHorizontal: 5,
  },
  title: {
    fontSize: 24,
    color: "#333",
    textAlign: "center",
    fontFamily: "Mont-SemiBold",
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    fontFamily: "Mont-Regular",
    marginBottom: 72,
    paddingHorizontal: 20,
    lineHeight: 22,
    marginTop: 9,
  },
  chooseText: {
    fontSize: 32,
    fontFamily: "Mont-SemiBold",
    color: "#555",
    marginBottom: 9,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    width: 258,
    height: 58,
  },
  buttonText: {
    color: "white",
    fontFamily: "Mont-SemiBold",
    fontSize: 20,
    textAlign: "center",
  },
  privacyPolicyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  privacyPolicyText: {
    fontSize: 10,
    color: "#337AB7",
    fontFamily: "Mont-SemiBold",
  },
  privacyPolicyText2: {
    fontSize: 10,
    color: "black",
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
  },
  // Стилі для модального вікна вибору мови (скопійовані з RegisterScreen.js)
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderColor: "#0EB3EB",
    borderWidth: 1,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333",
  },
});

export default HomeScreen;