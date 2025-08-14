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
  Switch, // ІМПОРТУЄМО КОМПОНЕНТ SWITCH
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Icon from "../assets/icon.svg";

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
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const handlePatientSelect = () => {
    if (privacyPolicyAgreed) {
      console.log("Patient selected");
      navigation.navigate("RegisterScreen");
    } else {
      setIsWarningModalVisible(true);
    }
  };

  const handleDoctorSelect = () => {
    if (privacyPolicyAgreed) {
      console.log("Doctor selected");
      navigation.navigate("Register");
    } else {
      setIsWarningModalVisible(true);
    }
  };

  const handlePrivacyPolicyToggle = (value) => {
    setPrivacyPolicyAgreed(value);
  };

  const handlePrivacyPolicyPress = () => {
     navigation.navigate("PrivacyPolice");
  };

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

  const languagesForModal = [
    { nameKey: "english", code: "en" },
    { nameKey: "ukrainian", code: "uk" },
  ];

  const isLargeScreen = width > 768;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Icon width={getResponsiveWidth(45)} height={getResponsiveWidth(45)} />
      </View>
      <Text style={styles.title}>{t("online_doctor_consultations")}</Text>
      <Text style={styles.subtitle}>
        {t("health_treasure_slogan")}
      </Text>

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
        {/* НОВИЙ ПЕРЕМИКАЧ SWITCH */}
        <Switch
          trackColor={{ false: "#A9A9A9", true: "#0EB3EB" }}
          thumbColor={privacyPolicyAgreed ? "white" : "white"}
          ios_backgroundColor="#A9A9A9"
          onValueChange={handlePrivacyPolicyToggle}
          value={privacyPolicyAgreed}
        />
        <TouchableOpacity onPress={handlePrivacyPolicyPress}>
          <Text style={styles.privacyPolicyText}>
            <Text>{t("i_agree_with")}</Text>
            <Text style={styles.privacyPolicyText2}>{t("privacy_policy")}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модальне вікно для вибору мови (повернуто до попереднього стилю) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLanguageModalVisible}
        onRequestClose={closeLanguageModal}
      >
        <TouchableWithoutFeedback onPress={closeLanguageModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {}}
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

      {/* Модальне вікно-попередження */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isWarningModalVisible}
        onRequestClose={() => setIsWarningModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContent}>
            <Text style={styles.warningTitle}>{t("warning_title")}</Text>
            <Text style={styles.warningText}>{t("privacy_policy_agreement_required")}</Text>
            <TouchableOpacity 
              style={styles.warningButton} 
              onPress={() => setIsWarningModalVisible(false)}
            >
              <Text style={styles.warningButtonText}>{t("ok_button")}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  languageButtonMain: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    paddingVertical: getResponsiveHeight(1.5),
    paddingHorizontal: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(3),
    width: getResponsiveWidth(60),
    maxWidth: 250,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  languageTextMain: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: "Mont-Bold",
    color: "white",
    marginLeft: getResponsiveWidth(2),
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
    marginBottom: getResponsiveHeight(2),
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
    gap: getResponsiveWidth(5),
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveHeight(1.2),
    width: getResponsiveWidth(65),
    maxWidth: 258,
    height: getResponsiveHeight(7),
    maxHeight: 58,
  },
  buttonLargeScreen: {
    width: getResponsiveWidth(35),
    maxWidth: 200,
    marginBottom: 0,
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
    fontSize: getResponsiveFontSize(12),
    color: "black",
    fontFamily: "Mont-SemiBold",
    textAlign: "center",
    marginRight: getResponsiveWidth(2.5),
    paddingHorizontal: getResponsiveWidth(2),
    lineHeight: getResponsiveFontSize(15),
  },
  privacyPolicyText2: {
    fontSize: getResponsiveFontSize(12),
    color: "#337AB7",
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
    lineHeight: getResponsiveFontSize(15),
    textAlign: "center",
    paddingHorizontal: getResponsiveWidth(2),
    marginLeft: getResponsiveWidth(1),
  },
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
    borderBottomColor: "rgba(14, 179, 235, 0.1)",
  },
  languageOptionText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: "Mont-Regular",
    color: "#333",
  },
  warningModalContent: {
    backgroundColor: "white",
    padding: getResponsiveWidth(6),
    borderRadius: 15,
    alignItems: "center",
    maxWidth: getResponsiveWidth(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  warningTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: "Mont-Bold",
    color: "#D32F2F",
    marginBottom: getResponsiveHeight(2),
  },
  warningText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "Mont-Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: getResponsiveHeight(3),
  },
  warningButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: getResponsiveHeight(1.5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 50,
  },
  warningButtonText: {
    color: "white",
    fontSize: getResponsiveFontSize(18),
    fontFamily: "Mont-SemiBold",
  },
});

export default HomeScreen;