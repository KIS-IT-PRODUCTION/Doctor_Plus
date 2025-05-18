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
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Svg, Path } from "react-native-svg";
import { supabase } from "../supabaseClient"; // Шлях до вашого файлу supabaseClient.ts

const countryFlags = [
  { name: "English", code: "gb", emoji: "🇬🇧" },
  { name: "Deutsch", code: "de", emoji: "🇩🇪" },
  { name: "Polski", code: "pl", emoji: "🇵🇱" },
  { name: "Україна", code: "ua", emoji: "🇺🇦" },
];

const languages = [
  { name: "English", code: "en", emoji: "🇬🇧" },
  { name: "Deutsch", code: "de", emoji: "🇩🇪" },
  { name: "Polski", code: "pl", emoji: "🇵🇱" },
  { name: "Українська", code: "ua", emoji: "🇺🇦" },
];

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [country, setCountry] = useState(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Стан для пароля
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState(languages[3]); // Default to Ukrainian
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null); // Додано для зберігання підписки

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    updateDimensions();
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    ); // Отримуємо об'єкт підписки
    setDimensionsSubscription(subscription); // Зберігаємо підписку

    return () => {
      if (dimensionsSubscription) {
        dimensionsSubscription.remove(); // Використовуємо метод remove() об'єкта підписки
      }
    };
  }, []);

  const handleRegistration = async () => {
    setRegistrationError("");
    if (!fullName.trim()) {
      setRegistrationError("Будь ласка, введіть ваше повне ім'я.");
      return;
    }
    if (!email.trim()) {
      setRegistrationError("Будь ласка, введіть вашу електронну пошту.");
      return;
    }
    if (!password.trim()) {
      setRegistrationError("Будь ласка, введіть пароль.");
      return;
    }
    if (password.length < 6) {
      setRegistrationError("Пароль повинен містити щонайменше 6 символів.");
      return;
    }

    setIsRegistering(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Помилка реєстрації Supabase Auth:", authError.message);
        setRegistrationError(
          `Не вдалося зареєструватися: ${authError.message}`
        );
      } else if (authData?.user?.id) {
        // Успішно зареєстровано в Auth, тепер зберігаємо додаткову інформацію в таблиці профілів
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            country: country?.name || null,
            language: language?.name || null,
          },
        ]);

        if (profileError) {
          console.error("Помилка збереження профілю:", profileError.message);
          setRegistrationError("Не вдалося зберегти додаткову інформацію.");
          await supabase.auth.signOut(); // Видаляємо користувача з auth, якщо не вдалося зберегти профіль
        } else {
          Alert.alert(
            "Успішно",
            "Вашу реєстрацію буде завершено! Будь ласка, перевірте свою пошту для підтвердження."
          );
          setFullName("");
          setEmail("");
          setPassword(""); // Очищаємо поле пароля
          setPhone("");
          setCountry(null);
          setLanguage(languages[3]); // Скинути мову до укр. після успіху
          navigation.navigate("Home"); // Перехід на головний екран після успішної реєстрації
        }
      }
    } catch (error) {
      console.error("Помилка реєстрації:", error);
      let errorMessage = "Не вдалося завершити реєстрацію.";
      if (error?.message?.includes("auth/email-already-in-use")) {
        errorMessage = "Ця електронна пошта вже використовується.";
      } else if (error?.message?.includes("auth/invalid-email")) {
        errorMessage = "Недійсна електронна пошта.";
      } else if (error?.message?.includes("auth/weak-password")) {
        errorMessage = "Пароль занадто слабкий.";
      }
      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const openCountryModal = () => {
    setIsCountryModalVisible(true);
  };

  const closeCountryModal = () => {
    setIsCountryModalVisible(false);
  };

  const openLanguageModal = () => {
    setIsLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setIsLanguageModalVisible(false);
  };

  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  const selectLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    closeLanguageModal();
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768; // Приклад: вважаємо планшети і більше великими

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width, height)}>
        <StatusBar style="auto" />
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={styles.selectLanguageButton}
            onPress={openLanguageModal}
          >
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></Path>
              <Path d="M10 11l-5-5 5-5"></Path>
              <Path d="M19 6h-14"></Path>
            </Svg>
            <Text style={styles.selectLanguageText}>
              {language ? `${language.emoji} ${language.name}` : "Мова"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title(isLargeScreen)}>Зареєструватися</Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          Почніть турботу про себе — з реєстрації
        </Text>
        <TouchableOpacity
          style={styles.selectCountryButton(width)}
          onPress={openCountryModal}
        >
          <Text style={styles.selectCountryText}>
            {country
              ? `${country.emoji} ${country.name}`
              : "Обрати країну проживання"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subtitle2}>Повне Ім’я</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Ведіть Ваше Ім'я"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
        <Text style={styles.subtitle2}>Пошта</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Ведіть Вашу електронну пошту"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {/* Додане поле для пароля */}
        <Text style={styles.subtitle2}>Пароль</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Ведіть Ваш пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>
        <Text style={styles.subtitle2}>Телефон</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Необов'язково"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>
        {registrationError ? (
          <Text style={styles.errorText}>{registrationError}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.registerButton(width)}
          onPress={handleRegistration}
          disabled={isRegistering}
        >
          <Text style={styles.registerButtonText}>
            {isRegistering ? "Реєстрація..." : "Зареєструватися"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Text style={styles.loginLinkText}>
            Вже зареєстровані?
            <Text style={{ fontWeight: "bold" }}> Увійти</Text>
          </Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCountryModalVisible}
          onRequestClose={closeCountryModal}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView(width)}>
              <Text style={styles.modalTitle}>Виберіть країну</Text>
              {countryFlags.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.countryItem}
                  onPress={() => selectCountry(item)}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeCountryModal}
              >
                <Text style={styles.textStyle}>Скасувати</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView(width)}>
              <Text style={styles.modalTitle}>Виберіть мову</Text>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.countryItem}
                  onPress={() => selectLanguage(item)}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeLanguageModal}
              >
                <Text style={styles.textStyle}>Скасувати</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: (width, height) => ({
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: height * 0.15, // Відносний відсоток від висоти екрану
    paddingHorizontal: width * 0.05, // Відносний відступ
    width: "100%",
  }),
  languageContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    alignItems: "center",
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 36 : 32, // Збільшуємо розмір для великих екранів
    marginBottom: 9,
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
    marginBottom: 14,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 35,
  },
  selectCountryButton: (width) => ({
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9, // Адаптивна ширина
    height: 52,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  }),
  selectCountryText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  selectLanguageButton: {
    backgroundColor: "transparent",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 0,
    width: "auto",
    height: "auto",
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  selectLanguageText: {
    color: "#00ACC1",
    fontSize: 16,
    fontFamily: "Mont-Medium",
    marginLeft: 8,
  },
  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9, // Адаптивна ширина
    height: 52,
  }),
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
  registerButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9, // Адаптивна ширина
    height: 52,
    alignItems: "center",
    marginTop: 8,
  }),
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: (width) => ({
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.9, // Адаптивна ширина модалки
  }),
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  loginLink: {
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },
});

export default RegisterScreen;
