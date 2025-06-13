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
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient";
import { useTranslation } from "react-i18next";

const countries = [
  { name: "Ukraine", code: "UA", emoji: "🇺🇦", timezone: "UTC+2" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧", timezone: "UTC+0" },
  { name: "United States", code: "US", emoji: "🇺🇸", timezone: "UTC-5" },
  { name: "Canada", code: "CA", emoji: "🇨🇦", timezone: "UTC-6" },
  { name: "Germany", code: "DE", emoji: "🇩🇪", timezone: "UTC+1" },
  { name: "France", code: "FR", emoji: "🇫🇷", timezone: "UTC+1" },
  { name: "Poland", code: "PL", emoji: "🇵🇱", timezone: "UTC+1" },
  { name: "Italy", code: "IT", emoji: "🇮🇹", timezone: "UTC+1" },
  { name: "Spain", code: "ES", emoji: "🇪🇸", timezone: "UTC+1" },
  { name: "Japan", code: "JP", emoji: "🇯🇵", timezone: "UTC+9" },
  { name: "China", code: "CN", emoji: "🇨🇳", timezone: "UTC+8" },
  { name: "India", code: "IN", emoji: "🇮🇳", timezone: "UTC+5:30" },
  { name: "Australia", code: "AU", emoji: "🇦🇺", timezone: "UTC+10" },
  { name: "Brazil", code: "BR", emoji: "🇧🇷", timezone: "UTC-3" },
  { name: "Turkey", code: "TR", emoji: "🇹🇷", timezone: "UTC+3" },
  { name: "Sweden", code: "SE", emoji: "🇸🇪", timezone: "UTC+1" },
  { name: "Switzerland", code: "CH", emoji: "🇨🇭", timezone: "UTC+1" },
  { name: "Netherlands", code: "NL", emoji: "🇳🇱", timezone: "UTC+1" },
  { name: "Norway", code: "NO", emoji: "🇳🇴", timezone: "UTC+1" },
  { name: "Denmark", code: "DK", emoji: "🇩🇰", timezone: "UTC+1" },
  { name: "Finland", code: "FI", emoji: "🇫🇮", timezone: "UTC+2" },
  { name: "South Africa", code: "ZA", emoji: "🇿🇦", timezone: "UTC+2" },
  { name: "Mexico", code: "MX", emoji: "🇲🇽", timezone: "UTC-6" },
  { name: "South Korea", code: "KR", emoji: "🇰🇷", timezone: "UTC+9" },
  { name: "Argentina", code: "AR", emoji: "🇦🇷", timezone: "UTC-3" },
  { name: "Ireland", code: "IE", emoji: "🇮🇪", timezone: "UTC+0" },
  { name: "New Zealand", code: "NZ", emoji: "🇳🇿", timezone: "UTC+12" },
  { name: "Singapore", code: "SG", emoji: "🇸🇬", timezone: "UTC+8" },
  { name: "Israel", code: "IL", emoji: "🇮🇱", timezone: "UTC+2" },
  { name: "Malaysia", code: "MY", emoji: "🇲🇾", timezone: "UTC+8" },
  { name: "Thailand", code: "TH", emoji: "🇹🇭", timezone: "UTC+7" },
  { name: "Vietnam", code: "VN", emoji: "🇻🇳", timezone: "UTC+7" },
  { name: "Indonesia", code: "ID", emoji: "🇮🇩", timezone: "UTC+8" },
  { name: "Egypt", code: "EG", emoji: "🇪🇬", timezone: "UTC+2" },
  { name: "Nigeria", code: "NG", emoji: "🇳🇬", timezone: "UTC+1" },
  { name: "Saudi Arabia", code: "SA", emoji: "🇸🇦", timezone: "UTC+3" },
  { name: "United Arab Emirates", code: "AE", emoji: "🇦🇪", timezone: "UTC+4" },
  { name: "Kuwait", code: "KW", emoji: "🇰🇼", timezone: "UTC+3" },
  { name: "Qatar", code: "QA", emoji: "🇶🇦", timezone: "UTC+3" },
  { name: "Austria", code: "AT", emoji: "🇦🇹", timezone: "UTC+1" },
  { name: "Azerbaijan", code: "AZ", emoji: "🇦🇿", timezone: "UTC+4" },
  { name: "Albania", code: "AL", emoji: "🇦🇱", timezone: "UTC+1" },
  { name: "Algeria", code: "DZ", emoji: "🇩🇿", timezone: "UTC+1" },
  { name: "Angola", code: "AO", emoji: "🇦🇴", timezone: "UTC+1" },
  { name: "Andorra", code: "AD", emoji: "🇦🇩", timezone: "UTC+1" },
  { name: "Antigua and Barbuda", code: "AG", emoji: "🇦🇬", timezone: "UTC-4" },
  { name: "Afghanistan", code: "AF", emoji: "🇦🇫", timezone: "UTC+4:30" },
  { name: "Bahamas", code: "BS", emoji: "🇧🇸", timezone: "UTC-5" },
  { name: "Bangladesh", code: "BD", emoji: "🇧🇩", timezone: "UTC+6" },
  { name: "Barbados", code: "BB", emoji: "🇧🇧", timezone: "UTC-4" },
  { name: "Bahrain", code: "BH", emoji: "🇧🇭", timezone: "UTC+3" },
  { name: "Belize", code: "BZ", emoji: "🇧🇿", timezone: "UTC-6" },
  { name: "Belgium", code: "BE", emoji: "🇧🇪", timezone: "UTC+1" },
  { name: "Benin", code: "BJ", emoji: "🇧🇯", timezone: "UTC+1" },
  { name: "Belarus", code: "BY", emoji: "🇧🇾", timezone: "UTC+3" },
  { name: "Bulgaria", code: "BG", emoji: "🇧🇬", timezone: "UTC+2" },
  { name: "Bolivia", code: "BO", emoji: "🇧🇴", timezone: "UTC-4" },
  { name: "Bosnia and Herzegovina", code: "BA", emoji: "🇧🇦", timezone: "UTC+1" },
  { name: "Botswana", code: "BW", emoji: "🇧🇼", timezone: "UTC+2" },
  { name: "Brunei", code: "BN", emoji: "🇧🇳", timezone: "UTC+8" },
  { name: "Burkina Faso", code: "BF", emoji: "🇧🇫", timezone: "UTC+0" },
  { name: "Burundi", code: "BI", emoji: "🇧🇮", timezone: "UTC+2" },
  { name: "Bhutan", code: "BT", emoji: "🇧🇹", timezone: "UTC+6" },
  { name: "Vanuatu", code: "VU", emoji: "🇻🇺", timezone: "UTC+11" },
  { name: "Venezuela", code: "VE", emoji: "🇻🇪", timezone: "UTC-4" },
  { name: "Armenia", code: "AM", emoji: "🇦🇲", timezone: "UTC+4" },
  { name: "Gabon", code: "GA", emoji: "🇬🇦", timezone: "UTC+1" },
  { name: "Haiti", code: "HT", emoji: "🇭🇹", timezone: "UTC-5" },
  { name: "Gambia", code: "GM", emoji: "🇬🇲", timezone: "UTC+0" },
  { name: "Ghana", code: "GH", emoji: "🇬🇭", timezone: "UTC+0" },
  { name: "Guyana", code: "GY", emoji: "🇬🇾", timezone: "UTC-4" },
  { name: "Guatemala", code: "GT", emoji: "🇬🇹", timezone: "UTC-6" },
  { name: "Guinea", code: "GN", emoji: "🇬🇳", timezone: "UTC+0" },
  { name: "Guinea-Bissau", code: "GW", emoji: "🇬🇼", timezone: "UTC+0" },
  { name: "Honduras", code: "HN", emoji: "🇭🇳", timezone: "UTC-6" },
  { name: "Grenada", code: "GD", emoji: "🇬🇩", timezone: "UTC-4" },
  { name: "Greece", code: "GR", emoji: "🇬🇷", timezone: "UTC+2" },
  { name: "Georgia", code: "GE", emoji: "🇬🇪", timezone: "UTC+4" },
  { name: "Djibouti", code: "DJ", emoji: "🇩🇯", timezone: "UTC+3" },
  { name: "Dominica", code: "DM", emoji: "🇩🇲", timezone: "UTC-4" },
  { name: "Dominican Republic", code: "DO", emoji: "🇩🇴", timezone: "UTC-4" },
  { name: "DR Congo", code: "CD", emoji: "🇨🇩", timezone: "UTC+1" },
  { name: "Ecuador", code: "EC", "emoji": "🇪🇨", timezone: "UTC-5" },
  { name: "Equatorial Guinea", code: "GQ", emoji: "🇬🇶", timezone: "UTC+1" },
  { name: "Eritrea", code: "ER", emoji: "🇪🇷", timezone: "UTC+3" },
  { name: "Eswatini", code: "SZ", emoji: "🇸🇿", timezone: "UTC+2" },
  { name: "Estonia", code: "EE", emoji: "🇪🇪", timezone: "UTC+2" },
  { name: "Ethiopia", code: "ET", emoji: "🇪🇹", timezone: "UTC+3" },
  { name: "Yemen", code: "YE", emoji: "🇾🇪", timezone: "UTC+3" },
  { name: "Zambia", code: "ZM", emoji: "🇿🇲", timezone: "UTC+2" },
  { name: "Zimbabwe", code: "ZW", emoji: "🇿🇼", timezone: "UTC+2" },
  { name: "Iran", code: "IR", emoji: "🇮🇷", timezone: "UTC+3:30" },
  { name: "Iceland", code: "IS", emoji: "🇮🇸", timezone: "UTC+0" },
  { name: "Iraq", code: "IQ", emoji: "🇮🇶", timezone: "UTC+3" },
  { name: "Jordan", code: "JO", emoji: "🇯🇴", timezone: "UTC+2" },
  { name: "Cape Verde", code: "CV", emoji: "🇨🇻", timezone: "UTC-1" },
  { name: "Kazakhstan", code: "KZ", emoji: "🇰🇿", timezone: "UTC+5" },
  { name: "Cambodia", code: "KH", emoji: "🇰🇭", timezone: "UTC+7" },
  { name: "Cameroon", code: "CM", emoji: "🇨🇲", timezone: "UTC+1" },
  { name: "Kenya", code: "KE", emoji: "🇰🇪", timezone: "UTC+3" },
  { name: "Kyrgyzstan", code: "KG", emoji: "🇰🇬", timezone: "UTC+6" },
  { name: "Cyprus", code: "CY", emoji: "🇨🇾", timezone: "UTC+2" },
  { name: "Kiribati", code: "KI", emoji: "🇰🇮", timezone: "UTC+13" },
  { name: "Colombia", code: "CO", emoji: "🇨🇴", timezone: "UTC-5" },
  { name: "Comoros", code: "KM", emoji: "🇰🇲", timezone: "UTC+4" },
  { name: "Costa Rica", code: "CR", emoji: "🇨🇷", timezone: "UTC-6" },
  { name: "Ivory Coast", code: "CI", emoji: "🇨🇮", timezone: "UTC+0" },
  { name: "Cuba", code: "CU", emoji: "🇨🇺", timezone: "UTC-5" },
  { name: "Laos", code: "LA", emoji: "🇱🇦", timezone: "UTC+7" },
  { name: "Latvia", code: "LV", emoji: "🇱🇻", timezone: "UTC+2" },
  { name: "Lesotho", code: "LS", emoji: "🇱🇸", timezone: "UTC+2" },
  { name: "Lithuania", code: "LT", emoji: "🇱🇹", timezone: "UTC+2" },
  { name: "Liberia", code: "LR", emoji: "🇱🇷", timezone: "UTC+0" },
  { name: "Lebanon", code: "LB", emoji: "🇱🇧", timezone: "UTC+2" },
  { name: "Libya", code: "LY", emoji: "🇱🇾", timezone: "UTC+1" },
  { name: "Liechtenstein", code: "LI", emoji: "🇱🇮", timezone: "UTC+1" },
  { name: "Luxembourg", code: "LU", emoji: "🇱🇺", timezone: "UTC+1" },
  { name: "Myanmar", code: "MM", emoji: "🇲🇲", timezone: "UTC+6:30" },
  { name: "Mauritius", code: "MU", emoji: "🇲🇺", timezone: "UTC+4" },
  { name: "Mauritania", code: "MR", emoji: "🇲🇷", timezone: "UTC+0" },
  { name: "Madagascar", code: "MG", emoji: "🇲🇬", timezone: "UTC+3" },
  { name: "Malawi", code: "MW", emoji: "🇲🇼", timezone: "UTC+2" },
  { name: "Mali", code: "ML", emoji: "🇲🇱", timezone: "UTC+0" },
  { name: "Maldives", code: "MV", emoji: "🇲🇻", timezone: "UTC+5" },
  { name: "Malta", code: "MT", emoji: "🇲🇹", timezone: "UTC+1" },
  { name: "Morocco", code: "MA", emoji: "🇲🇦", timezone: "UTC+1" },
  { name: "Marshall Islands", code: "MH", emoji: "🇲🇭", timezone: "UTC+12" },
  { name: "Mozambique", code: "MZ", emoji: "🇲🇿", timezone: "UTC+2" },
  { name: "Moldova", code: "MD", emoji: "🇲🇩", timezone: "UTC+2" },
  { name: "Monaco", code: "MC", emoji: "🇲🇨", timezone: "UTC+1" },
  { name: "Mongolia", code: "MN", emoji: "🇲🇳", timezone: "UTC+8" },
  { name: "Namibia", code: "NA", emoji: "🇳🇦", timezone: "UTC+1" },
  { name: "Nauru", code: "NR", emoji: "🇳🇷", timezone: "UTC+12" },
  { name: "Nepal", code: "NP", emoji: "🇳🇵", timezone: "UTC+5:45" },
  { name: "Niger", code: "NE", emoji: "🇳🇪", timezone: "UTC+1" },
  { name: "Nicaragua", code: "NI", emoji: "🇳🇮", timezone: "UTC-6" },
  { name: "Oman", code: "OM", emoji: "🇴🇲", timezone: "UTC+4" },
  { name: "Pakistan", code: "PK", emoji: "🇵🇰", timezone: "UTC+5" },
  { name: "Palau", code: "PW", emoji: "🇵🇼", timezone: "UTC+9" },
  { name: "Panama", code: "PA", emoji: "🇵🇦", timezone: "UTC-5" },
  { name: "Papua New Guinea", code: "PG", emoji: "🇵🇬", timezone: "UTC+10" },
  { name: "Paraguay", code: "PY", emoji: "🇵🇾", timezone: "UTC-4" },
  { name: "Peru", code: "PE", emoji: "🇵🇪", timezone: "UTC-5" },
  { name: "South Sudan", code: "SS", emoji: "🇸🇸", timezone: "UTC+2" },
  { name: "North Korea", code: "KP", emoji: "🇰🇵", timezone: "UTC+8:30" },
  { name: "North Macedonia", code: "MK", emoji: "🇲🇰", timezone: "UTC+1" },
  { name: "Portugal", code: "PT", emoji: "🇵🇹", timezone: "UTC+0" },
  { name: "Republic of the Congo", code: "CG", emoji: "🇨🇬", timezone: "UTC+1" },
  { name: "Russia", code: "RU", emoji: "🇷🇺", timezone: "UTC+3" },
  { name: "Rwanda", code: "RW", emoji: "🇷🇼", timezone: "UTC+2" },
  { name: "Romania", code: "RO", emoji: "🇷🇴", timezone: "UTC+2" },
  { name: "El Salvador", code: "SV", emoji: "🇸🇻", timezone: "UTC-6" },
  { name: "Samoa", code: "WS", emoji: "🇼🇸", timezone: "UTC+13" },
  { name: "San Marino", code: "SM", emoji: "🇸🇲", timezone: "UTC+1" },
  { name: "Sao Tome and Principe", code: "ST", emoji: "🇸🇹", timezone: "UTC+0" },
  { name: "Seychelles", code: "SC", emoji: "🇸🇨", timezone: "UTC+4" },
  { name: "Senegal", code: "SN", emoji: "🇸🇳", timezone: "UTC+0" },
  { name: "Saint Vincent and the Grenadines", code: "VC", emoji: "🇻🇨", timezone: "UTC-4" },
  { name: "Saint Kitts and Nevis", code: "KN", emoji: "🇰🇳", timezone: "UTC-4" },
  { name: "Saint Lucia", code: "LC", emoji: "🇱🇨", timezone: "UTC-4" },
  { name: "Serbia", code: "RS", emoji: "🇷🇸", timezone: "UTC+1" },
  { name: "Syria", code: "SY", emoji: "🇸🇾", timezone: "UTC+2" },
  { name: "Slovakia", code: "SK", emoji: "🇸🇰", timezone: "UTC+1" },
  { name: "Slovenia", code: "SI", emoji: "🇸🇮", timezone: "UTC+1" },
  { name: "Solomon Islands", code: "SB", emoji: "🇸🇧", timezone: "UTC+11" },
  { name: "Somalia", code: "SO", emoji: "🇸🇴", timezone: "UTC+3" },
  { name: "Sudan", code: "SD", emoji: "🇸🇩", timezone: "UTC+2" },
  { name: "Suriname", code: "SR", emoji: "🇸🇷", timezone: "UTC-3" },
  { name: "East Timor", code: "TL", emoji: "🇹🇱", timezone: "UTC+9" },
  { name: "Sierra Leone", code: "SL", emoji: "🇸🇱", timezone: "UTC+0" },
  { name: "Tajikistan", code: "TJ", emoji: "🇹🇯", timezone: "UTC+5" },
  { name: "Tanzania", code: "TZ", emoji: "🇹🇿", timezone: "UTC+3" },
  { name: "Togo", code: "TG", emoji: "🇹🇬", timezone: "UTC+0" },
  { name: "Tonga", code: "TO", emoji: "🇹🇴", timezone: "UTC+13" },
  { name: "Trinidad and Tobago", code: "TT", emoji: "🇹🇹", timezone: "UTC-5" },
  { name: "Tuvalu", code: "TV", emoji: "🇹🇻", timezone: "UTC+12" },
  { name: "Tunisia", code: "TN", emoji: "🇹🇳", timezone: "UTC+1" },
  { name: "Turkmenistan", code: "TM", emoji: "🇹🇲", timezone: "UTC+5" },
  { name: "Uganda", code: "UG", emoji: "🇺🇬", timezone: "UTC+3" },
  { name: "Hungary", code: "HU", emoji: "🇭🇺", timezone: "UTC+1" },
  { name: "Uzbekistan", code: "UZ", emoji: "🇺🇿", timezone: "UTC+5" },
  { name: "Uruguay", code: "UY", emoji: "🇺🇾", timezone: "UTC-3" },
  { name: "Federated States of Micronesia", code: "FM", emoji: "🇫🇲", timezone: "UTC+10" },
  { name: "Fiji", code: "FJ", emoji: "🇫🇯", timezone: "UTC+12" },
  { name: "Philippines", code: "PH", emoji: "🇵🇭", timezone: "UTC+8" },
  { name: "Croatia", code: "HR", emoji: "🇭🇷", timezone: "UTC+1" },
  { name: "Central African Republic", code: "CF", emoji: "🇨🇫", timezone: "UTC+1" },
  { name: "Chad", code: "TD", emoji: "🇹🇩", timezone: "UTC+1" },
  { name: "Czechia", code: "CZ", emoji: "🇨🇿", timezone: "UTC+1" },
  { name: "Chile", code: "CL", emoji: "🇨🇱", timezone: "UTC-4" },
  { name: "Montenegro", code: "ME", emoji: "🇲🇪", timezone: "UTC+1" },
  { name: "Sri Lanka", code: "LK", emoji: "🇱🇰", timezone: "UTC+5:30" },
  { name: "Jamaica", code: "JM", emoji: "🇯🇲", timezone: "UTC-5" },
];

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [country, setCountry] = useState(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    updateDimensions();
    if (Platform.OS === "web") {
      const handleResize = () => updateDimensions();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      const subscription = Dimensions.addEventListener(
        "change",
        updateDimensions
      );
      setDimensionsSubscription(subscription);

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, []);

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const handleRegistration = async () => {
    setRegistrationError("");

    if (!fullName.trim()) {
      setRegistrationError(t("error_empty_fullname"));
      return;
    }
    if (!email.trim()) {
      setRegistrationError(t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setRegistrationError(t("error_empty_password"));
      return;
    }
    if (password.length < 6) {
      setRegistrationError(t("error_short_password"));
      return;
    }

    setIsRegistering(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Помилка реєстрації Supabase:", authError.message);
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
        console.log("Supabase user registered. User ID:", data.user.id);

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            user_id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            country: country?.name || null,
            language: i18n.language || null,
            timezone: country?.timezone || null,
          },
        ]);

        if (profileError) {
          console.error(
            "Помилка збереження профілю в Supabase:",
            profileError.message
          );
          setRegistrationError(t("error_profile_save_failed"));
        } else {
          Alert.alert(t("success_title"), t("success_registration_message"));
          setFullName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setCountry(null);
          navigation.navigate("LoginScreen");
        }
      } else {
        console.warn("Supabase signUp completed, but user object is missing.");
        Alert.alert(t("success_title"), t("success_registration_message"));
        navigation.navigate("LoginScreen");
      }
    } catch (err) {
      console.error("Загальна помилка при реєстрації:", err);
      setRegistrationError(t("error_general_registration_failed"));
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

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width, height)}>
        <StatusBar style="auto" />
        <View style={styles.languageContainerRegister}>
          <TouchableOpacity
            style={styles.languageButtonRegister}
            onPress={openLanguageModal}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.languageTextRegister}>
                {displayedLanguageCode}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title(isLargeScreen)}>{t("greeting")}</Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          {t("registration_subtitle")}
        </Text>
        <TouchableOpacity
          style={styles.selectCountryButton(width)}
          onPress={openCountryModal}
        >
          <Text style={styles.selectCountryText}>
            {country
              ? `${country.emoji} ${t(`countries.${country.name}`)}`
              : t("select_country")}
          </Text>
        </TouchableOpacity>

        <Text style={styles.subtitle2}>{t("fullname")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_fullname")}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <Text style={styles.subtitle2}>{t("email")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.subtitle2}>{t("password")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        <Text style={styles.subtitle2}>{t("phone")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="call-outline"
            size={20}
            color="black"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_optional")}
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
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>{t("register")}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Text style={styles.loginLinkText}>
            {t("already_registered")}
            <Text style={{ fontWeight: "bold" }}> {t("login_greeting")}</Text>
          </Text>
        </TouchableOpacity>

        {/* Оновлене модальне вікно для вибору країни */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCountryModalVisible}
          onRequestClose={closeCountryModal}
        >
          <TouchableWithoutFeedback onPress={closeCountryModal}>
            <View style={styles.centeredView}>
              <View style={[styles.modalView(width), styles.modalBorder]}>
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

        {/* Модальне вікно для вибору мови (залишається без змін, але переконайтеся, що воно не конфліктує) */}
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
    paddingTop: height * 0.15,
    paddingHorizontal: width * 0.05,
    width: "100%",
  }),
  languageContainerRegister: {
    flexDirection: "row",
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
    paddingVertical: 70,
  },
  languageButtonRegister: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    width: 71,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  languageTextRegister: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginHorizontal: 5,
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 36 : 32,
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
    width: width * 0.9,
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

  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    height: 52,
  }),
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
  registerButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
  }),
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
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

  // Нові та оновлені стилі для модального вікна вибору країни
  centeredView: {
    ...StyleSheet.absoluteFillObject, // Розтягує на весь екран
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
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
    width: width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.8, // Обмеження висоти модального вікна
  }),
  modalBorder: {
    borderColor: "#0EB3EB", // Колір рамки
    borderWidth: 1, // Товщина рамки
  },
  // modalTitle (залишається як було, але його немає в модальному вікні вибору країни в прикладі)
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalScrollView: {
    width: "100%", // ScrollView займає всю доступну ширину
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
    justifyContent: "space-between", // Розносить елементи по краях
    paddingHorizontal: 15, // Додаємо горизонтальний відступ
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
    flex: 1, // Займає весь доступний простір
  },
  countryItemSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)", // Колір фону для вибраного елемента
    borderRadius: 10,
  },
  countryItemTextSelected: {
    fontWeight: "bold",
    color: "#0EB3EB", // Колір тексту для вибраного елемента
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "100%", // Кнопка займає всю доступну ширину
  },
  buttonClose: {
    backgroundColor: "#0EB3EB", // Колір кнопки "Закрити"
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  // Стилі для модального вікна вибору мови (залишаються без змін)
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
    borderColor: "#0EB3EB", // Колір рамки
    borderWidth: 1, // Товщина рамки
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
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#rgba(14, 179, 235, 0.1)",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
  },
});

export default RegisterScreen;