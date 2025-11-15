import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../providers/supabaseClient";
import { useTranslation } from "react-i18next";
import { countries } from '../../components/countries.js'; 
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const Register = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = getStyles(insets);

  const [country, setCountry] = useState(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const handleRegistration = async () => {
    Keyboard.dismiss();
    setRegistrationError("");
    setFieldErrors({});
    let hasErrors = false;
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t("error_empty_fullname");
      hasErrors = true;
    }

    if (!email.trim()) {
      newErrors.email = t("error_empty_email");
      hasErrors = true;
    } else if (!validateEmail(email)) {
      newErrors.email = t("error_invalid_email");
      hasErrors = true;
    }

    if (!password.trim()) {
      newErrors.password = t("error_empty_password");
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = t("error_short_password");
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }
    
    setIsRegistering(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setRegistrationError(t("error_email_in_use"));
        } else if (authError.message.includes("invalid email")) {
          setRegistrationError(t("error_invalid_email"));
        } else if (authError.message.includes("weak password")) {
          setRegistrationError(t("error_weak_password"));
        } else {
          setRegistrationError(
            t("error_registration_failed", { error: authError.message })
          );
        }
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profile_doctor")
          .insert([
            {
              user_id: data.user.id,
              full_name: fullName.trim(),
              email: email.trim(), 
              phone: phone.trim() || null,
              country: country?.name || null,
              language: i18n.language || null,
              doctor_points: 1000,
            },
          ]);

        if (profileError) {
          setRegistrationError(t("error_profile_save_failed"));
          return;
        }

        Alert.alert(t("success_title"), t("success_registration_message"));
        setFullName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setCountry(null);
        navigation.navigate("Login");
      } else {
        Alert.alert(t("success_title"), t("success_registration_message"));
        navigation.navigate("Login");
      }
    } catch (err) {
      setRegistrationError(t("error_general_registration_failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);
  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);
  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };
  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
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
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#212121" />
              </TouchableOpacity>

              <MotiView
                from={{ opacity: 0, translateY: -30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400 }}
              >
                <Text style={styles.title}>{t("greeting")}</Text>
                <Text style={styles.subtitle}>
                  {t("registration_subtitle")}
                </Text>
              </MotiView>
              
              <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400, delay: 100 }}
                style={styles.formContainer}
              >
                <TouchableOpacity
                  style={styles.selectCountryButton}
                  onPress={openCountryModal}
                >
                  <Text style={styles.selectCountryText}>
                    {country
                      ? `${country.emoji} ${t(`countries.${country.name}`)}`
                      : t("select_country")}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.label}>{t("fullname")}</Text>
                <View style={[styles.inputContainer, fieldErrors.fullName && styles.inputError]}>
                  <Ionicons name="person-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_fullname")}
                    placeholderTextColor="#B0BEC5"
                    value={fullName}
                    onChangeText={(text) => {
                        setFullName(text);
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: null }));
                    }}
                  />
                </View>
                <AnimatePresence>
                  {fieldErrors.fullName && <MotiView from={{opacity:0, translateY: -5}} animate={{opacity:1, translateY: 0}}><Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text></MotiView>}
                </AnimatePresence>

                <Text style={styles.label}>{t("email")}</Text>
                <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_email")}
                    placeholderTextColor="#B0BEC5"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <AnimatePresence>
                  {fieldErrors.email && <MotiView from={{opacity:0, translateY: -5}} animate={{opacity:1, translateY: 0}}><Text style={styles.fieldErrorText}>{fieldErrors.email}</Text></MotiView>}
                </AnimatePresence>

                <Text style={styles.label}>{t("password")}</Text>
                <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_password")}
                    placeholderTextColor="#B0BEC5"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                    }}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color="#B0BEC5" />
                  </TouchableOpacity>
                </View>
                <AnimatePresence>
                  {fieldErrors.password && <MotiView from={{opacity:0, translateY: -5}} animate={{opacity:1, translateY: 0}}><Text style={styles.fieldErrorText}>{fieldErrors.password}</Text></MotiView>}
                </AnimatePresence>

                <Text style={styles.label}>{t("phone")}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={22} color="#B0BEC5" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("placeholder_optional")}
                    placeholderTextColor="#B0BEC5"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400, delay: 200 }}
                style={styles.footerContainer}
              >
                <AnimatePresence>
                  {registrationError ? (
                    <MotiView from={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}}>
                      <Text style={styles.errorText}>{registrationError}</Text>
                    </MotiView>
                  ) : null}
                </AnimatePresence>

                <TouchableOpacity
                  style={[styles.registerButton, isRegistering && styles.buttonDisabled]}
                  onPress={handleRegistration}
                  disabled={isRegistering}
                >
                  <AnimatePresence exitBeforeEnter>
                    {isRegistering ? (
                      <MotiView key="loader" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                        <ActivityIndicator color="#fff" />
                      </MotiView>
                    ) : (
                      <MotiView key="text" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                        <Text style={styles.registerButtonText}>{t("register")}</Text>
                      </MotiView>
                    )}
                  </AnimatePresence>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={styles.loginLinkText}>
                    {t("already_registered")}
                    <Text style={{ fontWeight: "bold" }}> {t("login_greeting")}</Text>
                  </Text>
                </TouchableOpacity>
              </MotiView>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCountryModalVisible}
        onRequestClose={closeCountryModal}
      >
        <TouchableWithoutFeedback onPress={closeCountryModal}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, styles.modalBorder]}>
              <ScrollView style={styles.modalScrollView}>
                {countries.map((item, index) => (
                  <Pressable
                    key={item.code}
                    style={[
                      styles.countryItem,
                      country &&
                        country.code === item.code &&
                        styles.countryItemSelected,
                    ]}
                    onPress={() => selectCountry(item)}
                  >
                    <Text style={styles.countryEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.countryName,
                        country &&
                          country.code === item.code &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {t(`countries.${item.name}`)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeCountryModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
                <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
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

const getStyles = (insets) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    flex: 1,
    width: '90%',
    maxWidth: 450,
    alignItems: 'center',
    paddingTop: insets.top + 60,
    paddingBottom: insets.bottom + 20,
  },
  backButton: {
    position: 'absolute',
    top: insets.top + (Platform.OS === 'android' ? 20 : 10),
    left: 0,
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  formContainer: {
    width: '100%',
  },
  footerContainer: {
    width: '100%',
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    marginBottom: 8,
    marginLeft: 10,
  },
  selectCountryButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    height: 52,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  selectCountryText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 4,
    width: '100%',
    height: 52,
    borderWidth: 1, 
    borderColor: 'transparent', 
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: '#000',
  },
  registerButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    height: 52,
    width: '100%',
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Mont-Bold",
  },
  loginLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
  inputError: {
     borderColor: '#D32F2F', 
     borderWidth: 1,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Mont-Bold",
    fontSize: 14,
  },
  fieldErrorText: {
    color: '#D32F2F',
    alignSelf: 'flex-start',
    paddingLeft: 10, 
    marginBottom: 8,
    marginTop: 2, 
    fontSize: 13,
    fontFamily: "Mont-Regular",
  },
  centeredView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 500,
    maxHeight: "80%"
  },
  modalBorder: {
    borderColor: "#0EB3EB",
    borderWidth: 1,
  },
  modalScrollView: {
    width: "100%",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
    flex: 1,
    fontFamily: "Mont-Regular",
  },
  countryItemSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 10,
  },
  countryItemTextSelected: {
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "100%",
  },
  buttonClose: {
    backgroundColor: "#0EB3EB",
  },
  textStyle: {
    color: "white",
    fontFamily: "Mont-Bold",
    textAlign: "center",
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
    width: '80%',
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 20,
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
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
});

export default Register;