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

// --- ГЛОБАЛЬНІ КОНСТАНТИ ТА ФУНКЦІЇ МАСШТАБУВАННЯ ---
const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// --- СПИСКИ ДАНИХ (СПЕЦІАЛІЗАЦІЇ, ПРАПОРИ) ---
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
   "EN": "🇬🇧",
  "UK": "🇺🇦",
  "DE": "🇩🇪", // Germany/German
  "PH": "🇵🇭", // Philippines
  "HR": "🇭🇷", // Croatia
  "CF": "🇨🇫", // Central African Republic
  "TD": "🇹🇩", // Chad
  "CZ": "🇨🇿", // Czechia
  "CL": "🇨🇱", // Chile
  "ME": "🇲🇪", // Montenegro
  "LK": "🇱🇰", // Sri Lanka
  "JM": "🇯🇲", // Jamaica
  "UA": "🇺🇦", // Ukraine
  "GB": "🇬🇧", // United Kingdom
  "US": "🇺🇸", // United States
  "CA": "🇨🇦", // Canada
  "FR": "🇫🇷", // France
  "PL": "🇵🇱", // Poland
  "IT": "🇮🇹", // Italy
  "ES": "🇪🇸", // Spain
  "JP": "🇯🇵", // Japan
  "CN": "🇨🇳", // China
  "IN": "🇮🇳", // India
  "AU": "🇦🇺", // Australia
  "BR": "🇧🇷", // Brazil
  "TR": "🇹🇷", // Turkey
  "SE": "🇸🇪", // Sweden
  "CH": "🇨🇭", // Switzerland
  "NL": "🇳🇱", // Netherlands
  "NO": "🇳🇴", // Norway
  "DK": "🇩🇰", // Denmark
  "FI": "🇫🇮", // Finland
  "ZA": "🇿🇦", // South Africa
  "MX": "🇲🇽", // Mexico
  "KR": "🇰🇷", // South Korea
  "AR": "🇦🇷", // Argentina
  "IE": "🇮🇪", // Ireland
  "NZ": "🇳🇿", // New Zealand
  "SG": "🇸🇬", // Singapore
  "IL": "🇮🇱", // Israel
  "MY": "🇲🇾", // Malaysia
  "TH": "🇹🇭", // Thailand
  "VN": "🇻🇳", // Vietnam
  "ID": "🇮🇩", // Indonesia
  "EG": "🇪🇬", // Egypt
  "NG": "🇳🇬", // Nigeria
  "SA": "🇸🇦", // Saudi Arabia
  "AE": "🇦🇪", // United Arab Emirates
  "KW": "🇰🇼", // Kuwait
  "QA": "🇶🇦", // Qatar
  "AT": "🇦🇹", // Austria
  "AZ": "🇦🇿", // Azerbaijan
  "AL": "🇦🇱", // Albania
  "DZ": "🇩🇿", // Algeria
  "AO": "🇦🇴", // Angola
  "AD": "🇦🇩", // Andorra
  "AG": "🇦🇬", // Antigua and Barbuda
  "AF": "🇦🇫", // Afghanistan
  "BS": "🇧🇸", // Bahamas
  "BD": "🇧🇩", // Bangladesh
  "BB": "🇧🇧", // Barbados
  "BH": "🇧🇭", // Bahrain
  "BZ": "🇧🇿", // Belize
  "BE": "🇧🇪", // Belgium
  "BJ": "🇧🇯", // Benin
  "BY": "🇧🇾", // Belarus
  "BG": "🇧🇬", // Bulgaria
  "BO": "🇧🇴", // Bolivia
  "BA": "🇧🇦", // Bosnia and Herzegovina
  "BW": "🇧🇼", // Botswana
  "BN": "🇧🇳", // Brunei
  "BF": "🇧🇫", // Burkina Faso
  "BI": "🇧🇮", // Burundi
  "BT": "🇧🇹", // Bhutan
  "VU": "🇻🇺", // Vanuatu
  "VE": "🇻🇪", // Venezuela
  "AM": "🇦🇲", // Armenia
  "GA": "🇬🇦", // Gabon
  "HT": "🇭🇹", // Haiti
  "GM": "🇬🇲", // Gambia
  "GH": "🇬🇭", // Ghana
  "GY": "🇬🇾", // Guyana
  "GT": "🇬🇹", // Guatemala
  "GN": "🇬🇳", // Guinea
  "GW": "🇬🇼", // Guinea-Bissau
  "HN": "🇭🇳", // Honduras
  "GD": "🇬🇩", // Grenada
  "GR": "🇬🇷", // Greece
  "GE": "🇬🇪", // Georgia
  "DJ": "🇩🇯", // Djibouti
  "DM": "🇩🇲", // Dominica
  "DO": "🇩🇴", // Dominican Republic
  "CD": "🇨🇩", // DR Congo
  "EC": "🇪🇨", // Ecuador
  "GQ": "🇬🇶", // Equatorial Guinea
  "ER": "🇪🇷", // Eritrea
  "SZ": "🇸🇿", // Eswatini
  "EE": "🇪🇪", // Estonia
  "ET": "🇪🇹", // Ethiopia
  "YE": "🇾🇪", // Yemen
  "ZM": "🇿🇲", // Zambia
  "ZW": "🇿🇼", // Zimbabwe
  "IR": "🇮🇷", // Iran
  "IS": "🇮🇸", // Iceland
  "IQ": "🇮🇶", // Iraq
  "JO": "🇯🇴", // Jordan
  "CV": "🇨🇻", // Cape Verde
  "KZ": "🇰🇿", // Kazakhstan
  "KH": "🇰🇭", // Cambodia
  "CM": "🇨🇲", // Cameroon
  "KE": "🇰🇪", // Kenya
  "KG": "🇰🇬", // Kyrgyzstan
  "CY": "🇨🇾", // Cyprus
  "KI": "🇰🇮", // Kiribati
  "CO": "🇨🇴", // Colombia
  "KM": "🇰🇲", // Comoros
  "CR": "🇨🇷", // Costa Rica
  "CI": "🇨🇮", // Ivory Coast
  "CU": "🇨🇺", // Cuba
  "LA": "🇱🇦", // Laos
  "LV": "🇱🇻", // Latvia
  "LS": "🇱🇸", // Lesotho
  "LT": "🇱🇹", // Lithuania
  "LR": "🇱🇷", // Liberia
  "LB": "🇱🇧", // Lebanon
  "LY": "🇱🇾", // Libya
  "LI": "🇱🇮", // Liechtenstein
  "LU": "🇱🇺", // Luxembourg
  "MM": "🇲🇲", // Myanmar
  "MU": "🇲🇺", // Mauritius
  "MR": "🇲🇷", // Mauritania
  "MG": "🇲🇬", // Madagascar
  "MW": "🇲🇼", // Malawi
  "ML": "🇲🇱", // Mali
  "MV": "🇲🇻", // Maldives
  "MT": "🇲🇹", // Malta
  "MA": "🇲🇦", // Morocco
  "MH": "🇲🇭", // Marshall Islands
  "MZ": "🇲🇿", // Mozambique
  "MD": "🇲🇩", // Moldova
  "MC": "🇲🇨", // Monaco
  "MN": "🇲🇳", // Mongolia
  "NA": "🇳🇦", // Namibia
  "NR": "🇳🇷", // Nauru
  "NP": "🇳🇵", // Nepal
  "NE": "🇳🇪", // Niger
  "NI": "🇳🇮", // Nicaragua
  "OM": "🇴🇲", // Oman
  "PK": "🇵🇰", // Pakistan
  "PW": "🇵🇼", // Palau
  "PA": "🇵🇦", // Panama
  "PG": "🇵🇬", // Papua New Guinea
  "PY": "🇵🇾", // Paraguay
  "PE": "🇵🇪", // Peru
  "SS": "🇸🇸", // South Sudan
  "KP": "🇰🇵", // North Korea
  "MK": "🇲🇰", // North Macedonia
  "PT": "🇵🇹", // Portugal
  "CG": "🇨🇬", // Republic of the Congo
  "RU": "🇷🇺", // Russia
  "RW": "🇷🇼", // Rwanda
  "RO": "🇷🇴", // Romania
  "SV": "🇸🇻", // El Salvador
  "WS": "🇼🇸", // Samoa
  "SM": "🇸🇲", // San Marino
  "ST": "🇸🇹", // Sao Tome and Principe
  "SC": "🇸🇨", // Seychelles
  "SN": "🇸🇳", // Senegal
  "VC": "🇻🇨", // Saint Vincent and the Grenadines
  "KN": "🇰🇳", // Saint Kitts and Nevis
  "LC": "🇱🇨", // Saint Lucia
  "RS": "🇷🇸", // Serbia
  "SY": "🇸🇾", // Syria
  "SK": "🇸🇰", // Slovakia
  "SI": "🇸🇮", // Slovenia
  "SB": "🇸🇧", // Solomon Islands
  "SO": "🇸🇴", // Somalia
  "SD": "🇸🇩", // Sudan
  "SR": "🇸🇷", // Suriname
  "TL": "🇹🇱", // East Timor
  "SL": "🇸🇱", // Sierra Leone
  "TJ": "🇹🇯", // Tajikistan
  "TZ": "🇹🇿", // Tanzania
  "TG": "🇹🇬", // Togo
  "TO": "🇹🇴", // Tonga
  "TT": "🇹🇹", // Trinidad and Tobago
  "TV": "🇹🇻", // Tuvalu
  "TN": "🇹🇳", // Tunisia
  "TM": "🇹🇲", // Turkmenistan
  "UG": "🇺🇬", // Uganda
  "HU": "🇭🇺", // Hungary
  "UZ": "🇺🇿", // Uzbekistan
  "UY": "🇺🇾", // Uruguay
  "FM": "🇫🇲", // Federated States of Micronesia
  "FJ": "🇫🇯", // Fiji
};


// --- ДОПОМІЖНІ ФУНКЦІЇ ---
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

// --- ДОЧІРНІ КОМПОНЕНТИ (ПЕРЕВИКОРИСТАНІ З CHOOSE_SPECIAL) ---

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

  const getPoints = useCallback((doc) => {
    if (!doc || !doc.profile_doctor) return null;
    const profile = Array.isArray(doc.profile_doctor) ? doc.profile_doctor[0] : doc.profile_doctor;
    return (profile && typeof profile.doctor_points === 'number') ? profile.doctor_points : null;
  }, []);

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

// --- ГОЛОВНИЙ КОМПОНЕНТ ЕКРАНА ---
const Search = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // Чи був хоча б один пошук
  const searchInputRef = useRef(null);

  const fetchDoctors = useCallback(async (query, category) => {
    if (!query && !category) {
      setDoctors([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      let baseQuery = supabase.from("anketa_doctor").select("*, profile_doctor(doctor_points), consultation_cost, experience_years, created_at, avatar_url").eq("doctor_check", true);

      if (category) {
        baseQuery = baseQuery.filter("specialization", "cs", `["${category}"]`);
      } else if (query) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_doctors_by_name_or_specialization', { p_search_query: query });
        if (rpcError) throw rpcError;
        
        const doctorIds = rpcData.filter(d => d.doctor_check).map(d => d.user_id);
        if (doctorIds.length === 0) {
            setDoctors([]);
            setLoading(false);
            return;
        }
        baseQuery = baseQuery.in('user_id', doctorIds);
      }

      const { data, error } = await baseQuery.order('created_at', { ascending: false });
      if (error) throw error;
      
      const consultationCounts = await Promise.all(
        data.map(d => 
          supabase.from('patient_bookings').select('id', { count: 'exact', head: true }).eq('doctor_id', d.user_id).eq('consultation_conducted', true)
        )
      );

      const processedDoctors = data.map((doctor, index) => ({
        ...doctor,
        consultations_count: consultationCounts[index].count || 0,
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
      if (searchText || activeCategory) {
        fetchDoctors(searchText, activeCategory);
      } else {
        setDoctors([]);
        setHasSearched(false);
      }
    }, 500); // Затримка для уникнення частих запитів

    return () => clearTimeout(handler);
  }, [searchText, activeCategory, fetchDoctors]);

  const handleSearchTextChange = (text) => {
    setSearchText(text);
    if (activeCategory) setActiveCategory(null);
  };

  const handleCategoryPress = (categoryValue) => {
    if (activeCategory === categoryValue) {
      setActiveCategory(null); // Скасувати вибір
    } else {
      setActiveCategory(categoryValue);
      setSearchText(""); // Очистити текстовий пошук при виборі категорії
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
    if (!hasSearched) {
      return (
        <View style={styles.centeredContainer}>
            <Ionicons name="search-circle-outline" size={moderateScale(80)} color="#E0E0E0" />
            <Text style={styles.statusText}>{t("initial_search_prompt")}</Text>
        </View>
      );
    }
    if (doctors.length === 0) {
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

// --- СТИЛІ ---
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
  // Стилі для картки, скопійовані з ChooseSpecial для консистентності
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
