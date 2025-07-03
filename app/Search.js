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
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { supabase } from "../providers/supabaseClient";
// import Icon from "../assets/icon.svg"; // Залишаємо закоментованим, якщо не використовується напряму тут

// Отримання розмірів екрану
const { width, height } = Dimensions.get("window");

// Функції для масштабування розмірів
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;


// === Компоненти та дані ===

const getParsedArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(
      "Warning: Invalid JSON format for array (expected array or parsable JSON string):",
      value,
      e
    );
    return [];
  }
};

const specializationsList = [
  { value: "general_practitioner", nameKey: "categories.general_practitioner" },
  { value: "pediatrician", nameKey: "categories.pediatrician" },
  { value: "cardiologist", nameKey: "categories.cardiologist" },
  { value: "dermatologist", nameKey: "categories.dermatologist" },
  { value: "neurologist", nameKey: "categories.neurologist" },
  { value: "surgeon", nameKey: "categories.surgeon" },
  { value: "psychiatrist", nameKey: "categories.psychiatrist" },
  { value: "dentist", nameKey: "categories.dentist" },
  { value: "ophthalmologist", nameKey: "categories.ophthalmologist" },
  { value: "categories.ent_specialist", nameKey: "ent_specialist" },
  { value: "gastroenterologist", nameKey: "categories.gastroenterologist" },
  { value: "endocrinologist", nameKey: "categories.endocrinologist" },
  { value: "oncologist", nameKey: "categories.oncologist" },
  { value: "allergist", nameKey: "categories.allergist" },
  { value: "physiotherapist", nameKey: "categories.physiotherapist" },
  { value: "traumatologist", nameKey: "categories.traumatologist" },
  { value: "gynecologist", nameKey: "categories.gynecologist" },
  { value: "urologist", nameKey: "categories.urologist" },
  { value: "pulmonologist", nameKey: "categories.pulmonologist" },
  { value: "nephrologist", nameKey: "categories.nephrologist" },
  { value: "rheumatologist", nameKey: "categories.rheumatologist" },
  { value: "infectiousDiseasesSpecialist", nameKey: "categories.infectiousDiseasesSpecialist" },
  { value: "psychologist", nameKey: "categories.psychologist" },
  { value: "nutritionist", nameKey: "categories.nutritionist" },
  { value: "radiologist", nameKey: "categories.radiologist" },
  { value: "anesthesiologist", nameKey: "categories.anesthesiologist" },
];


// --- Додаємо мапу прапорів (таку ж, як у Profile_doctor.js) ---
const COUNTRY_FLAGS_MAP = {
  // Тут має бути ваш об'єкт з прапорами
  // Наприклад:
  // US: "🇺🇸",
  // UA: "🇺🇦",
  // GB: "🇬🇧",
  // DE: "🇩🇪",
  // FR: "🇫🇷",
};


const LanguageFlags = ({ languages }) => {
  const { t } = useTranslation(); // Отримуємо t для перекладу "not_specified"
  const getFlag = (code) => {
    // Звертаємося до глобальної мапи прапорів
    return COUNTRY_FLAGS_MAP[String(code).toUpperCase()] || "❓";
  };

  if (!languages || languages.length === 0) {
    return (
      <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
        {t("not_specified")}
      </Text>
    );
  }

  return (
    <View style={styles.flagsContainer}>
      {languages.map(
        (langCode, index) =>
          typeof langCode === "string" && (
            <Text key={index} style={styles.flagText}>
              {getFlag(langCode)}
            </Text>
          )
      )}
    </View>
  );
};

const InfoBox = ({ label, value, children }) => {
  const { t } = useTranslation();
  const isEmpty =
    !value && (!children || (Array.isArray(children) && children.length === 0));
  return (
    <View style={styles.infoBoxRow}>
      <Text style={styles.infoBoxLabel}>{label}:</Text>
      <View style={styles.infoBoxValueContainer}>
        {isEmpty ? (
          <Text style={[styles.infoBoxValueText, styles.notSpecifiedText]}>
            {t("not_specified")}
          </Text>
        ) : children ? (
          children
        ) : (
          <Text style={styles.infoBoxValueText}>{value}</Text>
        )}
      </View>
    </View>
  );
};

// Функція для розрахунку кількості зірочок від 0 до 5
// де 1000 points = 5 зірочок
const calculateStarsFromPoints = (points) => {
  if (points === null || points === undefined || isNaN(points) || points < 0) {
    return 0; // Якщо балів немає або вони некоректні, повертаємо 0 зірок
  }
  // Максимально 1000 балів = 5 зірок. Кожна зірка = 200 балів.
  return Math.min(5, Math.floor(points / 200));
};


const DoctorCard = ({ doctor }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const formatYearsText = useCallback(
    (years) => {
      if (years === null || years === undefined || isNaN(years) || years < 0) {
        return t("not_specified");
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
    },
    [t]
  );

  const handleGoToDoctor = () => {
    navigation.navigate("Profile", { doctorId: doctor.user_id });
  };

  const getTranslatedSpecializations = (specializationKeys) => {
    const parsedKeys = getParsedArray(specializationKeys);
    return parsedKeys
      .map((specKey) => {
        const spec = specializationsList.find((s) => s.value === specKey);
        return spec ? t(spec.nameKey) : specKey;
      })
      .join(", ");
  };

  // Отримуємо doctor_points з об'єкта doctor, який має вкладений profile_doctor
  const doctorPoints = doctor.profile_doctor?.doctor_points;
  const starRating = calculateStarsFromPoints(doctorPoints);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {doctor.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person-circle-outline" size={moderateScale(60)} color="#0EB3EB" />
          </View>
        )}
        <View style={styles.doctorSummary}>
          <Text style={styles.doctorName}>{doctor.full_name || t("not_specified")}</Text>
          <InfoBox label={t("rating")}>
            {/* Відображаємо повні зірочки */}
            {Array.from({ length: starRating }).map((_, i) => (
              <Ionicons key={`star-full-${i}`} name="star" size={moderateScale(18)} color="#FFD700" />
            ))}
            {/* Відображаємо пусті зірочки */}
            {Array.from({ length: 5 - starRating }).map((_, i) => (
              <Ionicons key={`star-outline-${i}`} name="star-outline" size={moderateScale(18)} color="#ccc" />
            ))}
            {doctorPoints !== undefined && doctorPoints !== null && !isNaN(doctorPoints) && (
              <Text style={styles.ratingPointsText}> ({doctorPoints} {t('points_short')})</Text>
            )}
          </InfoBox>
          <InfoBox label={t("communication_language")}>
            {/* Передаємо languages, як у Profile_doctor */}
            <LanguageFlags languages={getParsedArray(doctor.communication_languages)} />
          </InfoBox>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <InfoBox
          label={t("specialization")}
          value={getTranslatedSpecializations(doctor.specialization)}
        />
        <InfoBox
          label={t("work_experience")}
          value={formatYearsText(doctor.experience_years)}
        />
        <InfoBox label={t("time_in_app")} value={doctor.time_in_app || t("not_specified")} />
        <InfoBox
          label={t("consultations_count")}
          value={doctor.consultations_count?.toString() || "0"}
        />
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.goToButton} onPress={handleGoToDoctor}>
          <Text style={styles.goToButtonText}>{t("go_to")}</Text>
        </TouchableOpacity>
        <Text style={styles.priceText}>
          {t("price")}:{" "}
          {doctor.consultation_cost
            ? `${doctor.consultation_cost}$`
            : t("not_specified_price")}
        </Text>
      </View>
    </View>
  );
};


const Search = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasUserInitiatedSearch, setHasUserInitiatedSearch] = useState(false);


  const handleBackPress = () => {
    navigation.goBack();
  };

  const fetchDoctors = useCallback(async (query = "", category = null) => {
    setLoading(true);
    setSearchError(null);
    setDoctors([]);

    if (!query && !category && !hasUserInitiatedSearch) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    try {
      let data = [];
      let error = null;

      if (category) {
        const { data: categoryData, error: categoryError } = await supabase
          .from("anketa_doctor")
          .select("*, profile_doctor(doctor_points), consultation_cost, experience_years, created_at, avatar_url, search_tags") // IMPORTANT: Select profile_doctor(doctor_points)
          .filter("specialization", "cs", `["${category}"]`)
          .eq("doctor_check", true); // <<< ДОДАНО: Фільтруємо за doctor_check = true
        data = categoryData;
        error = categoryError;
      } else if (query) {
        // Якщо RPC функція `search_doctors_by_name_or_specialization` не має вбудованої фільтрації за `doctor_check`,
        // її потрібно буде модифікувати на стороні бази даних, АБО фільтрувати на стороні клієнта після отримання.
        // Оптимальніше - модифікувати RPC функцію, щоб вона враховувала `doctor_check = true`.
        // Нижче приклад, як це може виглядати, якщо ви будете робити додатковий запит.
        // НАЙКРАЩЕ РІШЕННЯ: ОНОВИТИ ВАШУ RPC ФУНКЦІЮ `search_doctors_by_name_or_specialization`
        // НА СТОРОНІ SUPABASE, ЩОБ ВОНА ВКЛЮЧАЛА ФІЛЬТРАЦІЮ `doctor_check = true`.
        // Наприклад, у вашій SQL функції Supabase:
        // SELECT ad.*, pd.doctor_points
        // FROM anketa_doctor ad
        // LEFT JOIN profile_doctor pd ON ad.user_id = pd.user_id
        // WHERE ad.doctor_check = TRUE
        // AND (ad.full_name ILIKE '%' || p_search_query || '%' OR ad.search_tags::text ILIKE '%' || p_search_query || '%');

        const { data: rpcData, error: rpcError } = await supabase.rpc('search_doctors_by_name_or_specialization', {
            p_search_query: query,
        });

        if (rpcData && !rpcError) {
          // Якщо RPC не повертає profile_doctor, його потрібно додати вручну або оновити RPC.
          const doctorIds = rpcData.map(d => d.user_id);
          const { data: profileData, error: profileError } = await supabase
            .from('profile_doctor')
            .select('user_id, doctor_points')
            .in('user_id', doctorIds);

          if (!profileError) {
            const profileMap = new Map(profileData.map(p => [p.user_id, p.doctor_points]));
            data = rpcData.map(d => ({
              ...d,
              profile_doctor: { doctor_points: profileMap.get(d.user_id) }
            }));
            error = rpcError; // Зберігаємо оригінальну помилку RPC, якщо є
          } else {
            console.warn("Could not fetch doctor_points for RPC results:", profileError.message);
            data = rpcData; // Використовуємо дані без рейтингу, якщо не вдалося завантажити
            error = rpcError || profileError;
          }

          // <<< ДОДАНО: Фільтруємо отримані дані з RPC на клієнті, якщо RPC не враховує doctor_check.
          // Цей клієнтський фільтр є тимчасовим рішенням. Оптимально - оновити RPC функцію.
          if (data) {
            const { data: anketaDoctorData, error: anketaDoctorError } = await supabase
              .from('anketa_doctor')
              .select('user_id, doctor_check')
              .in('user_id', data.map(d => d.user_id));

            if (!anketaDoctorError) {
              const checkedDoctorsMap = new Map(anketaDoctorData.map(d => [d.user_id, d.doctor_check]));
              data = data.filter(d => checkedDoctorsMap.get(d.user_id) === true); // Фільтруємо тільки перевірених
            } else {
              console.warn("Could not fetch doctor_check status for RPC results:", anketaDoctorError.message);
            }
          }

        } else {
          data = rpcData;
          error = rpcError;
        }

      } else {
        setDoctors([]);
        setLoading(false);
        return;
      }

      if (error) {
        console.error("Error fetching doctors:", error);
        setSearchError(`${t("error_fetching_doctors")}: ${error.message}`);
        setDoctors([]);
      } else {
        const processedDoctors = data.map((doctor) => {
          // Отримуємо мови, перетворюючи їх на верхній регістр та фільтруючи за COUNTRY_FLAGS_MAP
          const parsedCommunicationLanguages = getParsedArray(doctor.communication_languages).map(lang => {
            if (typeof lang === 'object' && lang !== null && lang.code) {
              return String(lang.code).toUpperCase();
            }
            return String(lang).toUpperCase();
          }).filter(code => COUNTRY_FLAGS_MAP[code]); // Фільтруємо, щоб були лише ті, для яких є прапори


          let timeInAppDisplay = t("not_specified");
          if (doctor.created_at) {
            const joinedDate = new Date(doctor.created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 30) {
              timeInAppDisplay = t("days_in_app", { count: diffDays });
            } else if (diffDays < 365) {
              const diffMonths = Math.floor(diffDays / 30);
              timeInAppDisplay = t("months_in_app", { count: diffMonths });
            } else {
              const diffYears = Math.floor(diffDays / 365);
              timeInAppDisplay = t("years_in_app", { count: diffYears });
            }
          }

          return {
            ...doctor,
            communication_languages: parsedCommunicationLanguages,
            time_in_app: timeInAppDisplay,
          };
        });
        setDoctors(processedDoctors);
      }
    } catch (e) {
      console.error("Unexpected search error:", e);
      setSearchError(t("unexpected_error"));
    } finally {
      setLoading(false);
    }
  }, [t, hasUserInitiatedSearch]);

  useEffect(() => {
    if (searchText.length > 0 || activeCategory !== null) {
      setHasUserInitiatedSearch(true);
      const debounceTimeout = setTimeout(() => {
        if (activeCategory) {
          fetchDoctors(null, activeCategory);
        } else {
          fetchDoctors(searchText, null);
        }
      }, 500);

      return () => clearTimeout(debounceTimeout);
    } else {
      setHasUserInitiatedSearch(false);
      setDoctors([]);
      setSearchError(null);
    }
  }, [searchText, activeCategory, fetchDoctors]);


  const handleSearchTextInput = (text) => {
    setSearchText(text);
    setActiveCategory(null);
  };

  const handleCategoryPress = (categoryValue) => {
    if (activeCategory === categoryValue) {
      setActiveCategory(null);
      setSearchText("");
    } else {
      setActiveCategory(categoryValue);
      setSearchText("");
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color="black" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={moderateScale(20)}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("search_placeholder")}
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={handleSearchTextInput}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color="#0EB3EB" style={styles.loadingIndicator} />}
            {searchText.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearSearchButton}>
                <Ionicons name="close-circle" size={moderateScale(20)} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchError && <Text style={styles.errorMessage}>{searchError}</Text>}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
        >
          {specializationsList.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton,
                activeCategory === category.value && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryPress(category.value)}
            >
              <Text style={[
                styles.categoryButtonText,
                activeCategory === category.value && styles.categoryButtonTextActive,
              ]}>
                {String(t(category.nameKey))}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.doctorsListContainer}>
          {!hasUserInitiatedSearch && !loading && (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="search" size={moderateScale(150)} color="rgba(14, 179, 235, 0.2)" />
              <Text style={styles.initialSearchPrompt}>{t("initial_search_prompt")}</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0EB3EB" />
              <Text style={styles.loadingText}>{t("loading_doctors")}</Text>
            </View>
          )}

          {!loading && hasUserInitiatedSearch && doctors.length > 0 ? (
            doctors.map((doctor) => (
              <DoctorCard key={doctor.user_id} doctor={doctor} />
            ))
          ) : !loading && hasUserInitiatedSearch && !searchError && doctors.length === 0 && (
            <View style={{ alignItems: "center", justifyContent: "start" }}>
              <Ionicons name="not-search" size={moderateScale(150)} color="rgba(14, 179, 235, 0.2)" />
              <Text style={styles.noDoctorsFound}>{t("no_doctors_found")}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? StatusBar.currentHeight + 5 : 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 5 : 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    marginRight: scale(15),
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(25),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: moderateScale(555),
    paddingHorizontal: scale(15),
    flex: 1,
    height: verticalScale(50),
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: "#333",
  },
  loadingIndicator: {
    marginLeft: scale(10),
  },
  clearSearchButton: {
    marginLeft: scale(10),
    padding: scale(5),
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginTop: verticalScale(10),
    fontSize: moderateScale(14),
    paddingHorizontal: scale(15),
  },
  categoryScrollContainer: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
  },
  categoryButton: {
    backgroundColor: "rgba(14, 179, 235, 0.7)",
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(15),
    marginRight: scale(10),
    justifyContent: "center",
    alignItems: "center",
    height: verticalScale(40),
    marginBottom: verticalScale(15),
  },
  categoryButtonActive: {
    backgroundColor: "#0EB3EB",
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  categoryButtonTextActive: {
    color: "#fff",
  },
  doctorsListContainer: {
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(300),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(50),
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: "#000000",
    fontFamily: "Mont-Regular",
  },
  noDoctorsFound: {
    fontSize: moderateScale(18),
    textAlign: "center",
    color: "#777",
    fontFamily: "Mont-Regular",
  },
  initialSearchPrompt: {
    fontSize: moderateScale(18),
    textAlign: "center",
    color: "#555",
    fontFamily: "Mont-Regular",
    paddingHorizontal: scale(20),
  },
  card: {
    backgroundColor: "#E3F2FD",
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: verticalScale(10),
  },
  avatar: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    marginRight: scale(15),
    borderWidth: 2,
    borderColor: "#0EB3EB",
    backgroundColor: "#F5F5F5",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#B3E0F2',
  },
  doctorSummary: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#333",
    marginBottom: verticalScale(8),
    fontFamily: "Mont-Bold",
  },
  infoBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  infoBoxLabel: {
    fontSize: moderateScale(13),
    color: "#555",
    marginRight: scale(5),
    fontFamily: "Mont-Medium",
  },
  infoBoxValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoBoxValueText: {
    fontSize: moderateScale(14),
    color: "#333",
    fontWeight: "500",
    fontFamily: "Mont-Regular",
    flexShrink: 1,
  },
  notSpecifiedText: {
    fontStyle: "italic",
    color: "#777",
  },
  flagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  flagText: {
    fontSize: moderateScale(18),
    marginRight: scale(5),
  },
  ratingPointsText: {
    fontSize: moderateScale(14),
    color: '#666',
    marginLeft: scale(5),
    fontFamily: 'Mont-Regular',
  },
  cardDetails: {
    paddingTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: "#CFD8DC",
    paddingTop: verticalScale(10),
  },
  goToButton: {
    backgroundColor: "#0EB3EB",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(25),
    borderRadius: moderateScale(25),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  goToButtonText: {
    color: "#FFF",
    fontSize: moderateScale(15),
    fontWeight: "bold",
    fontFamily: "Mont-Bold",
  },
  priceText: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#3498DB",
    fontFamily: "Mont-Bold",
  },
});

export default Search;