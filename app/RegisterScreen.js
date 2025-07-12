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
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../providers/supabaseClient";
import { useTranslation } from "react-i18next";

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

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [country, setCountry] = useState(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsSubscription, setDimensionsSubscription] = useState(null);
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
      setDimensionsSubscription(subscription);

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

  const handleRegistration = async () => {
    setRegistrationError("");

    if (!fullName.trim()) {
      setRegistrationError(t("error_empty_fullname"));
      return;
    }
    if (!email.trim()) {
      setRegistrationError(t("error_empty_email"));
      return;
    }
    if (!password.trim()) {
      setRegistrationError(t("error_empty_password"));
      return;
    }
    if (password.length < 6) {
      setRegistrationError(t("error_short_password"));
      return;
    }

    setIsRegistering(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Помилка реєстрації Supabase:", authError.message);
        if (authError.message.includes("already registered")) {
          setRegistrationError(t("error_email_in_use"));
        } else if (authError.message.includes("invalid email")) {
          setRegistrationError(t("error_invalid_email"));
        } else if (authError.message.includes("weak password")) {
          setRegistrationError(t("error_weak_password"));
        } else {
          setRegistrationError(
            t("error_registration_failed", { error: authError.message })
          );
        }
        return;
      }

      if (data.user) {
        console.log("Supabase user registered. User ID:", data.user.id);

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            user_id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            country: country?.name || null,
            language: i18n.language || null,
            country_timezone: country?.ianaTimezone || null, 
          },
        ]);

        if (profileError) {
          console.error(
            "Помилка збереження профілю в Supabase:",
            profileError.message
          );
          setRegistrationError(t("error_profile_save_failed"));
        } else {
          Alert.alert(t("success_title"), t("success_registration_message"));
          setFullName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setCountry(null);
          navigation.navigate("LoginScreen");
        }
      } else {
        console.warn("Supabase signUp completed, but user object is missing.");
        Alert.alert(t("success_title"), t("success_registration_message"));
        navigation.navigate("LoginScreen");
      }
    } catch (err) {
      console.error("Загальна помилка при реєстрації:", err);
      setRegistrationError(t("error_general_registration_failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  const openCountryModal = () => {
    setIsCountryModalVisible(true);
  };

  const closeCountryModal = () => {
    setIsCountryModalVisible(false);
  };

  const openLanguageModal = () => {
    setIsLanguageModalVisible(true);
  };

  const closeLanguageModal = () => {
    setIsLanguageModalVisible(false);
  };

  const selectCountry = (selectedCountry) => {
    setCountry(selectedCountry);
    closeCountryModal();
  };

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    closeLanguageModal();
  };

  const { width, height } = dimensions;
  const isLargeScreen = width > 768;

  const languagesForModal = [
    { nameKey: "english", code: "en", emoji: "🇬🇧" },
    { nameKey: "ukrainian", code: "uk", emoji: "🇺🇦" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container(width, height)}>
        <StatusBar style="auto" />
        <View style={styles.languageContainerRegister}>
          <TouchableOpacity
            style={styles.languageButtonRegister}
            onPress={openLanguageModal}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.languageTextRegister}>
                {displayedLanguageCode}
              </Text>
              <Ionicons name="globe-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title(isLargeScreen)}>{t("greeting")}</Text>
        <Text style={styles.subtitle(isLargeScreen)}>
          {t("registration_subtitle")}
        </Text>
        <TouchableOpacity
          style={styles.selectCountryButton(width)}
          onPress={openCountryModal}
        >
          <Text style={styles.selectCountryText}>
            {country
              ? `${country.emoji} ${t(`countries.${country.name}`)}`
              : t("select_country")}
          </Text>
        </TouchableOpacity>

        <Text style={styles.subtitle2}>{t("fullname")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_fullname")}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <Text style={styles.subtitle2}>{t("email")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.subtitle2}>{t("password")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#B0BEC5"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        <Text style={styles.subtitle2}>{t("phone")}</Text>
        <View style={styles.inputContainer(width)}>
          <Ionicons
            name="call-outline"
            size={20}
            color="black"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("placeholder_optional")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {registrationError ? (
          <Text style={styles.errorText}>{registrationError}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.registerButton(width)}
          onPress={handleRegistration}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>{t("register")}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Text style={styles.loginLinkText}>
            {t("already_registered")}
            <Text style={{ fontWeight: "bold" }}> {t("login_greeting")}</Text>
          </Text>
        </TouchableOpacity>

        {/* Оновлене модальне вікно для вибору країни */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCountryModalVisible}
          onRequestClose={closeCountryModal}
          // Додано для покращення доступності
          accessibilityLiveRegion="assertive" 
        >
          <TouchableWithoutFeedback onPress={closeCountryModal}>
            <View style={styles.centeredView}>
              <View style={[styles.modalView(width), styles.modalBorder]}>
                <ScrollView style={styles.modalScrollView}>
                  {countries.map((item, index) => (
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
                        {t(`countries.${item.name}`)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={closeCountryModal}
                  accessibilityLabel={t("close_modal")} // Для доступності
                >
                  <Text style={styles.textStyle}>{t("close")}</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Модальне вікно для вибору мови */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLanguageModalVisible}
          onRequestClose={closeLanguageModal}
          // Додано для покращення доступності
          accessibilityLiveRegion="assertive" 
        >
          <TouchableWithoutFeedback onPress={closeLanguageModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback
                onPress={() => {
                  /* Залишаємо порожнім, щоб не закривати модалку при натисканні всередині */
                }}
              >
                <View style={styles.languageModalContent}>
                  <Text style={styles.modalTitle}>
                    {t("selectLanguage")}
                  </Text>
                  {languagesForModal.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.languageOption}
                      onPress={() => handleLanguageSelect(item.code)}
                      accessibilityLabel={t(item.nameKey)} // Для доступності
                    >
                      <Text style={styles.languageOptionText}>
                        {t(item.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Pressable
                    style={[styles.button, styles.buttonClose, { marginTop: 20 }]}
                    onPress={closeLanguageModal}
                    accessibilityLabel={t("close_modal")}
                  >
                    <Text style={styles.textStyle}>{t("close")}</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: (width, height) => ({
    flex: 1, // Змінено: прибираємо flex: 1, якщо ScrollView є батьківським і керує прокруткою
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: height * 0.15,
    paddingHorizontal: width * 0.05,
    width: "100%",
    marginBottom: 50,
  }),
  languageContainerRegister: {
    flexDirection: "row",
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
    paddingVertical: 70,
  },
  languageButtonRegister: {
    backgroundColor: "#0EB3EB",
    borderRadius: 10,
    width: 71,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  languageTextRegister: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: "white",
    marginHorizontal: 5,
  },
  title: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 36 : 32,
    marginBottom: 9,
    fontFamily: "Mont-Bold",
    color: "#212121",
    textAlign: "center",
  }),
  subtitle: (isLargeScreen) => ({
    fontSize: isLargeScreen ? 18 : 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
    marginBottom: 14,
    textAlign: "center",
  }),
  subtitle2: {
    fontSize: 18,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    fontFamily: "Mont-Medium",
    paddingHorizontal: 35,
  },
  selectCountryButton: (width) => ({
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  }),
  selectCountryText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Mont-Medium",
  },
  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555,
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    height: 52,
  }),
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
  registerButton: (width) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    width: width * 0.9,
    height: 52,
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
  }),
  registerButtonText: {
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
  loginLink: {
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "Mont-Regular",
  },

  // Стилі для модального вікна вибору країни
  centeredView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.1)",
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
  // Стилі для модального вікна вибору мови
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
    width: Dimensions.get("window").width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { // Додано стиль для заголовка модального вікна мови
    fontSize: 20,
    fontFamily: "Mont-Bold",
    marginBottom: 20,
    color: "#212121",
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 179, 235, 0.1)",
  },
  languageOptionText: {
    fontSize: 16,
    fontFamily: "Mont-Regular",
  },
});

export default RegisterScreen;