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
  Image,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";

// --- GLOBAL CONSTANTS AND SCALING FUNCTIONS ---
const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// --- DATA LISTS (SPECIALIZATIONS, FLAGS) ---
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


// --- HELPER FUNCTIONS ---
const getParsedArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const calculateStarsFromPoints = (points) => {
  if (points === null || points === undefined || isNaN(points) || points < 0) return 0;
  return Math.min(5, Math.floor(points / 200));
};

// --- CHILD COMPONENTS (REUSED FROM CHOOSE_SPECIAL) ---

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

  const doctorPoints = doctor.doctor_points;
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

// --- MAIN SCREEN COMPONENT ---
const Search = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef(null);

  const fetchDoctors = useCallback(async (query, category) => {
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      let rpcParams = {};

      if (query && query.length > 0) {
        rpcParams.p_search_query = query;
      }
      if (category) {
        rpcParams.p_specialization_filter = category;
      }

      // If no query and no category, clear results and exit
      if (!query && !category) {
        setDoctors([]);
        setLoading(false);
        setHasSearched(false);
        return;
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'search_doctors_by_name_or_specialization',
        rpcParams // Pass parameters to RPC function
      );
      
      if (rpcError) throw rpcError;
      
      // Data now directly contains all necessary fields from the RPC function
      const processedDoctors = rpcResult.map(doctor => ({
        ...doctor,
        consultations_count: doctor.consultations_count || 0,
        doctor_points: doctor.doctor_points || 0,
        // Ensure JSONB fields are correctly handled if they come as strings
        specialization: getParsedArray(doctor.specialization),
        communication_languages: getParsedArray(doctor.communication_languages),
      }));

      setDoctors(processedDoctors);

    } catch (e) {
      setSearchError(t("unexpected_error"));
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchText.length > 0 || activeCategory) {
        fetchDoctors(searchText, activeCategory);
      } else {
        setDoctors([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchText, activeCategory, fetchDoctors]);

  const handleSearchTextChange = (text) => {
    setSearchText(text);
    if (activeCategory) setActiveCategory(null);
  };

  const handleCategoryPress = (categoryValue) => {
    if (activeCategory === categoryValue) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryValue);
      setSearchText("");
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0EB3EB" />
        </View>
      );
    }
    if (searchError) {
      return (
        <View style={styles.centeredContainer}>
            <Ionicons name="cloud-offline-outline" size={moderateScale(50)} color="#B0BEC5" />
            <Text style={styles.statusText}>{searchError}</Text>
        </View>
      );
    }
    if (!hasSearched && !searchText && !activeCategory) {
      return (
        <View style={styles.centeredContainer}>
            <Ionicons name="search-circle-outline" size={moderateScale(80)} color="#E0E0E0" />
            <Text style={styles.statusText}>{t("initial_search_prompt")}</Text>
        </View>
      );
    }
    if (hasSearched && doctors.length === 0) {
      return (
        <View style={styles.centeredContainer}>
            <Ionicons name="sad-outline" size={moderateScale(80)} color="#E0E0E0" />
            <Text style={styles.statusText}>{t("no_doctors_found")}</Text>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.doctorsListContainer}>
        {doctors.map((doctor) => <DoctorCard key={doctor.user_id} doctor={doctor} />)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#37474F" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={moderateScale(20)} color="#90A4AE" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t("search_placeholder")}
            placeholderTextColor="#90A4AE"
            value={searchText}
            onChangeText={handleSearchTextChange}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#B0BEC5" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
          {specializationsList.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[styles.categoryButton, activeCategory === category.value && styles.categoryButtonActive]}
              onPress={() => handleCategoryPress(category.value)}
            >
              <Text style={[styles.categoryButtonText, activeCategory === category.value && styles.categoryButtonTextActive]}>
                {t(category.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {renderContent()}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },
  backButton: {
    padding: moderateScale(10),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    borderRadius: moderateScale(12),
    height: verticalScale(44),
    paddingHorizontal: scale(10),
    marginLeft: scale(10),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Mont-Regular',
    color: "#263238",
  },
  clearButton: {
    padding: moderateScale(5),
  },
  categoryScrollContainer: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(15),
    backgroundColor: '#FFF',
  },
  categoryButton: {
    backgroundColor: "#E3F2FD",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    marginRight: scale(10),
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#0EB3EB",
  },
  categoryButtonText: {
    color: "#0EB3EB",
    fontSize: moderateScale(14),
    fontFamily: "Mont-SemiBold",
  },
  categoryButtonTextActive: {
    color: "#FFF",
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
  doctorsListContainer: {
    padding: moderateScale(15),
  },
  // Styles for card, copied from ChooseSpecial for consistency
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
    width: scale(110),
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
});

export default Search;