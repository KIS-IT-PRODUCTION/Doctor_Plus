// supabaseClient.js
import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Отримуємо URL та ключ Supabase з Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Перевірка наявності ключів Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key in app.config.js extra field.");
  // Можете додати Alert або інший механізм сповіщення користувача
}

// Ініціалізуємо клієнт Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// БІЛЬШЕ НЕМАЄ Clerk.addTokenListener ТУТ
