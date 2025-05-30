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
  Switch, // Для перемикача "Я погоджуюсь"
  Image,
  StatusBar,
  SafeAreaView, // Import Image component for previews
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../providers/supabaseClient"; // Шлях до вашого supabaseClient
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker"; // Для завантаження файлів
import * as ImagePicker from "expo-image-picker"; // Для завантаження фото
// Список країн (ви можете перенести його в окремий файл, якщо він використовується в багатьох місцях)
const countries = [
  { name: "Ukraine", code: "UA", emoji: "🇺🇦" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
  { name: "United States", code: "US", emoji: "🇺🇸" },
  { name: "Canada", code: "CA", emoji: "🇨🇦" },
  { name: "Germany", code: "DE", emoji: "🇩🇪" },
  { name: "France", code: "FR", emoji: "🇫🇷" },
  { name: "Poland", code: "PL", emoji: "🇵🇱" },
  { name: "Italy", code: "IT", emoji: "🇮🇹" },
  { name: "Spain", code: "ES", emoji: "🇪🇸" },
  { name: "Japan", code: "JP", emoji: "🇯🇵" },
  { name: "China", code: "CN", emoji: "🇨🇳" },
  { name: "India", code: "IN", emoji: "🇮🇳" },
  { name: "Australia", code: "AU", emoji: "🇦🇺" },
  { name: "Brazil", code: "BR", emoji: "🇧🇷" },
  { name: "Turkey", code: "TR", emoji: "🇹🇷" },
  { name: "Sweden", code: "SE", emoji: "🇸🇪" },
  { name: "Switzerland", code: "CH", emoji: "🇨🇭" },
  { name: "Netherlands", code: "NL", emoji: "🇳🇱" },
  { name: "Norway", code: "NO", emoji: "🇳🇴" },
  { name: "Denmark", code: "DK", emoji: "🇩🇰" },
  { name: "Finland", code: "FI", emoji: "🇫🇮" },
  { name: "South Africa", code: "ZA", emoji: "🇿🇦" },
  { name: "Mexico", code: "MX", emoji: "🇲🇽" },
  { name: "South Korea", code: "KR", emoji: "🇰🇷" },
  { name: "Argentina", code: "AR", emoji: "🇦🇷" },
  { name: "Ireland", code: "IE", emoji: "🇮🇪" },
  { name: "New Zealand", code: "NZ", emoji: "🇳🇿" },
  { name: "Singapore", code: "SG", emoji: "🇸🇬" },
  { name: "Israel", code: "IL", emoji: "🇮🇱" },
  { name: "Malaysia", code: "MY", emoji: "🇲🇾" },
  { name: "Thailand", code: "TH", emoji: "🇹🇭" },
  { name: "Vietnam", code: "VN", emoji: "🇻🇳" },
  { name: "Indonesia", code: "ID", emoji: "🇮🇩" },
  { name: "Egypt", code: "EG", emoji: "🇪🇬" },
  { name: "Nigeria", code: "NG", emoji: "🇳🇬" },
  { name: "Saudi Arabia", code: "SA", emoji: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", emoji: "🇦🇪" },
  { name: "Kuwait", code: "KW", emoji: "🇰🇼" },
  { name: "Qatar", code: "QA", emoji: "🇶🇦" },
];

// Список спеціалізацій для модального вікна
const specializations = [
  { nameKey: "specialization_therapist", value: "Therapist" },
  { nameKey: "specialization_cardiologist", value: "Cardiologist" },
  { nameKey: "specialization_surgeon", value: "Surgeon" },
  { nameKey: "specialization_pediatrician", value: "Pediatrician" },
  { nameKey: "specialization_dermatologist", value: "Dermatologist" },
  { nameKey: "specialization_neurologist", value: "Neurologist" },
  { nameKey: "specialization_gastroenterologist", value: "Gastroenterologist" },
  { nameKey: "specialization_ophthalmologist", value: "Ophthalmologist" },
  { nameKey: "specialization_lor", value: "LOR" },
  { nameKey: "specialization_gynecologist", value: "Gynecologist" },
  { nameKey: "specialization_urologist", value: "Urologist" },
  { nameKey: "specialization_endocrinologist", value: "Endocrinologist" },
  { nameKey: "specialization_psychologist", value: "Psychologist" },
  { nameKey: "specialization_psychiatrist", value: "Psychiatrist" },
  { nameKey: "specialization_nutritionist", value: "Nutritionist" },
];

// Список мов для модального вікна вибору мови консультацій
const consultationLanguages = [
  { nameKey: "english", code: "en", emoji: "🇬🇧" },
  { nameKey: "ukrainian", code: "uk", emoji: "uk" },
  { nameKey: "polish", code: "pl", emoji: "🇵🇱" },
  { nameKey: "german", code: "de", emoji: "🇩🇪" },
  { nameKey: "french", code: "fr", emoji: "🇫🇷" },
  { nameKey: "spanish", code: "es", emoji: "🇪🇸" },
  // Додайте інші мови за потребою
];

// Generate consultation cost options (e.g., from $10 to $200 in $5 increments)
const generateConsultationCostOptions = () => {
  const options = [];
  for (let i = 10; i <= 200; i += 5) {
    options.push(i);
  }
  return options;
};
const consultationCostOptions = generateConsultationCostOptions();

const Anketa_Settings = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // STATES FOR PROFILE DATA
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState(null); // Для поля "Україна"
  const [consultationCost, setConsultationCost] = useState("");
  // Changed to array for multiple languages for consultation
  const [selectedConsultationLanguages, setSelectedConsultationLanguages] =
    useState([]);
  // Changed to array for multiple specializations
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [photoUri, setPhotoUri] = useState(null);
  const [diplomaUri, setDiplomaUri] = useState(null);
  const [certificateUri, setCertificateUri] = useState(null);
  const [experienceText, setExperienceText] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [consultationCostRange, setConsultationCostRange] = useState(""); // Від і до
  const [searchTags, setSearchTags] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false); // Для чекбоксу "Я погоджуюсь"

  // MODAL VISIBILITY STATES
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isGeneralLanguageModalVisible, setIsGeneralLanguageModalVisible] =
    useState(false); // Для загальної мови інтерфейсу
  const [isConsultationLanguageModalVisible, setIsConsultationLanguageModalVisible] =
    useState(false); // Для мови консультацій
  const [isSpecializationModalVisible, setIsSpecializationModalVisible] =
    useState(false);
  const [isConsultationCostModalVisible, setIsConsultationCostModalVisible] =
    useState(false); // New state for cost picker

  // UI RELATED STATES
  const [profileSaveError, setProfileSaveError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
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

  // --- MODAL HANDLERS ---
  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);
  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  // Handlers for general app language
  const openGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(true);
  const closeGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(false);
  const handleGeneralLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeGeneralLanguageModal();
    // setDisplayedLanguageCode оновиться автоматично завдяки useEffect
  };

  // Handlers for consultation languages (multiple selection)
  const openConsultationLanguageModal = () => {
    setIsConsultationLanguageModalVisible(true);
  };
  const closeConsultationLanguageModal = () => setIsConsultationLanguageModalVisible(false);
  const toggleConsultationLanguageSelect = (langCode) => {
    setSelectedConsultationLanguages((prevSelected) => {
      if (prevSelected.includes(langCode)) {
        return prevSelected.filter((code) => code !== langCode);
      } else {
        return [...prevSelected, langCode];
      }
    });
  };

  const openSpecializationModal = () => setIsSpecializationModalVisible(true);
  const closeSpecializationModal = () => setIsSpecializationModalVisible(false);
  // Modified to handle multiple specialization selections
  const toggleSpecializationSelect = (spec) => {
    setSelectedSpecializations((prevSelected) => {
      const isSelected = prevSelected.some(
        (selectedSpec) => selectedSpec.value === spec.value
      );
      if (isSelected) {
        return prevSelected.filter(
          (selectedSpec) => selectedSpec.value !== spec.value
        );
      } else {
        return [...prevSelected, spec];
      }
    });
  };

  // Consultation Cost Picker handlers
  const openConsultationCostModal = () =>
    setIsConsultationCostModalVisible(true);
  const closeConsultationCostModal = () =>
    setIsConsultationCostModalVisible(false);
  const selectConsultationCost = (cost) => {
    setConsultationCost(cost.toString());
    closeConsultationCostModal();
  };

  // --- FILE UPLOAD HANDLERS ---
  const pickImage = async (setUri) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant media library permissions to upload photos."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
      // TODO: Додати логіку завантаження на Supabase Storage тут
      // Alert.alert(
      //   "Фото",
      //   `Завантажено: ${result.assets[0].uri.split("/").pop()}`
      // );
    }
  };

  const pickDocument = async (setUri) => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "*/*", // Дозволити всі типи файлів
      copyToCacheDirectory: true,
    });

    if (result.type === "success") {
      setUri(result.uri);
      // TODO: Додати логіку завантаження на Supabase Storage тут
      // Alert.alert("Документ", `Завантажено: ${result.name}`);
    } else if (result.type === "cancel") {
      console.log("Документ не вибрано");
    } else if (result.type === "error") {
      Alert.alert("Помилка", "Не вдалося вибрати документ.");
    }
  };

  // --- SAVE PROFILE HANDLER ---
  const handleSaveProfile = async () => {
    setProfileSaveError("");

    // Basic validation
    if (!fullName.trim()) {
      setProfileSaveError("Будь ласка, введіть повне ім'я.");
      return;
    }
    // Updated validation for multiple specializations
    if (selectedSpecializations.length === 0) {
      setProfileSaveError("Будь ласка, виберіть хоча б одну спеціалізацію.");
      return;
    }
    if (!agreedToTerms) {
      setProfileSaveError("Будь ласка, погодьтеся з умовами співпраці.");
      return;
    }

    setIsSavingProfile(true);

    try {
      // Отримання поточної сесії/користувача
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfileSaveError(
          "Користувач не автентифікований. Будь ласка, увійдіть."
        );
        setIsSavingProfile(false);
        return;
      }

      // Prepare data for Supabase
      const specializationsToSave = selectedSpecializations.map(
        (spec) => spec.value
      );
      const languagesToSave =
        selectedConsultationLanguages.length > 0
          ? selectedConsultationLanguages
          : [i18n.language]; // Default to current if none selected

      const { error: doctorProfileError } = await supabase
        .from("anketa_doctor") // <--- Changed from 'doctors' to 'anketa_doctor' based on previous discussion
        .upsert(
          [
            {
              // id: user.id, // <--- Removed this line as 'id' is auto-generated by DB (Primary Key)
              user_id: user.id, // <--- Correctly assigning user.id to user_id column
              full_name: fullName.trim(),
              email: user.email, // Email беремо з об'єкта користувача Supabase
              phone: "", // Якщо у вас немає поля вводу для телефону на цьому екрані, воно може бути пустим або null
              country: country?.name || null,
              // Saved as an array
              communication_languages: languagesToSave,
              // Saved as an array
              specialization: specializationsToSave,
              experience_years: null, // Потрібно окреме поле вводу для років досвіду
              education: null, // Потрібно окреме поле вводу
              achievements: achievements.trim() || null,
              about_me: aboutMe.trim() || null,
              consultation_cost: consultationCost.trim() || null, // Ціна за консультацію
              consultation_cost_range: consultationCostRange.trim() || null, // Діапазон цін
              search_tags: searchTags.trim() || null,
              bank_details: bankDetails.trim() || null,

              avatar_url: photoUri, // Тимчасово URI, в реальності URL після завантаження
              certificate_photo_url: certificateUri, // Тимчасово URI, в реальності URL після завантаження
              work_experience: experienceText.trim() || null,
              work_location: workLocation.trim() || null,

              is_verified: false, // Зазвичай встановлюється адміністратором
            },
          ],
          { onConflict: "user_id" } // <--- Changed 'id' to 'user_id' for onConflict
        );

      if (doctorProfileError) {
        console.error(
          "Помилка збереження профілю лікаря:",
          doctorProfileError.message
        );
        setProfileSaveError(t("error_profile_save_failed"));
        return;
      }

      Alert.alert(t("success_title"), t("success_profile_saved"));
      // Опціонально: перехід на інший екран або очищення форми
      navigation.navigate("HomeScreen"); // Redirect to HomeScreen after successful save
    } catch (err) {
      console.error("Загальна помилка при збереженні профілю:", err);
      setProfileSaveError(t("error_general_save_failed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  // Languages for general app language modal (can be different if you want different options)
  const generalAppLanguages = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container(width, height)}>
          <StatusBar style="auto" />

          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("HomeScreen")} // Go to HomeScreen
            >
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.title(isLargeScreen)}>
              {t("doctor_profile_title")}
            </Text>
            {/* Прапорець мови - для зміни загальної мови інтерфейсу */}
            <TouchableOpacity
              style={styles.languageDisplayContainer}
              onPress={openGeneralLanguageModal} // Open general language modal
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 14 }}>
                  {displayedLanguageCode}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Country (Україна) */}
          <Text style={styles.inputLabel}>{t("country")}</Text>
          <TouchableOpacity
            style={styles.selectButton(width)}
            onPress={openCountryModal}
          >
            <Text style={styles.selectButtonText}>
              {country
                ? `${country.emoji} ${country.name}`
                : t("select_country")}
            </Text>
          </TouchableOpacity>

          {/* ПІБ */}
          <Text style={styles.inputLabel}>ПІБ</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("fullname_placeholder_doc")}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Вартість консультації */}
          <Text style={styles.inputLabel}>{t("consultation_cost")}</Text>
          <TouchableOpacity
            style={styles.selectButton(width)}
            onPress={openConsultationCostModal}
          >
            <Text style={styles.selectButtonText}>
              {consultationCost
                ? `$${consultationCost}`
                : t("consultation_choose")}
            </Text>
          </TouchableOpacity>

          {/* Мова консультацій (Множинний вибір) */}
          <Text style={styles.inputLabel}>{t("consultation_language")}</Text>
          <TouchableOpacity
            style={styles.selectButton(width)}
            onPress={openConsultationLanguageModal} // Open consultation language modal
          >
            <Text style={styles.selectButtonTextExpanded}>
              {selectedConsultationLanguages.length > 0
                ? selectedConsultationLanguages
                    .map(
                      (code) =>
                        consultationLanguages.find((lang) => lang.code === code)
                          ?.emoji +
                        " " +
                        t(
                          consultationLanguages.find((lang) => lang.code === code)
                            ?.nameKey
                        )
                    )
                    .join(", ")
                : t("select_consultation_language")} {/* Changed translation key */}
            </Text>
          </TouchableOpacity>

          {/* Вибрати фах */}
          <Text style={styles.inputLabel}>{t("select_specialization")}</Text>
          <TouchableOpacity
            style={styles.selectButton(width)}
            onPress={openSpecializationModal}
          >
            <Text style={styles.selectButtonTextExpanded}>
              {selectedSpecializations.length > 0
                ? selectedSpecializations
                    .map((spec) => t(spec.nameKey))
                    .join(", ")
                : t("select_specialization")}
            </Text>
          </TouchableOpacity>

          {/* Photo Upload */}
          <Text style={styles.inputLabel}>{t("upload_photo")}</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton(width)}
              onPress={() => pickImage(setPhotoUri)}
            >
              <Text style={styles.uploadButtonText}>{t("upload_photo")}</Text>
            </TouchableOpacity>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            )}
          </View>

          {/* Diploma Upload */}
          <Text style={styles.inputLabel}>{t("upload_diploma")}</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton(width)}
              onPress={() => pickImage(setDiplomaUri)}
            >
              <Text style={styles.uploadButtonText}>{t("upload_diploma")}</Text>
            </TouchableOpacity>
            {diplomaUri && (
              // For documents, you might want a generic document icon or a small image for file types
              <Image source={{ uri: diplomaUri }} style={styles.previewImage} />
            )}
          </View>

          {/* Certificate Upload */}
          <Text style={styles.inputLabel}>{t("upload_certificate")}</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton(width)}
              onPress={() => pickImage(setCertificateUri)}
            >
              <Text style={styles.uploadButtonText}>
                {t("upload_certificate")}
              </Text>
            </TouchableOpacity>
            {certificateUri && (
              <Image
                source={{ uri: certificateUri }}
                style={styles.previewImage}
              />
            )}
          </View>

          {/* Досвід роботи */}
          <Text style={styles.inputLabel}>{t("work_experience")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("work_experience")}
              value={experienceText}
              onChangeText={setExperienceText}
              multiline={true} // Дозволити багаторядковий текст
            />
          </View>

          {/* Місце роботи */}
          <Text style={styles.inputLabel}>{t("work_location")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("work_location")}
              value={workLocation}
              onChangeText={setWorkLocation}
            />
          </View>

          {/* Досягнення */}
          <Text style={styles.inputLabel}>{t("achievements")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("achievements")}
              value={achievements}
              onChangeText={setAchievements}
              multiline={true}
            />
          </View>

          {/* Про себе */}
          <Text style={styles.inputLabel}>{t("about_me_placeholder")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("about_me_placeholder")}
              value={aboutMe}
              onChangeText={setAboutMe}
              multiline={true}
              numberOfLines={4} // Для багаторядкового вводу
            />
          </View>

          {/* Вартість консультації (від і до) */}
          <Text style={styles.inputLabel}>{t("consultation_cost_range")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder="Від 00.00 до 00.00"
              keyboardType="default" // Може бути text, якщо потрібні символи валюти
              value={consultationCostRange}
              onChangeText={setConsultationCostRange}
            />
          </View>

          {/* Теги для пошуку */}
          <Text style={styles.inputLabel}>{t("search_tags")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("search_tags")}
              value={searchTags}
              onChangeText={setSearchTags}
              multiline={true}
            />
          </View>

          {/* Реквізити */}
          <Text style={styles.inputLabel}>{t("bank_details")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("bank_details")}
              value={bankDetails}
              onChangeText={setBankDetails}
              multiline={true}
            />
          </View>

          {/* Checkbox "Я погоджуюсь" */}
          <View style={styles.agreementContainer}>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={agreedToTerms ? "#0EB3EB" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setAgreedToTerms}
              value={agreedToTerms}
            />
            <Text style={styles.agreementText}>
              {t("i_agree_with")}{" "}
              <Text
                style={styles.agreementLink}
                onPress={() =>
                  Alert.alert("Угода", "Перехід до договору співпраці")
                }
              >
                {t("cooperation_agreement")}
              </Text>
            </Text>
          </View>

          {profileSaveError ? (
            <Text style={styles.errorText}>{profileSaveError}</Text>
          ) : null}

          {/* Кнопка Зберегти */}
          <TouchableOpacity
            style={styles.saveProfileButton(width)}
            onPress={handleSaveProfile}
            disabled={isSavingProfile}
          >
            <Text style={styles.saveProfileButtonText}>
              {isSavingProfile ? "Збереження..." : t("save_profile")}
            </Text>
          </TouchableOpacity>

          {/* Modals */}
          {/* Country Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isCountryModalVisible}
            onRequestClose={closeCountryModal}
          >
            <ScrollView contentContainerStyle={styles.centeredView}>
              <View style={styles.modalView(width)}>
                <Text style={styles.modalTitle}>
                  {t("select_country_modal_title")}
                </Text>
                {countries.map((item) => (
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
                  <Text style={styles.textStyle}>{t("cancel")}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Modal>

          {/* General App Language Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={isGeneralLanguageModalVisible}
            onRequestClose={closeGeneralLanguageModal}
          >
            <TouchableWithoutFeedback onPress={closeGeneralLanguageModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback
                  onPress={() => {
                    /* Залишаємо порожнім, щоб не закривати модалку при натисканні всередині */
                  }}
                >
                  <View style={styles.languageModalContent}>
                    <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
                    {generalAppLanguages.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        style={styles.languageOption}
                        onPress={() => handleGeneralLanguageSelect(item.code)}
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

          {/* Consultation Language Modal (Multiple selection) */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isConsultationLanguageModalVisible}
            onRequestClose={closeConsultationLanguageModal}
          >
            <ScrollView contentContainerStyle={styles.centeredView}>
              <View style={styles.modalView(width)}>
                <Text style={styles.modalTitle}>
                  {t("select_consultation_language_modal_title")} {/* New translation key */}
                </Text>
                {consultationLanguages.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.countryItem, // Reusing style for consistency
                      selectedConsultationLanguages.includes(item.code) &&
                      styles.countryItemSelected,
                    ]}
                    onPress={() => toggleConsultationLanguageSelect(item.code)}
                  >
                    <Text style={styles.countryEmoji}>{item.emoji}</Text>
                    <Text style={styles.countryName}>{t(item.nameKey)}</Text>
                    {selectedConsultationLanguages.includes(item.code) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#0EB3EB"
                        style={styles.checkmarkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={closeConsultationLanguageModal}
                >
                  <Text style={styles.textStyle}>{t("close")}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Modal>

          {/* Specialization Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isSpecializationModalVisible}
            onRequestClose={closeSpecializationModal}
          >
            <ScrollView contentContainerStyle={styles.centeredView}>
              <View style={styles.modalView(width)}>
                <Text style={styles.modalTitle}>
                  {t("select_specialization_modal_title")}
                </Text>
                {specializations.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.countryItem, // Reusing style as it looks similar
                      selectedSpecializations.some(
                        (selectedSpec) => selectedSpec.value === item.value
                      ) && styles.countryItemSelected,
                    ]}
                    onPress={() => toggleSpecializationSelect(item)}
                  >
                    <Text style={styles.countryName}>{t(item.nameKey)}</Text>
                    {selectedSpecializations.some(
                      (selectedSpec) => selectedSpec.value === item.value
                    ) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#0EB3EB"
                        style={styles.checkmarkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={closeSpecializationModal}
                >
                  <Text style={styles.textStyle}>{t("close")}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Modal>

          {/* Consultation Cost Modal (Picker View) */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={isConsultationCostModalVisible}
            onRequestClose={closeConsultationCostModal}
          >
            <TouchableWithoutFeedback onPress={closeConsultationCostModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback
                  onPress={() => {
                    /* no-op */
                  }}
                >
                  <View style={styles.consultationCostModalContent}>
                    <Text style={styles.modalTitle}>
                      {t("select_consultation_cost")}
                    </Text>
                    <ScrollView style={styles.pickerScrollView}>
                      {consultationCostOptions.map((cost) => (
                        <TouchableOpacity
                          key={cost}
                          style={[
                            styles.pickerOption,
                            consultationCost === cost.toString() &&
                              styles.pickerOptionSelected,
                          ]}
                          onPress={() => selectConsultationCost(cost)}
                        >
                          <Text style={styles.pickerOptionText}>${cost}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={closeConsultationCostModal}
                    >
                      <Text style={styles.textStyle}>{t("cancel")}</Text>
                    </Pressable>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40, // Додано відступ зверху
  },
  container: (width, height) => ({
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0, // Змінимо, оскільки є header
    paddingHorizontal: width * 0.05,
    width: "100%",
  }),
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: {
    // Стилі для кнопки "назад"
  },
  languageDisplayContainer: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageDisplayText: {
    fontSize: 14,
    fontFamily: "Mont-Bold", // Розкоментовано
    color: "white",
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 30 : 26, // Трохи менше для анкети
    fontFamily: "Mont-Bold", // Розкоментовано
    color: "#212121",
    textAlign: "center",
    flex: 1, // Щоб заголовок займав доступне місце
    paddingHorizontal: 10, // Додано відступи для кращого вигляду
  }),
  inputLabel: {
    fontSize: 14,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium", // Розкоментовано
    paddingHorizontal: 35,
    marginTop: 10, // Відступ над кожним полем
    marginBottom: 5,
  },
  selectButton: (width) => ({
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9,
    minHeight: 52, // Змінено на minHeight
    alignItems: "flex-start",
    justifyContent: "flex-start", // Змінено на flex-start
    marginBottom: 14,
  }),
  // Стиль для тексту всередині selectButton, який може розширюватися
  selectButtonTextExpanded: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium", // Розкоментовано
    flexWrap: "wrap", // Дозволити перенос тексту
  },
  // Оригінальний selectButtonText, якщо він використовується для інших кнопок, де не потрібен wrap
  selectButtonText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium", // Розкоментовано
  },
  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    minHeight: 52, // Використовуємо minHeight для багаторядкових полів
  }),
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular", // Розкоментовано
    paddingVertical: Platform.OS === "ios" ? 10 : 0, // Для кращого вигляду на iOS
  },
  // New style for upload section to accommodate image preview
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Space between button and image
    width: "90%",
    marginBottom: 10,
  },
  uploadButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9 * 0.75, // Adjust width to make space for image
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    // marginBottom: 10, // Removed as it's now part of uploadContainer
  }),
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mont-Medium", // Розкоментовано
  },
  previewImage: {
    width: 60, // Smaller size for preview
    height: 60,
    borderRadius: 10, // Rounded corners for aesthetics
    marginLeft: 10, // Space between button and image
    resizeMode: "cover", // Ensure image covers the area
  },
  uploadedFileName: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 10,
    alignSelf: "flex-start",
    paddingLeft: 35,
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  agreementText: {
    fontSize: 14,
    fontFamily: "Mont-Regular", // Розкоментовано
    color: "#757575",
    marginLeft: 10,
    flexShrink: 1, // Дозволяє тексту переноситися
  },
  agreementLink: {
    fontWeight: "bold",
    color: "#0EB3EB",
    textDecorationLine: "underline",
  },
  saveProfileButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  }),
  saveProfileButtonText: {
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
  // Modal styles (перевикористовуються з RegisterScreen)
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
    width: width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.8, // Додано для прокручування
  }),
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  countryItem: {
    // Використовується для елементів списку в модальних вікнах (країни, спеціалізації, мови консультацій)
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
    justifyContent: "space-between", // To push checkmark to the right
    paddingHorizontal: 15, // Додано для відступів
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
    flex: 1, // Дозволяє тексту займати доступний простір
  },
  countryItemSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)", // Light blue background for selected
    borderRadius: 10,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "100%",
  },
  buttonClose: {
    backgroundColor: "#0EB3EB", // Змінено на колір кнопки збереження
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
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
    maxHeight: Dimensions.get("window").height * 0.6, // Обмежено висоту для прокручування
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular", // Розкоментовано
    color: "#333333",
  },
  checkmarkIcon: {
    marginLeft: 10,
  },
  // New styles for Consultation Cost Modal
  consultationCostModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    maxHeight: Dimensions.get("window").height * 0.6, // Limit height for scrollable content
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerScrollView: {
    width: "100%",
    maxHeight: 200, // Fixed height for the picker
  },
  pickerOption: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  pickerOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular", // Розкоментовано
    color: "#333333",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)", // Light blue background for selected
    borderRadius: 10,
  },
});

export default Anketa_Settings;