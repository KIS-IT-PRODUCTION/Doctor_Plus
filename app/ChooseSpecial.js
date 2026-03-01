import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const specializationsList = [
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
const COUNTRY_FLAGS_MAP = {
  "EN": "🇬🇧", "UK": "🇺🇦", "DE": "🇩🇪", "PH": "🇵🇭", "HR": "🇭🇷", "CF": "🇨🇫", "TD": "🇹🇩", "CZ": "🇨🇿", "CL": "🇨🇱", "ME": "🇲🇪", "LK": "🇱🇰", "JM": "🇯🇲", "UA": "🇺🇦", "GB": "🇬🇧", "US": "🇺🇸", "CA": "🇨🇦", "FR": "🇫🇷", "PL": "🇵🇱", "IT": "🇮🇹", "ES": "🇪🇸", "JP": "🇯🇵", "CN": "🇨🇳", "IN": "🇮🇳", "AU": "🇦🇺", "BR": "🇧🇷", "TR": "🇹🇷", "SE": "🇸🇪", "CH": "🇨🇭", "NL": "🇳🇱", "NO": "🇳🇴", "DK": "🇩🇰", "FI": "🇫🇮", "ZA": "🇿🇦", "MX": "🇲🇽", "KR": "🇰🇷", "AR": "🇦🇷", "IE": "🇮🇪", "NZ": "🇳🇿", "SG": "🇸🇬", "IL": "🇮🇱", "MY": "🇲🇾", "TH": "🇹🇭", "VN": "🇻🇳", "ID": "🇮🇩", "EG": "🇪🇬", "NG": "🇳🇬", "SA": "🇸🇦", "AE": "🇦🇪", "KW": "🇰🇼", "QA": "🇶🇦", "AT": "🇦🇹", "AZ": "🇦🇿", "AL": "🇦🇱", "DZ": "🇩🇿", "AO": "🇦🇴", "AD": "🇦🇩", "AG": "🇦🇬", "AF": "🇦🇫", "BS": "🇧🇸", "BD": "🇧🇩", "BB": "🇧🇧", "BH": "🇧🇭", "BZ": "🇧🇿", "BE": "🇧🇪", "BJ": "🇧🇯", "BY": "🇧🇾", "BG": "🇧🇬", "BO": "🇧🇴", "BA": "🇧🇦", "BW": "🇧🇼", "BN": "🇧🇳", "BF": "🇧🇫", "BI": "🇧🇮", "BT": "🇧🇹", "VU": "🇻🇺", "VE": "🇻🇪", "AM": "🇦🇲", "GA": "🇬🇦", "HT": "🇭🇹", "GM": "🇬🇲", "GH": "🇬🇭", "GY": "🇬🇾", "GT": "🇬🇹", "GN": "🇬🇳", "GW": "🇬🇼", "HN": "🇭🇳", "GD": "🇬🇩", "GR": "🇬🇷", "GE": "🇬🇪", "DJ": "🇩🇯", "DM": "🇩🇲", "DO": "🇩🇴", "CD": "🇨🇩", "EC": "🇪🇨", "GQ": "🇬🇶", "ER": "🇪🇷", "SZ": "🇸🇿", "EE": "🇪🇪", "ET": "🇪🇹", "YE": "🇾🇪", "ZM": "🇿🇲", "ZW": "🇿🇼", "IR": "🇮🇷", "IS": "🇮🇸", "IQ": "🇮🇶", "JO": "🇯🇴", "CV": "🇨🇻", "KZ": "🇰🇿", "KH": "🇰🇭", "CM": "🇨🇲", "KE": "🇰🇪", "KG": "🇰🇬", "CY": "🇨🇾", "KI": "🇰🇮", "CO": "🇨🇴", "KM": "🇰🇲", "CR": "🇨🇷", "CI": "🇨🇮", "CU": "🇨🇺", "LA": "🇱🇦", "LV": "🇱🇻", "LS": "🇱🇸", "LT": "🇱🇹", "LR": "🇱🇷", "LB": "🇱🇧", "LY": "🇱🇾", "LI": "🇱🇮", "LU": "🇱🇺", "MM": "🇲🇲", "MU": "🇲🇺", "MR": "🇲🇷", "MG": "🇲🇬", "MW": "🇲🇼", "ML": "🇲🇱", "MV": "🇲🇻", "MT": "🇲🇹", "MA": "🇲🇦", "MH": "🇲🇭", "MZ": "🇲🇿", "MD": "🇲🇩", "MC": "🇲🇨", "MN": "🇲🇳", "NA": "🇳🇦", "NR": "🇳🇷", "NP": "🇳🇵", "NE": "🇳🇪", "NI": "🇳🇮", "OM": "🇴🇲", "PK": "🇵🇰", "PW": "🇵🇼", "PA": "🇵🇦", "PG": "🇵🇬", "PY": "🇵🇾", "PE": "🇵🇪", "SS": "🇸🇸", "KP": "🇰🇵", "MK": "🇲🇰", "PT": "🇵🇹", "CG": "🇨🇬", "RU": "🇷🇺", "RW": "🇷🇼", "RO": "🇷🇴", "SV": "🇸🇻", "WS": "🇼🇸", "SM": "🇸🇲", "ST": "🇸🇹", "SC": "🇸🇨", "SN": "🇸🇳", "VC": "🇻🇨", "KN": "🇰🇳", "LC": "🇱🇨", "RS": "🇷🇸", "SY": "🇸🇾", "SK": "🇸🇰", "SI": "🇸🇮", "SB": "🇸🇧", "SO": "🇸🇴", "SD": "🇸🇩", "SR": "🇸🇷", "TL": "🇹🇱", "SL": "🇸🇱", "TJ": "🇹🇯", "TZ": "🇹🇿", "TG": "🇹🇬", "TO": "🇹🇴", "TT": "🇹🇹", "TV": "🇹🇻", "TN": "🇹🇳", "TM": "🇹🇲", "UG": "🇺🇬", "HU": "🇭🇺", "UZ": "🇺🇿", "UY": "🇺🇾", "FM": "🇫🇲", "FJ": "🇫🇯",
};

const getParsedArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse array:", value, e);
    return [];
  }
};

const calculateStarsFromPoints = (points) => {
  if (points === null || points === undefined || isNaN(points) || points < 0) return 0;
  return Math.min(5, Math.floor(points / 200));
};

const getPoints = (doc) => {
  if (!doc || !doc.profile_doctor) {
    return null;
  }
  const profile = Array.isArray(doc.profile_doctor) ? doc.profile_doctor[0] : doc.profile_doctor;
  return (profile && typeof profile.doctor_points === 'number') ? profile.doctor_points : null;
};


const InfoBox = ({ icon, label, value, children }) => {
  const { t } = useTranslation();
  const isEmpty = !value && (!children || (Array.isArray(children) && children.length === 0));
  
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={moderateScale(18)} color="#546E7A" style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <View style={styles.infoValueContainer}>
        {isEmpty ? (
          <Text style={[styles.infoValue, styles.notSpecifiedText]}>{t("not_specified")}</Text>
        ) : children || <Text style={styles.infoValue}>{value}</Text>}
      </View>
    </View>
  );
};

const LanguageFlags = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <View style={styles.flagsContainer}>
      {languages.map((langCode, index) => (
        <Text key={index} style={styles.flagText}>{COUNTRY_FLAGS_MAP[String(langCode).toUpperCase()] || "❓"}</Text>
      ))}
    </View>
  );
};

const DoctorCard = ({ doctor }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const doctorPoints = getPoints(doctor);
  const starRating = calculateStarsFromPoints(doctorPoints);

  const formatYearsText = useCallback((years) => {
    if (years === null || isNaN(years) || years < 0) return t("not_specified");
    const cases = [2, 0, 1, 1, 1, 2];
    const titles = [t("years_plural_genitive"), t("year_singular"), t("years_plural_nominative")];
    return `${years} ${titles[(years % 100 > 4 && years % 100 < 20) ? 2 : cases[Math.min(years % 10, 5)]]}`;
  }, [t]);

  const getTranslatedSpecializations = (keys) => {
    return getParsedArray(keys)
      .map(key => specializationsList.find(s => s.value === key)?.nameKey || key)
      .map(nameKey => t(nameKey))
      .join(", ");
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {doctor.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person-outline" size={moderateScale(40)} color="#90A4AE" />
          </View>
        )}
        <View style={styles.doctorSummary}>
          <Text style={styles.doctorName} numberOfLines={2}>{doctor.full_name || t("not_specified")}</Text>
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons key={i} name={i < starRating ? "star" : "star-outline"} size={moderateScale(18)} color={i < starRating ? "#FFC107" : "#CFD8DC"} />
            ))}
            {doctorPoints !== null && <Text style={styles.ratingPointsText}>({doctorPoints})</Text>}
          </View>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <InfoBox icon="medkit-outline" label={t("specialization")} value={getTranslatedSpecializations(doctor.specialization)} />
        <InfoBox icon="time-outline" label={t("work_experience")} value={formatYearsText(doctor.experience_years)} />
        <InfoBox icon="chatbubbles-outline" label={t("consultations_count")} value={doctor.consultations_count?.toString() || "0"} />
        <InfoBox icon="language-outline" label={t("communication_language")}>
          <LanguageFlags languages={getParsedArray(doctor.communication_languages)} />
        </InfoBox>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>
          {doctor.consultation_cost ? `${doctor.consultation_cost}$` : t("not_specified_price")}
        </Text>
        <TouchableOpacity style={styles.goToButton} onPress={() => navigation.navigate("Profile", { doctorId: doctor.user_id })}>
          <Text style={styles.goToButtonText}>{t("details")}</Text>
          <Ionicons name="arrow-forward" size={moderateScale(16)} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChooseSpecial = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { specialization: initialSpecialization, searchQuery } = route.params || {};
  const { t } = useTranslation();

  const [originalDoctors, setOriginalDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSortOption, setCurrentSortOption] = useState("popularity");
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const sortDoctors = useCallback((doctorsToSort, option) => {
    const sorted = [...doctorsToSort];
    switch (option) {
      case "rating_desc":
        return sorted.sort((a, b) => getPoints(b) - getPoints(a));
      case "rating_asc":
        return sorted.sort((a, b) => getPoints(a) - getPoints(b));
      case "experience_desc":
        return sorted.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
      case "experience_asc":
        return sorted.sort((a, b) => (a.experience_years || 0) - (b.experience_years || 0));
      case "price_asc":
        return sorted.sort((a, b) => (a.consultation_cost || 0) - (b.consultation_cost || 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.consultation_cost || 0) - (a.consultation_cost || 0));
      case "popularity":
      default:
        return sorted.sort((a, b) => (a.display_order || 9999) - (b.display_order || 9999));
    }
  }, []);

  const displayedDoctors = useMemo(() => sortDoctors(originalDoctors, currentSortOption), [originalDoctors, currentSortOption, sortDoctors]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("anketa_doctor")
        .select("*, profile_doctor(doctor_points), display_order")
        .eq("doctor_check", true)
        .order('display_order', { ascending: true, nullsFirst: false });

      if (initialSpecialization) {
        query = query.filter("specialization", "cs", `["${initialSpecialization}"]`);
      } else if (searchQuery) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_doctors_by_name_or_specialization', { p_search_query: searchQuery });
        if (rpcError) throw rpcError;
        const doctorIds = rpcData.filter(d => d.doctor_check).map(d => d.user_id);
        if (doctorIds.length === 0) {
            setOriginalDoctors([]);
            setLoading(false);
            return;
        }
        query = query.in('user_id', doctorIds);
      }
      
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const consultationCounts = await Promise.all(
        data.map(d => 
          supabase.from('patient_bookings').select('id', { count: 'exact', head: true }).eq('doctor_id', d.user_id).eq('consultation_conducted', true)
        )
      );

      const processedDoctors = data.map((doctor, index) => ({
        ...doctor,
        consultations_count: consultationCounts[index].count || 0,
      }));
      
      setOriginalDoctors(processedDoctors);
    } catch (e) {
      setError(`${t("unexpected_error")}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [t, initialSpecialization, searchQuery]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);
  
  useEffect(() => {
    setCurrentSortOption("popularity");
  }, [initialSpecialization, searchQuery]);

  const sortOptions = [
    { label: t("sort_by_popularity"), value: "popularity" },
    { label: t("sort_by_rating_desc"), value: "rating_desc" },
    { label: t("sort_by_rating_asc"), value: "rating_asc" },
    { label: t("sort_by_experience_desc"), value: "experience_desc" },
    { label: t("sort_by_experience_asc"), value: "experience_asc" },
    { label: t("sort_by_price_asc"), value: "price_asc" },
    { label: t("sort_by_price_desc"), value: "price_desc" },
  ];

  const toggleSortModal = (visible) => {
    if (visible) setSortModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: visible ? 0 : 300, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => !visible && setSortModalVisible(false));
  };

  const handleSortOptionSelect = (option) => {
    setCurrentSortOption(option.value);
    toggleSortModal(false);
  };

  const getHeaderTitle = () => {
    if (initialSpecialization) {
      const spec = specializationsList.find(s => s.value === initialSpecialization);
      return spec ? t(spec.nameKey) : t("doctors_general");
    }
    if (searchQuery) return `${t("search_results_for")} "${searchQuery}"`;
    return t("doctors");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0EB3EB" />
          <Text style={styles.statusText}>{t("loading_doctors")}</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="cloud-offline-outline" size={moderateScale(50)} color="#B0BEC5" />
          <Text style={styles.statusText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
            <Text style={styles.retryButtonText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (displayedDoctors.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="search-outline" size={moderateScale(50)} color="#B0BEC5" />
          <Text style={styles.statusText}>{t("no_doctors_found")}</Text>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {displayedDoctors.map((doctor) => <DoctorCard key={doctor.user_id} doctor={doctor} />)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#37474F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{getHeaderTitle()}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => toggleSortModal(true)}>
          <Ionicons name="filter" size={moderateScale(22)} color="#37474F" />
        </TouchableOpacity>
      </View>

      {renderContent()}

      <Modal transparent={true} visible={isSortModalVisible} onRequestClose={() => toggleSortModal(false)}>
        <TouchableWithoutFeedback onPress={() => toggleSortModal(false)}>
            <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                <TouchableWithoutFeedback>
                    <Animated.View style={[styles.sortModalContainer, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.sortModalTitle}>{t("sort")}</Text>
                        {sortOptions.map((option) => (
                        <TouchableOpacity key={option.value} style={styles.sortOptionButton} onPress={() => handleSortOptionSelect(option)}>
                            <Text style={[styles.sortOptionText, currentSortOption === option.value && styles.sortOptionTextSelected]}>{t(option.label)}</Text>
                            {currentSortOption === option.value && <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#0EB3EB" />}
                        </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableWithoutFeedback>
            </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  statusText: {
    marginTop: verticalScale(15),
    fontSize: moderateScale(16),
    color: "#546E7A",
    textAlign: "center",
    fontFamily: "Mont-Regular",
  },
  retryButton: {
    marginTop: verticalScale(20),
    backgroundColor: "#0EB3EB",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(30),
    borderRadius: moderateScale(25),
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontFamily: "Mont-Bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
  },
  headerButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: "Mont-SemiBold",
    fontSize: moderateScale(18),
    color: "#37474F",
  },
  scrollViewContent: {
    padding: moderateScale(15),
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(15),
    shadowColor: "#90A4AE",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(12),
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(15),
  },
  avatar: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    marginRight: scale(15),
    borderWidth: 2,
    borderColor: "#B0BEC5",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F4F6F8',
  },
  doctorSummary: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(18),
    fontFamily: "Mont-Bold",
    color: "#263238",
    marginBottom: verticalScale(4),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingPointsText: {
    fontSize: moderateScale(14),
    color: '#78909C',
    marginLeft: scale(5),
    fontFamily: 'Mont-Regular',
  },
  cardDetails: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: verticalScale(10),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: verticalScale(5),
  },
  infoIcon: {
    marginRight: scale(10),
    marginTop: verticalScale(2),
  },
  infoLabel: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-Medium",
    color: "#546E7A",
    width: scale(110), // Фіксована ширина для вирівнювання
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  infoValue: {
    fontSize: moderateScale(14),
    fontFamily: "Mont-Regular",
    color: "#37474F",
  },
  notSpecifiedText: {
    fontStyle: "italic",
    color: "#90A4AE",
  },
  flagsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagText: {
    fontSize: moderateScale(20),
    marginRight: scale(5),
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(10),
    padding: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: "#ECEFF1",
    backgroundColor: '#FAFBFC',
    borderBottomLeftRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
  },
  priceText: {
    fontSize: moderateScale(20),
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  goToButtonText: {
    color: "#FFF",
    fontSize: moderateScale(15),
    fontFamily: "Mont-Bold",
    marginRight: scale(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sortModalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
  },
  modalHandle: {
    width: scale(40),
    height: verticalScale(5),
    backgroundColor: '#CFD8DC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: verticalScale(15),
  },
  sortModalTitle: {
    fontSize: moderateScale(20),
    fontFamily: 'Mont-Bold',
    textAlign: 'center',
    marginBottom: verticalScale(20),
    color: '#37474F',
  },
  sortOptionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
  },
  sortOptionText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Regular",
    color: "#37474F",
  },
  sortOptionTextSelected: {
    fontFamily: "Mont-Bold",
    color: "#0EB3EB",
  },
});

export default ChooseSpecial;