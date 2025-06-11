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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../providers/supabaseClient";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

const countries = [
  { name: "Україна", code: "UA", emoji: "🇺🇦" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
  { name: "United States", code: "US", emoji: "🇺🇸" },
  { name: "Canada", code: "CA", emoji: "🇨🇦" },
  { name: "Germany", code: "DE", emoji: "🇩🇪" },
  { name: "France", code: "FR", emoji: "🇫🇷" },
  { name: "Poland", code: "PL", emoji: "🇵🇱" },
];

const consultationLanguages = [
  { nameKey: "english", code: "en", emoji: "" },
  { nameKey: "ukrainian", code: "uk", emoji: "" },
  { nameKey: "polish", code: "pl", emoji: ""  },
  { nameKey: "german", code: "de", emoji: "" },
];

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

const experienceYearsOptions = Array.from({ length: 51 }, (_, i) => i);

const Anketa_Settings = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState(null);
  const [consultationCost, setConsultationCost] = useState("");
  const [selectedConsultationLanguages, setSelectedConsultationLanguages] =
    useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [photoUri, setPhotoUri] = useState(null);
  const [diplomaUri, setDiplomaUri] = useState(null);
  const [certificateUri, setCertificateUri] = useState(null);
  const [experienceYears, setExperienceYears] = useState(null);
  const [workLocation, setWorkLocation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [consultationCostRange, setConsultationCostRange] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
  const [isExperienceYearsModalVisible, setIsExperienceYearsModalVisible] =
    useState(false);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

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

  const formatYearsText = (years) => {
    if (years === null || years === undefined || isNaN(years) || years < 0) {
      return t("select_experience_placeholder");
    }
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${years} ${t("years_plural_genitive")}`;
    }
    if (lastDigit === 1) {
      return `${years} ${t("year_singular")}`;
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${years} ${t("years_plural_nominative")}`;
    }
    return `${years} ${t("years_plural_genitive")}`;
  };

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
          console.error("Error fetching profile:", error.message);
          Alert.alert(t("error_title"), t("error_fetching_profile"));
          return;
        }

        if (data) {
          setFullName(data.full_name || "");
          const userCountry = countries.find((c) => c.name === data.country);
          setCountry(userCountry || null);
          setConsultationCost(data.consultation_cost?.toString() || "");

          let fetchedCommunicationLanguages = [];
          if (data.communication_languages) {
            if (Array.isArray(data.communication_languages)) {
              fetchedCommunicationLanguages = data.communication_languages;
            } else {
              try {
                fetchedCommunicationLanguages = JSON.parse(
                  data.communication_languages
                );
              } catch (e) {
                console.warn(
                  "Warning: Invalid communication_languages format on fetch:",
                  data.communication_languages,
                  e
                );
              }
            }
          }
          setSelectedConsultationLanguages(fetchedCommunicationLanguages);

          let fetchedSpecializations = [];
          if (data.specialization) {
            if (Array.isArray(data.specialization)) {
              fetchedSpecializations = data.specialization;
            } else {
              try {
                fetchedSpecializations = JSON.parse(data.specialization);
              } catch (e) {
                console.warn(
                  "Warning: Invalid specialization format on fetch:",
                  data.specialization,
                  e
                );
              }
            }
          }
          const mappedSpecializations = fetchedSpecializations
            .map((value) => specializations.find((spec) => spec.value === value))
            .filter(Boolean);
          setSelectedSpecializations(mappedSpecializations);

          setPhotoUri(data.avatar_url || null);
          setDiplomaUri(data.diploma_url || null);
          setCertificateUri(data.certificate_photo_url || null);

          setExperienceYears(
            data.experience_years ? parseInt(data.experience_years, 10) : null
          );
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

  const openExperienceYearsModal = () => setIsExperienceYearsModalVisible(true);
  const closeExperienceYearsModal = () => setIsExperienceYearsModalVisible(false);
  const selectExperienceYears = (years) => {
    setExperienceYears(years);
    closeExperienceYearsModal();
  };

  const openImageModal = (uri) => {
    setSelectedImageUri(uri);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImageUri(null);
    setIsImageModalVisible(false);
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

    let fileExtension = "bin";
    let mimeType = "application/octet-stream";
    let fileBuffer;

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

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      fileBuffer = decode(base64);

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
          "avatars",
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
          "avatars",
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

      const specializationsToSave = selectedSpecializations.map((spec) => spec.value);
      const languagesToSave = selectedConsultationLanguages.length > 0
          ? selectedConsultationLanguages
          : [i18n.language];

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
              experience_years: experienceYears,
              work_experience: null,
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

  const handleSignOut = async () => {
    Alert.alert(
      t("logout_confirm_title"),
      t("logout_confirm_message"),
      [
        {
          text: t("no"),
          style: "cancel",
        },
        {
          text: t("yes"),
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Помилка виходу:", error.message);
              Alert.alert(
                t("error_title"),
                t("signOutError", { error: error.message })
              );
            } else {
              Alert.alert(t("signOutSuccessTitle"), t("signOutSuccessMessage"));
              navigation.navigate("HomeScreen");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoadingProfile ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0EB3EB" />
            <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
          </View>
        ) : (
          <View style={styles.container(width, height)}>
            <StatusBar style="auto" />

            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Profile_doctor")}
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

            <Text style={styles.inputLabel}>{t("upload_photo")}</Text>
            <View style={styles.avatarUploadContainer}>
              {photoUri ? (
                <TouchableOpacity onPress={() => openImageModal(photoUri)}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.profileAvatar}
                  />
                </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.signOutButtonAboveSearch}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={styles.signOutButtonText}>{t("signOut")}</Text>
            </TouchableOpacity>
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

            <Text style={styles.inputLabel}>ПІБ</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("fullname_placeholder_doc")}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

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
                          consultationLanguages.find(
                            (lang) => lang.code === code
                          )?.emoji +
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

            <Text style={styles.inputLabel}>{t("upload_diploma")}</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={styles.uploadButton(width)}
                onPress={() => pickImage(setDiplomaUri)}
              >
                <Text style={styles.uploadButtonText}>{t("upload_diploma")}</Text>
              </TouchableOpacity>
              {diplomaUri && (
                <TouchableOpacity onPress={() => openImageModal(diplomaUri)}>
                  <Image
                    source={{ uri: diplomaUri }}
                    style={styles.previewImage}
                  />
                </TouchableOpacity>
              )}
            </View>

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
                <TouchableOpacity onPress={() => openImageModal(certificateUri)}>
                  <Image
                    source={{ uri: certificateUri }}
                    style={styles.previewImage}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputLabel}>{t("work_experience")}</Text>
            <TouchableOpacity
              style={styles.selectButton(width)}
              onPress={openExperienceYearsModal}
            >
              <Text style={styles.selectButtonText}>
                {formatYearsText(experienceYears)}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("work_location")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("work_location_placeholder")}
                value={workLocation}
                onChangeText={setWorkLocation}
              />
            </View>

            <Text style={styles.inputLabel}>{t("achievements")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("achievements_placeholder")}
                value={achievements}
                onChangeText={setAchievements}
                multiline={true}
              />
            </View>

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

            <Text style={styles.inputLabel}>
              {t("consultation_cost_range")}
            </Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("consultation_cost_range_placeholder")}
                value={consultationCostRange}
                onChangeText={setConsultationCostRange}
                keyboardType="default"
              />
            </View>

            <Text style={styles.inputLabel}>{t("search_tags")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput
                style={styles.input}
                placeholder={t("search_tags_placeholder")}
                value={searchTags}
                onChangeText={setSearchTags}
              />
            </View>

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

            <View style={styles.agreementContainer}>
              <Switch
                trackColor={{ false: "#767577", true: "#0EB3EB" }}
                thumbColor={agreedToTerms ? "#f4f3f4" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
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
              {isSavingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveProfileButtonText}>
                  {t("save_profile")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
                      {item.name}
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
        animationType="slide"
        transparent={true}
        visible={isGeneralLanguageModalVisible}
        onRequestClose={closeGeneralLanguageModal}
      >
        <TouchableWithoutFeedback onPress={closeGeneralLanguageModal}>
          <View style={styles.centeredView}>
            <View style={[styles.languageModalContent, styles.modalBorder]}>
              <ScrollView style={styles.modalScrollView}>
                {generalAppLanguages.map((lang, index) => (
                  <Pressable
                    key={lang.code}
                    style={styles.languageOption}
                    onPress={() => handleGeneralLanguageSelect(lang.code)}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        i18n.language === lang.code &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {t(lang.nameKey)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeGeneralLanguageModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isConsultationLanguageModalVisible}
        onRequestClose={closeConsultationLanguageModal}
      >
        <TouchableWithoutFeedback onPress={closeConsultationLanguageModal}>
          <View style={styles.centeredView}>
            <View style={[styles.languageModalContent, styles.modalBorder]}>
              <ScrollView style={styles.modalScrollView}>
                {consultationLanguages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={styles.languageOption}
                    onPress={() => toggleConsultationLanguageSelect(lang.code)}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        selectedConsultationLanguages.includes(lang.code) &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {t(lang.nameKey)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeConsultationLanguageModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSpecializationModalVisible}
        onRequestClose={closeSpecializationModal}
      >
        <TouchableWithoutFeedback onPress={closeSpecializationModal}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView(width), styles.modalBorder]}>
              <ScrollView style={styles.modalScrollView}>
                {specializations.map((spec) => (
                  <Pressable
                    key={spec.value}
                    style={styles.countryItem}
                    onPress={() => toggleSpecializationSelect(spec)}
                  >
                    <Text
                      style={[
                        styles.countryName,
                        selectedSpecializations.some(
                          (s) => s.value === spec.value
                        ) && styles.countryItemTextSelected,
                      ]}
                    >
                      {t(spec.nameKey)}
                    </Text>
                    {selectedSpecializations.some((s) => s.value === spec.value) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#0EB3EB"
                        style={styles.checkmarkIcon}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeSpecializationModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isConsultationCostModalVisible}
        onRequestClose={closeConsultationCostModal}
      >
        <TouchableWithoutFeedback onPress={closeConsultationCostModal}>
          <View style={styles.centeredView}>
            <View
              style={[styles.consultationCostModalContent, styles.modalBorder]}
            >
              <ScrollView style={styles.pickerScrollView}>
                {consultationCostOptions.map((cost) => (
                  <Pressable
                    key={cost}
                    style={[
                      styles.pickerOption,
                      consultationCost === cost.toString() &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() => selectConsultationCost(cost)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        consultationCost === cost.toString() &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      ${cost}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeConsultationCostModal}
              >
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isExperienceYearsModalVisible}
        onRequestClose={closeExperienceYearsModal}
      >
        <TouchableWithoutFeedback onPress={closeExperienceYearsModal}>
          <View style={styles.centeredView}>
            <View style={[styles.modalContentYears, styles.modalBorder]}>
              <ScrollView style={styles.pickerScrollView}>
                {experienceYearsOptions.map((year) => (
                  <Pressable
                    key={year}
                    style={[
                      styles.pickerOption,
                      experienceYears === year && styles.pickerOptionSelected,
                    ]}
                    onPress={() => selectExperienceYears(year)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        experienceYears === year &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {formatYearsText(year)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={closeExperienceYearsModal}
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
        visible={isImageModalVisible}
        onRequestClose={closeImageModal}
      >
        <TouchableWithoutFeedback onPress={closeImageModal}>
          <View style={styles.fullScreenImageModalOverlay}>
            <TouchableWithoutFeedback>
              {selectedImageUri && (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </TouchableWithoutFeedback>
            <TouchableOpacity
              style={styles.closeImageModalButton}
              onPress={closeImageModal}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000000",
    fontFamily: "Mont-Regular",
  },
  container: (width, height) => ({
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0,
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
  backButton: {},
  languageDisplayContainer: {
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
    fontSize: isLargeScreen ? 30 : 26,
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 10,
  }),
  inputLabel: {
    fontSize: 14,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 35,
    marginTop: 10,
    marginBottom: 5,
  },
  selectButton: (width) => ({
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9,
    minHeight: 52,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: 14,
  }),
  selectButtonTextExpanded: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
    flexWrap: "wrap",
  },
  selectButtonText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    minHeight: 52,
  }),
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    paddingVertical: Platform.OS === "ios" ? 10 : 0,
  },
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 10,
  },
  avatarUploadContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  uploadButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9 * 0.75,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  }),
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginLeft: 10,
    resizeMode: "cover",
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#0EB3EB",
    resizeMode: "cover",
  },
  profileAvatarPlaceholder: {
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
    fontFamily: "Mont-Regular",
    color: "#757575",
    marginLeft: 10,
    flexShrink: 1,
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
  // Застосовано StyleSheet.absoluteFillObject
  centeredView: {
    ...StyleSheet.absoluteFillObject,
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
    maxHeight: Dimensions.get("window").height * 0.8,
  }),
  modalBorder: {
    borderColor: "#0EB3EB",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
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
  },
  countryItemSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 10,
  },
  countryItemTextSelected: {
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
    backgroundColor: "#0EB3EB",
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
    maxHeight: Dimensions.get("window").height * 0.6,
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
  checkmarkIcon: {
    marginLeft: 10,
  },
  consultationCostModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    maxHeight: Dimensions.get("window").height * 0.6,
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
    maxHeight: 200,
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
    fontFamily: "Mont-Regular",
    color: "#333333",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
    borderRadius: 10,
  },
  signOutButtonAboveSearch: {
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    marginBottom: 20,
  },
  signOutButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Mont-Bold",
    marginLeft: 8,
  },

  modalContentYears: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
  }),
  // Застосовано StyleSheet.absoluteFillObject
  fullScreenImageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closeImageModalButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 1,
  },
});

export default Anketa_Settings;