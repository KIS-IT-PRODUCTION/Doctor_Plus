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
import { supabase } from "../../providers/supabaseClient"; // Original Supabase import
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
  { value: "ent_specialist", nameKey: "categories.ent_specialist" }, // Зберігаємо оригінальний формат nameKey
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

const generateConsultationCostOptions = () => {
  const options = [];
  for (let i = 10; i < 100; ) {
    if (i < 70) i += 5;
    else if (i >= 70) i += 10;
    options.push(i);
  }
  return options;
};
const consultationCostOptions = generateConsultationCostOptions();

const experienceYearsOptions = Array.from({ length: 51 }, (_, i) => i);

// Оновлений список країн з IANA Time Zone
const countries = [
  { name: "Ukraine", code: "UA", emoji: "🇺🇦", timezone: "UTC+2", ianaTimezone: "Europe/Kiev" },
  { name: "United Kingdom", code: "GB", emoji: "🇬🇧", timezone: "UTC+0", ianaTimezone: "Europe/London" },
  { name: "United States", code: "US", emoji: "🇺🇸", timezone: "UTC-5", ianaTimezone: "America/New_York" },
  { name: "Canada", code: "CA", emoji: "🇨🇦", timezone: "UTC-6", ianaTimezone: "America/Toronto" },
  { name: "Germany", code: "DE", emoji: "🇩🇪", timezone: "UTC+1", ianaTimezone: "Europe/Berlin" },
  { name: "France", code: "FR", emoji: "🇫🇷", timezone: "UTC+1", ianaTimezone: "Europe/Paris" },
  { name: "Poland", code: "PL", emoji: "🇵🇱", timezone: "UTC+1", ianaTimezone: "Europe/Warsaw" },
  { name: "Italy", code: "IT", emoji: "🇮🇹", timezone: "UTC+1", ianaTimezone: "Europe/Rome" },
  { name: "Spain", code: "ES", emoji: "🇪🇸", timezone: "UTC+1", ianaTimezone: "Europe/Madrid" },
  { name: "Japan", code: "JP", emoji: "🇯🇵", timezone: "UTC+9", ianaTimezone: "Asia/Tokyo" },
  { name: "China", code: "CN", emoji: "🇨🇳", timezone: "UTC+8", ianaTimezone: "Asia/Shanghai" },
  { name: "India", code: "IN", emoji: "🇮🇳", timezone: "UTC+5:30", ianaTimezone: "Asia/Kolkata" },
  { name: "Australia", code: "AU", emoji: "🇦🇺", timezone: "UTC+10", ianaTimezone: "Australia/Sydney" },
  { name: "Brazil", code: "BR", emoji: "🇧🇷", timezone: "UTC-3", ianaTimezone: "America/Sao_Paulo" },
  { name: "Turkey", code: "TR", emoji: "🇹🇷", timezone: "UTC+3", ianaTimezone: "Europe/Istanbul" },
  { name: "Sweden", code: "SE", emoji: "🇸🇪", timezone: "UTC+1", ianaTimezone: "Europe/Stockholm" },
  { name: "Switzerland", code: "CH", emoji: "🇨🇭", timezone: "UTC+1", ianaTimezone: "Europe/Zurich" },
  { name: "Netherlands", code: "NL", emoji: "🇳🇱", timezone: "UTC+1", ianaTimezone: "Europe/Amsterdam" },
  { name: "Norway", code: "NO", emoji: "🇳🇴", timezone: "UTC+1", ianaTimezone: "Europe/Oslo" },
  { name: "Denmark", code: "DK", emoji: "🇩🇰", timezone: "UTC+1", ianaTimezone: "Europe/Copenhagen" },
  { name: "Finland", code: "FI", emoji: "🇫🇮", timezone: "UTC+2", ianaTimezone: "Europe/Helsinki" },
  { name: "South Africa", code: "ZA", emoji: "🇿🇦", timezone: "UTC+2", ianaTimezone: "Africa/Johannesburg" },
  { name: "Mexico", code: "MX", emoji: "🇲🇽", timezone: "UTC-6", ianaTimezone: "America/Mexico_City" },
  { name: "South Korea", code: "KR", emoji: "🇰🇷", timezone: "UTC+9", ianaTimezone: "Asia/Seoul" },
  { name: "Argentina", code: "AR", emoji: "🇦🇷", timezone: "UTC-3", ianaTimezone: "America/Argentina/Buenos_Aires" },
  { name: "Ireland", code: "IE", emoji: "🇮🇪", timezone: "UTC+0", ianaTimezone: "Europe/Dublin" },
  { name: "New Zealand", code: "NZ", emoji: "🇳🇿", timezone: "UTC+12", ianaTimezone: "Pacific/Auckland" },
  { name: "Singapore", code: "SG", emoji: "🇸🇬", timezone: "UTC+8", ianaTimezone: "Asia/Singapore" },
  { name: "Israel", code: "IL", emoji: "🇮🇱", timezone: "UTC+2", ianaTimezone: "Asia/Jerusalem" },
  { name: "Malaysia", code: "MY", emoji: "🇲🇾", timezone: "UTC+8", ianaTimezone: "Asia/Kuala_Lumpur" },
  { name: "Thailand", code: "TH", emoji: "🇹🇭", timezone: "UTC+7", ianaTimezone: "Asia/Bangkok" },
  { name: "Vietnam", code: "VN", emoji: "🇻🇳", timezone: "UTC+7", ianaTimezone: "Asia/Ho_Chi_Minh" },
  { name: "Indonesia", code: "ID", emoji: "🇮🇩", timezone: "UTC+8", ianaTimezone: "Asia/Jakarta" },
  { name: "Egypt", code: "EG", emoji: "🇪🇬", timezone: "UTC+2", ianaTimezone: "Africa/Cairo" },
  { name: "Nigeria", code: "NG", emoji: "🇳🇬", timezone: "UTC+1", ianaTimezone: "Africa/Lagos" },
  { name: "Saudi Arabia", code: "SA", emoji: "🇸🇦", timezone: "UTC+3", ianaTimezone: "Asia/Riyadh" },
  { name: "United Arab Emirates", code: "AE", emoji: "🇦🇪", timezone: "UTC+4", ianaTimezone: "Asia/Dubai" },
  { name: "Kuwait", code: "KW", emoji: "🇰🇼", timezone: "UTC+3", ianaTimezone: "Asia/Kuwait" },
  { name: "Qatar", code: "QA", emoji: "🇶🇦", timezone: "UTC+3", ianaTimezone: "Asia/Qatar" },
  { name: "Austria", code: "AT", emoji: "🇦🇹", timezone: "UTC+1", ianaTimezone: "Europe/Vienna" },
  { name: "Azerbaijan", code: "AZ", emoji: "🇦🇿", timezone: "UTC+4", ianaTimezone: "Asia/Baku" },
  { name: "Albania", code: "AL", emoji: "🇦🇱", timezone: "UTC+1", ianaTimezone: "Europe/Tirane" },
  { name: "Algeria", code: "DZ", emoji: "🇩🇿", timezone: "UTC+1", ianaTimezone: "Africa/Algiers" },
  { name: "Angola", code: "AO", emoji: "🇦🇴", timezone: "UTC+1", ianaTimezone: "Africa/Luanda" },
  { name: "Andorra", code: "AD", emoji: "🇦🇩", timezone: "UTC+1", ianaTimezone: "Europe/Andorra" },
  { name: "Antigua and Barbuda", code: "AG", emoji: "🇦🇬", timezone: "UTC-4", ianaTimezone: "America/Antigua" },
  { name: "Afghanistan", code: "AF", emoji: "🇦🇫", timezone: "UTC+4:30", ianaTimezone: "Asia/Kabul" },
  { name: "Bahamas", code: "BS", emoji: "🇧🇸", timezone: "UTC-5", ianaTimezone: "America/Nassau" },
  { name: "Bangladesh", code: "BD", emoji: "🇧🇩", timezone: "UTC+6", ianaTimezone: "Asia/Dhaka" },
  { name: "Barbados", code: "BB", emoji: "🇧🇧", timezone: "UTC-4", ianaTimezone: "America/Barbados" },
  { name: "Bahrain", code: "BH", emoji: "🇧🇭", timezone: "UTC+3", ianaTimezone: "Asia/Bahrain" },
  { name: "Belize", code: "BZ", emoji: "🇧🇿", timezone: "UTC-6", ianaTimezone: "America/Belize" },
  { name: "Belgium", code: "BE", emoji: "🇧🇪", timezone: "UTC+1", ianaTimezone: "Europe/Brussels" },
  { name: "Benin", code: "BJ", emoji: "🇧🇯", timezone: "UTC+1", ianaTimezone: "Africa/Porto-Novo" },
  { name: "Belarus", code: "BY", emoji: "🇧🇾", timezone: "UTC+3", ianaTimezone: "Europe/Minsk" },
  { name: "Bulgaria", code: "BG", emoji: "🇧🇬", timezone: "UTC+2", ianaTimezone: "Europe/Sofia" },
  { name: "Bolivia", code: "BO", emoji: "🇧🇴", timezone: "UTC-4", ianaTimezone: "America/La_Paz" },
  { name: "Bosnia and Herzegovina", code: "BA", emoji: "🇧🇦", timezone: "UTC+1", ianaTimezone: "Europe/Sarajevo" },
  { name: "Botswana", code: "BW", emoji: "🇧🇼", timezone: "UTC+2", ianaTimezone: "Africa/Gaborone" },
  { name: "Brunei", code: "BN", emoji: "🇧🇳", timezone: "UTC+8", ianaTimezone: "Asia/Brunei" },
  { name: "Burkina Faso", code: "BF", emoji: "🇧🇫", timezone: "UTC+0", ianaTimezone: "Africa/Ouagadougou" },
  { name: "Burundi", code: "BI", emoji: "🇧🇮", timezone: "UTC+2", ianaTimezone: "Africa/Bujumbura" },
  { name: "Bhutan", code: "BT", emoji: "🇧🇹", timezone: "UTC+6", ianaTimezone: "Asia/Thimphu" },
  { name: "Vanuatu", code: "VU", emoji: "🇻🇺", timezone: "UTC+11", ianaTimezone: "Pacific/Efate" },
  { name: "Venezuela", code: "VE", emoji: "🇻🇪", timezone: "UTC-4", ianaTimezone: "America/Caracas" },
  { name: "Armenia", code: "AM", emoji: "🇦🇲", timezone: "UTC+4", ianaTimezone: "Asia/Yerevan" },
  { name: "Gabon", code: "GA", emoji: "🇬🇦", timezone: "UTC+1", ianaTimezone: "Africa/Libreville" },
  { name: "Haiti", code: "HT", emoji: "🇭🇹", timezone: "UTC-5", ianaTimezone: "America/Port-au-Prince" },
  { name: "Gambia", code: "GM", emoji: "🇬🇲", timezone: "UTC+0", ianaTimezone: "Africa/Banjul" },
  { name: "Ghana", code: "GH", emoji: "🇬🇭", timezone: "UTC+0", ianaTimezone: "Africa/Accra" },
  { name: "Guyana", code: "GY", emoji: "🇬🇾", timezone: "UTC-4", ianaTimezone: "America/Guyana" },
  { name: "Guatemala", code: "GT", emoji: "🇬🇹", timezone: "UTC-6", ianaTimezone: "America/Guatemala" },
  { name: "Guinea", code: "GN", emoji: "🇬🇳", timezone: "UTC+0", ianaTimezone: "Africa/Conakry" },
  { name: "Guinea-Bissau", code: "GW", emoji: "🇬🇼", timezone: "UTC+0", ianaTimezone: "Africa/Bissau" },
  { name: "Honduras", code: "HN", emoji: "🇭🇳", timezone: "UTC-6", ianaTimezone: "America/Tegucigalpa" },
  { name: "Grenada", code: "GD", emoji: "🇬🇩", timezone: "UTC-4", ianaTimezone: "America/Grenada" },
  { name: "Greece", code: "GR", emoji: "🇬🇷", timezone: "UTC+2", ianaTimezone: "Europe/Athens" },
  { name: "Georgia", code: "GE", emoji: "🇬🇪", timezone: "UTC+4", ianaTimezone: "Asia/Tbilisi" },
  { name: "Djibouti", code: "DJ", emoji: "🇩🇯", timezone: "UTC+3", ianaTimezone: "Africa/Djibouti" },
  { name: "Dominica", code: "DM", emoji: "🇩🇲", timezone: "UTC-4", ianaTimezone: "America/Dominica" },
  { name: "Dominican Republic", code: "DO", emoji: "🇩🇴", timezone: "UTC-4", ianaTimezone: "America/Santo_Domingo" },
  { name: "DR Congo", code: "CD", emoji: "🇨🇩", timezone: "UTC+1", ianaTimezone: "Africa/Kinshasa" },
  { name: "Ecuador", code: "EC", emoji: "🇪🇨", timezone: "UTC-5", ianaTimezone: "America/Guayaquil" },
  { name: "Equatorial Guinea", code: "GQ", emoji: "🇬🇶", timezone: "UTC+1", ianaTimezone: "Africa/Malabo" },
  { name: "Eritrea", code: "ER", emoji: "🇪🇷", timezone: "UTC+3", ianaTimezone: "Africa/Asmara" },
  { name: "Eswatini", code: "SZ", emoji: "🇸🇿", timezone: "UTC+2", ianaTimezone: "Africa/Mbabane" },
  { name: "Estonia", code: "EE", emoji: "🇪🇪", timezone: "UTC+2", ianaTimezone: "Europe/Tallinn" },
  { name: "Ethiopia", code: "ET", emoji: "🇪🇹", timezone: "UTC+3", ianaTimezone: "Africa/Addis_Ababa" },
  { name: "Yemen", code: "YE", emoji: "🇾🇪", timezone: "UTC+3", ianaTimezone: "Asia/Aden" },
  { name: "Zambia", code: "ZM", emoji: "🇿🇲", timezone: "UTC+2", ianaTimezone: "Africa/Lusaka" },
  { name: "Zimbabwe", code: "ZW", emoji: "🇿🇼", timezone: "UTC+2", ianaTimezone: "Africa/Harare" },
  { name: "Iran", code: "IR", emoji: "🇮🇷", timezone: "UTC+3:30", ianaTimezone: "Asia/Tehran" },
  { name: "Iceland", code: "IS", emoji: "🇮🇸", timezone: "UTC+0", ianaTimezone: "Atlantic/Reykjavik" },
  { name: "Iraq", code: "IQ", emoji: "🇮🇶", timezone: "UTC+3", ianaTimezone: "Asia/Baghdad" },
  { name: "Jordan", code: "JO", emoji: "🇯🇴", timezone: "UTC+2", ianaTimezone: "Asia/Amman" },
  { name: "Cape Verde", code: "CV", emoji: "🇨🇻", timezone: "UTC-1", ianaTimezone: "Atlantic/Cape_Verde" },
  { name: "Kazakhstan", code: "KZ", emoji: "🇰🇿", timezone: "UTC+5", ianaTimezone: "Asia/Almaty" },
  { name: "Cambodia", code: "KH", emoji: "🇰🇭", timezone: "UTC+7", ianaTimezone: "Asia/Phnom_Penh" },
  { name: "Cameroon", code: "CM", emoji: "🇨🇲", timezone: "UTC+1", ianaTimezone: "Africa/Douala" },
  { name: "Kenya", code: "KE", emoji: "🇰🇪", timezone: "UTC+3", ianaTimezone: "Africa/Nairobi" },
  { name: "Kyrgyzstan", code: "KG", emoji: "🇰🇬", timezone: "UTC+6", ianaTimezone: "Asia/Bishkek" },
  { name: "Cyprus", code: "CY", emoji: "🇨🇾", timezone: "UTC+2", ianaTimezone: "Asia/Nicosia" },
  { name: "Kiribati", code: "KI", emoji: "🇰🇮", timezone: "UTC+13", ianaTimezone: "Pacific/Kiritimati" },
  { name: "Colombia", code: "CO", emoji: "🇨🇴", timezone: "UTC-5", ianaTimezone: "America/Bogota" },
  { name: "Comoros", code: "KM", emoji: "🇰🇲", timezone: "UTC+4", ianaTimezone: "Indian/Comoro" },
  { name: "Costa Rica", code: "CR", emoji: "🇨🇷", timezone: "UTC-6", ianaTimezone: "America/Costa_Rica" },
  { name: "Ivory Coast", code: "CI", emoji: "🇨🇮", timezone: "UTC+0", ianaTimezone: "Africa/Abidjan" },
  { name: "Cuba", code: "CU", emoji: "🇨🇺", timezone: "UTC-5", ianaTimezone: "America/Havana" },
  { name: "Laos", code: "LA", emoji: "🇱🇦", timezone: "UTC+7", ianaTimezone: "Asia/Vientiane" },
  { name: "Latvia", code: "LV", emoji: "🇱🇻", timezone: "UTC+2", ianaTimezone: "Europe/Riga" },
  { name: "Lesotho", code: "LS", emoji: "🇱🇸", timezone: "UTC+2", ianaTimezone: "Africa/Maseru" },
  { name: "Lithuania", code: "LT", emoji: "🇱🇹", timezone: "UTC+2", ianaTimezone: "Europe/Vilnius" },
  { name: "Liberia", code: "LR", emoji: "🇱🇷", timezone: "UTC+0", ianaTimezone: "Africa/Monrovia" },
  { name: "Lebanon", code: "LB", emoji: "🇱🇧", timezone: "UTC+2", ianaTimezone: "Asia/Beirut" },
  { name: "Libya", code: "LY", emoji: "🇱🇾", timezone: "UTC+1", ianaTimezone: "Africa/Tripoli" },
  { name: "Liechtenstein", code: "LI", emoji: "🇱🇮", timezone: "UTC+1", ianaTimezone: "Europe/Vaduz" },
  { name: "Luxembourg", code: "LU", emoji: "🇱🇺", timezone: "UTC+1", ianaTimezone: "Europe/Luxembourg" },
  { name: "Myanmar", code: "MM", emoji: "🇲🇲", timezone: "UTC+6:30", ianaTimezone: "Asia/Yangon" },
  { name: "Mauritius", code: "MU", emoji: "🇲🇺", timezone: "UTC+4", ianaTimezone: "Indian/Mauritius" },
  { name: "Mauritania", code: "MR", emoji: "🇲🇷", timezone: "UTC+0", ianaTimezone: "Africa/Nouakchott" },
  { name: "Madagascar", code: "MG", emoji: "🇲🇬", timezone: "UTC+3", ianaTimezone: "Indian/Antananarivo" },
  { name: "Malawi", code: "MW", emoji: "🇲🇼", timezone: "UTC+2", ianaTimezone: "Africa/Blantyre" },
  { name: "Mali", code: "ML", emoji: "🇲🇱", timezone: "UTC+0", ianaTimezone: "Africa/Bamako" },
  { name: "Maldives", code: "MV", emoji: "🇲🇻", timezone: "UTC+5", ianaTimezone: "Indian/Maldives" },
  { name: "Malta", code: "MT", emoji: "🇲🇹", timezone: "UTC+1", ianaTimezone: "Europe/Malta" },
  { name: "Morocco", code: "MA", emoji: "🇲🇦", timezone: "UTC+1", ianaTimezone: "Africa/Casablanca" },
  { name: "Marshall Islands", code: "MH", emoji: "🇲🇭", timezone: "UTC+12", ianaTimezone: "Pacific/Majuro" },
  { name: "Mozambique", code: "MZ", emoji: "🇲🇿", timezone: "UTC+2", ianaTimezone: "Africa/Maputo" },
  { name: "Moldova", code: "MD", emoji: "🇲🇩", timezone: "UTC+2", ianaTimezone: "Europe/Chisinau" },
  { name: "Monaco", code: "MC", emoji: "🇲🇨", timezone: "UTC+1", ianaTimezone: "Europe/Monaco" },
  { name: "Mongolia", code: "MN", emoji: "🇲🇳", timezone: "UTC+8", ianaTimezone: "Asia/Ulaanbaatar" },
  { name: "Namibia", code: "NA", emoji: "🇳🇦", timezone: "UTC+1", ianaTimezone: "Africa/Windhoek" },
  { name: "Nauru", code: "NR", emoji: "🇳🇷", timezone: "UTC+12", ianaTimezone: "Pacific/Nauru" },
  { name: "Nepal", code: "NP", emoji: "🇳🇵", timezone: "UTC+5:45", ianaTimezone: "Asia/Kathmandu" },
  { name: "Niger", code: "NE", emoji: "🇳🇪", timezone: "UTC+1", ianaTimezone: "Africa/Niamey" },
  { name: "Nicaragua", code: "NI", emoji: "🇳🇮", timezone: "UTC-6", ianaTimezone: "America/Managua" },
  { name: "Oman", code: "OM", emoji: "🇴🇲", timezone: "UTC+4", ianaTimezone: "Asia/Muscat" },
  { name: "Pakistan", code: "PK", emoji: "🇵🇰", timezone: "UTC+5", ianaTimezone: "Asia/Karachi" },
  { name: "Palau", code: "PW", emoji: "🇵🇼", timezone: "UTC+9", ianaTimezone: "Pacific/Palau" },
  { name: "Panama", code: "PA", emoji: "🇵🇦", timezone: "UTC-5", ianaTimezone: "America/Panama" },
  { name: "Papua New Guinea", code: "PG", emoji: "🇵🇬", timezone: "UTC+10", ianaTimezone: "Pacific/Port_Moresby" },
  { name: "Paraguay", code: "PY", emoji: "🇵🇾", timezone: "UTC-4", ianaTimezone: "America/Asuncion" },
  { name: "Peru", code: "PE", emoji: "🇵🇪", timezone: "UTC-5", ianaTimezone: "America/Lima" },
  { name: "South Sudan", code: "SS", emoji: "🇸🇸", timezone: "UTC+2", ianaTimezone: "Africa/Juba" },
  { name: "North Korea", code: "KP", emoji: "🇰🇵", timezone: "UTC+8:30", ianaTimezone: "Asia/Pyongyang" },
  { name: "North Macedonia", code: "MK", emoji: "🇲🇰", timezone: "UTC+1", ianaTimezone: "Europe/Skopje" },
  { name: "Portugal", code: "PT", emoji: "🇵🇹", timezone: "UTC+0", ianaTimezone: "Europe/Lisbon" },
  { name: "Republic of the Congo", code: "CG", emoji: "🇨🇬", timezone: "UTC+1", ianaTimezone: "Africa/Brazzaville" },
  { name: "Russia", code: "RU", emoji: "🇷🇺", timezone: "UTC+3", ianaTimezone: "Europe/Moscow" },
  { name: "Rwanda", code: "RW", emoji: "🇷🇼", timezone: "UTC+2", ianaTimezone: "Africa/Kigali" },
  { name: "Romania", code: "RO", emoji: "🇷🇴", timezone: "UTC+2", ianaTimezone: "Europe/Bucharest" },
  { name: "El Salvador", code: "SV", emoji: "🇸🇻", timezone: "UTC-6", ianaTimezone: "America/El_Salvador" },
  { name: "Samoa", code: "WS", emoji: "🇼🇸", timezone: "UTC+13", ianaTimezone: "Pacific/Apia" },
  { name: "San Marino", code: "SM", emoji: "🇸🇲", timezone: "UTC+1", ianaTimezone: "Europe/San_Marino" },
  { name: "Sao Tome and Principe", code: "ST", emoji: "🇸🇹", timezone: "UTC+0", ianaTimezone: "Africa/Sao_Tome" },
  { name: "Seychelles", code: "SC", emoji: "🇸🇨", timezone: "UTC+4", ianaTimezone: "Indian/Mahe" },
  { name: "Senegal", code: "SN", emoji: "🇸🇳", timezone: "UTC+0", ianaTimezone: "Africa/Dakar" },
  { name: "Saint Vincent and the Grenadines", code: "VC", emoji: "🇻🇨", timezone: "UTC-4", ianaTimezone: "America/St_Vincent" },
  { name: "Saint Kitts and Nevis", code: "KN", emoji: "🇰🇳", timezone: "UTC-4", ianaTimezone: "America/St_Kitts" },
  { name: "Saint Lucia", code: "LC", emoji: "🇱🇨", timezone: "UTC-4", ianaTimezone: "America/St_Lucia" },
  { name: "Serbia", code: "RS", emoji: "🇷🇸", timezone: "UTC+1", ianaTimezone: "Europe/Belgrade" },
  { name: "Syria", code: "SY", emoji: "🇸🇾", timezone: "UTC+2", ianaTimezone: "Asia/Damascus" },
  { name: "Slovakia", code: "SK", emoji: "🇸🇰", timezone: "UTC+1", ianaTimezone: "Europe/Bratislava" },
  { name: "Slovenia", code: "SI", emoji: "🇸🇮", timezone: "UTC+1", ianaTimezone: "Europe/Ljubljana" },
  { name: "Solomon Islands", code: "SB", emoji: "🇸🇧", timezone: "UTC+11", ianaTimezone: "Pacific/Guadalcanal" },
  { name: "Somalia", code: "SO", emoji: "🇸🇴", timezone: "UTC+3", ianaTimezone: "Africa/Mogadishu" },
  { name: "Sudan", code: "SD", emoji: "🇸🇩", timezone: "UTC+2", ianaTimezone: "Africa/Khartoum" },
  { name: "Suriname", code: "SR", emoji: "🇸🇷", timezone: "UTC-3", ianaTimezone: "America/Paramaribo" },
  { name: "East Timor", code: "TL", emoji: "🇹🇱", timezone: "UTC+9", ianaTimezone: "Asia/Dili" },
  { name: "Sierra Leone", code: "SL", emoji: "🇸🇱", timezone: "UTC+0", ianaTimezone: "Africa/Freetown" },
  { name: "Tajikistan", code: "TJ", emoji: "🇹🇯", timezone: "UTC+5", ianaTimezone: "Asia/Dushanbe" },
  { name: "Tanzania", code: "TZ", emoji: "🇹🇿", timezone: "UTC+3", ianaTimezone: "Africa/Dar_es_Salaam" },
  { name: "Togo", code: "TG", emoji: "🇹🇬", timezone: "UTC+0", ianaTimezone: "Africa/Lome" },
  { name: "Tonga", code: "TO", emoji: "🇹🇴", timezone: "UTC+13", ianaTimezone: "Pacific/Tongatapu" },
  { name: "Trinidad and Tobago", code: "TT", emoji: "🇹🇹", timezone: "UTC-5", ianaTimezone: "America/Port_of_Spain" },
  { name: "Tuvalu", code: "TV", emoji: "🇹🇻", timezone: "UTC+12", ianaTimezone: "Pacific/Funafuti" },
  { name: "Tunisia", code: "TN", emoji: "🇹🇳", timezone: "UTC+1", ianaTimezone: "Africa/Tunis" },
  { name: "Turkmenistan", code: "TM", emoji: "🇹🇲", timezone: "UTC+5", ianaTimezone: "Asia/Ashgabat" },
  { name: "Uganda", code: "UG", emoji: "🇺🇬", timezone: "UTC+3", ianaTimezone: "Africa/Kampala" },
  { name: "Hungary", code: "HU", emoji: "🇭🇺", timezone: "UTC+1", ianaTimezone: "Europe/Budapest" },
  { name: "Uzbekistan", code: "UZ", emoji: "🇺🇿", timezone: "UTC+5", ianaTimezone: "Asia/Tashkent" },
  { name: "Uruguay", code: "UY", emoji: "🇺🇾", timezone: "UTC-3", ianaTimezone: "America/Montevideo" },
  { name: "Federated States of Micronesia", code: "FM", emoji: "🇫🇲", timezone: "UTC+10", ianaTimezone: "Pacific/Ponape" },
  { name: "Fiji", code: "FJ", emoji: "🇫🇯", timezone: "UTC+12", ianaTimezone: "Pacific/Fiji" },
  { name: "Philippines", code: "PH", emoji: "🇵🇭", timezone: "UTC+8", ianaTimezone: "Asia/Manila" },
  { name: "Croatia", code: "HR", emoji: "🇭🇷", timezone: "UTC+1", ianaTimezone: "Europe/Zagreb" },
  { name: "Central African Republic", code: "CF", emoji: "🇨🇫", timezone: "UTC+1", ianaTimezone: "Africa/Bangui" },
  { name: "Chad", code: "TD", emoji: "🇹🇩", timezone: "UTC+1", ianaTimezone: "Africa/Ndjamena" },
  { name: "Czechia", code: "CZ", emoji: "🇨🇿", timezone: "UTC+1", ianaTimezone: "Europe/Prague" },
  { name: "Chile", code: "CL", emoji: "🇨🇱", timezone: "UTC-4", ianaTimezone: "America/Santiago" },
  { name: "Montenegro", code: "ME", emoji: "🇲🇪", timezone: "UTC+1", ianaTimezone: "Europe/Podgorica" },
  { name: "Sri Lanka", code: "LK", emoji: "🇱🇰", timezone: "UTC+5:30", ianaTimezone: "Asia/Colombo" },
  { name: "Jamaica", code: "JM", emoji: "🇯🇲", timezone: "UTC-5", ianaTimezone: "America/Jamaica" },
];

const consultationLanguages = [
  // { name: "english", code: "en", emoji: "" }, // Використовуємо емодзі для Британії, як для англійської
  // { name: "ukrainian", code: "uk", emoji: "" },
  // { name: "german", code: "de", emoji: "" },
  { name: "countries.Philippines", code: "PH", emoji: "🇵🇭", timezone: "UTC+8" },
  { name: "countries.Croatia", code: "HR", emoji: "🇭🇷", timezone: "UTC+1" },
  { name: "countries.Chad", code: "TD", emoji: "🇹🇩", timezone: "UTC+1" },
  { name: "countries.Czechia", code: "CZ", emoji: "🇨🇿", timezone: "UTC+1" },
  { name: "countries.Chile", code: "CL", emoji: "🇨🇱", timezone: "UTC-4" },
  { name: "countries.Montenegro", code: "ME", emoji: "🇲🇪", timezone: "UTC+1" },
  { name: "countries.Sri Lanka", code: "LK", emoji: "🇱🇰", timezone: "UTC+5:30" },
  { name: "countries.Jamaica", code: "JM", emoji: "🇯🇲", timezone: "UTC-5" },
  { name: "countries.Ukraine", code: "uk", emoji: "🇺🇦", timezone: "UTC+2" },
  { name: "countries.United Kingdom", code: "en", emoji: "🇬🇧", timezone: "UTC+0" },
  { name: "countries.United States", code: "US", emoji: "🇺🇸", timezone: "UTC-5" }, // Приклад: Східний час
  { name: "countries.Canada", code: "CA", emoji: "🇨🇦", timezone: "UTC-6" }, // Приклад: Центральний час
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
  { name: "countries.South Africa", code: "ZA", emoji: "🇿🇦", timezone: "UTC+2" },
  { name: "countries.Mexico", code: "MX", emoji: "🇲🇽", timezone: "UTC-6" },
  { name: "countries.South Korea", code: "KR", emoji: "🇰🇷", timezone: "UTC+9" },
  { name: "countries.Argentina", code: "AR", emoji: "🇦🇷", timezone: "UTC-3" },
  { name: "countries.Ireland", code: "IE", emoji: "🇮🇪", timezone: "UTC+0" },
  { name: "countries.New Zealand", code: "NZ", emoji: "🇳🇿", timezone: "UTC+12" },
  { name: "countries.Singapore", code: "SG", emoji: "🇸🇬", timezone: "UTC+8" },
  { name: "countries.Israel", code: "IL", emoji: "🇮🇱", timezone: "UTC+2" },
  { name: "countries.Malaysia", code: "MY", emoji: "🇲🇾", timezone: "UTC+8" },
  { name: "countries.Thailand", code: "TH", emoji: "🇹🇭", timezone: "UTC+7" },
  { name: "countries.Vietnam", code: "VN", emoji: "🇻🇳", timezone: "UTC+7" },
  { name: "countries.Indonesia", code: "ID", emoji: "🇮🇩", timezone: "UTC+8" },
  { name: "countries.Egypt", code: "EG", emoji: "🇪🇬", timezone: "UTC+2" },
  { name: "countries.Nigeria", code: "NG", emoji: "🇳🇬", timezone: "UTC+1" },
  { name: "countries.Saudi Arabia", code: "SA", emoji: "🇸🇦", timezone: "UTC+3" },
  { name: "countries.United Arab Emirates", code: "AE", emoji: "🇦🇪", timezone: "UTC+4" },
  { name: "countries.Kuwait", code: "KW", emoji: "🇰🇼", timezone: "UTC+3" },
  { name: "countries.Qatar", code: "QA", emoji: "🇶🇦", timezone: "UTC+3" },
  { name: "countries.Austria", code: "AT", emoji: "🇦🇹", timezone: "UTC+1" },
  { name: "countries.Azerbaijan", code: "AZ", emoji: "🇦🇿", timezone: "UTC+4" },
  { name: "countries.Albania", code: "AL", emoji: "🇦🇱", timezone: "UTC+1" },
  { name: "countries.Algeria", code: "DZ", emoji: "🇩🇿", timezone: "UTC+1" },
  { name: "countries.Angola", code: "AO", emoji: "🇦🇴", timezone: "UTC+1" },
  { name: "countries.Andorra", code: "AD", emoji: "🇦🇩", timezone: "UTC+1" },
  { name: "countries.Antigua and Barbuda", code: "AG", emoji: "🇦🇬", timezone: "UTC-4" },
  { name: "countries.Afghanistan", code: "AF", emoji: "🇦🇫", timezone: "UTC+4:30" },
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
  { name: "countries.Bosnia and Herzegovina", code: "BA", emoji: "🇧🇦", timezone: "UTC+1" },
  { name: "countries.Botswana", code: "BW", emoji: "🇧🇼", timezone: "UTC+2" },
  { name: "countries.Brunei", code: "BN", emoji: "🇧🇳", timezone: "UTC+8" },
  { name: "countries.Burkina Faso", code: "BF", emoji: "🇧🇫", timezone: "UTC+0" },
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
  { name: "countries.Guinea-Bissau", code: "GW", emoji: "🇬🇼", timezone: "UTC+0" },
  { name: "countries.Honduras", code: "HN", emoji: "🇭🇳", timezone: "UTC-6" },
  { name: "countries.Grenada", code: "GD", emoji: "🇬🇩", timezone: "UTC-4" },
  { name: "countries.Greece", code: "GR", emoji: "🇬🇷", timezone: "UTC+2" },
  { name: "countries.Georgia", code: "GE", emoji: "🇬🇪", timezone: "UTC+4" },
  { name: "countries.Djibouti", code: "DJ", emoji: "🇩🇯", timezone: "UTC+3" },
  { name: "countries.Dominica", code: "DM", emoji: "🇩🇲", timezone: "UTC-4" },
  { name: "countries.Dominican Republic", code: "DO", emoji: "🇩🇴", timezone: "UTC-4" },
  { name: "countries.DR Congo", code: "CD", emoji: "🇨🇩", timezone: "UTC+1" },
  { name: "countries.Ecuador", code: "EC", "emoji": "🇪🇨", timezone: "UTC-5" },
  { name: "countries.Equatorial Guinea", code: "GQ", emoji: "🇬🇶", timezone: "UTC+1" },
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
  { name: "countries.Liechtenstein", code: "LI", emoji: "🇱🇮", timezone: "UTC+1" },
  { name: "countries.Luxembourg", code: "LU", emoji: "🇱🇺", timezone: "UTC+1" },
  { name: "countries.Myanmar", code: "MM", emoji: "🇲🇲", timezone: "UTC+6:30" },
  { name: "countries.Mauritius", code: "MU", emoji: "🇲🇺", timezone: "UTC+4" },
  { name: "countries.Mauritania", code: "MR", emoji: "🇲🇷", timezone: "UTC+0" },
  { name: "countries.Madagascar", code: "MG", emoji: "🇲🇬", timezone: "UTC+3" },
  { name: "countries.Malawi", code: "MW", emoji: "🇲🇼", timezone: "UTC+2" },
  { name: "countries.Mali", code: "ML", emoji: "🇲🇱", timezone: "UTC+0" },
  { name: "countries.Maldives", code: "MV", emoji: "🇲🇻", timezone: "UTC+5" },
  { name: "countries.Malta", code: "MT", emoji: "🇲🇹", timezone: "UTC+1" },
  { name: "countries.Morocco", code: "MA", emoji: "🇲🇦", timezone: "UTC+1" },
  { name: "countries.Marshall Islands", code: "MH", emoji: "🇲🇭", timezone: "UTC+12" },
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
  { name: "countries.Papua New Guinea", code: "PG", emoji: "🇵🇬", timezone: "UTC+10" },
  { name: "countries.Paraguay", code: "PY", emoji: "🇵🇾", timezone: "UTC-4" },
  { name: "countries.Peru", code: "PE", emoji: "🇵🇪", timezone: "UTC-5" },
  { name: "countries.South Sudan", code: "SS", emoji: "🇸🇸", timezone: "UTC+2" },
  { name: "countries.North Korea", code: "KP", emoji: "🇰🇵", timezone: "UTC+8:30" },
  { name: "countries.North Macedonia", code: "MK", emoji: "🇲🇰", timezone: "UTC+1" },
  { name: "countries.Portugal", code: "PT", emoji: "🇵🇹", timezone: "UTC+0" },
  { name: "countries.Republic of the Congo", code: "CG", emoji: "🇨🇬", timezone: "UTC+1" },
  { name: "countries.Russia", code: "RU", emoji: "🇷🇺", timezone: "UTC+3" }, // Московський час
  { name: "countries.Rwanda", code: "RW", emoji: "🇷🇼", timezone: "UTC+2" },
  { name: "countries.Romania", code: "RO", emoji: "🇷🇴", timezone: "UTC+2" },
  { name: "countries.El Salvador", code: "SV", emoji: "🇸🇻", timezone: "UTC-6" },
  { name: "countries.Samoa", code: "WS", emoji: "🇼🇸", timezone: "UTC+13" },
  { name: "countries.San Marino", code: "SM", emoji: "🇸🇲", timezone: "UTC+1" },
  { name: "countries.Sao Tome and Principe", code: "ST", emoji: "🇸🇹", timezone: "UTC+0" },
  { name: "countries.Seychelles", code: "SC", emoji: "🇸🇨", timezone: "UTC+4" },
  { name: "countries.Senegal", code: "SN", emoji: "🇸🇳", timezone: "UTC+0" },
  { name: "countries.Saint Vincent and the Grenadines", code: "VC", emoji: "🇻🇨", timezone: "UTC-4" },
  { name: "countries.Saint Kitts and Nevis", code: "KN", emoji: "🇰🇳", timezone: "UTC-4" },
  { name: "countries.Saint Lucia", code: "LC", emoji: "🇱🇨", timezone: "UTC-4" },
  { name: "countries.Serbia", code: "RS", emoji: "🇷🇸", timezone: "UTC+1" },
  { name: "countries.Syria", code: "SY", emoji: "🇸🇾", timezone: "UTC+2" },
  { name: "countries.Slovakia", code: "SK", emoji: "🇸🇰", timezone: "UTC+1" },
  { name: "countries.Slovenia", code: "SI", emoji: "🇸🇮", timezone: "UTC+1" },
  { name: "countries.Solomon Islands", code: "SB", emoji: "🇸🇧", timezone: "UTC+11" },
  { name: "countries.Somalia", code: "SO", emoji: "🇸🇴", timezone: "UTC+3" },
  { name: "countries.Sudan", code: "SD", emoji: "🇸🇩", timezone: "UTC+2" },
  { name: "countries.Suriname", code: "SR", emoji: "🇸🇷", timezone: "UTC-3" },
  { name: "countries.East Timor", code: "TL", emoji: "🇹🇱", timezone: "UTC+9" },
  { name: "countries.Sierra Leone", code: "SL", emoji: "🇸🇱", timezone: "UTC+0" },
  { name: "countries.Tajikistan", code: "TJ", emoji: "🇹🇯", timezone: "UTC+5" },
  { name: "countries.Tanzania", code: "TZ", emoji: "🇹🇿", timezone: "UTC+3" },
  { name: "countries.Togo", code: "TG", emoji: "🇹🇬", timezone: "UTC+0" },
  { name: "countries.Tonga", code: "TO", emoji: "🇹🇴", timezone: "UTC+13" },
  { name: "countries.Trinidad and Tobago", code: "TT", emoji: "🇹🇹", timezone: "UTC-5" },
  { name: "countries.Tuvalu", code: "TV", emoji: "🇹🇻", timezone: "UTC+12" },
  { name: "countries.Tunisia", code: "TN", emoji: "🇹🇳", timezone: "UTC+1" },
  { name: "countries.Turkmenistan", code: "TM", emoji: "🇹🇲", timezone: "UTC+5" },
  { name: "countries.Uganda", code: "UG", emoji: "🇺🇬", timezone: "UTC+3" },
  { name: "countries.Hungary", code: "HU", emoji: "🇭🇺", timezone: "UTC+1" },
  { name: "countries.Uzbekistan", code: "UZ", emoji: "🇺🇿", timezone: "UTC+5" },
  { name: "countries.Uruguay", code: "UY", emoji: "🇺🇾", timezone: "UTC-3" },
  { name: "countries.Federated States of Micronesia", code: "FM", emoji: "🇫🇲", timezone: "UTC+10" },
  { name: "countries.Fiji", code: "FJ", emoji: "🇫🇯", timezone: "UTC+12" },
    { name: "countries.Central African Republic", code: "CF", emoji: "🇨🇫", timezone: "UTC+1" },

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
  const [doctorCheckStatus, setDoctorCheckStatus] = useState(false); // Додано стан для doctor_check

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
  const [isDeletingProfile, setIsDeletingProfile] = useState(false); // Новий стан для видалення
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

        // --- ПОЧАТОК: ЗАВАНТАЖЕННЯ ЗАГАЛЬНОЇ МОВИ ДОДАТКУ ---
        // Запит до profile_doctor для отримання мови
        const { data: profileDoctorData, error: profileDoctorError } = await supabase
          .from("profile_doctor")
          .select("language")
          .eq("user_id", user.id)
          .single();

        if (profileDoctorError && profileDoctorError.code !== "PGRST116") {
          console.error("Error fetching doctor's language from profile_doctor:", profileDoctorError.message);
        } else if (profileDoctorData && profileDoctorData.language) {
          i18n.changeLanguage(profileDoctorData.language);
          setDisplayedLanguageCode(profileDoctorData.language.toUpperCase());
          console.log(`Loaded language from profile_doctor: ${profileDoctorData.language}`);
        } else {
          // Якщо мова не знайдена в profile_doctor, використовуємо i18n.language за замовчуванням
          console.log("No language found in profile_doctor, using i18n default.");
        }
        // --- КІНЕЦЬ: ЗАВАНТАЖЕННЯ ЗАГАЛЬНОЇ МОВИ ДОДАТКУ ---


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
          // Оновлено: При завантаженні профілю, шукаємо країну за IANA Time Zone,
          // якщо country_timezone не null.
          // Якщо `country_timezone` відсутній або `null`, то повертаємося до пошуку за `country`
          const userCountry = countries.find(
            (c) => c.ianaTimezone === data.country_timezone || c.name === data.country
          );
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
          setDoctorCheckStatus(data.doctor_check || false); // Завантаження статусу doctor_check
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

  // Оновлена функція для збереження мови інтерфейсу в БД
  const handleGeneralLanguageSelect = async (langCode) => {
    // 1. Змінюємо мову i18n
    i18n.changeLanguage(langCode);
    setDisplayedLanguageCode(langCode.toUpperCase()); // Оновлюємо відображуваний код мови
    closeGeneralLanguageModal();

    // 2. Зберігаємо вибрану мову в Supabase
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        console.error("User not authenticated for language save:", userError?.message || "User ID not found.");
        Alert.alert(t("error_title"), t("error_not_authenticated_for_language"));
        return;
      }
      // Оновлення колонки 'language' для поточного користувача в таблиці profile_doctor
      const { error } = await supabase
        .from("profile_doctor") // <--- Змінено на profile_doctor
        .upsert(
          {
            user_id: user.id,
            language: langCode, // Зберігаємо обраний код мови
          },
          { onConflict: "user_id" } // Якщо запис існує, оновлюємо, якщо ні - створюємо
        );

      if (error) {
        console.error("Error saving general app language:", error.message);
        Alert.alert(t("error_title"), t("error_saving_language"));
      } else {
        console.log("General app language saved successfully to profile_doctor:", langCode);
      }
    } catch (err) {
      console.error("General error saving app language:", err);
      Alert.alert(t("error_title"), t("error_general_save_language_failed"));
    }
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

    // Перевірка та запит дозволів
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Media library permission status:", mediaLibraryStatus);

    if (mediaLibraryStatus !== "granted") {
      Alert.alert(
        "Потрібен дозвіл",
        "Будь ласка, надайте дозволи до бібліотеки медіа для завантаження фотографій."
      );
      return;
    }

    console.log("Permissions granted. Launching image library...");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false,
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
            // Для веб-платформи створюємо Blob URL
            const response = await fetch(selectedUri);
            const blob = await response.blob();
            uriToSet = URL.createObjectURL(blob);
          }
          setUriState(uriToSet);
        } else {
          // Для нативних платформ використовуємо отриманий URI
          setUriState(selectedUri);
        }
      } else {
        console.log("ImagePicker canceled by user or no asset selected.");
        // Якщо користувач скасував або нічого не вибрав, URI має бути null
        setUriState(null);
      }
    } catch (error) {
      console.error("Error launching ImagePicker:", error);
      Alert.alert(
        "Помилка відкриття галереї",
        `Виникла проблема під час спроби відкрити галерею. Будь ласка, спробуйте ще раз. Деталі: ${error.message}`
      );
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
              user_id: user.id, // Додано user_id
              full_name: fullName.trim(),
              email: user.email,
              phone: "", // Телефон відсутній у формі, залишаємо порожнім
              country: country?.name || null,
              country_timezone: country?.ianaTimezone || null, // Змінено: Зберігаємо IANA Time Zone
              communication_languages: languagesToSave,
              specialization: specializationsToSave,
              experience_years: experienceYears,
              work_experience: null, // Поле відсутнє у формі, залишаємо null
              education: null, // Поле відсутнє у формі, залишаємо null
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
              agreed_to_terms: agreedToTerms,
              doctor_check: doctorCheckStatus, // Зберігаємо поточний статус doctor_check
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

  const handleDeleteProfile = async () => {
    Alert.alert(
      t("delete_profile_confirm_title"),
      t("delete_profile_confirm_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => console.log("Deletion canceled"),
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeletingProfile(true);
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (userError || !user || !user.id) {
                console.error(
                  "User not authenticated for deletion:",
                  userError?.message || "User ID not found."
                );
                Alert.alert(
                  t("error_title"),
                  t("error_not_authenticated_for_deletion")
                );
                setIsDeletingProfile(false);
                return;
              }

              const userId = user.id;

              // Отримуємо URL-адреси файлів для видалення зі Storage
              const { data: profileData, error: fetchError } = await supabase
                .from("anketa_doctor")
                .select("avatar_url, diploma_url, certificate_photo_url")
                .eq("user_id", userId)
                .single();

              if (fetchError && fetchError.code !== "PGRST116") {
                console.error(
                  "Error fetching profile data for deletion:",
                  fetchError.message
                );
                Alert.alert(
                  t("error_title"),
                  t("error_fetching_data_for_deletion")
                );
                setIsDeletingProfile(false);
                return;
              }

              const getFilePathFromUrl = (url) => {
                if (!url) return null;
                const parts = url.split('/');
                const publicIndex = parts.indexOf('public');
                if (publicIndex !== -1 && publicIndex + 2 < parts.length) {
                    return parts.slice(publicIndex + 2).join('/'); // Path after /public/bucket_name/
                }
                return null;
              };

              const filesToDelete = [];
              if (profileData) {
                if (profileData.avatar_url) {
                    const avatarPath = getFilePathFromUrl(profileData.avatar_url);
                    if (avatarPath) filesToDelete.push({ path: avatarPath, bucket: "avatars" });
                }
                if (profileData.diploma_url) {
                    const diplomaPath = getFilePathFromUrl(profileData.diploma_url);
                    if (diplomaPath) filesToDelete.push({ path: diplomaPath, bucket: "avatars" });
                }
                if (profileData.certificate_photo_url) {
                    const certificatePath = getFilePathFromUrl(profileData.certificate_photo_url);
                    if (certificatePath) filesToDelete.push({ path: certificatePath, bucket: "avatars" });
                }
              }

              for (const file of filesToDelete) {
                console.log(`Attempting to delete file: ${file.path} from bucket: ${file.bucket}`);
                const { error: storageError } = await supabase.storage
                  .from(file.bucket)
                  .remove([file.path]);

                if (storageError) {
                  console.warn(
                    `Warning: Could not delete file ${file.path}:`,
                    storageError.message
                  );
                }
              }
              console.log("Storage files deletion attempted.");

              // Видаляємо запис профілю лікаря з таблиці `anketa_doctor`
              const { error: deleteProfileError } = await supabase
                .from("anketa_doctor")
                .delete()
                .eq("user_id", userId);

              if (deleteProfileError) {
                console.error(
                  "Error deleting doctor profile:",
                  deleteProfileError.message
                );
                Alert.alert(
                  t("error_title"),
                  t("error_deleting_profile_data")
                );
                setIsDeletingProfile(false);
                return;
              }
              console.log("Doctor profile data deleted.");

              // Видаляємо запис профілю лікаря з таблиці `profile_doctor`
              const { error: deleteProfileDoctorError } = await supabase
                .from("profile_doctor") // <--- Додано видалення з profile_doctor
                .delete()
                .eq("user_id", userId);

              if (deleteProfileDoctorError) {
                console.warn(
                  "Warning: Error deleting profile_doctor entry:",
                  deleteProfileDoctorError.message
                );
                // Не блокуємо видалення, оскільки це не критично для основної анкети
              }
              console.log("Profile doctor data deletion attempted.");


              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) {
                console.warn("Warning: Error signing out after deletion:", signOutError.message);
              }
              console.log("User signed out.");


              Alert.alert(t("success_title"), t("success_profile_deleted"));
              navigation.navigate("HomeScreen");
            } catch (err) {
              console.error("Загальна помилка при видаленні профілю:", err);
              Alert.alert(
                t("error_title"),
                t("error_general_deletion_failed")
              );
            } finally {
              setIsDeletingProfile(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };


  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  useEffect(() => {
    const cleanupUris = [photoUri, diplomaUri, certificateUri].filter(
      (uri) => Platform.OS === "web" && uri && uri.startsWith("blob:")
    );

    return () => {
      cleanupUris.forEach((uri) => URL.revokeObjectURL(uri));
    };
  }, [photoUri, diplomaUri, certificateUri]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
            {/* --- Секція заголовка --- */}
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
  {/* Відображення статусу перевірки лікаря */}
              {doctorCheckStatus !== undefined && (
                <View style={styles.doctorStatusContainer(doctorCheckStatus)}>
                  <Text style={styles.doctorStatusText}>
                    {doctorCheckStatus ? t("status_confirmed") : t("status_pending")}
                  </Text>
                </View>
              )}

            {/* --- Секція фото профілю --- */}
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

            {/* --- Кнопка виходу --- */}
            <TouchableOpacity
              style={styles.signOutButtonAboveSearch}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={styles.signOutButtonText}>{t("signOut")}</Text>
            </TouchableOpacity>

            {/* --- Поля форми --- */}
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

            <Text style={styles.inputLabel}>{t("fullname")}</Text>
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
                            )?.name
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

            {/* --- Завантаження документів --- */}
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

            {/* --- Досвід та місцезнаходження --- */}
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

            {/* --- Досягнення та Про мене --- */}
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

            {/* --- Деталі консультації та банківська інформація --- */}
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

            {/* --- Згода з умовами --- */}
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

            {/* --- Кнопки збереження та видалення --- */}
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

            <TouchableOpacity
              style={styles.deleteProfileButton(width)}
              onPress={handleDeleteProfile}
              disabled={isDeletingProfile}
            >
              {isDeletingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteProfileButtonText}>
                  {t("delete_profile")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* --- Модальні вікна (Країна, Мови, Спеціалізація, Вартість, Досвід, Зображення) --- */}
      {/* Модальне вікно для вибору країни */}
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
                {countries.map((item) => (
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

      {/* Модальне вікно для вибору загальної мови додатка */}
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
                {generalAppLanguages.map((lang) => (
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

      {/* Модальне вікно для вибору мови консультації */}
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
                      {lang.emoji} {t(lang.name)}
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

      {/* Модальне вікно для вибору спеціалізації */}
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

      {/* Модальне вікно для вибору вартості консультації */}
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

      {/* Модальне вікно для вибору років досвіду */}
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

      {/* Модальне вікно для повноекранного перегляду зображення */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={closeImageModal}
      >
        <TouchableWithoutFeedback onPress={closeImageModal}>
          <View style={styles.fullScreenImageModalOverlay}>
            <TouchableWithoutFeedback>
              {selectedImageUri ? (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ flex: 1 }} />
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

// --- Таблиця стилів ---
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
  container: (width) => ({
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
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 25,
    width: 48,
    height: 48,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
    fontSize: 22,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
    justifyContent: "center",
    position: "absolute",
    left: 0,
    paddingVertical: 10,
    right: 0,
    fontFamily: "Mont-SemiBold",
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
  deleteProfileButton: (width) => ({
    backgroundColor: "#FF3B30",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  }),
  deleteProfileButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Стилі для відображення статусу лікаря
  doctorStatusContainer: (isConfirmed) => ({
    backgroundColor: isConfirmed ? "#4CAF50" : "rgba(241, 179, 7, 0.66)", // Зелений для підтверджено, бурштиновий для очікує
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 14,
    marginLeft: 10, // Відрегулюйте за потреби для відступу
  }),
  doctorStatusText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
  },
});

export default Anketa_Settings;