import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  PixelRatio,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Icon from "../assets/icon.svg";
import Box from "../assets/Main/check_box.svg";
import Box2 from "../assets/Main/check_box_outline_blank.svg";

// Отримуємо розміри екрану для адаптивності
const { width, height } = Dimensions.get("window");

// Допоміжні функції для адаптивних розмірів
const getResponsiveFontSize = (baseSize) => {
  const scale = width / 400; // База 400px для мобільного пристрою (приблизно iPhone X/Xs)
  const newSize = baseSize * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const getResponsiveWidth = (percent) => {
  return width * (percent / 100);
};

const getResponsiveHeight = (percent) => {
  return height * (percent / 100);
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

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
    navigation.navigate("Register");
  };

  const handlePrivacyPolicyToggle = () => {
    setPrivacyPolicyAgreed(!privacyPolicyAgreed);
  };

  const handlePrivacyPolicyPress = () => {
    console.log("Privacy Policy Clicked");
    // Тут можна відкрити WebView або новий екран з текстом політики конфіденційності
  };

  // Функції для керування модальним вікном вибору мови
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

  // Мови для відображення у модальному вікні
  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  const isLargeScreen = width > 768; // Визначення для адаптивного дизайну (наприклад, для планшетів)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Icon width={getResponsiveWidth(45)} height={getResponsiveWidth(45)} />
      </View>
      <Text style={styles.title}>{t("online_doctor_consultations")}</Text>
      <Text style={styles.subtitle}>
        {t("health_treasure_slogan")}
      </Text>

      {/* Кнопка вибору мови - тепер у видному місці в основному потоці */}
      <TouchableOpacity
        style={styles.languageButtonMain}
        onPress={openLanguageModal}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="globe-outline" size={getResponsiveFontSize(20)} color="white" />
          <Text style={styles.languageTextMain}>
            {displayedLanguageCode}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.chooseText}>{t("choose_your_role")}</Text>
      <View style={[styles.buttonContainer, isLargeScreen && styles.buttonContainerLargeScreen]}>
        <TouchableOpacity style={[styles.button, isLargeScreen && styles.buttonLargeScreen]} onPress={handlePatientSelect}>
          <Text style={styles.buttonText}>{t("patient_role")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, isLargeScreen && styles.buttonLargeScreen]} onPress={handleDoctorSelect}>
          <Text style={styles.buttonText}>{t("doctor_role")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.privacyPolicyContainer}>
        <TouchableOpacity onPress={handlePrivacyPolicyToggle}>
          {privacyPolicyAgreed ? (
            <Box width={getResponsiveFontSize(24)} height={getResponsiveFontSize(24)} />
          ) : (
            <Box2 width={getResponsiveFontSize(24)} height={getResponsiveFontSize(24)} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrivacyPolicyPress}>
          <Text style={styles.privacyPolicyText}>
            <Text>{t("i_agree_with")}</Text>
            <Text style={styles.privacyPolicyText2}>{t("privacy_policy")}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модальне вікно для вибору мови */}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + getResponsiveHeight(2) : getResponsiveHeight(2),
  },
  logoContainer: {
    marginBottom: getResponsiveHeight(2),
  },
  // Нові стилі для основної кнопки вибору мови
  languageButtonMain: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555, // Кругла кнопка
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row', // Щоб іконка та текст були поруч
    paddingVertical: getResponsiveHeight(1.5),
    paddingHorizontal: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(3), // Відступ від наступного елемента
    width: getResponsiveWidth(60), // Адаптивна ширина
    maxWidth: 250, // Максимальна ширина для великих екранів
    shadowColor: "#000", // Додаємо тінь для 3D ефекту
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Для Android
  },
  languageTextMain: {
    fontSize: getResponsiveFontSize(18), // Більший розмір шрифту
    fontFamily: "Mont-Bold",
    color: "white",
    marginLeft: getResponsiveWidth(2), // Відступ між іконкою та текстом
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    color: "#333",
    textAlign: "center",
    fontFamily: "Mont-SemiBold",
    marginBottom: getResponsiveHeight(1.2),
    paddingHorizontal: getResponsiveWidth(5),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(15),
    color: "#777",
    textAlign: "center",
    fontFamily: "Mont-Regular",
    marginBottom: getResponsiveHeight(2), // Зменшуємо відступ, якщо кнопка мови буде нижче
    paddingHorizontal: getResponsiveWidth(5),
    lineHeight: getResponsiveFontSize(22),
    marginTop: getResponsiveHeight(1.2),
  },
  chooseText: {
    fontSize: getResponsiveFontSize(32),
    fontFamily: "Mont-SemiBold",
    color: "#555",
    marginBottom: getResponsiveHeight(1.2),
  },
  buttonContainer: {
    width: getResponsiveWidth(100),
    alignItems: "center",
    marginBottom: getResponsiveHeight(2),
  },
  buttonContainerLargeScreen: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getResponsiveWidth(5), // Простір між кнопками для великих екранів
    flexWrap: 'wrap', // Дозволяє кнопкам переноситися на новий рядок, якщо не вистачає місця
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveHeight(1.2),
    width: getResponsiveWidth(65), // Адаптивна ширина
    maxWidth: 258, // Максимальна ширина
    height: getResponsiveHeight(7), // Адаптивна висота
    maxHeight: 58, // Максимальна висота
  },
  buttonLargeScreen: {
    width: getResponsiveWidth(35),
    maxWidth: 200,
    marginBottom: 0, // Без нижнього відступу, якщо в рядок
  },
  buttonText: {
    color: "white",
    fontFamily: "Mont-SemiBold",
    fontSize: getResponsiveFontSize(20),
    textAlign: "center",
  },
  privacyPolicyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getResponsiveHeight(2),
  },
  checkbox: {
    marginRight: getResponsiveWidth(2.5),
  },
  privacyPolicyText: {
    fontSize: getResponsiveFontSize(10),
    color: "#337AB7",
    fontFamily: "Mont-SemiBold",
  },
  privacyPolicyText2: {
    fontSize: getResponsiveFontSize(10),
    color: "black",
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
  },
  // Стилі для модального вікна вибору мови
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: getResponsiveWidth(5),
    borderColor: "#0EB3EB",
    borderWidth: 1,
    alignItems: "center",
    width: getResponsiveWidth(80),
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
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    marginBottom: getResponsiveHeight(2),
  },
  languageOption: {
    paddingVertical: getResponsiveHeight(2),
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  languageOptionText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: "Mont-Regular",
    color: "#333",
  },
});

export default HomeScreen;