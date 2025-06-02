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
  Switch,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../providers/supabaseClient";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer"; // Цей імпорт потрібен для перетворення base64 в ArrayBuffer

const countries = [
  { name: "Україна", code: "UA", emoji: "🇺🇦" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
  { name: "United States", code: "US", emoji: "🇺🇸" },
  { name: "Canada", code: "CA", emoji: "🇨🇦" },
  { name: "Germany", code: "DE", emoji: "🇩🇪" },
  { name: "France", code: "FR", emoji: "🇫🇷" },
  { name: "Poland", code: "PL", emoji: "🇵🇱" },
];

// Languages for consultation
const consultationLanguages = [
  { nameKey: "english", code: "en", emoji: "" },
  { nameKey: "ukrainian", code: "uk", emoji: "" },
  { nameKey: "polish", code: "pl", emoji: "" },
  { nameKey: "german", code: "de", emoji: "" },
];

// Specializations
const specializations = [
  { nameKey: "general_practitioner", value: "general_practitioner" },
  { nameKey: "pediatrician", value: "pediatrician" },
  { nameKey: "cardiologist", value: "cardiologist" },
  { nameKey: "dermatologist", value: "dermatologist" },
  { nameKey: "neurologist", value: "neurologist" },
  { nameKey: "surgeon", value: "surgeon" },
  { nameKey: "psychiatrist", value: "psychiatrist" },
  { nameKey: "dentist", value: "dentist" },
  { nameKey: "ophthalmologist", value: "ophthalmologist" },
  { nameKey: "ent_specialist", value: "ent_specialist" },
  { nameKey: "gastroenterologist", value: "gastroenterologist" },
  { nameKey: "endocrinologist", value: "endocrinologist" },
  { nameKey: "oncologist", value: "oncologist" },
  { nameKey: "allergist", value: "allergist" },
  { nameKey: "physiotherapist", value: "physiotherapist" },
];

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
  const [country, setCountry] = useState(null);
  const [consultationCost, setConsultationCost] = useState("");
  const [selectedConsultationLanguages, setSelectedConsultationLanguages] =
    useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [photoUri, setPhotoUri] = useState(null);
  const [diplomaUri, setDiplomaUri] = useState(null);
  const [certificateUri, setCertificateUri] = useState(null);
  const [experienceText, setExperienceText] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [consultationCostRange, setConsultationCostRange] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // MODAL VISIBILITY STATES
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isGeneralLanguageModalVisible, setIsGeneralLanguageModalVisible] =
    useState(false);
  const [
    isConsultationLanguageModalVisible,
    setIsConsultationLanguageModalVisible,
  ] = useState(false);
  const [isSpecializationModalVisible, setIsSpecializationModalVisible] =
    useState(false);
  const [isConsultationCostModalVisible, setIsConsultationCostModalVisible] =
    useState(false);

  // UI RELATED STATES
  const [profileSaveError, setProfileSaveError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
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

  // --- FETCH USER PROFILE DATA ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User not authenticated:", userError?.message);
          setIsLoadingProfile(false);
          return;
        }

        const { data, error } = await supabase
          .from("anketa_doctor")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 means "No rows found"
          console.error("Error fetching profile:", error.message);
          Alert.alert(t("error_title"), t("error_fetching_profile"));
          return;
        }

        if (data) {
          setFullName(data.full_name || "");
          const userCountry = countries.find((c) => c.name === data.country);
          setCountry(userCountry || null);
          setConsultationCost(data.consultation_cost?.toString() || "");

          try {
            setSelectedConsultationLanguages(
              JSON.parse(data.communication_languages || "[]")
            );
          } catch (e) {
            console.error("Помилка парсингу communication_languages:", e);
            setSelectedConsultationLanguages([]);
          }

          try {
            const storedSpecializationsFromDb = JSON.parse(
              data.specialization || "[]"
            );
            const storedSpecializations = storedSpecializationsFromDb
              .map((value) =>
                specializations.find((spec) => spec.value === value)
              )
              .filter(Boolean);
            setSelectedSpecializations(storedSpecializations);
          } catch (e) {
            console.error("Помилка парсингу specialization:", e);
            setSelectedSpecializations([]);
          }

          // Встановлюємо photoUri з publicUrl, якщо він є
          setPhotoUri(data.avatar_url || null);
          // Тепер зчитуємо diploma_url та certificate_photo_url, якщо вони існують
          setDiplomaUri(data.diploma_url || null);
          setCertificateUri(data.certificate_photo_url || null);

          setExperienceText(data.work_experience || "");
          setWorkLocation(data.work_location || "");
          setAchievements(data.achievements || "");
          setAboutMe(data.about_me || "");
          setConsultationCostRange(data.consultation_cost_range || "");
          setSearchTags(data.search_tags || "");
          setBankDetails(data.bank_details || "");
          setAgreedToTerms(data.agreed_to_terms || false);
        }
      } catch (err) {
        console.error("Загальна помилка під час завантаження профілю:", err);
        Alert.alert(t("error_title"), t("error_general_fetch_failed"));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // --- MODAL HANDLERS ---
  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);
  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  const openGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(true);
  const closeGeneralLanguageModal = () =>
    setIsGeneralLanguageModalVisible(false);
  const handleGeneralLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeGeneralLanguageModal();
  };

  const openConsultationLanguageModal = () => {
    setIsConsultationLanguageModalVisible(true);
  };
  const closeConsultationLanguageModal = () =>
    setIsConsultationLanguageModalVisible(false);
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

  const openConsultationCostModal = () =>
    setIsConsultationCostModalVisible(true);
  const closeConsultationCostModal = () =>
    setIsConsultationCostModalVisible(false);
  const selectConsultationCost = (cost) => {
    setConsultationCost(cost.toString());
    closeConsultationCostModal();
  };

  const uploadFile = async (uri, bucketName, userId, fileNamePrefix) => {
    console.log("Starting upload for URI:", uri);
    console.log("Bucket:", bucketName);
    console.log("User ID (in uploadFile):", userId);

    if (!userId) {
      console.error("User ID is missing or null in uploadFile. Cannot upload.");
      Alert.alert(
        "Помилка завантаження",
        "Ідентифікатор користувача відсутній."
      );
      return null;
    }

    if (!uri || uri.length === 0) {
      console.error("URI is empty or null in uploadFile. Cannot upload.");
      Alert.alert("Помилка завантаження", "URI файлу відсутній.");
      return null;
    }

    let fileExtension = "bin"; // Дефолтне розширення
    let mimeType = "application/octet-stream"; // Дефолтний MIME тип
    let fileBuffer; // Буде ArrayBuffer

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("File Info:", fileInfo);

      if (!fileInfo.exists) {
        console.error("ERROR: File does not exist at URI:", uri);
        Alert.alert("Помилка завантаження", "Вибраний файл не існує.");
        return null;
      }
      if (fileInfo.size === 0) {
        console.warn("WARNING: File selected has 0 bytes:", uri);
        Alert.alert(
          "Помилка завантаження",
          "Вибраний файл порожній або не вдалося прочитати його вміст."
        );
        return null;
      }

      // Визначення mimeType та fileExtension
      if (fileInfo.mimeType) {
        mimeType = fileInfo.mimeType;
      } else {
        const uriParts = uri.split(".");
        if (uriParts.length > 1) {
          const ext = uriParts[uriParts.length - 1].toLowerCase();
          if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
          else if (ext === "png") mimeType = "image/png";
          else if (ext === "pdf") mimeType = "application/pdf";
          else if (ext === "doc") mimeType = "application/msword";
          else if (ext === "docx")
            mimeType =
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          // Додаємо інші формати зображень, якщо необхідно
          else if (ext === "gif") mimeType = "image/gif";
          else if (ext === "bmp") mimeType = "image/bmp";
          else if (ext === "webp") mimeType = "image/webp";
        }
      }

      const uriParts = uri.split(".");
      if (uriParts.length > 1) {
        fileExtension = uriParts[uriParts.length - 1];
      } else if (mimeType) {
        const mimeTypeParts = mimeType.split("/");
        if (mimeTypeParts.length > 1) {
          fileExtension = mimeTypeParts[1];
        }
      }

      // Читаємо файл у base64 для завантаження
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      fileBuffer = decode(base64); // Перетворюємо base64 в ArrayBuffer

      console.log("File data type for upload:", typeof fileBuffer);
      console.log("Determined MIME type for upload:", mimeType);

      const filePath = `${userId}/${fileNamePrefix}_${Date.now()}.${fileExtension}`;
      console.log("Attempting to upload to path (key):", filePath);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        Alert.alert(
          "Помилка завантаження Supabase",
          `Не вдалося завантажити файл: ${error.message}`
        );
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        console.log("Public URL:", publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      } else {
        console.warn("Could not get public URL for file:", filePath);
        Alert.alert(
          "Помилка URL",
          "Не вдалося отримати публічну URL-адресу для файлу."
        );
        return null;
      }
    } catch (error) {
      console.error("Error in uploadFile (catch block):", error);
      Alert.alert(
        "Помилка завантаження",
        `Невідома помилка завантаження: ${error.message}`
      );
      return null;
    }
  };

  const pickImage = async (setUriState) => {
    console.log("Attempting to pick image...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Media library permission status:", status);

    if (status !== "granted") {
      Alert.alert(
        "Потрібен дозвіл",
        "Будь ласка, надайте дозволи до бібліотеки медіа для завантаження фотографій."
      );
      return;
    }

    console.log("Permissions granted. Launching image library...");
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      console.log("ImagePicker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log("ImagePicker not canceled. Selected URI:", selectedUri);

        if (Platform.OS === "web") {
          let uriToSet;
          if (
            typeof selectedUri === "string" &&
            selectedUri.startsWith("blob:")
          ) {
            uriToSet = selectedUri;
          } else {
            const response = await fetch(selectedUri);
            const blob = await response.blob();
            uriToSet = URL.createObjectURL(blob);
          }
          setUriState(uriToSet);
        } else {
          setUriState(selectedUri);
        }
      } else {
        console.log("ImagePicker canceled by user or no asset selected.");
        setUriState(null);
      }
    } catch (error) {
      console.error("Error launching ImagePicker:", error);
      Alert.alert("Помилка", `Не вдалося відкрити галерею: ${error.message}`);
      setUriState(null);
    }
  };

  
  // --- SAVE PROFILE HANDLER ---
  const handleSaveProfile = async () => {
    setProfileSaveError("");

    if (!fullName.trim()) {
      setProfileSaveError("Будь ласка, введіть повне ім'я.");
      return;
    }
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        console.error(
          "User not authenticated or user ID is missing:",
          userError?.message || "User ID not found."
        );
        setProfileSaveError(
          "Користувач не автентифікований або ID користувача відсутній. Будь ласка, увійдіть."
        );
        setIsSavingProfile(false);
        return;
      }

      console.log("Authenticated User ID in handleSaveProfile:", user.id);

      let avatarUrl = photoUri;
      if (
        photoUri &&
        !photoUri.startsWith("http") &&
        !photoUri.startsWith("https")
      ) {
        console.log("Uploading photo from local URI:", photoUri);
        avatarUrl = await uploadFile(photoUri, "avatars", user.id, "profile");
        if (!avatarUrl) {
          setProfileSaveError("Не вдалося завантажити фото профілю.");
          setIsSavingProfile(false);
          return;
        }
      } else if (photoUri === null) {
        avatarUrl = null;
      }

      let diplomaUrl = diplomaUri;
      if (
        diplomaUri &&
        !diplomaUri.startsWith("http") &&
        !diplomaUri.startsWith("https")
      ) {
        console.log("Uploading diploma from local URI:", diplomaUri);
        diplomaUrl = await uploadFile(
          diplomaUri,
          "avatars", // ЗМІНА: Завантажуємо в бакет "avatars"
          user.id,
          "diploma"
        );
        if (!diplomaUrl) {
          setProfileSaveError("Не вдалося завантажити диплом.");
          setIsSavingProfile(false);
          return;
        }
      } else if (diplomaUri === null) {
        diplomaUrl = null;
      }

      let certUrl = certificateUri;
      if (
        certificateUri &&
        !certificateUri.startsWith("http") &&
        !certificateUri.startsWith("https")
      ) {
        console.log("Uploading certificate from local URI:", certificateUri);
        certUrl = await uploadFile(
          certificateUri,
          "avatars", // ЗМІНА: Завантажуємо в бакет "avatars"
          user.id,
          "certificate"
        );
        if (!certUrl) {
          setProfileSaveError("Не вдалося завантажити сертифікат.");
          setIsSavingProfile(false);
          return;
        }
      } else if (certificateUri === null) {
        certUrl = null;
      }

      const specializationsToSave = JSON.stringify(
        selectedSpecializations.map((spec) => spec.value)
      );
      const languagesToSave = JSON.stringify(
        selectedConsultationLanguages.length > 0
          ? selectedConsultationLanguages
          : [i18n.language]
      );

      const { error: doctorProfileError } = await supabase
        .from("anketa_doctor")
        .upsert(
          [
            {
              user_id: user.id,
              full_name: fullName.trim(),
              email: user.email,
              phone: "",
              country: country?.name || null,
              communication_languages: languagesToSave,
              specialization: specializationsToSave,
              experience_years: null,
              education: null,
              achievements: achievements.trim() || null,
              about_me: aboutMe.trim() || null,
              consultation_cost: consultationCost.trim() || null,
              consultation_cost_range: consultationCostRange.trim() || null,
              search_tags: searchTags.trim() || null,
              bank_details: bankDetails.trim() || null,
              avatar_url: avatarUrl,
              diploma_url: diplomaUrl,
              certificate_photo_url: certUrl,
              work_experience: experienceText.trim() || null,
              work_location: workLocation.trim() || null,
              is_verified: false,
              agreed_to_terms: agreedToTerms,
            },
          ],
          { onConflict: "user_id" }
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
      navigation.navigate("Profile_doctor");
    } catch (err) {
      console.error("Загальна помилка при збереженні профілю:", err);
      setProfileSaveError(t("error_general_save_failed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  const generalAppLanguages = [
    { nameKey: "english", code: "en", emoji: "" },
    { nameKey: "ukrainian", code: "uk", emoji: "" },
  ];

  useEffect(() => {
    const cleanupUris = [photoUri, diplomaUri, certificateUri].filter(
      (uri) => Platform.OS === "web" && uri && uri.startsWith("blob:")
    );

    return () => {
      cleanupUris.forEach((uri) => URL.revokeObjectURL(uri));
    };
  }, [photoUri, diplomaUri, certificateUri]);

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
              onPress={() => navigation.navigate("HomeScreen")}
            >
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.title(isLargeScreen)}>
              {t("doctor_profile_title")}
            </Text>
            <TouchableOpacity
              style={styles.languageDisplayContainer}
              onPress={openGeneralLanguageModal}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.languageDisplayText}>
                  {displayedLanguageCode}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Photo Upload - Moved to the top and styled as a circle */}
          <Text style={styles.inputLabel}>{t("upload_photo")}</Text>
          <View style={styles.avatarUploadContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
            <TouchableOpacity
              style={styles.uploadButton(width)}
              onPress={() => pickImage(setPhotoUri)}
            >
              <Text style={styles.uploadButtonText}>{t("upload_photo")}</Text>
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
            onPress={openConsultationLanguageModal}
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
                          consultationLanguages.find(
                            (lang) => lang.code === code
                          )?.nameKey
                        )
                    )
                    .join(", ")
                : t("select_consultation_language")}
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
              multiline={true}
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
              numberOfLines={4}
            />
          </View>

          {/* Вартість консультації (від і до) */}
          <Text style={styles.inputLabel}>{t("consultation_cost_range")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder="Від 00.00 до 00.00"
              keyboardType="default"
              value={consultationCostRange}
              onChangeText={setConsultationCostRange}
            />
          </View>

          {/* Теги для пошуку */}
          <Text style={styles.inputLabel}>{t("search_tags")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("search_tags_placeholder")}
              value={searchTags}
              onChangeText={setSearchTags}
            />
          </View>

          {/* Банківські реквізити */}
          <Text style={styles.inputLabel}>{t("bank_details")}</Text>
          <View style={styles.inputContainer(width)}>
            <TextInput
              style={styles.input}
              placeholder={t("bank_details_placeholder")}
              value={bankDetails}
              onChangeText={setBankDetails}
              multiline={true}
              numberOfLines={3}
            />
          </View>

          {/* Згода з умовами */}
          <View style={styles.agreementContainer}>
            <Switch
              trackColor={{
                false: "#767577",
                true: "rgb(3, 88, 101)",
              }}
              thumbColor={agreedToTerms ? "rgba(14, 179, 235, 1)" : "#f4f3f4"}
              onValueChange={setAgreedToTerms}
              value={agreedToTerms}
            />
            <Text style={styles.agreementText}>{t("agree_to_terms")}</Text>
          </View>

          {profileSaveError ? (
            <Text style={styles.errorText}>{profileSaveError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.saveProfileButton(width)}
            onPress={handleSaveProfile}
            disabled={isSavingProfile}
          >
            <Text style={styles.saveProfileButtonText}>
              {isSavingProfile ? t("saving") : t("save_profile")}
            </Text>
          </TouchableOpacity>

          {/* Country Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isCountryModalVisible}
            onRequestClose={closeCountryModal}
          >
            <Pressable style={styles.centeredView} onPress={closeCountryModal}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalView(width), styles.modalBorder]}>
                  {/* ЗМІНА: Додано modalBorder */}
                  <Text style={styles.modalTitle}>
                    {t("select_country_modal_title")}
                  </Text>
                  <ScrollView style={styles.modalScrollView}>
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
                  </ScrollView>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={closeCountryModal}
                  >
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
          </Modal>

          {/* General Language Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isGeneralLanguageModalVisible}
            onRequestClose={closeGeneralLanguageModal}
          >
            <Pressable
              style={styles.centeredView}
              onPress={closeGeneralLanguageModal}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.modalView(width), styles.modalBorder]}>
                  {/* ЗМІНА: Додано modalBorder */}
                  <Text style={styles.modalTitle}>{t("select_language")}</Text>
                  <ScrollView style={styles.modalScrollView}>
                    {generalAppLanguages.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={styles.languageOption}
                        onPress={() => handleGeneralLanguageSelect(lang.code)}
                      >
                        <Text style={styles.languageOptionText}>
                          {lang.emoji} {t(lang.nameKey)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={closeGeneralLanguageModal}
                  >
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
          </Modal>

          {/* Consultation Language Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isConsultationLanguageModalVisible}
            onRequestClose={closeConsultationLanguageModal}
          >
            <Pressable
              style={styles.centeredView}
              onPress={closeConsultationLanguageModal}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.modalView(width), styles.modalBorder]}>
                  {/* ЗМІНА: Додано modalBorder */}
                  <Text style={styles.modalTitle}>
                    {t("select_consultation_language")}
                  </Text>
                  <ScrollView style={styles.modalScrollView}>
                    {consultationLanguages.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.countryItem,
                          selectedConsultationLanguages.includes(lang.code) &&
                            styles.countryItemSelected,
                        ]}
                        onPress={() =>
                          toggleConsultationLanguageSelect(lang.code)
                        }
                      >
                        <Text
                          style={[
                            styles.countryName,
                            selectedConsultationLanguages.includes(lang.code) &&
                              styles.countryItemTextSelected,
                          ]}
                        >
                          {lang.emoji} {t(lang.nameKey)}
                        </Text>
                        {selectedConsultationLanguages.includes(lang.code) && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#0EB3EB"
                            style={styles.checkmarkIcon}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={closeConsultationLanguageModal}
                  >
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
          </Modal>

          {/* Specialization Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isSpecializationModalVisible}
            onRequestClose={closeSpecializationModal}
          >
            <Pressable
              style={styles.centeredView}
              onPress={closeSpecializationModal}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.modalView(width), styles.modalBorder]}>
                  {/* ЗМІНА: Додано modalBorder */}
                  <Text style={styles.modalTitle}>
                    {t("select_specialization_modal_title")}
                  </Text>
                  <ScrollView style={styles.modalScrollView}>
                    {specializations.map((spec) => (
                      <TouchableOpacity
                        key={spec.value}
                        style={[
                          styles.countryItem,
                          selectedSpecializations.some(
                            (selectedSpec) => selectedSpec.value === spec.value
                          ) && styles.countryItemSelected,
                        ]}
                        onPress={() => toggleSpecializationSelect(spec)}
                      >
                        <Text
                          style={[
                            styles.countryName,
                            selectedSpecializations.some(
                              (selectedSpec) =>
                                selectedSpec.value === spec.value
                            ) && styles.countryItemTextSelected,
                          ]}
                        >
                          {t(spec.nameKey)}
                        </Text>
                        {selectedSpecializations.some(
                          (s) => s.value === spec.value
                        ) && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#0EB3EB"
                            style={styles.checkmarkIcon}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={closeSpecializationModal}
                  >
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
          </Modal>

          {/* Consultation Cost Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isConsultationCostModalVisible}
            onRequestClose={closeConsultationCostModal}
          >
            <Pressable
              style={styles.centeredView}
              onPress={closeConsultationCostModal}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.consultationCostModalContent,
                    styles.modalBorder,
                  ]}
                >
                  {/* ЗМІНА: Додано modalBorder */}
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
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
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
    borderRadius: 20,
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
    // For diploma and certificate
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Space between button and image
    width: "90%",
    marginBottom: 10,
  },
  avatarUploadContainer: {
    // Specific for avatar
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
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
    // For diploma and certificate previews
    width: 60, // Smaller size for preview
    height: 60,
    borderRadius: 10, // Rounded corners for aesthetics
    marginLeft: 10, // Space between button and image
    resizeMode: "cover", // Ensure image covers the area
  },
  profileAvatar: {
    // Specific style for the circular avatar
    width: 120,
    height: 120,
    borderRadius: 60, // Makes it a circle
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#0EB3EB",
    resizeMode: "cover",
  },
  profileAvatarPlaceholder: {
    // Placeholder for when no avatar is selected
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#0EB3EB",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
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
  modalBorder: {
    // НОВИЙ СТИЛЬ: для рамки модальних вікон
    borderColor: "#0EB3EB",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalScrollView: {
    width: "100%", // Займає всю ширину модального вікна
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
  countryItemTextSelected: {
    // Додано для стилю тексту вибраних елементів
    fontWeight: "bold",
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
