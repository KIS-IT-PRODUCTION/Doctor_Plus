import React, { useState, useEffect, useCallback } from "react";
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
  Switch,
  ScrollView,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import Icon from "../assets/icon.svg";
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = getStyles(insets, height, isTablet); 

  const [agreementsAccepted, setAgreementsAccepted] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [errorText, setErrorText] = useState(""); 
  
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  const logoSize = isTablet ? 190 : 150;

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const handleRoleSelect = (role) => {
    setErrorText(""); 
    
    if (!agreementsAccepted) {
      setErrorText(t("agree_to_terms_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); 
      return;
    }
    
    if (role === 'patient') {
      navigation.navigate("RegisterScreen");
    } else if (role === 'doctor') {
      navigation.navigate("Register");
    }
  };

  const handleAgreementsToggle = (value) => {
    if (errorText) setErrorText(""); 
    setAgreementsAccepted(value);
  };

  const handlePrivacyPolicyPress = () => {
    navigation.navigate("PrivacyPolice"); 
  };
  
  const handleTermsPress = () => {
    navigation.navigate("PartnershipAgreementScreen"); 
  };

  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const languagesForModal = [
    { nameKey: "english", code: "en" },
    { nameKey: "ukrainian", code: "uk" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <TouchableOpacity
        style={styles.languageButtonMain}
        onPress={openLanguageModal}
      >
        <View style={styles.languageButtonContent}>
          <Ionicons name="globe-outline" size={styles.languageTextMain.fontSize - 2} color="#0EB3EB" />
          <Text style={styles.languageTextMain}>
            {displayedLanguageCode}
          </Text>
        </View>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>

              <MotiView 
                from={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ type: 'timing', duration: 500 }}
                style={styles.logoContainer}
              >
                <Icon width={logoSize} height={logoSize} />
              </MotiView>
              
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
              >
                <Text style={styles.title}>{t("online_doctor_consultations")}</Text>
                <Text style={styles.subtitle}>
                  {t("health_treasure_slogan")}
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
                style={styles.buttonContainer}
              >
                <Text style={styles.chooseText}>{t("choose_your_role")}</Text>
                <TouchableOpacity style={styles.button} onPress={() => handleRoleSelect('patient')}>
                  <Text style={styles.buttonText}>{t("patient_role")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => handleRoleSelect('doctor')}>
                  <Text style={styles.buttonText}>{t("doctor_role")}</Text>
                </TouchableOpacity>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 300 }}
                style={styles.privacyContainerWrapper}
              >
                <View style={styles.privacyPolicyContainer}>
                  <Switch
                    trackColor={{ false: "#A9A9A9", true: "#0EB3EB" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#A9A9A9"
                    onValueChange={handleAgreementsToggle}
                    value={agreementsAccepted}
                  />
                  <View style={styles.privacyTextWrapper}>
                    <Text style={styles.privacyPolicyText}>
                      <Text>{t("i_agree_to")} </Text>
                      <Text style={styles.privacyPolicyTextLink} onPress={handlePrivacyPolicyPress}>
                        {t("privacy_policy")}
                      </Text>
                      <Text>{` ${t("and")} `}</Text>
                      <Text style={styles.privacyPolicyTextLink} onPress={handleTermsPress}>
                        {t("terms_of_use")}
                      </Text>
                    </Text>
                  </View>
                </View>
                
                <AnimatePresence>
                  {errorText ? (
                    <MotiView
                      from={{ opacity: 0, translateY: -10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                    >
                      <Text style={styles.errorText}>{errorText}</Text>
                    </MotiView>
                  ) : null}
                </AnimatePresence>
              </MotiView>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!errorText}
        onRequestClose={() => setErrorText("")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContent}>
            <Text style={styles.warningTitle}>{t("warning_title")}</Text>
            <Text style={styles.warningText}>{errorText}</Text>
            <TouchableOpacity 
              style={styles.warningButton} 
              onPress={() => setErrorText("")}
            >
              <Text style={styles.warningButtonText}>{t("ok_button")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (insets, height, isTablet) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    minHeight: height,
  },
  innerContainer: {
    width: "90%",
    maxWidth: isTablet ? 500 : 450,
    alignItems: "center",
    paddingTop: 130,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: isTablet ? 30 : 25,
  },
  languageButtonMain: {
    position: 'absolute',
    top: insets.top + (Platform.OS === 'android' ? 15 : 10),
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    paddingVertical: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 16 : 12,
  },
  languageButtonContent: {
    flexDirection: "row", 
    alignItems: "center"
  },
  languageTextMain: {
    fontSize: isTablet ? 18 : 16,
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
    marginLeft: 6,
  },
  title: {
    fontSize: isTablet ? 34 : 28,
    color: "#333",
    textAlign: "center",
    fontFamily: "Mont-SemiBold",
    marginBottom: isTablet ? 15 : 10,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "#777",
    textAlign: "center",
    fontFamily: "Mont-Regular",
    marginBottom: isTablet ? 40 : 35,
    paddingHorizontal: 10,
    lineHeight: isTablet ? 28 : 24,
  },
  chooseText: {
    fontSize: isTablet ? 26 : 22,
    fontFamily: "Mont-SemiBold",
    color: "#555",
    marginBottom: isTablet ? 25 : 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: "center",
    marginBottom: isTablet ? 25 : 20,
  },
  button: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isTablet ? 20 : 15,
    width: '90%',
    height: isTablet ? 70 : 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontFamily: "Mont-SemiBold",
    fontSize: isTablet ? 22 : 20,
    textAlign: "center",
  },
  privacyContainerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  privacyPolicyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  privacyTextWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  privacyPolicyText: {
    fontSize: isTablet ? 15 : 13,
    color: "black",
    fontFamily: "Mont-SemiBold",
    lineHeight: isTablet ? 22 : 18,
  },
  privacyPolicyTextLink: {
    color: "#337AB7",
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
  },
  errorText: {
    color: '#D32F2F',
    fontFamily: "Mont-Bold",
    fontSize: isTablet ? 15 : 14,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderColor: "#0EB3EB",
    borderWidth: 1,
    alignItems: "center",
    width: isTablet ? '60%' : '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: isTablet ? 22 : 20,
    fontFamily: "Mont-Bold",
    marginBottom: 20,
    color: "#212121",
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.1)",
  },
  languageOptionText: {
    fontSize: isTablet ? 20 : 18,
    fontFamily: "Mont-Regular",
    color: "#333",
  },
  warningModalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 15,
    alignItems: "center",
    width: isTablet ? '70%' : '90%',
    maxWidth: isTablet ? 500 : 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  warningTitle: {
    fontSize: isTablet ? 24 : 22,
    fontFamily: "Mont-Bold",
    color: "#D32F2F",
    marginBottom: 15,
  },
  warningText: {
    fontSize: isTablet ? 18 : 16,
    fontFamily: "Mont-Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
  },
  warningButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  warningButtonText: {
    color: "white",
    fontSize: isTablet ? 20 : 18,
    fontFamily: "Mont-SemiBold",
  },
});

export default HomeScreen;