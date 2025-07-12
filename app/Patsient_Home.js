import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  RefreshControl,
  StatusBar // Імпортуємо StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider";
import * as Notifications from 'expo-notifications'; // Для push-сповіщень
import * as Device from 'expo-device'; // Для push-сповіщень

// Ваші SVG компоненти
import Icon from "../assets/icon.svg";
import People from "../assets/Main/people.svg";
// Компонент TabBar, який ви не надали, але він використовується
// Припускаємо, що він імпортується з окремого файлу
import TabBar from "../components/TopBar.js"; // Замініть на правильний шлях, якщо він інший


// Отримання розмірів екрану
const { width, height } = Dimensions.get("window");

// Функції для масштабування розмірів
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Визначаємо containerWidth для адаптивності
const containerWidth = width * 0.9;

// --- ОНОВЛЕНИЙ МАСИВ ВСІХ СПЕЦІАЛІЗАЦІЙ ---
// Тепер nameKey для всіх спеціалізацій має префікс "categories."
// Це забезпечить коректне звернення до перекладів у файлах локалізації
const allDoctorSpecializations = [
  { value: "general_practitioner", nameKey: "general_practitioner" },
  { value: "pediatrician", nameKey: "pediatrician" },
  { value: "cardiologist", nameKey: "cardiologist" },
  { value: "dermatologist", nameKey: "dermatologist" },
  { value: "neurologist", nameKey: "neurologist" },
  { value: "surgeon", nameKey: "surgeon" },
  { value: "psychiatrist", nameKey: "psychiatrist" },
  { value: "dentist", nameKey: "dentist" },
  { value: "ophthalmologist", nameKey: "ophthalmologist" },
  { value: "ent_specialist", nameKey: "categories.ent_specialist" }, // Зберігаємо оригінальний формат nameKey
  { value: "gastroenterologist", nameKey: "gastroenterologist" },
  { value: "endocrinologist", nameKey: "endocrinologist" },
  { value: "oncologist", nameKey: "oncologist" },
  { value: "allergist", nameKey: "allergist" },
  { value: "physiotherapist", nameKey: "physiotherapist" },
  { value: "traumatologist", nameKey: "traumatologist" }, // Додано
  { value: "gynecologist", nameKey: "gynecologist" },       // Додано
  { value: "urologist", nameKey: "urologist" },             // Додано
  { value: "pulmonologist", nameKey: "pulmonologist" },     // Додано
  { value: "nephrologist", nameKey: "nephrologist" },       // Додано
  { value: "rheumatologist", nameKey: "rheumatologist" },   // Додано
  { value: "infectiousDiseasesSpecialist", nameKey: "infectiousDiseasesSpecialist" }, // Додано
  { value: "psychologist", nameKey: "psychologist" },       // Додано
  { value: "nutritionist", nameKey: "nutritionist" },       // Додано
  { value: "radiologist", nameKey: "radiologist" },         // Додано
  { value: "anesthesiologist", nameKey: "anesthesiologist" }, // Додано
  { value: "oncologist_radiation", nameKey: "oncologist_radiation" }, // Додано
  { value: "endoscopy_specialist", nameKey: "endoscopy_specialist" }, // Додано
  { value: "ultrasound_specialist", nameKey: "ultrasound_specialist" }, // Додано
  { value: "laboratory_diagnostician", nameKey: "laboratory_diagnostician" }, // Додано
  { value: "immunologist", nameKey: "immunologist" }, // Додано
  { value: "genetics_specialist", nameKey: "genetics_specialist" }, // Додано
  { value: "geriatrician", nameKey: "geriatrician" }, // Додано
  { value: "toxicologist", nameKey: "toxicologist" }, // Додано
  { value: "forensic_expert", nameKey: "forensic_expert" }, // Додано
  { value: "epidemiologist", nameKey: "epidemiologist" }, // Додано
  { value: "pathologist", nameKey: "pathologist" }, // Додано
  { value: "rehabilitologist", nameKey: "rehabilitologist" }, // Додано
  { value: "manual_therapist", nameKey: "manual_therapist" }, // Додано
  { value: "chiropractor", nameKey: "chiropractor" }, // Додано
  { value: "reflexologist", nameKey: "reflexologist" }, // Додано
  { value: "massage_therapist", nameKey: "massage_therapist" }, // Додано
  { value: "dietitian", nameKey: "dietitian" }, // Додано
  { value: "sexologist", nameKey: "sexologist" }, // Додано
  { value: "phlebologist", nameKey: "phlebologist" }, // Додано
  { value: "mammologist", nameKey: "mammologist" }, // Додано
  { value: "proctologist", nameKey: "proctologist" }, // Додано
  { value: "andrologist", nameKey: "andrologist" }, // Додано
  { value: "reproductive_specialist", nameKey: "reproductive_specialist" }, // Додано
  { value: "transfusiologist", nameKey: "transfusiologist" }, // Додано
  { value: "balneologist", nameKey: "balneologist" }, // Додано
  { value: "infectious_disease_specialist_pediatric", nameKey: "infectious_disease_specialist_pediatric" }, // Додано
  { value: "pediatric_gastroenterologist", nameKey: "pediatric_gastroenterologist" }, // Додано
  { value: "pediatric_cardiologist", nameKey: "pediatric_cardiologist" }, // Додано
  { value: "pediatric_neurologist", nameKey: "pediatric_neurologist" }, // Додано
  { value: "pediatric_surgeon", nameKey: "pediatric_surgeon" }, // Додано
  { value: "neonatologist", nameKey: "neonatologist" }, // Додано
  { value: "speech_therapist", nameKey: "speech_therapist" }, // Додано
  { value: "ergotherapist", nameKey: "ergotherapist" }, // Додано
  { value: "osteopath", nameKey: "osteopath" }, // Додано
  { value: "homeopath", nameKey: "homeopath" }, // Додано
  { value: "acupuncturist", nameKey: "acupuncturist" }, // Додано
];
const Patsient_Home = () => {
  const navigation = useNavigation();
  const { session, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();

  const [personalInfoText, setPersonalInfoText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setSpecializationModalVisible] =
    useState(false);
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(
    i18n.language.toUpperCase()
  );

  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);
  const [specializationsError, setSpecializationsError] = useState(null);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);


  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!session?.user) {
      console.log("No user session found, cannot fetch unread messages.");
      setUnreadMessagesCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('patient_notifications')
        .select('*', { count: 'exact' })
        .eq('patient_id', session.user.id)
        .eq('is_read', false);

      if (error) {
        console.error("Error fetching unread messages count:", error.message);
        setUnreadMessagesCount(0);
      } else {
        setUnreadMessagesCount(count);
        console.log("Unread messages count fetched:", count);
      }
    } catch (err) {
      console.error("Unexpected error fetching unread messages count:", err);
      setUnreadMessagesCount(0);
    }
  }, [session?.user]);


  const registerForPushNotificationsAsync = useCallback(async (userId) => {
    console.log("--- START registerForPushNotificationsAsync ---");
    console.log("Input userId:", userId);
    let token = null;

    if (!userId) {
      console.error("DEBUG: userId is null or undefined at the start of registerForPushNotificationsAsync. Aborting.");
      Alert.alert(t("error"), t("user_id_not_available_for_notifications"));
      return null;
    }

    if (Platform.OS === "android") {
      try {
        console.log("DEBUG: Setting up notification channel for Android...");
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
        console.log("DEBUG: Android notification channel set successfully.");
      } catch (e) {
        console.error("DEBUG ERROR: Failed to set notification channel for Android:", e);
      }
    }

    if (Device.isDevice) {
      console.log("DEBUG: Running on a physical device. Proceeding with permissions check.");
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log("DEBUG: Existing notification permissions status:", existingStatus);

      if (existingStatus !== "granted") {
        console.log("DEBUG: Permissions not granted yet. Requesting permissions...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("DEBUG: New permission request status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        console.error("DEBUG ERROR: Final notification permissions status is NOT granted:", finalStatus);
        Alert.alert(
          t("error"),
          t("failed_to_get_push_token_permissions")
        );
        console.error("Failed to get push token for push notification: Permissions not granted!");
        return null;
      }
      console.log("DEBUG: Notification permissions GRANTED. Attempting to get Expo Push Token.");

      try {
        const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!expoProjectId) {
            console.error("DEBUG ERROR: Expo Project ID is not defined in app.json extra.eas.projectId.");
            Alert.alert(t("error"), t("expo_project_id_missing"));
            return null;
        }
        console.log("DEBUG: Using Expo Project ID for token generation:", expoProjectId);
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: expoProjectId,
          })
        ).data;
        console.log("SUCCESS: Expo Push Token obtained:", token);
        if (!token) {
          console.warn("DEBUG WARNING: Expo Push Token is UNDEFINED or NULL after getExpoPushTokenAsync.");
        }
      } catch (e) {
        let errorMessage = 'Unknown error';
        if (e instanceof Error) {
          errorMessage = e.message;
        } else if (typeof e === 'string') {
          errorMessage = e;
        } else if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
          errorMessage = e.message;
        }
        console.error("DEBUG ERROR: Error getting Expo push token. Details:", e, "Message:", errorMessage);
        Alert.alert(t("error"), `${t("error_getting_push_token")}: ${errorMessage}. ${t("check_connection")}`);
        return null;
      }
    } else {
      console.log("DEBUG: Not a physical device. Skipping push notification registration.");
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    console.log("DEBUG: Attempting to save token to Supabase.");
    console.log("DEBUG: Token to be saved:", token, "for userId:", userId);

    if (token && userId) {
      console.log(`DEBUG: Saving token '${token}' for user_id '${userId}' to 'profiles' table.`);
      const { data: updateData, error } = await supabase
        .from('profiles')
        .update({ notification_token: token })
        .eq('user_id', userId);

      if (error) {
        console.error("DEBUG ERROR: Помилка збереження push-токену в Supabase:", error.message, "Details:", error);
        Alert.alert(t('error'), `${t('failed_to_save_notification_token')}: ${error.message}`);
      } else {
        console.log("SUCCESS: Expo Push Token збережено в Supabase для користувача:", userId);
        console.log("DEBUG: Supabase update data:", updateData);
      }
    } else {
      console.warn("DEBUG WARNING: Відсутній токен або ID користувача, push-токен не збережено. Token:", token, "UserId:", userId);
    }
    console.log("--- END registerForPushNotificationsAsync ---");
    return token;
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Home");
      if (session?.user) {
        fetchUnreadMessagesCount();
      }
      return () => {};
    }, [fetchUnreadMessagesCount, session?.user])
  );

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  useEffect(() => {
    if (!authLoading && session?.user) {
      console.log("Attempting to register for push notifications for user:", session.user.id);
      registerForPushNotificationsAsync(session.user.id);
      fetchUnreadMessagesCount();
    }
  }, [session, authLoading, registerForPushNotificationsAsync, fetchUnreadMessagesCount]);


  useEffect(() => {
    const updateDimensions = () => {};
    updateDimensions();
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Оновлена функція fetchAvailableSpecializations
  const fetchAvailableSpecializations = useCallback(async () => {
    setLoadingSpecializations(true);
    setSpecializationsError(null);
    try {
      // Замість запиту до Supabase, просто використовуємо весь локальний масив
      setAvailableSpecializations(allDoctorSpecializations);
    } catch (err) {
      console.error("Unexpected error fetching specializations:", err);
      setSpecializationsError(
        t("unexpected_error_fetching_specializations") + ": " + err.message
      );
      setAvailableSpecializations([]);
    } finally {
      setLoadingSpecializations(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAvailableSpecializations();
  }, [fetchAvailableSpecializations]);

  const handleSaveInfo = async () => {
    if (!personalInfoText.trim()) {
      Alert.alert(t("error_title"), t("pleaseEnterText"));
      return;
    }

    if (authLoading) {
      Alert.alert(t("loadingUserData"));
      return;
    }

    if (!session?.user) {
      Alert.alert(t("error_title"), t("notAuthorized"));
      navigation.navigate("LoginScreen");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("user_notes").insert([
        {
          user_id: session.user.id,
          note_text: personalInfoText.trim(),
        },
      ]);

      if (error) {
        console.error("Error saving information:", error);
        Alert.alert(t("error_title"), t("saveError", { error: error.message }));
      } else {
        Alert.alert(t("saveSuccessTitle"), t("saveSuccessMessage"));
        setPersonalInfoText("");
      }
    } catch (err) {
      console.error("General error saving information:", err);
      Alert.alert(t("error_title"), t("unknownError"));
    } finally {
      setIsSaving(false);
    }
  };

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
              console.error("Error signing out:", error.message);
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

  const openLanguageModal = () => {
    setLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setLanguageModalVisible(false);
  };

  const handleLanguageSelect = async (langCode) => {
    i18n.changeLanguage(langCode);
    setDisplayedLanguageCode(langCode.toUpperCase());
    closeLanguageModal();

    if (session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language: langCode })
          .eq('user_id', session.user.id);

        if (error) {
          console.error("Error updating user language in Supabase:", error.message);
          Alert.alert(t("error_title"), t("failed_to_save_language", { error: error.message }));
        } else {
          console.log(`User ${session.user.id} language updated to: ${langCode}`);
        }
      } catch (err) {
        console.error("Unexpected error updating user language:", err);
        Alert.alert(t("error_title"), t("unknown_error_saving_language"));
      }
    } else {
      console.warn("No active session, skipping language save to Supabase.");
    }
  };

  const openSpecializationModal = () => {
    setSpecializationModalVisible(true);
  };

  const closeSpecializationModal = () => {
    setSpecializationModalVisible(false);
  };

  // Оновлена функція handleSpecializationSelect
  const handleSpecializationSelect = (specializationItem) => {
    // Додаємо лог для перевірки, що саме приходить:
    console.log("Selected Specialization Item:", specializationItem);

    // Перевіряємо, чи об'єкт specializationItem існує і має властивість 'value'
    if (specializationItem && specializationItem.value) {
      closeSpecializationModal();
      // Передаємо specializationItem.value, як і очікує ChooseSpecial
      navigation.navigate("ChooseSpecial", { specialization: specializationItem.value });
    } else {
      console.error("Error: Selected specialization item is undefined or missing 'value'.", specializationItem);
      Alert.alert(t("error_title"), t("specialization_selection_error"));
    }
  };

  const languagesForModal = [
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUnreadMessagesCount();
    await fetchAvailableSpecializations();
    setRefreshing(false);
  }, [fetchUnreadMessagesCount, fetchAvailableSpecializations]);

  return (
    <View style={styles.fullScreenContainer}>
      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0EB3EB"]}
              tintColor="#0EB3EB"
            />
          }
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon width={moderateScale(50)} height={moderateScale(50)} />
              </View>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={openLanguageModal}
              >
                <View style={styles.languageButtonContent}>
                  <Text style={styles.languageText}>
                    {displayedLanguageCode}
                  </Text>
                  <Ionicons name="globe-outline" size={moderateScale(16)} color="white" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate("PatientMessages")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={moderateScale(24)}
                  color="white"
                />
                {unreadMessagesCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationNumber}>{unreadMessagesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={moderateScale(24)} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.specializationButton}
                onPress={openSpecializationModal}
              >
                <Text style={styles.specializationText} numberOfLines={1} adjustsFontSizeToFit>
                  {t("chooseDoctorSpecialization")}
                </Text>
              </TouchableOpacity>

              <View style={styles.doctorsImageContainer}>
                <People style={styles.peopleImage} />
              </View>

              <TouchableOpacity
                style={styles.searchContainer}
                onPress={() => navigation.navigate("Search")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="search"
                  size={moderateScale(20)}
                  color="#BDBDBD"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("search_placeholder")}
                  placeholderTextColor="#BDBDBD"
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <TabBar activeTab={activeTab} onTabPress={setActiveTab} i18n={i18n} />

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
                // Keep empty to prevent closing modal when pressing inside
              }}
            >
              <View style={styles.languageModalContent}>
                <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
                {languagesForModal.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.languageOption,
                      {
                        borderBottomWidth: item.code === "en" ? 0 : 1,
                      },
                    ]}
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
        visible={isSpecializationModalVisible}
        onRequestClose={closeSpecializationModal}
      >
        <TouchableWithoutFeedback onPress={closeSpecializationModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                // Keep empty to prevent closing modal
              }}
            >
              <View style={styles.specializationModalContent}>
                <View style={styles.specializationModalHeader}>
                  <Text style={styles.specializationModalTitle} numberOfLines={1} adjustsFontSizeToFit>
                    {t("selectSpecialization")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeSpecializationModal}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={moderateScale(28)}
                      color="#0EB3EB"
                      style={{ marginLeft: moderateScale(5) }}
                    />
                  </TouchableOpacity>
                </View>
                {loadingSpecializations ? (
                  <View style={styles.loadingSpecializationsContainer}>
                    <ActivityIndicator size="large" color="#0EB3EB" />
                    <Text style={styles.loadingSpecializationsText}>
                      {t("loading_specializations")}
                    </Text>
                  </View>
                ) : specializationsError ? (
                  <View style={styles.errorSpecializationsContainer}>
                    <Text style={styles.errorSpecializationsText}>
                      {specializationsError}
                    </Text>
                  </View>
                ) : availableSpecializations.length > 0 ? (
                  <ScrollView
                    style={styles.specializationScrollView}
                    contentContainerStyle={
                      styles.specializationScrollViewContent
                    }
                  >
                    {availableSpecializations.map((spec) => (
                      <TouchableOpacity
                        key={spec.value} 
                        style={styles.specializationItem}
                        onPress={() => handleSpecializationSelect(spec)} 
                      >
                        <Text
                          style={styles.specializationItemText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {t(spec.nameKey)}
                        </Text>
                        <View style={styles.goToButton}>
                          <Text style={styles.goToButtonText}>
                            {t("goTo")}
                          </Text>
                          <Ionicons
                            name="play"
                            size={moderateScale(14)}
                            color="white"
                            style={{ marginLeft: moderateScale(5) }}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noSpecializationsContainer}>
                    <Text style={styles.noSpecializationsText}>
                      {t("no_specializations_found")}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: verticalScale(90),
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: containerWidth,
    height: verticalScale(60),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(5),
    zIndex: 10,
  },
  logoContainer: {
    paddingLeft: scale(5),
  },
  languageButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minWidth: scale(70),
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(5),
    flexWrap: 'nowrap',
  },
  languageText: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-Bold",
    color: "white",
    marginRight: scale(5),
  },
  notificationButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: "rgba(14, 179, 235, 0.69)",
    borderRadius: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: verticalScale(5),
    right: scale(10),
    backgroundColor: "#E04D53",
    borderRadius: moderateScale(1000),
    width: moderateScale(17),
    height: moderateScale(17),
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: moderateScale(10),
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    width: containerWidth,
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    position: "relative",
  },
  signOutButton: {
    position: "absolute",
    top: verticalScale(0),
    right: scale(0),
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: moderateScale(30),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    elevation: 5,
    zIndex: 100,
  },
  signOutButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontFamily: "Mont-Bold",
    marginLeft: scale(8),
  },
  specializationButton: {
    marginTop: verticalScale(30),
    backgroundColor: "#0EB3EB",
    borderRadius: moderateScale(555),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    width: "90%",
    height: verticalScale(52),
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: verticalScale(50),
  },
  specializationText: {
    fontSize: moderateScale(18), // Збільшено, як і раніше
    fontFamily: "Mont-Bold",
    color: "white",
    textAlign: 'center',
    flexShrink: 1,
  },
  doctorsImageContainer: {
    marginTop: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(300),
    width: "100%",
    marginBottom: verticalScale(10),
  },
  peopleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(555),
    paddingHorizontal: scale(15),
    width: width * 0.9,
    height: verticalScale(52),
    marginTop: verticalScale(80),
  },
  searchIcon: {
    marginRight: scale(10),
    color: "#BDBDBD",
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    paddingVertical: verticalScale(10),
    paddingLeft: 0,
    borderWidth: 0,
    color: "#212121",
    fontFamily: "Mont-Regular",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    borderColor: "#0EB3EB",
    borderWidth: 1,
    alignItems: "center",
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontFamily: "Mont-Bold",
    marginBottom: verticalScale(20),
    color: "#0EB3EB",
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  languageOption: {
    paddingVertical: verticalScale(15),
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.3)",
  },
  languageOptionText: {
    fontSize: moderateScale(18),
    fontFamily: "Mont-Regular",
    color: "#333333",
    textAlign: 'center',
    flexWrap: 'wrap',
  },

  specializationModalContent: {
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    borderColor: "#0EB3EB",
    borderWidth: 1,
    padding: moderateScale(20),
    width: width * 0.9,
    maxHeight: height * 0.75,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  specializationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(20),
    width: "100%",
  },
  // Оновлений стиль для заголовка модального вікна спеціалізацій
  specializationModalTitle: {
    fontSize: moderateScale(18), // Зменшено базовий розмір для кращого вмісту
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
    textAlign: "center",
    marginHorizontal: scale(10),
  },
  modalCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(5),
    marginLeft: scale(10),
  },
  modalCloseButtonText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Regular",
    color: "#0EB3EB",
    flexShrink: 1,
  },
  specializationScrollView: {
    width: "100%",
  },
  specializationScrollViewContent: {
    flexGrow: 1,
  },
  specializationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(1.41),
    elevation: 2,
  },
  specializationItemText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Medium",
    color: "#333333",
    flex: 1,
    marginRight: scale(5),
    textAlign: 'left',
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: moderateScale(555),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: scale(80),
  },
  goToButtonText: {
    color: "white",
    fontSize: moderateScale(14),
    fontFamily: "Mont-Bold",
    flexShrink: 1,
  },
  loadingSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  loadingSpecializationsText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    fontFamily: "Mont-Regular",
    color: "#000000",
    textAlign: 'center',
  },
  errorSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
    backgroundColor: "#ffebee",
    borderRadius: moderateScale(10),
  },
  errorSpecializationsText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Regular",
    color: "#000000",
    textAlign: "center",
  },
  noSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  noSpecializationsText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-SemiBold",
    color: "#777777",
    textAlign: "center",
  },
});

export default Patsient_Home;