import "react-native-url-polyfill/auto";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  RefreshControl,
  Modal,
  Image,
  FlatList,
  Animated,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
import { useAuth } from "../providers/AuthProvider";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import SvgUri from 'react-native-svg';

import Icon from "../assets/icon.svg";
import Doctor from "../assets/Main/doctor.svg";
import TabBar from "../components/TopBar.js";

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const containerWidth = width * 0.9;
const TAB_BAR_HEIGHT = verticalScale(90);
const SEARCH_BAR_BOTTOM_OFFSET = verticalScale(40);

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
  { value: "ent_specialist", nameKey: "categories.ent_specialist" },
  { value: "gastroenterologist", nameKey: "gastroenterologist" },
  { value: "endocrinologist", nameKey: "endocrinologist" },
  { value: "oncologist", nameKey: "oncologist" },
  { value: "allergist", nameKey: "allergist" },
  { value: "physiotherapist", nameKey: "physiotherapist" },
  { value: "traumatologist", nameKey: "traumatologist" },
  { value: "gynecologist", nameKey: "gynecologist" },
  { value: "urologist", nameKey: "urologist" },
  { value: "pulmonologist", nameKey: "pulmonologist" },
  { value: "nephrologist", nameKey: "nephrologist" },
  { value: "rheumatologist", nameKey: "rheumatologist" },
  { value: "infectiousDiseasesSpecialist", nameKey: "infectiousDiseasesSpecialist" },
  { value: "psychologist", nameKey: "psychologist" },
  { value: "nutritionist", nameKey: "nutritionist" },
  { value: "radiologist", nameKey: "radiologist" },
  { value: "anesthesiologist", nameKey: "anesthesiologist" },
  { value: "oncologist_radiation", nameKey: "oncologist_radiation" },
  { value: "endoscopy_specialist", nameKey: "endoscopy_specialist" },
  { value: "ultrasound_specialist", nameKey: "ultrasound_specialist" },
  { value: "laboratory_diagnostician", nameKey: "laboratory_diagnostician" },
  { value: "immunologist", nameKey: "immunologist" },
  { value: "genetics_specialist", nameKey: "genetics_specialist" },
  { value: "geriatrician", nameKey: "geriatrician" },
  { value: "toxicologist", nameKey: "toxicologist" },
  { value: "forensic_expert", nameKey: "forensic_expert" },
  { value: "epidemiologist", nameKey: "epidemiologist" },
  { value: "pathologist", nameKey: "pathologist" },
  { value: "rehabilitologist", nameKey: "rehabilitologist" },
  { value: "manual_therapist", nameKey: "manual_therapist" },
  { value: "chiropractor", nameKey: "chiropractor" },
  { value: "reflexologist", nameKey: "reflexologist" },
  { value: "massage_therapist", nameKey: "massage_therapist" },
  { value: "dietitian", nameKey: "dietitian" },
  { value: "sexologist", nameKey: "sexologist" },
  { value: "phlebologist", nameKey: "phlebologist" },
  { value: "mammologist", nameKey: "mammologist" },
  { value: "proctologist", nameKey: "proctologist" },
  { value: "andrologist", nameKey: "andrologist" },
  { value: "reproductive_specialist", nameKey: "reproductive_specialist" },
  { value: "transfusiologist", nameKey: "transfusiologist" },
  { value: "balneologist", nameKey: "balneologist" },
  { value: "infectious_disease_specialist_pediatric", nameKey: "infectious_disease_specialist_pediatric" },
  { value: "pediatric_gastroenterologist", nameKey: "pediatric_gastroenterologist" },
  { value: "pediatric_cardiologist", nameKey: "pediatric_cardiologist" },
  { value: "pediatric_neurologist", nameKey: "pediatric_neurologist" },
  { value: "pediatric_surgeon", nameKey: "pediatric_surgeon" },
  { value: "neonatologist", nameKey: "neonatologist" },
  { value: "speech_therapist", nameKey: "speech_therapist" },
  { value: "ergotherapist", nameKey: "ergotherapist" },
  { value: "osteopath", nameKey: "osteopath" },
  { value: "homeopath", nameKey: "homeopath" },
  { value: "acupuncturist", nameKey: "acupuncturist" },
];

const Patsient_Home = () => {
  const navigation = useNavigation();
  const { session, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState("Home");
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setSpecializationModalVisible] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);
  const [specializationsError, setSpecializationsError] = useState(null);

  const [mainScreenImageUrl, setMainScreenImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(null);

  const [introMottoText, setIntroMottoText] = useState("");
  
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);
  const signOutAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUserLanguage = async () => {
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('language')
            .eq('user_id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          if (data?.language) await i18n.changeLanguage(data.language);
        } catch (err) {
          console.error("Failed to load user language:", err.message);
        }
      }
    };
    if (!authLoading) loadUserLanguage();
  }, [session, authLoading, i18n]);

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!session?.user) return;
    try {
      const { count, error } = await supabase
        .from('patient_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', session.user.id)
        .eq('is_read', false);
      if (error) throw error;
      setUnreadMessagesCount(count || 0);
    } catch (err) {
      console.error("Error fetching unread messages count:", err.message);
      setUnreadMessagesCount(0);
    }
  }, [session?.user]);
  
  const registerForPushNotificationsAsync = useCallback(async (userId) => {
    if (!userId || !Device.isDevice) return null;
    
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(t("error"), t("failed_to_get_push_token_permissions"));
      return null;
    }

    try {
      const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!expoProjectId) throw new Error("Expo project ID is missing.");
      const token = (await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId })).data;
      
      if (token) {
        await supabase.from('profiles').update({ notification_token: token }).eq('user_id', userId);
      }
      return token;
    } catch (e) {
      Alert.alert(t("error"), `${t("error_getting_push_token")}: ${e.message}`);
      return null;
    }
  }, [t]);

  const fetchMainScreenImage = useCallback(async () => {
    setImageLoading(true);
    setImageError(null);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_name', 'main_screen_image_url')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        setMainScreenImageUrl(data.setting_value);
      } else {
        setMainScreenImageUrl(null);
      }
    } catch (err) {
      console.error("Error fetching main screen image URL:", err.message);
      setImageError(t("failed_to_load_image"));
      setMainScreenImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  }, [t]);

  const fetchIntroMottoText = useCallback(async () => {
    try {
        const currentLang = i18n.language; 
        const settingName = `intro_motto_text_${currentLang}`; 

        const { data, error } = await supabase
            .from('app_settings')
            .select('setting_value')
            .eq('setting_name', settingName)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        setIntroMottoText(data?.setting_value || t("default_intro_motto_text"));
    } catch (err) {
        console.error("Error fetching intro motto text:", err.message);
        setIntroMottoText(t("default_intro_motto_text"));
    }
  }, [i18n.language, t]); 


  useFocusEffect(
    useCallback(() => {
      setActiveTab("Home");
      if (session?.user) fetchUnreadMessagesCount();
      fetchMainScreenImage();
      fetchIntroMottoText();
    }, [fetchUnreadMessagesCount, session?.user, fetchMainScreenImage, fetchIntroMottoText])
  );
  
  useEffect(() => {
    if (!authLoading && session?.user) {
      registerForPushNotificationsAsync(session.user.id);
      fetchUnreadMessagesCount();
    }
  }, [session, authLoading, registerForPushNotificationsAsync, fetchUnreadMessagesCount]);
  
  useEffect(() => {
    fetchIntroMottoText();
  }, [i18n.language, fetchIntroMottoText]);

  const fetchAvailableSpecializations = useCallback(async () => {
    setLoadingSpecializations(true);
    setSpecializationsError(null);
    try {
      setAvailableSpecializations(allDoctorSpecializations);
    } catch (err) {
      setSpecializationsError(t("unexpected_error_fetching_specializations"));
    } finally {
      setLoadingSpecializations(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAvailableSpecializations();
  }, [fetchAvailableSpecializations]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isSignOutVisible) toggleSignOutButton();
    await Promise.all([
      session?.user ? fetchUnreadMessagesCount() : Promise.resolve(),
      fetchAvailableSpecializations(),
      fetchMainScreenImage(),
      fetchIntroMottoText(),
    ]);
    setRefreshing(false);
  }, [session, isSignOutVisible, fetchUnreadMessagesCount, fetchAvailableSpecializations, fetchMainScreenImage, fetchIntroMottoText]);
  
  const toggleSignOutButton = () => {
    const toValue = isSignOutVisible ? 0 : 1;
    setIsSignOutVisible(!isSignOutVisible);
    Animated.timing(signOutAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const handleSignOut = () => {
    toggleSignOutButton();
    Alert.alert(
      t("logout_confirm_title"),
      t("logout_confirm_message"),
      [
        { text: t("no"), style: "cancel", onPress: () => setIsSignOutVisible(false) },
        {
          text: t("yes"),
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert(t("error_title"), error.message);
            else navigation.replace("HomeScreen");
          },
        },
      ],
      { cancelable: false }
    );
  };
  
  const openLanguageModal = () => setLanguageModalVisible(true);
  const closeLanguageModal = () => setLanguageModalVisible(false);
  
  const handleLanguageSelect = async (langCode) => {
    closeLanguageModal();
    await i18n.changeLanguage(langCode);
    if (session?.user) {
      await supabase.from('profiles').update({ language: langCode }).eq('user_id', session.user.id);
    }
  };
  
  const openSpecializationModal = () => setSpecializationModalVisible(true);
  const closeSpecializationModal = () => setSpecializationModalVisible(false);
  
  const handleSpecializationSelect = (specializationItem) => {
    closeSpecializationModal();
    navigation.navigate("ChooseSpecial", { specialization: specializationItem.value });
  };
  
  const languagesForModal = [
    { nameKey: "ukrainian", code: "uk" },
    { nameKey: "english", code: "en" },
  ];

  const signOutButtonAnimatedStyle = {
    opacity: signOutAnimation,
    transform: [{
      translateY: signOutAnimation.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
    }],
  };

  const renderSpecializationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specializationGridItem}
      onPress={() => handleSpecializationSelect(item)}
    >
      <Text style={styles.specializationGridText} numberOfLines={2}>
        {t(item.nameKey)}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeAreaContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0EB3EB"]} />}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            
            <View style={styles.header}>
              <View>
                <TouchableOpacity onPress={toggleSignOutButton} style={styles.logoTouchArea}>
                  <Icon width={moderateScale(50)} height={moderateScale(50)} />
                </TouchableOpacity>
                {isSignOutVisible && (
                  <Animated.View style={[styles.signOutContainer, signOutButtonAnimatedStyle]}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                      <Ionicons name="log-out-outline" size={moderateScale(22)} color="white" />
                      <Text style={styles.signOutButtonText}>{t("signOut")}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>

              <TouchableOpacity style={styles.languageButton} onPress={openLanguageModal}>
                <View style={styles.languageButtonContent}>
                  <Text style={styles.languageText}>{i18n.language.toUpperCase()}</Text>
          <Ionicons name="globe-outline" size={moderateScale(16)} color="#0EB3EB" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("PatientMessages")}>
                  <Ionicons name="mail-outline" size={moderateScale(24)} color="#0EB3EB" />
                {unreadMessagesCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationNumber}>{unreadMessagesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>{t("hello")}!</Text>
              <Text style={styles.welcomeSubtitle}>{t("how_are_you_feeling")}</Text>
            </View>
            
            <TouchableOpacity style={styles.ctaCard} onPress={openSpecializationModal} activeOpacity={0.8}>
              <Doctor width={moderateScale(40)} height={moderateScale(40)} color="#0EB3EB" />
              <Text style={styles.ctaText}>{t("chooseDoctorSpecialization")}</Text>
              <Ionicons name="chevron-forward" size={moderateScale(24)} color="#0EB3EB" />
            </TouchableOpacity>

            <View style={styles.doctorsImageContainer}>
              {imageLoading ? (
                <ActivityIndicator size="large" color="#0EB3EB" style={styles.imageLoader} />
              ) : imageError ? (
                <Text style={styles.imageErrorText}>{imageError}</Text>
              ) : mainScreenImageUrl ? (
                mainScreenImageUrl.endsWith('.svg') ? (
                  <SvgUri
                    width="100%"
                    height="100%"
                    source={{ uri: mainScreenImageUrl }}
                    style={styles.peopleImage}
                  />
                ) : (
                  <Image
                    source={{ uri: mainScreenImageUrl }}
                    style={styles.peopleImage}
                    resizeMode="cover"
                  />
                )
              ) : (
                <Text style={styles.imageErrorText}>{t("no_image_available")}</Text>
              )}
            </View>

            <Text style={styles.introMottoText}>
              {introMottoText}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigation.navigate("Search")}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={moderateScale(20)} color="#828282" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("search_placeholder")}
          placeholderTextColor="#828282"
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>

      <TabBar activeTab={activeTab} onTabPress={setActiveTab} i18n={i18n} />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isLanguageModalVisible}
        onRequestClose={closeLanguageModal}
      >
        <TouchableWithoutFeedback onPress={closeLanguageModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.languageModalContent}>
                <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
                {languagesForModal.map((item, index) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.languageOption, index === languagesForModal.length - 1 && styles.noBorder]}
                    onPress={() => handleLanguageSelect(item.code)}
                  >
                    <Text style={styles.languageOptionText}>{t(item.nameKey)}</Text>
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
            <TouchableWithoutFeedback>
              <View style={styles.specializationModalContent}>
                <View style={styles.specializationModalHeader}>
                  <Text style={styles.specializationModalTitle} numberOfLines={1} adjustsFontSizeToFit>
                    {t("selectSpecialization")}
                  </Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={closeSpecializationModal}>
                    <Ionicons name="close-circle" size={moderateScale(30)} color="#E0E0E0" />
                  </TouchableOpacity>
                </View>
                {loadingSpecializations ? (
                  <ActivityIndicator size="large" color="#0EB3EB" />
                ) : (
                  <FlatList
                    data={availableSpecializations}
                    renderItem={renderSpecializationItem}
                    keyExtractor={(item) => item.value}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.specializationGridContainer}
                  />
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
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: TAB_BAR_HEIGHT + SEARCH_BAR_BOTTOM_OFFSET + verticalScale(52 + 20),
  },
  container: {
    width: containerWidth,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: verticalScale(10),
    zIndex: 10,
  },
  logoTouchArea: {
    padding: moderateScale(5),
  },
  signOutContainer: {
    position: 'absolute',
    top: moderateScale(60),
    width: moderateScale(180),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    transform: [{ translateY: 5 , translateX: 15}],
    zIndex: 100,
  },
  signOutButton: {
    backgroundColor: "rgba(235, 87, 87, 0.95)",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontFamily: "Mont-Bold",
    marginLeft: scale(8),
  },
  languageButton: {
    paddingVertical: verticalScale(5),
    alignSelf: 'center',
    paddingHorizontal: scale(10),
    backgroundColor: "#F0F0F0",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    color: "#0EB3EB",
  },
  languageText: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-Bold",
    marginRight: scale(5),
    color: "#0EB3EB",
  },
  notificationButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: "#F0F0F0",
    borderRadius: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: verticalScale(5),
    right: scale(10),
    backgroundColor: "#E04D53",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    paddingHorizontal: moderateScale(5),
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  notificationNumber: {
    color: "white",
    fontSize: moderateScale(10),
    fontFamily: 'Mont-Bold',
  },
  welcomeHeader: {
    width: '100%',
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },
  welcomeTitle: {
    fontSize: moderateScale(32),
    fontFamily: "Mont-Bold",
    color: "#212121",
  },
  welcomeSubtitle: {
    fontSize: moderateScale(18),
    fontFamily: "Mont-Regular",
    color: "#616161",
    marginTop: verticalScale(4),
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: moderateScale(20),
    borderRadius: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  ctaText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: "Mont-SemiBold",
    color: "#212121",
    marginLeft: scale(15),
  },
  doctorsImageContainer: {
    marginTop: verticalScale(25),
    width: "100%",
    aspectRatio: 16 / 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: moderateScale(20),
    backgroundColor: "#E0E0E0",
  },
  peopleImage: {
    width: "100%",
    height: "100%",
  },
  imageLoader: {},
  imageErrorText: {
    fontSize: moderateScale(16),
    color: '#616161',
    textAlign: 'center',
    fontFamily: 'Mont-Regular',
  },
  introMottoText: {
    fontSize: moderateScale(17),
    fontFamily: "Mont-Medium",
    color: "#424242",
    textAlign: "center",
    marginHorizontal: scale(10),
    marginTop: verticalScale(25),
    marginBottom: verticalScale(30),
    lineHeight: verticalScale(26),
  },
  searchContainer: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + SEARCH_BAR_BOTTOM_OFFSET,
    left: '50%',
    transform: [{ translateX: -(width * 0.9) / 2 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(30),
    paddingHorizontal: scale(20),
    width: width * 0.9,
    height: verticalScale(52),
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: "#212121",
    fontFamily: "Mont-Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  languageModalContent: {
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    width: width * 0.8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontFamily: "Mont-Bold",
    marginVertical: verticalScale(15),
    color: "#333",
  },
  languageOption: {
    paddingVertical: verticalScale(15),
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  languageOptionText: {
    fontSize: moderateScale(18),
    fontFamily: "Mont-Regular",
    color: "#333333",
  },
  specializationModalContent: {
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    padding: moderateScale(15),
    width: width * 0.9,
    maxHeight: height * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  specializationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: verticalScale(15),
  },
  specializationModalTitle: {
    fontSize: moderateScale(20),
    fontFamily: "Mont-Bold",
    color: "#333",
    flex: 1,
    textAlign: 'left',
    marginLeft: moderateScale(10),
  },
  modalCloseButton: {
    padding: moderateScale(5),
  },
  specializationGridContainer: {
    paddingBottom: verticalScale(20),
  },
  specializationGridItem: {
    flex: 1,
    margin: moderateScale(5),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: verticalScale(80),
  },
  specializationGridText: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
    color: "#424242",
    textAlign: 'center',
  },
});

export default Patsient_Home;