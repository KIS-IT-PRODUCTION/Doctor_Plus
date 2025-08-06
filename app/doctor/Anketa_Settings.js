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



const specializations = [
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
  {
    value: "infectiousDiseasesSpecialist",
    nameKey: "infectiousDiseasesSpecialist",
  },
  { value: "psychologist", nameKey: "psychologist" },
  { value: "nutritionist", nameKey: "nutritionist" },
  { value: "radiologist", nameKey: "radiologist" },
  { value: "anesthesiologist", nameKey: "anesthesiologist" },
  { value: "oncologist_radiation", nameKey: "oncologist_radiation" },
  { value: "endoscopy_specialist", nameKey: "endoscopy_specialist" },
  { value: "ultrasound_specialist", nameKey: "ultrasound_specialist" },
  {
    value: "laboratory_diagnostician",
    nameKey: "laboratory_diagnostician",
  },
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
  {
    value: "infectious_disease_specialist_pediatric",
    nameKey: "infectious_disease_specialist_pediatric",
  },
  {
    value: "pediatric_gastroenterologist",
    nameKey: "pediatric_gastroenterologist",
  },
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

const experienceYearsOptions = Array.from({ length: 51 }, (_, i) => i);

const consultationCostOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5); // 5, 10, 15... 200

// --- FIX: Повернено відсутній список країн ---
const countries = [
  {
    name: "Ukraine",
    code: "UA",
    emoji: "🇺🇦",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Kiev",
  },
  {
    name: "United Kingdom",
    code: "GB",
    emoji: "🇬🇧",
    timezone: "UTC+0",
    ianaTimezone: "Europe/London",
  },
  {
    name: "United States",
    code: "US",
    emoji: "🇺🇸",
    timezone: "UTC-5",
    ianaTimezone: "America/New_York",
  },
  {
    name: "Canada",
    code: "CA",
    emoji: "🇨🇦",
    timezone: "UTC-6",
    ianaTimezone: "America/Toronto",
  },
  {
    name: "Germany",
    code: "DE",
    emoji: "🇩🇪",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Berlin",
  },
  {
    name: "France",
    code: "FR",
    emoji: "🇫🇷",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Paris",
  },
  {
    name: "Poland",
    code: "PL",
    emoji: "🇵🇱",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Warsaw",
  },
  {
    name: "Italy",
    code: "IT",
    emoji: "🇮🇹",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Rome",
  },
  {
    name: "Spain",
    code: "ES",
    emoji: "🇪🇸",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Madrid",
  },
  {
    name: "Japan",
    code: "JP",
    emoji: "🇯🇵",
    timezone: "UTC+9",
    ianaTimezone: "Asia/Tokyo",
  },
  {
    name: "China",
    code: "CN",
    emoji: "🇨🇳",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Shanghai",
  },
  {
    name: "India",
    code: "IN",
    emoji: "🇮🇳",
    timezone: "UTC+5:30",
    ianaTimezone: "Asia/Kolkata",
  },
  {
    name: "Australia",
    code: "AU",
    emoji: "🇦🇺",
    timezone: "UTC+10",
    ianaTimezone: "Australia/Sydney",
  },
  {
    name: "Brazil",
    code: "BR",
    emoji: "🇧🇷",
    timezone: "UTC-3",
    ianaTimezone: "America/Sao_Paulo",
  },
  {
    name: "Turkey",
    code: "TR",
    emoji: "🇹🇷",
    timezone: "UTC+3",
    ianaTimezone: "Europe/Istanbul",
  },
  {
    name: "Sweden",
    code: "SE",
    emoji: "🇸🇪",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Stockholm",
  },
  {
    name: "Switzerland",
    code: "CH",
    emoji: "🇨🇭",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Zurich",
  },
  {
    name: "Netherlands",
    code: "NL",
    emoji: "🇳🇱",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Amsterdam",
  },
  {
    name: "Norway",
    code: "NO",
    emoji: "🇳🇴",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Oslo",
  },
  {
    name: "Denmark",
    code: "DK",
    emoji: "🇩🇰",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Copenhagen",
  },
  {
    name: "Finland",
    code: "FI",
    emoji: "🇫🇮",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Helsinki",
  },
  {
    name: "South Africa",
    code: "ZA",
    emoji: "🇿🇦",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Johannesburg",
  },
  {
    name: "Mexico",
    code: "MX",
    emoji: "🇲🇽",
    timezone: "UTC-6",
    ianaTimezone: "America/Mexico_City",
  },
  {
    name: "South Korea",
    code: "KR",
    emoji: "🇰🇷",
    timezone: "UTC+9",
    ianaTimezone: "Asia/Seoul",
  },
  {
    name: "Argentina",
    code: "AR",
    emoji: "🇦🇷",
    timezone: "UTC-3",
    ianaTimezone: "America/Argentina/Buenos_Aires",
  },
  {
    name: "Ireland",
    code: "IE",
    emoji: "🇮🇪",
    timezone: "UTC+0",
    ianaTimezone: "Europe/Dublin",
  },
  {
    name: "New Zealand",
    code: "NZ",
    emoji: "🇳🇿",
    timezone: "UTC+12",
    ianaTimezone: "Pacific/Auckland",
  },
  {
    name: "Singapore",
    code: "SG",
    emoji: "🇸🇬",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Singapore",
  },
  {
    name: "Israel",
    code: "IL",
    emoji: "🇮🇱",
    timezone: "UTC+2",
    ianaTimezone: "Asia/Jerusalem",
  },
  {
    name: "Malaysia",
    code: "MY",
    emoji: "🇲🇾",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Kuala_Lumpur",
  },
  {
    name: "Thailand",
    code: "TH",
    emoji: "🇹🇭",
    timezone: "UTC+7",
    ianaTimezone: "Asia/Bangkok",
  },
  {
    name: "Vietnam",
    code: "VN",
    emoji: "🇻🇳",
    timezone: "UTC+7",
    ianaTimezone: "Asia/Ho_Chi_Minh",
  },
  {
    name: "Indonesia",
    code: "ID",
    emoji: "🇮🇩",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Jakarta",
  },
  {
    name: "Egypt",
    code: "EG",
    emoji: "🇪🇬",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Cairo",
  },
  {
    name: "Nigeria",
    code: "NG",
    emoji: "🇳🇬",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Lagos",
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    emoji: "🇸🇦",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Riyadh",
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    emoji: "🇦🇪",
    timezone: "UTC+4",
    ianaTimezone: "Asia/Dubai",
  },
  {
    name: "Kuwait",
    code: "KW",
    emoji: "🇰🇼",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Kuwait",
  },
  {
    name: "Qatar",
    code: "QA",
    emoji: "🇶🇦",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Qatar",
  },
  {
    name: "Austria",
    code: "AT",
    emoji: "🇦🇹",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Vienna",
  },
  {
    name: "Azerbaijan",
    code: "AZ",
    emoji: "🇦🇿",
    timezone: "UTC+4",
    ianaTimezone: "Asia/Baku",
  },
  {
    name: "Albania",
    code: "AL",
    emoji: "🇦🇱",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Tirane",
  },
  {
    name: "Algeria",
    code: "DZ",
    emoji: "🇩🇿",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Algiers",
  },
  {
    name: "Angola",
    code: "AO",
    emoji: "🇦🇴",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Luanda",
  },
  {
    name: "Andorra",
    code: "AD",
    emoji: "🇦🇩",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Andorra",
  },
  {
    name: "Antigua and Barbuda",
    code: "AG",
    emoji: "🇦🇬",
    timezone: "UTC-4",
    ianaTimezone: "America/Antigua",
  },
  {
    name: "Afghanistan",
    code: "AF",
    emoji: "🇦🇫",
    timezone: "UTC+4:30",
    ianaTimezone: "Asia/Kabul",
  },
  {
    name: "Bahamas",
    code: "BS",
    emoji: "🇧🇸",
    timezone: "UTC-5",
    ianaTimezone: "America/Nassau",
  },
  {
    name: "Bangladesh",
    code: "BD",
    emoji: "🇧🇩",
    timezone: "UTC+6",
    ianaTimezone: "Asia/Dhaka",
  },
  {
    name: "Barbados",
    code: "BB",
    emoji: "🇧🇧",
    timezone: "UTC-4",
    ianaTimezone: "America/Barbados",
  },
  {
    name: "Bahrain",
    code: "BH",
    emoji: "🇧🇭",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Bahrain",
  },
  {
    name: "Belize",
    code: "BZ",
    emoji: "🇧🇿",
    timezone: "UTC-6",
    ianaTimezone: "America/Belize",
  },
  {
    name: "Belgium",
    code: "BE",
    emoji: "🇧🇪",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Brussels",
  },
  {
    name: "Benin",
    code: "BJ",
    emoji: "🇧🇯",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Porto-Novo",
  },
  {
    name: "Belarus",
    code: "BY",
    emoji: "🇧🇾",
    timezone: "UTC+3",
    ianaTimezone: "Europe/Minsk",
  },
  {
    name: "Bulgaria",
    code: "BG",
    emoji: "🇧🇬",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Sofia",
  },
  {
    name: "Bolivia",
    code: "BO",
    emoji: "🇧🇴",
    timezone: "UTC-4",
    ianaTimezone: "America/La_Paz",
  },
  {
    name: "Bosnia and Herzegovina",
    code: "BA",
    emoji: "🇧🇦",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Sarajevo",
  },
  {
    name: "Botswana",
    code: "BW",
    emoji: "🇧🇼",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Gaborone",
  },
  {
    name: "Brunei",
    code: "BN",
    emoji: "🇧🇳",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Brunei",
  },
  {
    name: "Burkina Faso",
    code: "BF",
    emoji: "🇧🇫",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Ouagadougou",
  },
  {
    name: "Burundi",
    code: "BI",
    emoji: "🇧🇮",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Bujumbura",
  },
  {
    name: "Bhutan",
    code: "BT",
    emoji: "🇧🇹",
    timezone: "UTC+6",
    ianaTimezone: "Asia/Thimphu",
  },
  {
    name: "Vanuatu",
    code: "VU",
    emoji: "🇻🇺",
    timezone: "UTC+11",
    ianaTimezone: "Pacific/Efate",
  },
  {
    name: "Venezuela",
    code: "VE",
    emoji: "🇻🇪",
    timezone: "UTC-4",
    ianaTimezone: "America/Caracas",
  },
  {
    name: "Armenia",
    code: "AM",
    emoji: "🇦🇲",
    timezone: "UTC+4",
    ianaTimezone: "Asia/Yerevan",
  },
  {
    name: "Gabon",
    code: "GA",
    emoji: "🇬🇦",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Libreville",
  },
  {
    name: "Haiti",
    code: "HT",
    emoji: "🇭🇹",
    timezone: "UTC-5",
    ianaTimezone: "America/Port-au-Prince",
  },
  {
    name: "Gambia",
    code: "GM",
    emoji: "🇬🇲",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Banjul",
  },
  {
    name: "Ghana",
    code: "GH",
    emoji: "🇬🇭",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Accra",
  },
  {
    name: "Guyana",
    code: "GY",
    emoji: "🇬🇾",
    timezone: "UTC-4",
    ianaTimezone: "America/Guyana",
  },
  {
    name: "Guatemala",
    code: "GT",
    emoji: "🇬🇹",
    timezone: "UTC-6",
    ianaTimezone: "America/Guatemala",
  },
  {
    name: "Guinea",
    code: "GN",
    emoji: "🇬🇳",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Conakry",
  },
  {
    name: "Guinea-Bissau",
    code: "GW",
    emoji: "🇬🇼",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Bissau",
  },
  {
    name: "Honduras",
    code: "HN",
    emoji: "🇭🇳",
    timezone: "UTC-6",
    ianaTimezone: "America/Tegucigalpa",
  },
  {
    name: "Grenada",
    code: "GD",
    emoji: "🇬🇩",
    timezone: "UTC-4",
    ianaTimezone: "America/Grenada",
  },
  {
    name: "Greece",
    code: "GR",
    emoji: "🇬🇷",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Athens",
  },
  {
    name: "Georgia",
    code: "GE",
    emoji: "🇬🇪",
    timezone: "UTC+4",
    ianaTimezone: "Asia/Tbilisi",
  },
  {
    name: "Djibouti",
    code: "DJ",
    emoji: "🇩🇯",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Djibouti",
  },
  {
    name: "Dominica",
    code: "DM",
    emoji: "🇩🇲",
    timezone: "UTC-4",
    ianaTimezone: "America/Dominica",
  },
  {
    name: "Dominican Republic",
    code: "DO",
    emoji: "🇩🇴",
    timezone: "UTC-4",
    ianaTimezone: "America/Santo_Domingo",
  },
  {
    name: "DR Congo",
    code: "CD",
    emoji: "🇨🇩",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Kinshasa",
  },
  {
    name: "Ecuador",
    code: "EC",
    emoji: "🇪🇨",
    timezone: "UTC-5",
    ianaTimezone: "America/Guayaquil",
  },
  {
    name: "Equatorial Guinea",
    code: "GQ",
    emoji: "🇬🇶",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Malabo",
  },
  {
    name: "Eritrea",
    code: "ER",
    emoji: "🇪🇷",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Asmara",
  },
  {
    name: "Eswatini",
    code: "SZ",
    emoji: "🇸🇿",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Mbabane",
  },
  {
    name: "Estonia",
    code: "EE",
    emoji: "🇪🇪",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Tallinn",
  },
  {
    name: "Ethiopia",
    code: "ET",
    emoji: "🇪🇹",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Addis_Ababa",
  },
  {
    name: "Yemen",
    code: "YE",
    emoji: "🇾🇪",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Aden",
  },
  {
    name: "Zambia",
    code: "ZM",
    emoji: "🇿🇲",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Lusaka",
  },
  {
    name: "Zimbabwe",
    code: "ZW",
    emoji: "🇿🇼",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Harare",
  },
  {
    name: "Iran",
    code: "IR",
    emoji: "🇮🇷",
    timezone: "UTC+3:30",
    ianaTimezone: "Asia/Tehran",
  },
  {
    name: "Iceland",
    code: "IS",
    emoji: "🇮🇸",
    timezone: "UTC+0",
    ianaTimezone: "Atlantic/Reykjavik",
  },
  {
    name: "Iraq",
    code: "IQ",
    emoji: "🇮🇶",
    timezone: "UTC+3",
    ianaTimezone: "Asia/Baghdad",
  },
  {
    name: "Jordan",
    code: "JO",
    emoji: "🇯🇴",
    timezone: "UTC+2",
    ianaTimezone: "Asia/Amman",
  },
  {
    name: "Cape Verde",
    code: "CV",
    emoji: "🇨🇻",
    timezone: "UTC-1",
    ianaTimezone: "Atlantic/Cape_Verde",
  },
  {
    name: "Kazakhstan",
    code: "KZ",
    emoji: "🇰🇿",
    timezone: "UTC+5",
    ianaTimezone: "Asia/Almaty",
  },
  {
    name: "Cambodia",
    code: "KH",
    emoji: "🇰🇭",
    timezone: "UTC+7",
    ianaTimezone: "Asia/Phnom_Penh",
  },
  {
    name: "Cameroon",
    code: "CM",
    emoji: "🇨🇲",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Douala",
  },
  {
    name: "Kenya",
    code: "KE",
    emoji: "🇰🇪",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Nairobi",
  },
  {
    name: "Kyrgyzstan",
    code: "KG",
    emoji: "🇰🇬",
    timezone: "UTC+6",
    ianaTimezone: "Asia/Bishkek",
  },
  {
    name: "Cyprus",
    code: "CY",
    emoji: "🇨🇾",
    timezone: "UTC+2",
    ianaTimezone: "Asia/Nicosia",
  },
  {
    name: "Kiribati",
    code: "KI",
    emoji: "🇰🇮",
    timezone: "UTC+13",
    ianaTimezone: "Pacific/Kiritimati",
  },
  {
    name: "Colombia",
    code: "CO",
    emoji: "🇨🇴",
    timezone: "UTC-5",
    ianaTimezone: "America/Bogota",
  },
  {
    name: "Comoros",
    code: "KM",
    emoji: "🇰🇲",
    timezone: "UTC+4",
    ianaTimezone: "Indian/Comoro",
  },
  {
    name: "Costa Rica",
    code: "CR",
    emoji: "🇨🇷",
    timezone: "UTC-6",
    ianaTimezone: "America/Costa_Rica",
  },
  {
    name: "Ivory Coast",
    code: "CI",
    emoji: "🇨🇮",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Abidjan",
  },
  {
    name: "Cuba",
    code: "CU",
    emoji: "🇨🇺",
    timezone: "UTC-5",
    ianaTimezone: "America/Havana",
  },
  {
    name: "Laos",
    code: "LA",
    emoji: "🇱🇦",
    timezone: "UTC+7",
    ianaTimezone: "Asia/Vientiane",
  },
  {
    name: "Latvia",
    code: "LV",
    emoji: "🇱🇻",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Riga",
  },
  {
    name: "Lesotho",
    code: "LS",
    emoji: "🇱🇸",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Maseru",
  },
  {
    name: "Lithuania",
    code: "LT",
    emoji: "🇱🇹",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Vilnius",
  },
  {
    name: "Liberia",
    code: "LR",
    emoji: "🇱🇷",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Monrovia",
  },
  {
    name: "Lebanon",
    code: "LB",
    emoji: "🇱🇧",
    timezone: "UTC+2",
    ianaTimezone: "Asia/Beirut",
  },
  {
    name: "Libya",
    code: "LY",
    emoji: "🇱🇾",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Tripoli",
  },
  {
    name: "Liechtenstein",
    code: "LI",
    emoji: "🇱🇮",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Vaduz",
  },
  {
    name: "Luxembourg",
    code: "LU",
    emoji: "🇱🇺",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Luxembourg",
  },
  {
    name: "Myanmar",
    code: "MM",
    emoji: "🇲🇲",
    timezone: "UTC+6:30",
    ianaTimezone: "Asia/Yangon",
  },
  {
    name: "Mauritius",
    code: "MU",
    emoji: "🇲🇺",
    timezone: "UTC+4",
    ianaTimezone: "Indian/Mauritius",
  },
  {
    name: "Mauritania",
    code: "MR",
    emoji: "🇲🇷",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Nouakchott",
  },
  {
    name: "Madagascar",
    code: "MG",
    emoji: "🇲🇬",
    timezone: "UTC+3",
    ianaTimezone: "Indian/Antananarivo",
  },
  {
    name: "Malawi",
    code: "MW",
    emoji: "🇲🇼",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Blantyre",
  },
  {
    name: "Mali",
    code: "ML",
    emoji: "🇲🇱",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Bamako",
  },
  {
    name: "Maldives",
    code: "MV",
    emoji: "🇲🇻",
    timezone: "UTC+5",
    ianaTimezone: "Indian/Maldives",
  },
  {
    name: "Malta",
    code: "MT",
    emoji: "🇲🇹",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Malta",
  },
  {
    name: "Morocco",
    code: "MA",
    emoji: "🇲🇦",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Casablanca",
  },
  {
    name: "Marshall Islands",
    code: "MH",
    emoji: "🇲🇭",
    timezone: "UTC+12",
    ianaTimezone: "Pacific/Majuro",
  },
  {
    name: "Mozambique",
    code: "MZ",
    emoji: "🇲🇿",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Maputo",
  },
  {
    name: "Moldova",
    code: "MD",
    emoji: "🇲🇩",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Chisinau",
  },
  {
    name: "Monaco",
    code: "MC",
    emoji: "🇲🇨",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Monaco",
  },
  {
    name: "Mongolia",
    code: "MN",
    emoji: "🇲🇳",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Ulaanbaatar",
  },
  {
    name: "Namibia",
    code: "NA",
    emoji: "🇳🇦",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Windhoek",
  },
  {
    name: "Nauru",
    code: "NR",
    emoji: "🇳🇷",
    timezone: "UTC+12",
    ianaTimezone: "Pacific/Nauru",
  },
  {
    name: "Nepal",
    code: "NP",
    emoji: "🇳🇵",
    timezone: "UTC+5:45",
    ianaTimezone: "Asia/Kathmandu",
  },
  {
    name: "Niger",
    code: "NE",
    emoji: "🇳🇪",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Niamey",
  },
  {
    name: "Nicaragua",
    code: "NI",
    emoji: "🇳🇮",
    timezone: "UTC-6",
    ianaTimezone: "America/Managua",
  },
  {
    name: "Oman",
    code: "OM",
    emoji: "🇴🇲",
    timezone: "UTC+4",
    ianaTimezone: "Asia/Muscat",
  },
  {
    name: "Pakistan",
    code: "PK",
    emoji: "🇵🇰",
    timezone: "UTC+5",
    ianaTimezone: "Asia/Karachi",
  },
  {
    name: "Palau",
    code: "PW",
    emoji: "🇵🇼",
    timezone: "UTC+9",
    ianaTimezone: "Pacific/Palau",
  },
  {
    name: "Panama",
    code: "PA",
    emoji: "🇵🇦",
    timezone: "UTC-5",
    ianaTimezone: "America/Panama",
  },
  {
    name: "Papua New Guinea",
    code: "PG",
    emoji: "🇵🇬",
    timezone: "UTC+10",
    ianaTimezone: "Pacific/Port_Moresby",
  },
  {
    name: "Paraguay",
    code: "PY",
    emoji: "🇵🇾",
    timezone: "UTC-4",
    ianaTimezone: "America/Asuncion",
  },
  {
    name: "Peru",
    code: "PE",
    emoji: "🇵🇪",
    timezone: "UTC-5",
    ianaTimezone: "America/Lima",
  },
  {
    name: "South Sudan",
    code: "SS",
    emoji: "🇸🇸",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Juba",
  },
  {
    name: "North Korea",
    code: "KP",
    emoji: "🇰🇵",
    timezone: "UTC+8:30",
    ianaTimezone: "Asia/Pyongyang",
  },
  {
    name: "North Macedonia",
    code: "MK",
    emoji: "🇲🇰",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Skopje",
  },
  {
    name: "Portugal",
    code: "PT",
    emoji: "🇵🇹",
    timezone: "UTC+0",
    ianaTimezone: "Europe/Lisbon",
  },
  {
    name: "Republic of the Congo",
    code: "CG",
    emoji: "🇨🇬",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Brazzaville",
  },
  {
    name: "Russia",
    code: "RU",
    emoji: "🇷🇺",
    timezone: "UTC+3",
    ianaTimezone: "Europe/Moscow",
  },
  {
    name: "Rwanda",
    code: "RW",
    emoji: "🇷🇼",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Kigali",
  },
  {
    name: "Romania",
    code: "RO",
    emoji: "🇷🇴",
    timezone: "UTC+2",
    ianaTimezone: "Europe/Bucharest",
  },
  {
    name: "El Salvador",
    code: "SV",
    emoji: "🇸🇻",
    timezone: "UTC-6",
    ianaTimezone: "America/El_Salvador",
  },
  {
    name: "Samoa",
    code: "WS",
    emoji: "🇼🇸",
    timezone: "UTC+13",
    ianaTimezone: "Pacific/Apia",
  },
  {
    name: "San Marino",
    code: "SM",
    emoji: "🇸🇲",
    timezone: "UTC+1",
    ianaTimezone: "Europe/San_Marino",
  },
  {
    name: "Sao Tome and Principe",
    code: "ST",
    emoji: "🇸🇹",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Sao_Tome",
  },
  {
    name: "Seychelles",
    code: "SC",
    emoji: "🇸🇨",
    timezone: "UTC+4",
    ianaTimezone: "Indian/Mahe",
  },
  {
    name: "Senegal",
    code: "SN",
    emoji: "🇸🇳",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Dakar",
  },
  {
    name: "Saint Vincent and the Grenadines",
    code: "VC",
    emoji: "🇻🇨",
    timezone: "UTC-4",
    ianaTimezone: "America/St_Vincent",
  },
  {
    name: "Saint Kitts and Nevis",
    code: "KN",
    emoji: "🇰🇳",
    timezone: "UTC-4",
    ianaTimezone: "America/St_Kitts",
  },
  {
    name: "Saint Lucia",
    code: "LC",
    emoji: "🇱🇨",
    timezone: "UTC-4",
    ianaTimezone: "America/St_Lucia",
  },
  {
    name: "Serbia",
    code: "RS",
    emoji: "🇷🇸",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Belgrade",
  },
  {
    name: "Syria",
    code: "SY",
    emoji: "🇸🇾",
    timezone: "UTC+2",
    ianaTimezone: "Asia/Damascus",
  },
  {
    name: "Slovakia",
    code: "SK",
    emoji: "🇸🇰",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Bratislava",
  },
  {
    name: "Slovenia",
    code: "SI",
    emoji: "🇸🇮",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Ljubljana",
  },
  {
    name: "Solomon Islands",
    code: "SB",
    emoji: "🇸🇧",
    timezone: "UTC+11",
    ianaTimezone: "Pacific/Guadalcanal",
  },
  {
    name: "Somalia",
    code: "SO",
    emoji: "🇸🇴",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Mogadishu",
  },
  {
    name: "Sudan",
    code: "SD",
    emoji: "🇸🇩",
    timezone: "UTC+2",
    ianaTimezone: "Africa/Khartoum",
  },
  {
    name: "Suriname",
    code: "SR",
    emoji: "🇸🇷",
    timezone: "UTC-3",
    ianaTimezone: "America/Paramaribo",
  },
  {
    name: "East Timor",
    code: "TL",
    emoji: "🇹🇱",
    timezone: "UTC+9",
    ianaTimezone: "Asia/Dili",
  },
  {
    name: "Sierra Leone",
    code: "SL",
    emoji: "🇸🇱",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Freetown",
  },
  {
    name: "Tajikistan",
    code: "TJ",
    emoji: "🇹🇯",
    timezone: "UTC+5",
    ianaTimezone: "Asia/Dushanbe",
  },
  {
    name: "Tanzania",
    code: "TZ",
    emoji: "🇹🇿",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Dar_es_Salaam",
  },
  {
    name: "Togo",
    code: "TG",
    emoji: "🇹🇬",
    timezone: "UTC+0",
    ianaTimezone: "Africa/Lome",
  },
  {
    name: "Tonga",
    code: "TO",
    emoji: "🇹🇴",
    timezone: "UTC+13",
    ianaTimezone: "Pacific/Tongatapu",
  },
  {
    name: "Trinidad and Tobago",
    code: "TT",
    emoji: "🇹🇹",
    timezone: "UTC-5",
    ianaTimezone: "America/Port_of_Spain",
  },
  {
    name: "Tuvalu",
    code: "TV",
    emoji: "🇹🇻",
    timezone: "UTC+12",
    ianaTimezone: "Pacific/Funafuti",
  },
  {
    name: "Tunisia",
    code: "TN",
    emoji: "🇹🇳",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Tunis",
  },
  {
    name: "Turkmenistan",
    code: "TM",
    emoji: "🇹🇲",
    timezone: "UTC+5",
    ianaTimezone: "Asia/Ashgabat",
  },
  {
    name: "Uganda",
    code: "UG",
    emoji: "🇺🇬",
    timezone: "UTC+3",
    ianaTimezone: "Africa/Kampala",
  },
  {
    name: "Hungary",
    code: "HU",
    emoji: "🇭🇺",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Budapest",
  },
  {
    name: "Uzbekistan",
    code: "UZ",
    emoji: "🇺🇿",
    timezone: "UTC+5",
    ianaTimezone: "Asia/Tashkent",
  },
  {
    name: "Uruguay",
    code: "UY",
    emoji: "🇺🇾",
    timezone: "UTC-3",
    ianaTimezone: "America/Montevideo",
  },
  {
    name: "Federated States of Micronesia",
    code: "FM",
    emoji: "🇫🇲",
    timezone: "UTC+10",
    ianaTimezone: "Pacific/Ponape",
  },
  {
    name: "Fiji",
    code: "FJ",
    emoji: "🇫🇯",
    timezone: "UTC+12",
    ianaTimezone: "Pacific/Fiji",
  },
  {
    name: "Philippines",
    code: "PH",
    emoji: "🇵🇭",
    timezone: "UTC+8",
    ianaTimezone: "Asia/Manila",
  },
  {
    name: "Croatia",
    code: "HR",
    emoji: "🇭🇷",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Zagreb",
  },
  {
    name: "Central African Republic",
    code: "CF",
    emoji: "🇨🇫",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Bangui",
  },
  {
    name: "Chad",
    code: "TD",
    emoji: "🇹🇩",
    timezone: "UTC+1",
    ianaTimezone: "Africa/Ndjamena",
  },
  {
    name: "Czechia",
    code: "CZ",
    emoji: "🇨🇿",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Prague",
  },
  {
    name: "Chile",
    code: "CL",
    emoji: "🇨🇱",
    timezone: "UTC-4",
    ianaTimezone: "America/Santiago",
  },
  {
    name: "Montenegro",
    code: "ME",
    emoji: "🇲🇪",
    timezone: "UTC+1",
    ianaTimezone: "Europe/Podgorica",
  },
  {
    name: "Sri Lanka",
    code: "LK",
    emoji: "🇱🇰",
    timezone: "UTC+5:30",
    ianaTimezone: "Asia/Colombo",
  },
  {
    name: "Jamaica",
    code: "JM",
    emoji: "🇯🇲",
    timezone: "UTC-5",
    ianaTimezone: "America/Jamaica",
  },
];

const consultationLanguages = [
  { name: "countries.Philippines", code: "PH", emoji: "🇵🇭", timezone: "UTC+8" },
  { name: "countries.Croatia", code: "HR", emoji: "🇭🇷", timezone: "UTC+1" },
  { name: "countries.Chad", code: "TD", emoji: "🇹🇩", timezone: "UTC+1" },
  { name: "countries.Czechia", code: "CZ", emoji: "🇨🇿", timezone: "UTC+1" },
  { name: "countries.Chile", code: "CL", emoji: "🇨🇱", timezone: "UTC-4" },
  { name: "countries.Montenegro", code: "ME", emoji: "🇲🇪", timezone: "UTC+1" },
  {
    name: "countries.Sri Lanka",
    code: "LK",
    emoji: "🇱🇰",
    timezone: "UTC+5:30",
  },
  { name: "countries.Jamaica", code: "JM", emoji: "🇯🇲", timezone: "UTC-5" },
  { name: "countries.Ukraine", code: "uk", emoji: "🇺🇦", timezone: "UTC+2" },
  {
    name: "countries.United Kingdom",
    code: "en",
    emoji: "🇬🇧",
    timezone: "UTC+0",
  },
  { name: "countries.United States", code: "US", emoji: "🇺🇸", timezone: "UTC-5" },
  { name: "countries.Canada", code: "CA", emoji: "🇨🇦", timezone: "UTC-6" },
  { name: "countries.Germany", code: "ge", emoji: "🇩🇪", timezone: "UTC+1" },
  { name: "countries.France", code: "FR", emoji: "🇫🇷", timezone: "UTC+1" },
  { name: "countries.Poland", code: "PL", emoji: "🇵🇱", timezone: "UTC+1" },
  { name: "countries.Italy", code: "IT", emoji: "🇮🇹", timezone: "UTC+1" },
  { name: "countries.Spain", code: "ES", emoji: "🇪🇸", timezone: "UTC+1" },
  { name: "countries.Japan", code: "JP", emoji: "🇯🇵", timezone: "UTC+9" },
  { name: "countries.China", code: "CN", emoji: "🇨🇳", timezone: "UTC+8" },
  { name: "countries.India", code: "IN", emoji: "🇮🇳", timezone: "UTC+5:30" },
  { name: "countries.Australia", code: "AU", emoji: "🇦🇺", timezone: "UTC+10" },
  { name: "countries.Brazil", code: "BR", emoji: "🇧🇷", timezone: "UTC-3" },
  { name: "countries.Turkey", code: "TR", emoji: "🇹🇷", timezone: "UTC+3" },
  { name: "countries.Sweden", code: "SE", emoji: "🇸🇪", timezone: "UTC+1" },
  { name: "countries.Switzerland", code: "CH", emoji: "🇨🇭", timezone: "UTC+1" },
  { name: "countries.Netherlands", code: "NL", emoji: "🇳🇱", timezone: "UTC+1" },
  { name: "countries.Norway", code: "NO", emoji: "🇳🇴", timezone: "UTC+1" },
  { name: "countries.Denmark", code: "DK", emoji: "🇩🇰", timezone: "UTC+1" },
  { name: "countries.Finland", code: "FI", emoji: "🇫🇮", timezone: "UTC+2" },
  {
    name: "countries.South Africa",
    code: "ZA",
    emoji: "🇿🇦",
    timezone: "UTC+2",
  },
  { name: "countries.Mexico", code: "MX", emoji: "🇲🇽", timezone: "UTC-6" },
  { name: "countries.South Korea", code: "KR", emoji: "🇰🇷", timezone: "UTC+9" },
  { name: "countries.Argentina", code: "AR", emoji: "🇦🇷", timezone: "UTC-3" },
  { name: "countries.Ireland", code: "IE", emoji: "🇮🇪", timezone: "UTC+0" },
  {
    name: "countries.New Zealand",
    code: "NZ",
    emoji: "🇳🇿",
    timezone: "UTC+12",
  },
  { name: "countries.Singapore", code: "SG", emoji: "🇸🇬", timezone: "UTC+8" },
  { name: "countries.Israel", code: "IL", emoji: "🇮🇱", timezone: "UTC+2" },
  { name: "countries.Malaysia", code: "MY", emoji: "🇲🇾", timezone: "UTC+8" },
  { name: "countries.Thailand", code: "TH", emoji: "🇹🇭", timezone: "UTC+7" },
  { name: "countries.Vietnam", code: "VN", emoji: "🇻🇳", timezone: "UTC+7" },
  { name: "countries.Indonesia", code: "ID", emoji: "🇮🇩", timezone: "UTC+8" },
  { name: "countries.Egypt", code: "EG", emoji: "🇪🇬", timezone: "UTC+2" },
  { name: "countries.Nigeria", code: "NG", emoji: "🇳🇬", timezone: "UTC+1" },
  {
    name: "countries.Saudi Arabia",
    code: "SA",
    emoji: "🇸🇦",
    timezone: "UTC+3",
  },
  {
    name: "countries.United Arab Emirates",
    code: "AE",
    emoji: "🇦🇪",
    timezone: "UTC+4",
  },
  { name: "countries.Kuwait", code: "KW", emoji: "🇰🇼", timezone: "UTC+3" },
  { name: "countries.Qatar", code: "QA", emoji: "🇶🇦", timezone: "UTC+3" },
  { name: "countries.Austria", code: "AT", emoji: "🇦🇹", timezone: "UTC+1" },
  { name: "countries.Azerbaijan", code: "AZ", emoji: "🇦🇿", timezone: "UTC+4" },
  { name: "countries.Albania", code: "AL", emoji: "🇦🇱", timezone: "UTC+1" },
  { name: "countries.Algeria", code: "DZ", emoji: "🇩🇿", timezone: "UTC+1" },
  { name: "countries.Angola", code: "AO", emoji: "🇦🇴", timezone: "UTC+1" },
  { name: "countries.Andorra", code: "AD", emoji: "🇦🇩", timezone: "UTC+1" },
  {
    name: "countries.Antigua and Barbuda",
    code: "AG",
    emoji: "🇦🇬",
    timezone: "UTC-4",
  },
  {
    name: "countries.Afghanistan",
    code: "AF",
    emoji: "🇦🇫",
    timezone: "UTC+4:30",
  },
  { name: "countries.Bahamas", code: "BS", emoji: "🇧🇸", timezone: "UTC-5" },
  { name: "countries.Bangladesh", code: "BD", emoji: "🇧🇩", timezone: "UTC+6" },
  { name: "countries.Barbados", code: "BB", emoji: "🇧🇧", timezone: "UTC-4" },
  { name: "countries.Bahrain", code: "BH", emoji: "🇧🇭", timezone: "UTC+3" },
  { name: "countries.Belize", code: "BZ", emoji: "🇧🇿", timezone: "UTC-6" },
  { name: "countries.Belgium", code: "BE", emoji: "🇧🇪", timezone: "UTC+1" },
  { name: "countries.Benin", code: "BJ", emoji: "🇧🇯", timezone: "UTC+1" },
  { name: "countries.Belarus", code: "BY", emoji: "🇧🇾", timezone: "UTC+3" },
  { name: "countries.Bulgaria", code: "BG", emoji: "🇧🇬", timezone: "UTC+2" },
  { name: "countries.Bolivia", code: "BO", emoji: "🇧🇴", timezone: "UTC-4" },
  {
    name: "countries.Bosnia and Herzegovina",
    code: "BA",
    emoji: "🇧🇦",
    timezone: "UTC+1",
  },
  { name: "countries.Botswana", code: "BW", emoji: "🇧🇼", timezone: "UTC+2" },
  { name: "countries.Brunei", code: "BN", emoji: "🇧🇳", timezone: "UTC+8" },
  {
    name: "countries.Burkina Faso",
    code: "BF",
    emoji: "🇧🇫",
    timezone: "UTC+0",
  },
  { name: "countries.Burundi", code: "BI", emoji: "🇧🇮", timezone: "UTC+2" },
  { name: "countries.Bhutan", code: "BT", emoji: "🇧🇹", timezone: "UTC+6" },
  { name: "countries.Vanuatu", code: "VU", emoji: "🇻🇺", timezone: "UTC+11" },
  { name: "countries.Venezuela", code: "VE", emoji: "🇻🇪", timezone: "UTC-4" },
  { name: "countries.Armenia", code: "AM", emoji: "🇦🇲", timezone: "UTC+4" },
  { name: "countries.Gabon", code: "GA", emoji: "🇬🇦", timezone: "UTC+1" },
  { name: "countries.Haiti", code: "HT", emoji: "🇭🇹", timezone: "UTC-5" },
  { name: "countries.Gambia", code: "GM", emoji: "🇬🇲", timezone: "UTC+0" },
  { name: "countries.Ghana", code: "GH", emoji: "🇬🇭", timezone: "UTC+0" },
  { name: "countries.Guyana", code: "GY", emoji: "🇬🇾", timezone: "UTC-4" },
  { name: "countries.Guatemala", code: "GT", emoji: "🇬🇹", timezone: "UTC-6" },
  { name: "countries.Guinea", code: "GN", emoji: "🇬🇳", timezone: "UTC+0" },
  {
    name: "countries.Guinea-Bissau",
    code: "GW",
    emoji: "🇬🇼",
    timezone: "UTC+0",
  },
  { name: "countries.Honduras", code: "HN", emoji: "🇭🇳", timezone: "UTC-6" },
  { name: "countries.Grenada", code: "GD", emoji: "🇬🇩", timezone: "UTC-4" },
  { name: "countries.Greece", code: "GR", emoji: "🇬🇷", timezone: "UTC+2" },
  { name: "countries.Georgia", code: "GE", emoji: "🇬🇪", timezone: "UTC+4" },
  { name: "countries.Djibouti", code: "DJ", emoji: "🇩🇯", timezone: "UTC+3" },
  { name: "countries.Dominica", code: "DM", emoji: "🇩🇲", timezone: "UTC-4" },
  {
    name: "countries.Dominican Republic",
    code: "DO",
    emoji: "🇩🇴",
    timezone: "UTC-4",
  },
  { name: "countries.DR Congo", code: "CD", emoji: "🇨🇩", timezone: "UTC+1" },
  { name: "countries.Ecuador", code: "EC", emoji: "🇪🇨", timezone: "UTC-5" },
  {
    name: "countries.Equatorial Guinea",
    code: "GQ",
    emoji: "🇬🇶",
    timezone: "UTC+1",
  },
  { name: "countries.Eritrea", code: "ER", emoji: "🇪🇷", timezone: "UTC+3" },
  { name: "countries.Eswatini", code: "SZ", emoji: "🇸🇿", timezone: "UTC+2" },
  { name: "countries.Estonia", code: "EE", emoji: "🇪🇪", timezone: "UTC+2" },
  { name: "countries.Ethiopia", code: "ET", emoji: "🇪🇹", timezone: "UTC+3" },
  { name: "countries.Yemen", code: "YE", emoji: "🇾🇪", timezone: "UTC+3" },
  { name: "countries.Zambia", code: "ZM", emoji: "🇿🇲", timezone: "UTC+2" },
  { name: "countries.Zimbabwe", code: "ZW", emoji: "🇿🇼", timezone: "UTC+2" },
  { name: "countries.Iran", code: "IR", emoji: "🇮🇷", timezone: "UTC+3:30" },
  { name: "countries.Iceland", code: "IS", emoji: "🇮🇸", timezone: "UTC+0" },
  { name: "countries.Iraq", code: "IQ", emoji: "🇮🇶", timezone: "UTC+3" },
  { name: "countries.Jordan", code: "JO", emoji: "🇯🇴", timezone: "UTC+2" },
  { name: "countries.Cape Verde", code: "CV", emoji: "🇨🇻", timezone: "UTC-1" },
  { name: "countries.Kazakhstan", code: "KZ", emoji: "🇰🇿", timezone: "UTC+5" },
  { name: "countries.Cambodia", code: "KH", emoji: "🇰🇭", timezone: "UTC+7" },
  { name: "countries.Cameroon", code: "CM", emoji: "🇨🇲", timezone: "UTC+1" },
  { name: "countries.Kenya", code: "KE", emoji: "🇰🇪", timezone: "UTC+3" },
  { name: "countries.Kyrgyzstan", code: "KG", emoji: "🇰🇬", timezone: "UTC+6" },
  { name: "countries.Cyprus", code: "CY", emoji: "🇨🇾", timezone: "UTC+2" },
  { name: "countries.Kiribati", code: "KI", emoji: "🇰🇮", timezone: "UTC+13" },
  { name: "countries.Colombia", code: "CO", emoji: "🇨🇴", timezone: "UTC-5" },
  { name: "countries.Comoros", code: "KM", emoji: "🇰🇲", timezone: "UTC+4" },
  { name: "countries.Costa Rica", code: "CR", emoji: "🇨🇷", timezone: "UTC-6" },
  { name: "countries.Ivory Coast", code: "CI", emoji: "🇨🇮", timezone: "UTC+0" },
  { name: "countries.Cuba", code: "CU", emoji: "🇨🇺", timezone: "UTC-5" },
  { name: "countries.Laos", code: "LA", emoji: "🇱🇦", timezone: "UTC+7" },
  { name: "countries.Latvia", code: "LV", emoji: "🇱🇻", timezone: "UTC+2" },
  { name: "countries.Lesotho", code: "LS", emoji: "🇱🇸", timezone: "UTC+2" },
  { name: "countries.Lithuania", code: "LT", emoji: "🇱🇹", timezone: "UTC+2" },
  { name: "countries.Liberia", code: "LR", emoji: "🇱🇷", timezone: "UTC+0" },
  { name: "countries.Lebanon", code: "LB", emoji: "🇱🇧", timezone: "UTC+2" },
  { name: "countries.Libya", code: "LY", emoji: "🇱🇾", timezone: "UTC+1" },
  {
    name: "countries.Liechtenstein",
    code: "LI",
    emoji: "🇱🇮",
    timezone: "UTC+1",
  },
  { name: "countries.Luxembourg", code: "LU", emoji: "🇱🇺", timezone: "UTC+1" },
  { name: "countries.Myanmar", code: "MM", emoji: "🇲🇲", timezone: "UTC+6:30" },
  { name: "countries.Mauritius", code: "MU", emoji: "🇲🇺", timezone: "UTC+4" },
  { name: "countries.Mauritania", code: "MR", emoji: "🇲🇷", timezone: "UTC+0" },
  {
    name: "countries.Madagascar",
    code: "MG",
    emoji: "🇲🇬",
    timezone: "UTC+3",
  },
  { name: "countries.Malawi", code: "MW", emoji: "🇲🇼", timezone: "UTC+2" },
  { name: "countries.Mali", code: "ML", emoji: "🇲🇱", timezone: "UTC+0" },
  { name: "countries.Maldives", code: "MV", emoji: "🇲🇻", timezone: "UTC+5" },
  { name: "countries.Malta", code: "MT", emoji: "🇲🇹", timezone: "UTC+1" },
  { name: "countries.Morocco", code: "MA", emoji: "🇲🇦", timezone: "UTC+1" },
  {
    name: "countries.Marshall Islands",
    code: "MH",
    emoji: "🇲🇭",
    timezone: "UTC+12",
  },
  { name: "countries.Mozambique", code: "MZ", emoji: "🇲🇿", timezone: "UTC+2" },
  { name: "countries.Moldova", code: "MD", emoji: "🇲🇩", timezone: "UTC+2" },
  { name: "countries.Monaco", code: "MC", emoji: "🇲🇨", timezone: "UTC+1" },
  { name: "countries.Mongolia", code: "MN", emoji: "🇲🇳", timezone: "UTC+8" },
  { name: "countries.Namibia", code: "NA", emoji: "🇳🇦", timezone: "UTC+1" },
  { name: "countries.Nauru", code: "NR", emoji: "🇳🇷", timezone: "UTC+12" },
  { name: "countries.Nepal", code: "NP", emoji: "🇳🇵", timezone: "UTC+5:45" },
  { name: "countries.Niger", code: "NE", emoji: "🇳🇪", timezone: "UTC+1" },
  { name: "countries.Nicaragua", code: "NI", emoji: "🇳🇮", timezone: "UTC-6" },
  { name: "countries.Oman", code: "OM", emoji: "🇴🇲", timezone: "UTC+4" },
  { name: "countries.Pakistan", code: "PK", emoji: "🇵🇰", timezone: "UTC+5" },
  { name: "countries.Palau", code: "PW", emoji: "🇵🇼", timezone: "UTC+9" },
  { name: "countries.Panama", code: "PA", emoji: "🇵🇦", timezone: "UTC-5" },
  {
    name: "countries.Papua New Guinea",
    code: "PG",
    emoji: "🇵🇬",
    timezone: "UTC+10",
  },
  { name: "countries.Paraguay", code: "PY", emoji: "🇵🇾", timezone: "UTC-4" },
  { name: "countries.Peru", code: "PE", emoji: "🇵🇪", timezone: "UTC-5" },
  { name: "countries.South Sudan", code: "SS", emoji: "🇸🇸", timezone: "UTC+2" },
  {
    name: "countries.North Korea",
    code: "KP",
    emoji: "🇰🇵",
    timezone: "UTC+8:30",
  },
  {
    name: "countries.North Macedonia",
    code: "MK",
    emoji: "🇲🇰",
    timezone: "UTC+1",
  },
  { name: "countries.Portugal", code: "PT", emoji: "🇵🇹", timezone: "UTC+0" },
  {
    name: "countries.Republic of the Congo",
    code: "CG",
    emoji: "🇨🇬",
    timezone: "UTC+1",
  },
  { name: "countries.Russia", code: "RU", emoji: "🇷🇺", timezone: "UTC+3" }, // Московський час
  { name: "countries.Rwanda", code: "RW", emoji: "🇷🇼", timezone: "UTC+2" },
  { name: "countries.Romania", code: "RO", emoji: "🇷🇴", timezone: "UTC+2" },
  { name: "countries.El Salvador", code: "SV", emoji: "🇸🇻", timezone: "UTC-6" },
  { name: "countries.Samoa", code: "WS", emoji: "🇼🇸", timezone: "UTC+13" },
  { name: "countries.San Marino", code: "SM", emoji: "🇸🇲", timezone: "UTC+1" },
  {
    name: "countries.Sao Tome and Principe",
    code: "ST",
    emoji: "🇸🇹",
    timezone: "UTC+0",
  },
  { name: "countries.Seychelles", code: "SC", emoji: "🇸🇨", timezone: "UTC+4" },
  { name: "countries.Senegal", code: "SN", emoji: "🇸🇳", timezone: "UTC+0" },
  {
    name: "countries.Saint Vincent and the Grenadines",
    code: "VC",
    emoji: "🇻🇨",
    timezone: "UTC-4",
  },
  {
    name: "countries.Saint Kitts and Nevis",
    code: "KN",
    emoji: "🇰🇳",
    timezone: "UTC-4",
  },
  {
    name: "countries.Saint Lucia",
    code: "LC",
    emoji: "🇱🇨",
    timezone: "UTC-4",
  },
  { name: "countries.Serbia", code: "RS", emoji: "🇷🇸", timezone: "UTC+1" },
  { name: "countries.Syria", code: "SY", emoji: "🇸🇾", timezone: "UTC+2" },
  { name: "countries.Slovakia", code: "SK", emoji: "🇸🇰", timezone: "UTC+1" },
  { name: "countries.Slovenia", code: "SI", emoji: "🇸🇮", timezone: "UTC+1" },
  {
    name: "countries.Solomon Islands",
    code: "SB",
    emoji: "🇸🇧",
    timezone: "UTC+11",
  },
  { name: "countries.Somalia", code: "SO", emoji: "🇸🇴", timezone: "UTC+3" },
  { name: "countries.Sudan", code: "SD", emoji: "🇸🇩", timezone: "UTC+2" },
  { name: "countries.Suriname", code: "SR", emoji: "🇸🇷", timezone: "UTC-3" },
  { name: "countries.East Timor", code: "TL", emoji: "🇹🇱", timezone: "UTC+9" },
  {
    name: "countries.Sierra Leone",
    code: "SL",
    emoji: "🇸🇱",
    timezone: "UTC+0",
  },
  { name: "countries.Tajikistan", code: "TJ", emoji: "🇹🇯", timezone: "UTC+5" },
  { name: "countries.Tanzania", code: "TZ", emoji: "🇹🇿", timezone: "UTC+3" },
  { name: "countries.Togo", code: "TG", emoji: "🇹🇬", timezone: "UTC+0" },
  { name: "countries.Tonga", code: "TO", emoji: "🇹🇴", timezone: "UTC+13" },
  {
    name: "countries.Trinidad and Tobago",
    code: "TT",
    emoji: "🇹🇹",
    timezone: "UTC-5",
  },
  { name: "countries.Tuvalu", code: "TV", emoji: "🇹🇻", timezone: "UTC+12" },
  { name: "countries.Tunisia", code: "TN", emoji: "🇹🇳", timezone: "UTC+1" },
  {
    name: "countries.Turkmenistan",
    code: "TM",
    emoji: "🇹🇲",
    timezone: "UTC+5",
  },
  { name: "countries.Uganda", code: "UG", emoji: "🇺🇬", timezone: "UTC+3" },
  { name: "countries.Hungary", code: "HU", emoji: "🇭🇺", timezone: "UTC+1" },
  { name: "countries.Uzbekistan", code: "UZ", emoji: "🇺🇿", timezone: "UTC+5" },
  { name: "countries.Uruguay", code: "UY", emoji: "🇺🇾", timezone: "UTC-3" },
  {
    name: "countries.Federated States of Micronesia",
    code: "FM",
    emoji: "🇫🇲",
    timezone: "UTC+10",
  },
  { name: "countries.Fiji", code: "FJ", emoji: "🇫🇯", timezone: "UTC+12" },
  {
    name: "countries.Central African Republic",
    code: "CF",
    emoji: "🇨🇫",
    timezone: "UTC+1",
  },
];
const generalAppLanguages = [
  { nameKey: "english", code: "en", emoji: "" },
  { nameKey: "ukrainian", code: "uk", emoji: "" },
];

const Anketa_Settings = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

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

  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isGeneralLanguageModalVisible, setIsGeneralLanguageModalVisible] = useState(false);
  const [isConsultationLanguageModalVisible, setIsConsultationLanguageModalVisible] = useState(false);
  const [isSpecializationModalVisible, setIsSpecializationModalVisible] = useState(false);
  const [isExperienceYearsModalVisible, setIsExperienceYearsModalVisible] = useState(false);
  const [isBankInfoModalVisible, setBankInfoModalVisible] = useState(false);
  const [isCostModalVisible, setIsCostModalVisible] = useState(false);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const [profileSaveError, setProfileSaveError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  
  const [isDeleteConfirmationModalVisible, setIsDeleteConfirmationModalVisible] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState("");
  const [passwordToDelete, setPasswordToDelete] = useState("");
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [displayedLanguageCode, setDisplayedLanguageCode] = useState(i18n.language.toUpperCase());

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };
    updateDimensions();
    const subscription = Dimensions.addEventListener("change", updateDimensions);
    return () => {
      subscription?.remove();
    };
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingProfile(false);
          return;
        }

        const { data: profileDoctorData } = await supabase
          .from("profile_doctor")
          .select("language")
          .eq("user_id", user.id)
          .single();

        if (profileDoctorData?.language && profileDoctorData.language !== i18n.language) {
          i18n.changeLanguage(profileDoctorData.language);
        }

        const { data, error } = await supabase
          .from("anketa_doctor")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setFullName(data.full_name || "");
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
        }
      } catch (err) {
        console.error("Помилка завантаження профілю:", err);
        Alert.alert(t("error_title"), t("error_fetching_profile"));
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
  const closeGeneralLanguageModal = () => setIsGeneralLanguageModalVisible(false);

  const handleGeneralLanguageSelect = async (langCode) => {
    i18n.changeLanguage(langCode);
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
    setProfileSaveError("");

    if (!fullName.trim()) {
      setProfileSaveError(t("fullname_required"));
      return;
    }
    if (selectedSpecializations.length === 0) {
      setProfileSaveError(t("specialization_required"));
      return;
    }
    if (!consultationCost.trim() || isNaN(parseFloat(consultationCost))) {
      setProfileSaveError(t("consultation_cost_required"));
      return;
    }
    if (!bankDetails.trim()) {
      setProfileSaveError(t("paymentInfoIBANRequired"));
      return;
    }
    const ibanRegex = /^UA\d{27}$/;
    if (!ibanRegex.test(bankDetails.trim().replace(/\s/g, ''))) {
      setProfileSaveError(t("paymentInfoIBANInvalid"));
      return;
    }
    if (!agreedToTerms) {
      setProfileSaveError(t("agree_to_terms_required"));
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let avatarUrl = photoUri;
      if (photoUri && !photoUri.startsWith("http")) {
        avatarUrl = await uploadFile(photoUri, "avatars", user.id, "profile");
        if (!avatarUrl) return;
      }
      let diplomaUrl = diplomaUri;
      if (diplomaUri && !diplomaUri.startsWith("http")) {
        diplomaUrl = await uploadFile(diplomaUri, "avatars", user.id, "diploma");
        if (!diplomaUrl) return;
      }
      let certUrl = certificateUri;
      if (certificateUri && !certificateUri.startsWith("http")) {
        certUrl = await uploadFile(certificateUri, "avatars", user.id, "certificate");
        if (!certUrl) return;
      }

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
        {
          text: t("cancel"),
          style: "cancel"
        },
        {
          text: t("signOut"),
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert(t("error_title"), error.message);
              } else {
                navigation.navigate("MainScreen");
              }
            } catch (err) {
              Alert.alert(t("error_title"), t("error_signing_out"));
              console.error(err);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleDeleteProfile = () => {
    setIsDeleteConfirmationModalVisible(true);
  };

  const confirmAndDeleteProfile = async () => {
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

  const { width } = dimensions;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoadingProfile ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0EB3EB" />
            <Text style={styles.loadingText}>{t("loading_profile_data")}</Text>
          </View>
        ) : (
          <View style={styles.container(width)}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Profile_doctor")}>
                <Ionicons name="arrow-back" size={24} color="#212121" />
              </TouchableOpacity>
              <Text style={styles.title}>{t("doctor_profile_title")}</Text>
              <TouchableOpacity style={styles.languageDisplayContainer} onPress={openGeneralLanguageModal}>
                <Text style={styles.languageDisplayText}>{displayedLanguageCode}</Text>
              </TouchableOpacity>
            </View>

            {doctorCheckStatus !== undefined && (
              <View style={styles.statusSectionContainer}>
                <View style={styles.doctorStatusContainer(doctorCheckStatus)}>
                  <Text style={styles.doctorStatusText}>
                    {doctorCheckStatus ? t("statusConfirmedTitle") : t("statusPendingTitle")}
                  </Text>
                </View>
                <TouchableOpacity onPress={showStatusInfo} style={styles.statusInfoIcon}>
                  <Ionicons name="information-circle-outline" size={26} color="#0EB3EB" />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.inputLabel}>{t("upload_photo")}</Text>
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
              <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickImage(setPhotoUri)}>
                <Text style={styles.uploadButtonText}>{t("upload_photo")}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutButtonAboveSearch} onPress={confirmSignOut}>
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={styles.signOutButtonText}>{t("signOut")}</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("country")}</Text>
            <TouchableOpacity style={styles.selectButton(width)} onPress={openCountryModal}>
              <Text style={styles.selectButtonText}>
                {country ? `${country.emoji} ${country.name}` : t("select_country")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("fullname")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={t("fullname_placeholder_doc")} value={fullName} onChangeText={setFullName} />
            </View>

            <Text style={styles.inputLabel}>{t("consultation_language")}</Text>
            <TouchableOpacity style={styles.selectButton(width)} onPress={openConsultationLanguageModal}>
              <Text style={styles.selectButtonTextExpanded}>
                {selectedConsultationLanguages.length > 0
                  ? selectedConsultationLanguages.map(code => consultationLanguages.find(lang => lang.code === code)?.emoji + " " + t(consultationLanguages.find(lang => lang.code === code)?.name)).join(", ")
                  : t("select_consultation_language")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("select_specialization")}</Text>
            <TouchableOpacity style={styles.selectButton(width)} onPress={openSpecializationModal}>
              <Text style={styles.selectButtonTextExpanded}>
                {selectedSpecializations.length > 0 ? selectedSpecializations.map(spec => t(spec.nameKey)).join(", ") : t("select_specialization")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("upload_diploma")}</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickImage(setDiplomaUri)}>
                <Text style={styles.uploadButtonText}>{t("upload_diploma")}</Text>
              </TouchableOpacity>
              {diplomaUri && (
                <TouchableOpacity onPress={() => openImageModal(diplomaUri)}>
                  <Image source={{ uri: diplomaUri }} style={styles.previewImage} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputLabel}>{t("upload_certificate")}</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity style={styles.uploadButton(width)} onPress={() => pickImage(setCertificateUri)}>
                <Text style={styles.uploadButtonText}>{t("upload_certificate")}</Text>
              </TouchableOpacity>
              {certificateUri && (
                <TouchableOpacity onPress={() => openImageModal(certificateUri)}>
                  <Image source={{ uri: certificateUri }} style={styles.previewImage} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputLabel}>{t("work_experience")}</Text>
            <TouchableOpacity style={styles.selectButton(width)} onPress={openExperienceYearsModal}>
              <Text style={styles.selectButtonText}>{formatYearsText(experienceYears)}</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("work_location")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={t("work_location_placeholder")} value={workLocation} onChangeText={setWorkLocation} />
            </View>

            <Text style={styles.inputLabel}>{t("achievements")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={t("achievements_placeholder")} value={achievements} onChangeText={setAchievements} multiline />
            </View>

            <Text style={styles.inputLabel}>{t("about_me_placeholder")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={t("about_me_placeholder")} value={aboutMe} onChangeText={setAboutMe} multiline numberOfLines={4} />
            </View>
            
            <Text style={styles.inputLabel}>{t("consultation_cost")}</Text>
            <TouchableOpacity style={styles.selectButton(width)} onPress={openCostModal}>
              <Text style={styles.selectButtonText}>
                {consultationCost ? `$${consultationCost}` : t("select_consultation_cost_placeholder")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t("search_tags")}</Text>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={t("search_tags_placeholder")} value={searchTags} onChangeText={setSearchTags} />
            </View>

            <View style={styles.labelWithIconContainer}>
              <Text style={styles.inputLabelText}>{t("bank_details")}</Text>
              <TouchableOpacity onPress={() => setBankInfoModalVisible(true)} style={styles.infoIcon}>
                <Ionicons name="information-circle-outline" size={24} color="#0EB3EB" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer(width)}>
              <TextInput style={styles.input} placeholder={"UA" + "X".repeat(27)} value={bankDetails} onChangeText={setBankDetails} autoCapitalize="characters" multiline={false} />
            </View>

            <View style={styles.agreementContainer}>
              <Switch trackColor={{ false: "#767577", true: "#0EB3EB" }} thumbColor={"#f4f3f4"} onValueChange={setAgreedToTerms} value={agreedToTerms} />
              <Text style={styles.agreementText}>{t("agree_to_terms")}</Text>
            </View>

            {profileSaveError ? <Text style={styles.errorText}>{profileSaveError}</Text> : null}
            <TouchableOpacity style={styles.saveProfileButton(width)} onPress={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveProfileButtonText}>{t("save_profile")}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteProfileButton(width)} onPress={handleDeleteProfile} disabled={isDeletingProfile}>
              {isDeletingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteProfileButtonText}>{t("delete_profile")}</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={isCountryModalVisible} onRequestClose={closeCountryModal}>
        <TouchableWithoutFeedback onPress={closeCountryModal}>
          <View style={styles.centeredView}><View style={[styles.modalView(width), styles.modalBorder]}><ScrollView style={styles.modalScrollView}>{countries.map(item => (<Pressable key={item.code} style={[styles.countryItem, country?.code === item.code && styles.countryItemSelected]} onPress={() => selectCountry(item)}><Text style={styles.countryEmoji}>{item.emoji}</Text><Text style={[styles.countryName, country?.code === item.code && styles.countryItemTextSelected]}>{item.name}</Text></Pressable>))}</ScrollView><Pressable style={[styles.button, styles.buttonClose]} onPress={closeCountryModal}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></View>
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
            <View style={[styles.modalView(width), styles.modalBorder]}>
              <ScrollView>
                <Text style={{ fontFamily: "Mont-Medium", fontSize: 18, position:"static" }}> {t("select_specialization")}</Text>
                {specializations.map(spec => (
                  <Pressable 
                    key={spec.value} 
                    style={[
                      styles.countryItem,
                      selectedSpecializations.some(s => s.value === spec.value) && styles.countryItemSelected,
                    ]} 
                    onPress={() => toggleSpecializationSelect(spec)}
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
                    onPress={() => selectConsultationCost(cost)}
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
        <TouchableWithoutFeedback onPress={() => setBankInfoModalVisible(false)}><View style={styles.centeredView}><TouchableWithoutFeedback><View style={[styles.modalView(width), styles.modalBorder]}><Text style={styles.modalTitle}>{t("paymentInfoTitle")}</Text><Text style={styles.infoModalText}>• {t("ibanInstruction")}</Text><Text style={styles.infoModalText}>• {t("commissionInfo")}</Text><Text style={styles.infoModalText}>• {t("paymentCondition")}</Text><Pressable style={[styles.button, styles.buttonClose, { marginTop: 20 }]} onPress={() => setBankInfoModalVisible(false)}><Text style={styles.textStyle}>{t("close")}</Text></Pressable></View></TouchableWithoutFeedback></View></TouchableWithoutFeedback>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={isImageModalVisible} onRequestClose={closeImageModal}>
        <TouchableWithoutFeedback onPress={closeImageModal}><View style={styles.fullScreenImageModalOverlay}>{selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.fullScreenImage} resizeMode="contain" />}<TouchableOpacity style={styles.closeImageModalButton} onPress={closeImageModal}><Ionicons name="close-circle" size={40} color="white" /></TouchableOpacity></View></TouchableWithoutFeedback>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={isDeleteConfirmationModalVisible} onRequestClose={() => setIsDeleteConfirmationModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsDeleteConfirmationModalVisible(false)}>
          <View style={styles.centeredView}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView(width), styles.modalBorder, styles.deleteModalView]}>
                <Text style={styles.modalTitle}>{t("deleteProfile_title")}</Text>
                <Text style={styles.infoModalText}>{t("deleteProfile_message")}</Text>
                
                <TextInput
                  style={[styles.input, styles.deleteInput]}
                  placeholder={t("email")}
                  value={emailToDelete}
                  onChangeText={setEmailToDelete}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={[styles.input, styles.deleteInput]}
                  placeholder={t("password")}
                  value={passwordToDelete}
                  onChangeText={setPasswordToDelete}
                  secureTextEntry
                />
                
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
      </Modal>

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255, 255, 255, 0.8)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#000000", fontFamily: "Mont-Regular" },
  container: (width) => ({ backgroundColor: "#fff", alignItems: "center", paddingTop: 0, paddingHorizontal: width * 0.05, width: "100%" }),
  headerContainer: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  backButton: { backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 25, width: 48, height: 48, zIndex: 1, justifyContent: "center", alignItems: "center" },
  languageDisplayContainer: { backgroundColor: "#0EB3EB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  languageDisplayText: { fontSize: 14, fontFamily: "Mont-Bold", color: "white" },
  title: { fontSize: 22, flex: 1, textAlign: "center", marginHorizontal: 10, justifyContent: "center", position: "absolute", left: 0, paddingVertical: 10, right: 0, fontFamily: "Mont-SemiBold" },
  statusSectionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 15, paddingHorizontal: 20, width: '100%' },
  doctorStatusContainer: (isConfirmed) => ({ backgroundColor: isConfirmed ? "#4CAF50" : "rgba(241, 179, 7, 0.66)", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }),
  doctorStatusText: { fontSize: 14, fontFamily: "Mont-Bold", color: "white" },
  statusInfoIcon: { marginLeft: 12 },
  inputLabel: { fontSize: 14, alignSelf: "flex-start", color: "#2A2A2A", fontFamily: "Mont-Medium", paddingHorizontal: 35, marginTop: 10, marginBottom: 5 },
  labelWithIconContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "90%", marginTop: 10, marginBottom: 5, paddingHorizontal: 5 },
  inputLabelText: { fontSize: 14, color: "#2A2A2A", fontFamily: "Mont-Medium" },
  infoIcon: { padding: 5 },
  infoModalText: { fontSize: 15, fontFamily: "Mont-Regular", color: "#333333", textAlign: "left", width: "100%", marginBottom: 12, lineHeight: 22 },
  selectButton: (width) => ({ backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 555, paddingVertical: 15, paddingHorizontal: 20, width: width * 0.9, minHeight: 52, justifyContent: "center", marginBottom: 14 }),
  selectButtonTextExpanded: { color: "black", fontSize: 16, fontFamily: "Mont-Medium", flexWrap: "wrap" },
  selectButtonText: { color: "black", fontSize: 16, fontFamily: "Mont-Medium" },
  inputContainer: (width) => ({ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(14, 179, 235, 0.2)", borderRadius: 20, paddingHorizontal: 15, marginBottom: 14, width: width * 0.9, minHeight: 52 }),
  input: { flex: 1, fontSize: 16, fontFamily: "Mont-Regular", paddingVertical: Platform.OS === "ios" ? 10 : 0 },
  uploadContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "90%", marginBottom: 10 },
  avatarUploadContainer: { flexDirection: "column", alignItems: "center", marginBottom: 20, width: "100%" },
  uploadButton: (width) => ({ backgroundColor: "#0EB3EB", borderRadius: 555, paddingVertical: 15, width: width * 0.9 * 0.75, height: 52, alignItems: "center", justifyContent: "center", marginTop: 5 }),
  uploadButtonText: { color: "#fff", fontSize: 16, fontFamily: "Mont-Medium" },
  previewImage: { width: 60, height: 60, borderRadius: 10, marginLeft: 10, resizeMode: "cover" },
  profileAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 1, borderColor: "#0EB3EB", resizeMode: "cover" },
  profileAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 1, borderColor: "#0EB3EB", backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  agreementContainer: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 30, marginTop: 10, marginBottom: 20 },
  agreementText: { fontSize: 14, fontFamily: "Mont-Regular", color: "#757575", marginLeft: 10, flexShrink: 1 },
  saveProfileButton: (width) => ({ backgroundColor: "#0EB3EB", borderRadius: 555, paddingVertical: 15, width: width * 0.9, height: 52, alignItems: "center", marginTop: 8, marginBottom: 20 }),
  saveProfileButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  errorText: { color: "red", marginBottom: 10, textAlign: "center", fontFamily: "Mont-Regular", paddingHorizontal: 20 },
  centeredView: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalView: (width) => ({ margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: width * 0.9, maxHeight: Dimensions.get("window").height * 0.8 }),
  modalBorder: { borderColor: "#0EB3EB", borderWidth: 1 },
  modalTitle: { fontSize: 20, fontFamily: 'Mont-Bold', marginBottom: 15, textAlign: 'center' },
  modalScrollView: { width: "100%" },
  countryItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, width: "100%", justifyContent: "space-between", paddingHorizontal: 15 },
  countryEmoji: { fontSize: 24, marginRight: 15 },
  countryName: { fontSize: 18, flex: 1 },
  countryItemSelected: { backgroundColor: "rgba(14, 179, 235, 0.1)", borderRadius: 10 },
  countryItemTextSelected: { fontWeight: "bold", color: "#0EB3EB" },
  button: { borderRadius: 20, padding: 10, elevation: 2, marginTop: 15, width: "100%" },
  buttonClose: { backgroundColor: "#0EB3EB" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
  languageModalContent: { backgroundColor: "white", borderRadius: 20, padding: 20, alignItems: "center", width: Dimensions.get("window").width * 0.8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, maxHeight: Dimensions.get("window").height * 0.6 },
  languageOption: { paddingVertical: 15, width: "100%", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#ECECEC" },
  languageOptionText: { fontSize: 18, fontFamily: "Mont-Regular", color: "#333333" },
  checkmarkIcon: { marginLeft: 10 },
  pickerScrollView: { width: "100%", maxHeight: 200 },
  pickerOption: { paddingVertical: 12, width: "100%", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#ECECEC" },
  pickerOptionText: { fontSize: 18, fontFamily: "Mont-Regular", color: "#333333" },
  pickerOptionSelected: { backgroundColor: "rgba(14, 179, 235, 0.1)", borderRadius: 10 },
  signOutButtonAboveSearch: { backgroundColor: "rgba(255, 0, 0, 0.7)", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, zIndex: 100, marginBottom: 20 },
  signOutButtonText: { color: "white", fontSize: 16, fontFamily: "Mont-Bold", marginLeft: 8 },
  modalContentYears: { backgroundColor: "#fff", borderRadius: 10, padding: 20, width: "80%", maxHeight: "70%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  fullScreenImageModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "center", alignItems: "center" },
  fullScreenImage: { width: "100%", height: "100%" },
  closeImageModalButton: { position: "absolute", top: Platform.OS === "ios" ? 50 : 20, right: 20, zIndex: 1 },
  deleteProfileButton: (width) => ({ backgroundColor: "#FF3B30", borderRadius: 555, paddingVertical: 15, width: width * 0.9, height: 52, alignItems: "center", marginTop: 10, marginBottom: 20 }),
  deleteProfileButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  deleteModalView: { paddingHorizontal: 20, paddingVertical: 30 },
  deleteInput: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    marginBottom: 10,
    borderColor: "#FF3B30",
    borderWidth: 1,
    color: "#000",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  }
});

export default Anketa_Settings;
