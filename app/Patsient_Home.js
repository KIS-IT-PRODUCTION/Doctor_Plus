import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl, 
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../assets/icon.svg";
import People from "../assets/Main/people.svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider";
import TabBar from "../components/TopBar.js";

import { useTranslation } from "react-i18next";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Встановіть обробник для сповіщень, коли додаток активний
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width } = Dimensions.get("window");
const containerWidth = width * 0.9;

const allDoctorSpecializations = [
  { key: "traumatologist", nameKey: "categories.traumatologist" },
  { key: "pediatrician", nameKey: "categories.pediatrician" },
  { key: "gynecologist", nameKey: "categories.gynecologist" },
  { key: "ent", nameKey: "categories.ent" },
  { key: "surgeon", nameKey: "categories.surgeon" },
  { key: "cardiologist", nameKey: "categories.cardiologist" },
  { key: "dentist", nameKey: "categories.dentist" },
  { key: "dermatologist", nameKey: "categories.dermatologist" },
  { key: "ophthalmologist", nameKey: "categories.ophthalmologist" },
  { key: "neurologist", nameKey: "categories.neurologist" },
  { key: "endocrinologist", nameKey: "categories.endocrinologist" },
  { key: "gastroenterologist", nameKey: "categories.gastroenterologist" },
  { key: "urologist", nameKey: "categories.urologist" },
  { key: "pulmonologist", nameKey: "categories.pulmonologist" },
  { key: "nephrologist", nameKey: "categories.nephrologist" },
  { key: "rheumatologist", nameKey: "categories.rheumatologist" },
  { key: "oncologist", nameKey: "categories.oncologist" },
  { key: "allergist", nameKey: "categories.allergist" },
  {
    key: "infectiousDiseasesSpecialist",
    nameKey: "categories.infectiousDiseasesSpecialist",
  },
  { key: "psychiatrist", nameKey: "categories.psychiatrist" },
  { key: "psychologist", nameKey: "categories.psychologist" },
  { key: "physiotherapist", nameKey: "categories.physiotherapist" },
  { key: "nutritionist", nameKey: "categories.nutritionist" },
  { key: "radiologist", nameKey: "categories.radiologist" },
  { key: "anesthesiologist", nameKey: "categories.anesthesiologist" },
  { key: "general_practitioner", nameKey: "categories.general_practitioner" },
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

  // Додаємо стан для кількості непрочитаних повідомлень
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  // Додаємо стан для Pull-to-Refresh
  const [refreshing, setRefreshing] = useState(false);


  // Функція для отримання кількості непрочитаних повідомлень
  const fetchUnreadMessagesCount = useCallback(async () => {
    // Перевіряємо наявність сесії користувача перед виконанням запиту
    if (!session?.user) {
      console.log("No user session found, cannot fetch unread messages.");
      setUnreadMessagesCount(0); // Скидаємо лічильник, якщо немає користувача
      return;
    }

    try {
      // Виправлено назву таблиці з 'messages' на 'patient_notifications'
      // Видалено 'head: false', оскільки для count: 'exact' це не потрібно
      const { count, error } = await supabase
        .from('patient_notifications') // <--- ВИПРАВЛЕНО ТУТ!
        .select('*', { count: 'exact' }) // Запитуємо точну кількість
        .eq('patient_id', session.user.id) // Повідомлення для поточного пацієнта
        .eq('is_read', false); // Тільки непрочитані

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
  }, [session?.user]); // Залежить від зміни сесії користувача


  // Функція для реєстрації та збереження push-токену
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
        const expoProjectId = "e2619b61-6ef5-4958-90bc-a400bbc8c50a";
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
      Alert.alert(t("error"), t("push_notifications_only_on_physical_devices"));
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    console.log("DEBUG: Attempting to save token to Supabase.");
    console.log("DEBUG: Token to be saved:", token, "for userId:", userId);

    if (token && userId) {
      console.log(`DEBUG: Saving token '<span class="math-inline">\{token\}' for user\_id '</span>{userId}' to 'profiles' table.`);
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
      // Викликаємо функцію для отримання непрочитаних повідомлень лише якщо сесія є
      if (session?.user) {
        fetchUnreadMessagesCount();
      }
      return () => {
        // Опціонально, якщо потрібно щось очистити при втраті фокусу
      };
    }, [fetchUnreadMessagesCount, session?.user]) // Додаємо fetchUnreadMessagesCount та session?.user в залежності
  );

  useEffect(() => {
    setDisplayedLanguageCode(i18n.language.toUpperCase());
  }, [i18n.language]);

  // Виклик registerForPushNotificationsAsync та fetchUnreadMessagesCount при завантаженні та зміні сесії
  useEffect(() => {
    // Викликаємо ці функції лише якщо сесія завантажена і користувач авторизований
    if (!authLoading && session?.user) {
      console.log("Attempting to register for push notifications for user:", session.user.id);
      registerForPushNotificationsAsync(session.user.id);
      fetchUnreadMessagesCount(); // Завантажуємо лічильник при успішній автентифікації
    }
  }, [session, authLoading, registerForPushNotificationsAsync, fetchUnreadMessagesCount]);


  useEffect(() => {
    const updateDimensions = () => {
      // Logic for updating dimensions if needed
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

  const fetchAvailableSpecializations = useCallback(async () => {
    setLoadingSpecializations(true);
    setSpecializationsError(null);
    try {
      const { data, error } = await supabase
        .from("anketa_doctor")
        .select("specialization");

      if (error) {
        console.error("Error fetching doctor specializations:", error);
        setSpecializationsError(
          t("error_fetching_specializations") + ": " + error.message
        );
        setAvailableSpecializations([]);
        return;
      }

      const uniqueSpecs = new Set();
      data.forEach((doctor) => {
        if (doctor.specialization) {
          const currentSpecializations = Array.isArray(doctor.specialization)
            ? doctor.specialization
            : (() => {
                try {
                  return JSON.parse(doctor.specialization);
                } catch (e) {
                  console.warn(
                    "Warning: Invalid specialization format for doctor (expected array or parsable JSON string):",
                    doctor.user_id,
                    doctor.specialization,
                    e
                  );
                  return [];
                }
              })();

          currentSpecializations.forEach((spec) => {
            const matchingSpec = allDoctorSpecializations.find(
              (s) => s.key === spec
            );
            if (matchingSpec) {
              uniqueSpecs.add(matchingSpec);
            }
          });
        }
      });
      setAvailableSpecializations(Array.from(uniqueSpecs));
    } catch (err) {
      console.error("Unexpected error fetching specializations:", err);
      setSpecializationsError(
        t("unexpected_error_fetching_specializations") + ": " + err.message
      );
      setAvailableSpecializations([]);
    } finally {
      setLoadingSpecializations(false);
    }
  }, [t]); // Додаємо t в залежності, оскільки воно використовується всередині

  useEffect(() => {
    fetchAvailableSpecializations();
  }, [fetchAvailableSpecializations]); // Залежить від fetchAvailableSpecializations

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

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const openSpecializationModal = () => {
    setSpecializationModalVisible(true);
  };

  const closeSpecializationModal = () => {
    setSpecializationModalVisible(false);
  };

  const handleSpecializationSelect = (specializationKey) => {
    closeSpecializationModal();
    navigation.navigate("ChooseSpecial", { specialization: specializationKey });
  };

  const languagesForModal = [
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
  ];

  // Функція, яка викликається при "потягни, щоб оновити"
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Викликаємо функції, які потрібно оновити
    await fetchUnreadMessagesCount();
    await fetchAvailableSpecializations();
    // Додайте сюди інші функції, які ви хочете оновити
    setRefreshing(false);
  }, [fetchUnreadMessagesCount, fetchAvailableSpecializations]);


  return (
    <View style={styles.fullScreenContainer}>
      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={ // Додаємо RefreshControl
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0EB3EB"]} // Колір індикатора оновлення
              tintColor="#0EB3EB" // Колір індикатора оновлення для iOS
            />
          }
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon width={50} height={50} />
              </View>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={openLanguageModal}
              >
                <View style={styles.languageButtonContent}>
                  <Text style={styles.languageText}>
                    {displayedLanguageCode}
                  </Text>
                  <Ionicons name="globe-outline" size={16} color="white" />
                  
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate("PatientMessages")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
                {unreadMessagesCount > 0 && ( // Відображаємо бейдж тільки якщо є непрочитані
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationNumber}>{unreadMessagesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
              <TouchableOpacity
                style={styles.signOutButtonAboveSearch}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={24} color="white" />
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
                  size={20}
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
                    <Text style={styles.modalCloseButtonText} numberOfLines={1} adjustsFontSizeToFit>
                      {t("cancel")}
                    </Text>
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="#0EB3EB"
                      style={{ marginLeft: 5 }}
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
                        key={spec.key}
                        style={styles.specializationItem}
                        onPress={() => handleSpecializationSelect(spec.key)}
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
                            size={14}
                            color="white"
                            style={{ marginLeft: 5 }}
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
    paddingTop: Platform.OS === "ios" ? (StatusBar.currentHeight ? 5 : 10) : 0,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ? 5 : 10) : 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 90,
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
    height: 60,
    zIndex: 10,
  },
  logoContainer: {
    paddingLeft: 5,
  },
  languageButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minWidth: 70,
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    flexWrap: 'nowrap',
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginRight: 5,
  },
  notificationButton: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: "rgba(14, 179, 235, 0.69)",
    borderRadius: width * 0.06,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 10,
    backgroundColor: "#E04D53",
    borderRadius: 1000,
    width: 17,
    height: 17,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    width: containerWidth,
    paddingTop: 20,
    paddingBottom: 20,
    position: "relative",
  },
  specializationButton: {
    marginTop: 30,
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "90%",
    height: 52,
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 50,
  },
  specializationText: {
    fontSize: 18,
    fontFamily: "Mont-Bold",
    color: "white",
    textAlign: 'center',
    flexShrink: 1,
  },
  doctorsImageContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: "100%",
    marginBottom: 10,
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
    borderRadius: 555,
    paddingHorizontal: 15,
    width: width * 0.9,
    height: 52,
    marginTop: 80,
  },
  searchIcon: {
    marginRight: 10,
    color: "#BDBDBD",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingLeft: 0,
    borderWidth: 0,
    color: "#212121",
    fontFamily: "Mont-Regular",
  },

  signOutButtonAboveSearch: {
    position: "absolute",
    right: 0,
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
  },
  signOutButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Mont-Bold",
    marginLeft: 8,
  },

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
    borderColor: "#0EB3EB",
    borderWidth: 1,
    alignItems: "center",
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Mont-Bold",
    marginBottom: 20,
    color: "#0EB3EB",
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.3)",
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
    textAlign: 'center',
    flexWrap: 'wrap',
  },

  specializationModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    borderColor: "#0EB3EB",
    borderWidth: 1,
    padding: 20,
    width: width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.75,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  specializationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  specializationModalTitle: {
    fontSize: 22,
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
    flexWrap: 'wrap',
  },
  modalCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    marginLeft: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
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
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  specializationItemText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: "#333333",
    flex: 1,
    marginRight: 10,
    textAlign: 'left',
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  goToButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Mont-Bold",
    flexShrink: 1,
  },
  loadingSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingSpecializationsText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: "#000000",
    textAlign: 'center',
  },
  errorSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffebee",
    borderRadius: 10,
  },
  errorSpecializationsText: {
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: "#000000",
    textAlign: "center",
  },
  noSpecializationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noSpecializationsText: {
    fontSize: 16,
    fontFamily: "Mont-SemiBold",
    color: "#777777",
    textAlign: "center",
  },
});

export default Patsient_Home;