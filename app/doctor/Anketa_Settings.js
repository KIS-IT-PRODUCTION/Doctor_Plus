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
} from "react-native";
import { StatusBar } from "expo-status-bar";
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

const Anketa_Settings = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // STATES FOR PROFILE DATA
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState(null); // Для поля "Україна"
  const [consultationCost, setConsultationCost] = useState("");
  const [selectedConsultationLanguage, setSelectedConsultationLanguage] = useState(null); // Мова консультацій
  const [selectedSpecialization, setSelectedSpecialization] = useState(null); // Для "Обрати спеціалізацію"
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
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setIsSpecializationModalVisible] = useState(false);

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
      const subscription = Dimensions.addEventListener("change", updateDimensions);
      // setDimensionsSubscription(subscription); // Зберігання підписки не потрібне для useEffect cleanup
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

  const openLanguageModal = () => setIsLanguageModalVisible(true);
  const closeLanguageModal = () => setIsLanguageModalVisible(false);
  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    setSelectedConsultationLanguage(langCode); // Зберігаємо обрану мову консультації
    closeLanguageModal();
  };

  const openSpecializationModal = () => setIsSpecializationModalVisible(true);
  const closeSpecializationModal = () => setIsSpecializationModalVisible(false);
  const selectSpecialization = (spec) => {
    setSelectedSpecialization(spec);
    closeSpecializationModal();
  };

  // --- FILE UPLOAD HANDLERS ---
  const pickImage = async (setUri) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant media library permissions to upload photos.');
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
      Alert.alert("Фото", `Завантажено: ${result.assets[0].uri.split('/').pop()}`);
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
      Alert.alert("Документ", `Завантажено: ${result.name}`);
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
    if (!selectedSpecialization) {
      setProfileSaveError("Будь ласка, виберіть спеціалізацію.");
      return;
    }
    if (!agreedToTerms) {
      setProfileSaveError("Будь ласка, погодьтеся з умовами співпраці.");
      return;
    }

    setIsSavingProfile(true);

    try {
      // Отримання поточної сесії/користувача
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfileSaveError("Користувач не автентифікований. Будь ласка, увійдіть.");
        setIsSavingProfile(false);
        return;
      }

      // TODO: Upload files to Supabase Storage and get their URLs
      // Ця логіка може бути складною і вимагати окремих функцій для завантаження
      // і отримання URL. Для прикладу я просто передам URI.
      // В реальному проекті ви б завантажували файли сюди і отримували їхні публічні URL
      // const photoUrl = photoUri ? await uploadFile(photoUri, 'doctor_photos') : null;
      // const diplomaUrl = diplomaUri ? await uploadFile(diplomaUri, 'doctor_diplomas') : null;
      // const certificateUrl = certificateUri ? await uploadFile(certificateUri, 'doctor_certificates') : null;


      // Зберігання даних профілю лікаря в таблицю "doctors"
      const { error: doctorProfileError } = await supabase.from("doctors").upsert([
        {
          id: user.id, // ID користувача з Supabase Auth
          user_id: user.id, // Посилання на auth.users
          full_name: fullName.trim(),
          email: user.email, // Email беремо з об'єкта користувача Supabase
          phone: '', // Якщо у вас немає поля вводу для телефону на цьому екрані, воно може бути пустим або null
          country: country?.name || null,
          language: selectedConsultationLanguage || i18n.language || null, // Мова консультації
          specialization: selectedSpecialization?.value || null,
          experience_years: null, // Потрібно окреме поле вводу для років досвіду
          education: null, // Потрібно окреме поле вводу
          achievements: achievements.trim() || null,
          about_me: aboutMe.trim() || null,
          communication_languages: [selectedConsultationLanguage || i18n.language], // Або масив, якщо декілька мов
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
      ], { onConflict: 'id' }); // Використовуємо upsert, щоб оновити існуючий запис, якщо він є

      if (doctorProfileError) {
        console.error("Помилка збереження профілю лікаря:", doctorProfileError.message);
        setProfileSaveError(t("error_profile_save_failed"));
        return;
      }

      Alert.alert(t("success_title"), t("success_profile_saved"));
      // Опціонально: перехід на інший екран або очищення форми
      // navigation.navigate("DoctorDashboard");

    } catch (err) {
      console.error("Загальна помилка при збереженні профілю:", err);
      setProfileSaveError(t("error_general_save_failed"));
    } finally {
      setIsSavingProfile(false);
    }
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

        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.title(isLargeScreen)}>{t("doctor_profile_title")}</Text>
          {/* Прапорець мови - на зображенні він вгорі праворуч, але не кнопка */}
          <View style={styles.languageDisplayContainer}>
            <Text style={styles.languageDisplayText}>{displayedLanguageCode}</Text>
          </View>
        </View>

        {/* Country (Україна) */}
        <TouchableOpacity
          style={styles.selectButton(width)}
          onPress={openCountryModal}
        >
          <Text style={styles.selectButtonText}>
            {country ? `${country.emoji} ${country.name}` : t("select_country")}
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
        <View style={styles.inputContainer(width)}>
          <TextInput
            style={styles.input}
            placeholder="00.00"
            keyboardType="numeric"
            value={consultationCost}
            onChangeText={setConsultationCost}
          />
        </View>

        {/* Мова консультацій */}
        <Text style={styles.inputLabel}>{t("consultation_language")}</Text>
        <TouchableOpacity
          style={styles.selectButton(width)}
          onPress={openLanguageModal}
        >
          <Text style={styles.selectButtonText}>
            {selectedConsultationLanguage
              ? languagesForModal.find(lang => lang.code === selectedConsultationLanguage)?.emoji + " " + t(languagesForModal.find(lang => lang.code === selectedConsultationLanguage)?.nameKey)
              : t("select_language")}
          </Text>
        </TouchableOpacity>

        {/* Вибрати фах */}
        <Text style={styles.inputLabel}>{t("select_specialization")}</Text>
        <TouchableOpacity
          style={styles.selectButton(width)}
          onPress={openSpecializationModal}
        >
          <Text style={styles.selectButtonText}>
            {selectedSpecialization ? t(selectedSpecialization.nameKey) : t("select_specialization")}
          </Text>
        </TouchableOpacity>

        {/* Photo Upload */}
        <Text style={styles.inputLabel}>{t("upload_photo")}</Text>
        <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickImage(setPhotoUri)}>
          <Text style={styles.uploadButtonText}>{t("upload_photo")}</Text>
        </TouchableOpacity>
        {photoUri && <Text style={styles.uploadedFileName}>Обрано: {photoUri.split('/').pop()}</Text>}

        {/* Diploma Upload */}
        <Text style={styles.inputLabel}>{t("upload_diploma")}</Text>
        <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickDocument(setDiplomaUri)}>
          <Text style={styles.uploadButtonText}>{t("upload_diploma")}</Text>
        </TouchableOpacity>
        {diplomaUri && <Text style={styles.uploadedFileName}>Обрано: {diplomaUri.split('/').pop()}</Text>}

        {/* Certificate Upload */}
        <Text style={styles.inputLabel}>{t("upload_certificate")}</Text>
        <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickDocument(setCertificateUri)}>
          <Text style={styles.uploadButtonText}>{t("upload_certificate")}</Text>
        </TouchableOpacity>
        {certificateUri && <Text style={styles.uploadedFileName}>Обрано: {certificateUri.split('/').pop()}</Text>}

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
              onPress={() => Alert.alert("Угода", "Перехід до договору співпраці")}
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
              <Text style={styles.modalTitle}>{t("select_country_modal_title")}</Text>
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

        {/* Language Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
        >
          <TouchableWithoutFeedback onPress={closeLanguageModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => { /* no-op */ }}>
                <View style={styles.languageModalContent}>
                  <Text style={styles.modalTitle}>{t("select_language")}</Text>
                  {languagesForModal.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.languageOption}
                      onPress={() => handleLanguageSelect(item.code)}
                    >
                      <Text style={styles.languageOptionText}>
                        {item.emoji} {t(item.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
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
              <Text style={styles.modalTitle}>{t("select_specialization_modal_title")}</Text>
              {specializations.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.countryItem} // Перевикористаємо стиль, оскільки виглядає схоже
                  onPress={() => selectSpecialization(item)}
                >
                  <Text style={styles.countryName}>{t(item.nameKey)}</Text>
                </TouchableOpacity>
              ))}
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeSpecializationModal}
              >
                <Text style={styles.textStyle}>{t("cancel")}</Text>
              </Pressable>
            </View>
          </ScrollView>
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
    paddingVertical: 20, // Додамо відступ для прокрутки
  },
  container: (width, height) => ({
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0, // Змінимо, оскільки є header
    paddingHorizontal: width * 0.05,
    width: "100%",
  }),
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: {
    // Стилі для кнопки "назад"
  },
  languageDisplayContainer: {
    // Це місце для вашого "Прапорця" на зображенні
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageDisplayText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 30 : 26, // Трохи менше для анкети
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
    flex: 1, // Щоб заголовок займав доступне місце
  }),
  inputLabel: {
    fontSize: 14,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
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
    height: 52,
    alignItems: "flex-start", // Текст ліворуч
    justifyContent: "center",
    marginBottom: 14,
  }),
  selectButtonText: {
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
    minHeight: 52, // Використовуємо minHeight для багаторядкових полів
  }),
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    paddingVertical: Platform.OS === 'ios' ? 10 : 0, // Для кращого вигляду на iOS
  },
  uploadButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 10,
  }),
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  uploadedFileName: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingLeft: 35,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  agreementText: {
    fontSize: 14,
    fontFamily: "Mont-Regular",
    color: "#757575",
    marginLeft: 10,
    flexShrink: 1, // Дозволяє тексту переноситися
  },
  agreementLink: {
    fontWeight: 'bold',
    color: '#0EB3EB',
    textDecorationLine: 'underline',
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
  }),
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  countryItem: { // Використовується для елементів списку в модальних вікнах (країни, спеціалізації)
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
  modalOverlay: { // Стиль для модального вікна мови (як у RegisterScreen)
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
    fontFamily: "Mont-Regular",
    color: "#333333",
  },
});

export default Anketa_Settings;