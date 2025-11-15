import React, { useState, useEffect, memo } from "react";
import {
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
  Switch,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView, 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../providers/supabaseClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useAuth } from "../../providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { countries } from '../../components/countries.js'; 
import { consultationLanguages } from './constant/consultationLanguages.js';
import { specializations } from './constant/specializations.js';
import { Image } from 'expo-image';
import { MotiView, AnimatePresence } from 'moti';
import { getStyles } from './Anketa_Settings.styles.js';
import { da } from "date-fns/locale";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const experienceYearsOptions = Array.from({ length: 51 }, (_, i) => i);
const consultationCostOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
const generalAppLanguages = [
  { nameKey: "english", code: "en", emoji: "🇬🇧" },
  { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
];

async function registerForPushNotificationsAsync(userId) {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Помилка", "Не вдалося отримати токен для push-сповіщень!");
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId: "e2619b61-6ef5-4958-90bc-a400bbc8c50a" })).data;
    } catch (e) {
      console.error("Error getting Expo push token:", e);
      return;
    }
  } else {
    return;
  }
  if (token && userId) {
    const { error } = await supabase
      .from("profile_doctor")
      .update({ notification_token: token })
      .eq("user_id", userId);
    if (error) {
      console.error("Error saving notification token:", error.message);
    } else {
      console.log("Notification token saved successfully for doctor user_id:", userId);
    }
  }
  return token;
}

const Section = memo(({ title, children, delay = 0 }) => {
  const styles = getStyles();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: delay }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </MotiView>
  );
});

const InputText = memo(({ label, placeholder, value, onChangeText, error, multiline = false, numberOfLines = 1, ...props }) => {
  const styles = getStyles();
  return (
    <View style={{width: '100%'}}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError, multiline && styles.multilineInputContainer]}>
        <TextInput 
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder} 
          placeholderTextColor="#B0BEC5"
          value={value} 
          onChangeText={onChangeText} 
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
      </View>
      <AnimatePresence>
        {error && 
          <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
            <Text style={styles.fieldErrorText}>{error}</Text>
          </MotiView>
        }
      </AnimatePresence>
    </View>
  );
});

const PickerButton = memo(({ label, text, placeholder, onPress, error }) => {
  const styles = getStyles();
  const hasValue = text && text !== placeholder;
  return (
    <View style={{width: '100%'}}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity 
        style={[styles.selectButton, error && styles.inputError]} 
        onPress={onPress}
      >
        <Text style={hasValue ? styles.selectButtonText : styles.selectButtonPlaceholder} numberOfLines={2}>
          {text || placeholder}
        </Text>
      </TouchableOpacity>
      <AnimatePresence>
        {error && 
          <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
            <Text style={styles.fieldErrorText}>{error}</Text>
          </MotiView>
        }
      </AnimatePresence>
    </View>
  );
});


const Anketa_Settings = ({ route }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const styles = getStyles();

  const doctorIdFromParams = route.params?.doctorId ? String(route.params.doctorId) : null;
  const isProfileOwner = !doctorIdFromParams || (session?.user?.id === doctorIdFromParams);

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState(null);
  const [selectedConsultationLanguages, setSelectedConsultationLanguages] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [photoUri, setPhotoUri] = useState(null);
  const [diplomaUri, setDiplomaUri] = useState(null);
  const [certificateUri, setCertificateUri] = useState(null);
  const [experienceYears, setExperienceYears] = useState(null);
  const [workLocation, setWorkLocation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [consultationCost, setConsultationCost] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [doctorCheckStatus, setDoctorCheckStatus] = useState(false);
  const [isProfileCreated, setIsProfileCreated] = useState(false);

  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isGeneralLanguageModalVisible, setIsGeneralLanguageModalVisible] = useState(false);
  const [isConsultationLanguageModalVisible, setIsConsultationLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setIsSpecializationModalVisible] = useState(false);
  const [isExperienceYearsModalVisible, setIsExperienceYearsModalVisible] = useState(false);
  const [isBankInfoModalVisible, setBankInfoModalVisible] = useState(false);
  const [isCostModalVisible, setIsCostModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isDeleteConfirmationModalVisible, setIsDeleteConfirmationModalVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [profileSaveError, setProfileSaveError] = useState(""); 

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  
  const [emailToDelete, setEmailToDelete] = useState("");
  const [passwordToDelete, setPasswordToDelete] = useState("");
  const [deleteErrors, setDeleteErrors] = useState({});

  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(i18n.language.toUpperCase());

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  const formatYearsText = (years) => {
    if (years === null || years === undefined || isNaN(years) || years < 0) {
      return t("select_experience_placeholder");
    }
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${years} ${t("years_plural_genitive")}`;
    if (lastDigit === 1) return `${years} ${t("year_singular")}`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${years} ${t("years_plural_nominative")}`;
    return `${years} ${t("years_plural_genitive")}`;
  };

useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingProfile(false);
          return;
        }

        if (isProfileOwner) {
          registerForPushNotificationsAsync(user.id);
        }

        const { data: profileDoctorData } = await supabase
          .from("profile_doctor")
          .select("language, full_name, country") 
          .eq("user_id", user.id)
          .single();

        const nameFromProfile = profileDoctorData?.full_name || "";
        const countryFromProfile = profileDoctorData?.country || "";

        if (profileDoctorData) {
          if (profileDoctorData.language && profileDoctorData.language !== i18n.language) {
            i18n.changeLanguage(profileDoctorData.language);
          }

          if (nameFromProfile) {
            setFullName(nameFromProfile);
          }
          if (countryFromProfile) {
            setCountry(countries.find(c => c.name === countryFromProfile) || null);
          }
        }

        const { data, error } = await supabase
          .from("anketa_doctor")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (data) {
          setIsProfileCreated(true);
          
       
          setFullName(data.full_name || nameFromProfile || ""); 
          setCountry(data.country ? countries.find(c => c.name === data.country) : (countryFromProfile ? countries.find(c => c.name === countryFromProfile) : null));
          const userCountry = countries.find(c => c.ianaTimezone === data.country_timezone || c.name === data.country);
          setCountry(userCountry || null);
          const communicationLanguages = data.communication_languages ? (Array.isArray(data.communication_languages) ? data.communication_languages : JSON.parse(data.communication_languages)) : [];
          setSelectedConsultationLanguages(communicationLanguages);
          const specializationData = data.specialization ? (Array.isArray(data.specialization) ? data.specialization : JSON.parse(data.specialization)) : [];
          
          const mappedSpecializations = specializationData.map(value => {
            const cleanValue = value.replace('categories.', ''); 
            return specializations.find(spec => spec.value === cleanValue);
          }).filter(Boolean);

          setSelectedSpecializations(mappedSpecializations);
          setPhotoUri(data.avatar_url || null);
          setDiplomaUri(data.diploma_url || null);
          setCertificateUri(data.certificate_photo_url || null);
          setExperienceYears(data.experience_years ? parseInt(data.experience_years, 10) : null);
          setWorkLocation(data.work_location || "");
          setAchievements(data.achievements || "");
          setAboutMe(data.about_me || "");
          setConsultationCost(data.consultation_cost ? String(data.consultation_cost) : "");
          setSearchTags(data.search_tags || "");
          setBankDetails(data.bank_details || "");
          setAgreedToTerms(data.agreed_to_terms || false);
          setDoctorCheckStatus(data.doctor_check || false);
        } else {
          setIsProfileCreated(false);
        }
      } catch (err) {
        console.error("Помилка завантаження профілю:", err);
        Alert.alert(t("error_title"), t("error_fetching_profile"));
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [i18n, t, isProfileOwner]);

  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);
  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  const openGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(true);
  const closeGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(false);

  const handleGeneralLanguageSelect = async (langCode) => {
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem('user_language', langCode);
    closeGeneralLanguageModal();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profile_doctor").upsert({ user_id: user.id, language: langCode }, { onConflict: "user_id" });
      }
    } catch (error) {
      Alert.alert(t("error_title"), t("error_saving_language"));
    }
  };

  const openConsultationLanguageModal = () => setIsConsultationLanguageModalVisible(true);
  const closeConsultationLanguageModal = () => setIsConsultationLanguageModalVisible(false);
  const toggleConsultationLanguageSelect = (langCode) => {
    setSelectedConsultationLanguages(prev => prev.includes(langCode) ? prev.filter(code => code !== langCode) : [...prev, langCode]);
  };

  const openSpecializationModal = () => setIsSpecializationModalVisible(true);
  const closeSpecializationModal = () => setIsSpecializationModalVisible(false);
  const toggleSpecializationSelect = (spec) => {
    setSelectedSpecializations(prev => prev.some(s => s.value === spec.value) ? prev.filter(s => s.value !== spec.value) : [...prev, spec]);
  };

  const openExperienceYearsModal = () => setIsExperienceYearsModalVisible(true);
  const closeExperienceYearsModal = () => setIsExperienceYearsModalVisible(false);
  const selectExperienceYears = (years) => {
    setExperienceYears(years);
    closeExperienceYearsModal();
  };
  
  const openCostModal = () => setIsCostModalVisible(true);
  const closeCostModal = () => setIsCostModalVisible(false);
  const selectConsultationCost = (cost) => {
    setConsultationCost(String(cost));
    closeCostModal();
  };

  const openImageModal = (uri) => {
    setSelectedImageUri(uri);
    setIsImageModalVisible(true);
  };
  const closeImageModal = () => setIsImageModalVisible(false);

  const uploadFile = async (uri, bucketName, userId, fileNamePrefix) => {
    if (!uri || uri.startsWith("http")) {
      return Promise.resolve(uri);
    }
    try {
      const fileExtension = uri.split('.').pop();
      const mimeType = `image/${fileExtension}`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const fileBuffer = decode(base64);
      const filePath = `${userId}/${fileNamePrefix}_${Date.now()}.${fileExtension}`;
      const { error } = await supabase.storage.from(bucketName).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      Alert.alert(t("error_title"), t("error_uploading_file", { message: error.message }));
      return null;
    }
  };

  const pickImage = async (setUriState) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permission_denied_title"), t("permission_denied_message"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setUriState(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    Keyboard.dismiss();
    setProfileSaveError("");
    setFieldErrors({});
    let hasErrors = false;
    const newErrors = {};
    const ibanRegex = /^UA\d{27}$/;

    if (!fullName.trim()) {
      newErrors.fullName = t("fullname_required");
      hasErrors = true;
    }
    if (selectedSpecializations.length === 0) {
      newErrors.specialization = t("specialization_required");
      hasErrors = true;
    }
    if (!consultationCost.trim() || isNaN(parseFloat(consultationCost))) {
      newErrors.consultationCost = t("consultation_cost_required");
      hasErrors = true;
    }
    if (!bankDetails.trim()) {
      newErrors.bankDetails = t("paymentInfoIBANRequired");
      hasErrors = true;
    } else if (!ibanRegex.test(bankDetails.trim().replace(/\s/g, ''))) {
      newErrors.bankDetails = t("paymentInfoIBANInvalid");
      hasErrors = true;
    }
    if (!agreedToTerms) {
      newErrors.agreedToTerms = t("agree_to_terms_required");
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newErrors);
      Alert.alert(t("error_title"), t("fill_all_required_fields"));
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const uploadTasks = [
        uploadFile(photoUri, "avatars", user.id, "profile"),
        uploadFile(diplomaUri, "avatars", user.id, "diploma"),
        uploadFile(certificateUri, "avatars", user.id, "certificate")
      ];

      const [avatarUrl, diplomaUrl, certUrl] = await Promise.all(uploadTasks);

      const profileData = {
        user_id: user.id,
        full_name: fullName.trim(),
        email: user.email,
        country: country?.name || null,
        country_timezone: country?.ianaTimezone || null,
        communication_languages: selectedConsultationLanguages,
        specialization: selectedSpecializations.map(spec => spec.value),
        experience_years: experienceYears,
        work_location: workLocation.trim() || null,
        achievements: achievements.trim() || null,
        about_me: aboutMe.trim() || null,
        consultation_cost: parseFloat(consultationCost),
        search_tags: searchTags.trim() || null,
        bank_details: bankDetails.trim(),
        avatar_url: avatarUrl,
        diploma_url: diplomaUrl,
        certificate_photo_url: certUrl,
        agreed_to_terms: agreedToTerms,
        doctor_check: doctorCheckStatus,
      };

      const { error } = await supabase.from("anketa_doctor").upsert(profileData, { onConflict: "user_id" });
      if (error) throw error;

      setIsProfileCreated(true);

      Alert.alert(t("success_title"), t("success_profile_saved"));
      navigation.navigate("Profile_doctor");
    } catch (err) {
      setProfileSaveError(err.message || t("error_general_save_failed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      t("signOutTitle"),
      t("logout_confirm_message"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("signOut"), onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) { Alert.alert(t("error_title"), error.message); } 
              else { navigation.navigate("MainScreen"); }
            } catch (err) {
              Alert.alert(t("error_title"), t("error_signing_out"));
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleOpenDeleteModal = () => {
    setEmailToDelete("");
    setPasswordToDelete("");
    setDeleteErrors({});
    setIsDeleteConfirmationModalVisible(true);
  }

  const confirmAndDeleteProfile = async () => {
    Keyboard.dismiss();
    setDeleteErrors({});
    let hasErrors = false;
    const newErrors = {};

    if (!emailToDelete.trim()) {
      newErrors.email = t("delete_email_required");
      hasErrors = true;
    }
    if (!passwordToDelete.trim()) {
      newErrors.password = t("delete_password_required");
      hasErrors = true;
    }

    if (hasErrors) {
      setDeleteErrors(newErrors);
      return;
    }

    setIsDeletingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t("error_title"), t("error_not_authenticated"));
        return;
      }
      if (emailToDelete !== user.email) {
          Alert.alert(t("error_title"), t("error_email_mismatch"));
          return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToDelete,
        password: passwordToDelete,
      });
      if (signInError) {
        Alert.alert(t("error_title"), t("error_invalid_credentials"));
        return;
      }
      const { error: anketaError } = await supabase
        .from("anketa_doctor")
        .delete()
        .eq("user_id", user.id);
      if (anketaError) throw anketaError;
      const { error: profileError } = await supabase
        .from("profile_doctor")
        .delete()
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      Alert.alert(t("success_title"), t("profile_deleted"));
      setIsDeleteConfirmationModalVisible(false);
      navigation.navigate("MainScreen");
    } catch (err) {
      console.error("Помилка видалення профілю:", err);
      Alert.alert(t("error_title"), err.message || t("error_deleting_profile"));
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const showStatusInfo = () => {
    const title = t('statusInfoTitle');
    const message = doctorCheckStatus ? t('statusConfirmedDetails') : t('statusPendingDetails');
    Alert.alert(title, message, [{ text: t('close') }]);
  };

  const getStatusContent = () => {
    if (!isProfileCreated) {
      return {
        text: t("statusDraftTitle") || "Заповніть анкету", 
        colorType: 'draft',
        infoMessage: t("statusDraftDetails") || "Будь ласка, заповніть всі дані та натисніть 'Зберегти профіль', щоб подати заявку на перевірку адміністратору."
      };
    } else if (!doctorCheckStatus) {
      return {
        text: t("statusPendingTitle"), 
        colorType: 'pending',
        infoMessage: t("statusPendingDetails")
      };
    } else {
      return {
        text: t("statusConfirmedTitle"), 
        colorType: 'confirmed',
        infoMessage: t("statusConfirmedDetails")
      };
    }
  };

  const statusContent = getStatusContent();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F8" />
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Profile_doctor")}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("doctor_profile_title")}</Text>
        <TouchableOpacity style={styles.languageDisplayContainer} onPress={openGeneralLanguageModal}>
          <Text style={styles.languageDisplayText}>{displayedLanguageCode}</Text>
        </TouchableOpacity>
      </View>

      {isLoadingProfile ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0EB3EB" />
          <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            
            {doctorCheckStatus !== undefined && (
              <View style={styles.statusSectionContainer}>
                <View style={styles.doctorStatusContainer(statusContent.colorType)}>
                  <Text style={styles.doctorStatusText}>
                    {statusContent.text}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => Alert.alert(t('statusInfoTitle'), statusContent.infoMessage, [{ text: t('close') }])} 
                  style={styles.statusInfoIcon}
                >
                  <Ionicons name="information-circle-outline" size={26} color="#0EB3EB" />
                </TouchableOpacity>
              </View>
            )}

            <Section title={t('personal_information')} delay={100}>
              <View style={styles.avatarUploadContainer}>
                {photoUri ? (
                  <TouchableOpacity onPress={() => openImageModal(photoUri)}>
                    <Image source={{ uri: photoUri }} style={styles.profileAvatar} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.profileAvatarPlaceholder}>
                    <Ionicons name="person" size={60} color="#ccc" />
                  </View>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setPhotoUri)}>
                  <Text style={styles.uploadButtonText}>{t("upload_photo")}</Text>
                </TouchableOpacity>
              </View>

              <InputText
                label={t("fullname")}
                placeholder={t("fullname_placeholder_doc")}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (fieldErrors.fullName) setFieldErrors(p => ({...p, fullName: null}));
                }}
                error={fieldErrors.fullName}
              />
              
              <PickerButton
                label={t("country")}
                placeholder={t("select_country")}
                text={country ? `${country.emoji} ${country.name}` : null}
                onPress={openCountryModal}
              />
            </Section>

            <Section title={t('professional_details')} delay={200}>
              <PickerButton
                label={t("select_specialization")}
                placeholder={t("select_specialization")}
                text={selectedSpecializations.length > 0 ? selectedSpecializations.map(spec => t(spec.nameKey)).join(", ") : null}
                onPress={() => {
                  openSpecializationModal();
                  if (fieldErrors.specialization) setFieldErrors(p => ({...p, specialization: null}));
                }}
                error={fieldErrors.specialization}
              />
              <PickerButton
                label={t("consultation_language")}
                placeholder={t("select_consultation_language")}
                text={selectedConsultationLanguages.length > 0
                  ? selectedConsultationLanguages.map(code => consultationLanguages.find(lang => lang.code === code)?.emoji + " " + t(consultationLanguages.find(lang => lang.code === code)?.name)).join(", ")
                  : null}
                onPress={openConsultationLanguageModal}
              />
              <PickerButton
                label={t("work_experience")}
                placeholder={t("select_experience_placeholder")}
                text={experienceYears !== null ? formatYearsText(experienceYears) : null}
                onPress={openExperienceYearsModal}
              />
               <PickerButton
                label={t("consultation_cost")}
                placeholder={t("select_consultation_cost_placeholder")}
                text={consultationCost ? `$${consultationCost}` : null}
                onPress={() => {
                  openCostModal();
                  if (fieldErrors.consultationCost) setFieldErrors(p => ({...p, consultationCost: null}));
                }}
                error={fieldErrors.consultationCost}
              />
            </Section>

            <Section title={t('additional_information')} delay={300}>
              <InputText
                label={t("work_location")}
                placeholder={t("work_location_placeholder")}
                value={workLocation}
                onChangeText={setWorkLocation}
              />
              <InputText
                label={t("achievements")}
                placeholder={t("achievements_placeholder")}
                value={achievements}
                onChangeText={setAchievements}
                multiline
                numberOfLines={4}
              />
              <InputText
                label={t("about_me_placeholder")}
                placeholder={t("about_me_placeholder")}
                value={aboutMe}
                onChangeText={setAboutMe}
                multiline
                numberOfLines={4}
              />
              <InputText
                label={t("search_tags")}
                placeholder={t("search_tags_placeholder")}
                value={searchTags}
                onChangeText={setSearchTags}
                multiline
                numberOfLines={3}
              />
            </Section>
            
            <Section title={t('documents')} delay={400}>
               <View style={styles.uploadContainer}>
                <Text style={styles.inputLabel}>{t("upload_diploma")}</Text>
                {diplomaUri && (
                  <TouchableOpacity onPress={() => openImageModal(diplomaUri)}>
                    <Image source={{ uri: diplomaUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDiplomaUri)}>
                <Text style={styles.uploadButtonText}>{diplomaUri ? t('change_file') : t('upload_diploma')}</Text>
              </TouchableOpacity>
              
               <View style={[styles.uploadContainer, { marginTop: 15 }]}>
                <Text style={styles.inputLabel}>{t("upload_certificate")}</Text>
                {certificateUri && (
                  <TouchableOpacity onPress={() => openImageModal(certificateUri)}>
                    <Image source={{ uri: certificateUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCertificateUri)}>
                <Text style={styles.uploadButtonText}>{certificateUri ? t('change_file') : t('upload_certificate')}</Text>
              </TouchableOpacity>
            </Section>

            <Section title={t('payment_information')} delay={500}>
              <View style={styles.labelWithIconContainer}>
                <Text style={styles.inputLabel}>{t("bank_details")}</Text>
                <TouchableOpacity onPress={() => setBankInfoModalVisible(true)} style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={24} color="#0EB3EB" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, fieldErrors.bankDetails && styles.inputError]}>
                <TextInput 
                  style={styles.input} 
                  placeholder={"UA" + "X".repeat(27)} 
                  placeholderTextColor="#B0BEC5"
                  value={bankDetails} 
                  onChangeText={(text) => {
                    setBankDetails(text);
                    if (fieldErrors.bankDetails) setFieldErrors(p => ({...p, bankDetails: null}));
                  }}
                  autoCapitalize="characters" 
                  multiline={false} 
                />
              </View>
              <AnimatePresence>
                {fieldErrors.bankDetails && 
                  <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
                    <Text style={styles.fieldErrorText}>{fieldErrors.bankDetails}</Text>
                  </MotiView>
                }
              </AnimatePresence>
            </Section>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 600 }}
              style={{width: '100%'}}
            >
              <View style={[styles.agreementContainer, fieldErrors.agreedToTerms && styles.inputError]}>
                <Switch 
                  trackColor={{ false: "#767577", true: "#0EB3EB" }} 
                  thumbColor={"#f4f3f4"} 
                  onValueChange={(value) => {
                    setAgreedToTerms(value);
                    if (fieldErrors.agreedToTerms) setFieldErrors(p => ({...p, agreedToTerms: null}));
                  }} 
                  value={agreedToTerms} 
                />
                <Text style={styles.privacyPolicyText}>{t("i_agree_to")}</Text>
                <Text style={styles.agreementText} onPress={() => navigation.navigate("PartnershipAgreementScreen")}> {t("terms_of_use")}</Text>
                
              </View>
              <AnimatePresence>
                {fieldErrors.agreedToTerms && 
                  <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
                    <Text style={[styles.fieldErrorText, {paddingHorizontal: 20}]}>{fieldErrors.agreedToTerms}</Text>
                  </MotiView>
                }
              </AnimatePresence>

              <AnimatePresence>
                {profileSaveError ? (
                  <MotiView from={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}}>
                    <Text style={styles.errorText}>{profileSaveError}</Text>
                  </MotiView>
                ) : null}
              </AnimatePresence>
              
              <TouchableOpacity 
                style={[styles.saveProfileButton, isSavingProfile && styles.saveProfileButtonDisabled]} 
                onPress={handleSaveProfile} 
                disabled={isSavingProfile}
              >
                <AnimatePresence exitBeforeEnter>
                  {isSavingProfile ? (
                    <MotiView key="loader" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                      <ActivityIndicator color="#fff" />
                    </MotiView>
                  ) : (
                    <MotiView key="text" from={{scale: 0.5}} animate={{scale: 1}} exit={{scale: 0.5}}>
                      <Text style={styles.saveProfileButtonText}>{t("save_profile")}</Text>
                    </MotiView>
                  )}
                </AnimatePresence>
              </TouchableOpacity>
            </MotiView>
            
            <View style={{marginTop: 30, gap: 10, width: '100%'}}>
              <TouchableOpacity style={styles.signOutButton} onPress={confirmSignOut}>
                <Ionicons name="log-out-outline" size={24} color="white" />
                <Text style={styles.signOutButtonText}>{t("signOut")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteProfileButton} 
                onPress={handleOpenDeleteModal}
              >
                <Text style={styles.deleteProfileButtonText}>{t("deleteProfile_title")}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      )}

      <Modal animationType="slide" transparent={true} visible={isCountryModalVisible} onRequestClose={closeCountryModal}>
        <TouchableWithoutFeedback onPress={closeCountryModal}>
          <View style={styles.centeredView}><View style={[styles.modalView, styles.modalBorder]}><ScrollView style={styles.modalScrollView}>{countries.map(item => (<Pressable key={item.code} style={[styles.countryItem, country?.code === item.code && styles.countryItemSelected]} onPress={() => selectCountry(item)}><Text style={styles.countryEmoji}>{item.emoji}</Text><Text style={[styles.countryName, country?.code === item.code && styles.countryItemTextSelected]}>{item.name}</Text></Pressable>))}</ScrollView><Pressable style={[styles.button, styles.buttonClose]} onPress={closeCountryModal}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isGeneralLanguageModalVisible} onRequestClose={closeGeneralLanguageModal}>
          <TouchableWithoutFeedback onPress={closeGeneralLanguageModal}>
            <View style={styles.centeredView}><View style={[styles.languageModalContent, styles.modalBorder]}><ScrollView>{generalAppLanguages.map(lang => (<Pressable key={lang.code} style={styles.languageOption} onPress={() => handleGeneralLanguageSelect(lang.code)}><Text style={[styles.languageOptionText, i18n.language === lang.code && styles.countryItemTextSelected]}>{t(lang.nameKey)}</Text></Pressable>))}</ScrollView><Pressable style={[styles.button, styles.buttonClose]} onPress={closeGeneralLanguageModal}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></View>
          </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isConsultationLanguageModalVisible} onRequestClose={closeConsultationLanguageModal}>
        <TouchableWithoutFeedback onPress={closeConsultationLanguageModal}><View style={styles.centeredView}><View style={[styles.languageModalContent, styles.modalBorder]}><ScrollView>{consultationLanguages.map(lang => (<Pressable key={lang.code} style={styles.languageOption} onPress={() => toggleConsultationLanguageSelect(lang.code)}><Text style={[styles.languageOptionText, selectedConsultationLanguages.includes(lang.code) && styles.countryItemTextSelected]}>{lang.emoji} {t(lang.name)}</Text></Pressable>))}</ScrollView><Pressable style={[styles.button, styles.buttonClose]} onPress={closeConsultationLanguageModal}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></View></TouchableWithoutFeedback>
      </Modal>
      
      <Modal animationType="slide" transparent={true} visible={isSpecializationModalVisible} onRequestClose={closeSpecializationModal}>
        <TouchableWithoutFeedback onPress={closeSpecializationModal}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, styles.modalBorder]}>
              <ScrollView>
                <Text style={styles.modalTitle}> {t("select_specialization")}</Text>
                {specializations.map(spec => (
                  <Pressable 
                    key={spec.value} 
                    style={[
                      styles.countryItem,
                      selectedSpecializations.some(s => s.value === spec.value) && styles.countryItemSelected,
                    ]} 
                    onPress={() => {
                      toggleSpecializationSelect(spec);
                      if (fieldErrors.specialization) setFieldErrors(p => ({...p, specialization: null}));
                    }}
                  >
                    <Text style={[
                      styles.countryName, 
                      selectedSpecializations.some(s => s.value === spec.value) && styles.countryItemTextSelected
                    ]}>
                       {t(spec.nameKey)}
                    </Text>
                    {selectedSpecializations.some(s => s.value === spec.value) && 
                      <Ionicons name="checkmark-circle" size={24} color="#0EB3EB" style={styles.checkmarkIcon} />}
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={[styles.button, styles.buttonClose]} onPress={closeSpecializationModal}>
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isExperienceYearsModalVisible} onRequestClose={closeExperienceYearsModal}>
        <TouchableWithoutFeedback onPress={closeExperienceYearsModal}><View style={styles.centeredView}><View style={[styles.modalContentYears, styles.modalBorder]}><ScrollView style={styles.pickerScrollView}>{experienceYearsOptions.map(year => (<Pressable key={year} style={[styles.pickerOption, experienceYears === year && styles.pickerOptionSelected]} onPress={() => selectExperienceYears(year)}><Text style={[styles.pickerOptionText, experienceYears === year && styles.countryItemTextSelected]}>{formatYearsText(year)}</Text></Pressable>))}</ScrollView><Pressable style={[styles.button, styles.buttonClose]} onPress={closeExperienceYearsModal}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></View></TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isCostModalVisible} onRequestClose={closeCostModal}>
        <TouchableWithoutFeedback onPress={closeCostModal}>
          <View style={styles.centeredView}>
            <View style={[styles.modalContentYears, styles.modalBorder]}>
              <ScrollView style={styles.pickerScrollView}>
                {consultationCostOptions.map(cost => (
                  <Pressable 
                    key={cost} 
                    style={[styles.pickerOption, String(consultationCost) === String(cost) && styles.pickerOptionSelected]} 
                    onPress={() => {
                      selectConsultationCost(cost);
                      if (fieldErrors.consultationCost) setFieldErrors(p => ({...p, consultationCost: null}));
                    }}
                  >
                    <Text style={[styles.pickerOptionText, String(consultationCost) === String(cost) && styles.countryItemTextSelected]}>
                      ${cost}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={[styles.button, styles.buttonClose]} onPress={closeCostModal}>
                <Text style={styles.textStyle}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={isBankInfoModalVisible} onRequestClose={() => setBankInfoModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setBankInfoModalVisible(false)}><View style={styles.centeredView}><TouchableWithoutFeedback><View style={[styles.modalView, styles.modalBorder]}><Text style={styles.modalTitle}>{t("paymentInfoTitle")}</Text><Text style={styles.infoModalText}>• {t("ibanInstruction")}</Text><Text style={styles.infoModalText}>• {t("commissionInfo")}</Text><Text style={styles.infoModalText}>• {t("paymentCondition")}</Text><Pressable style={[styles.button, styles.buttonClose, { marginTop: 20 }]} onPress={() => setBankInfoModalVisible(false)}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></TouchableWithoutFeedback></View></TouchableWithoutFeedback>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={isImageModalVisible} onRequestClose={closeImageModal}>
        <TouchableWithoutFeedback onPress={closeImageModal}><View style={styles.fullScreenImageModalOverlay}>{selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.fullScreenImage} resizeMode="contain" />}<TouchableOpacity style={styles.closeImageModalButton} onPress={closeImageModal}><Ionicons name="close-circle" size={40} color="white" /></TouchableOpacity></View></TouchableWithoutFeedback>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={isDeleteConfirmationModalVisible} onRequestClose={() => setIsDeleteConfirmationModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <TouchableWithoutFeedback onPress={() => setIsDeleteConfirmationModalVisible(false)}>
            <View style={styles.centeredView}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.modalView, styles.modalBorder, styles.deleteModalView]}>
                  <Text style={styles.modalTitle}>{t("deleteProfile_title")}</Text>
                  <Text style={styles.infoModalText}>{t("deleteProfile_message")}</Text>
                  
                  <View style={{width: '100%'}}>
                    <View style={[styles.inputContainer, styles.deleteInput, deleteErrors.email && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder={t("email")}
                        placeholderTextColor="#B0BEC5"
                        value={emailToDelete}
                        onChangeText={(text) => {
                          setEmailToDelete(text);
                          if (deleteErrors.email) setDeleteErrors(p => ({...p, email: null}));
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                    <AnimatePresence>
                      {deleteErrors.email && 
                        <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
                          <Text style={styles.fieldErrorText}>{deleteErrors.email}</Text>
                        </MotiView>
                      }
                    </AnimatePresence>
                  </View>

                  <View style={{width: '100%'}}>
                    <View style={[styles.inputContainer, styles.deleteInput, deleteErrors.password && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder={t("password")}
                        placeholderTextColor="#B0BEC5"
                        value={passwordToDelete}
                        onChangeText={(text) => {
                          setPasswordToDelete(text);
                          if (deleteErrors.password) setDeleteErrors(p => ({...p, password: null}));
                        }}
                        secureTextEntry
                      />
                    </View>
                    <AnimatePresence>
                      {deleteErrors.password && 
                        <MotiView from={{opacity: 0, translateY: -5}} animate={{opacity: 1, translateY: 0}}>
                          <Text style={styles.fieldErrorText}>{deleteErrors.password}</Text>
                        </MotiView>
                      }
                    </AnimatePresence>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton, { marginTop: 20 }]}
                    onPress={confirmAndDeleteProfile}
                    disabled={isDeletingProfile}
                  >
                    {isDeletingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.textStyle}>{t("confirm_delete")}</Text>}
                  </TouchableOpacity>
                  <Pressable
                    style={[styles.button, styles.buttonClose, { marginTop: 10 }]}
                    onPress={() => setIsDeleteConfirmationModalVisible(false)}
                  >
                    <Text style={styles.textStyle}>{t("cancel")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = getStyles();

export default Anketa_Settings;