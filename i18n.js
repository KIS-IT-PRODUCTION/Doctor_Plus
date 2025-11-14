// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import enTranslation from "./locales/en.json";
import ukTranslation from "./locales/uk.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  uk: {
    translation: ukTranslation,
  },
};

const USER_LANG_KEY = "user_language"; // Ключ для збереження

const languageDetector = {
  type: "languageDetector",
  async: true, // ✅ Вмикаємо асинхронність
  
  detect: async (callback) => {
    try {
      // 1. Спробувати знайти збережену мову
      const savedLanguage = await AsyncStorage.getItem(USER_LANG_KEY);
      if (savedLanguage) {
        console.log("i18n: Знайдено збережену мову:", savedLanguage);
        return callback(savedLanguage);
      }

      // 2. Якщо не знайдено, взяти мову пристрою
      const deviceLocale = Localization.getLocales()[0].languageCode;
      if (resources[deviceLocale]) {
        console.log("i18n: Мова пристрою:", deviceLocale);
        return callback(deviceLocale);
      }

      // 3. Якщо мова пристрою не підтримується, взяти мову за замовчуванням
      console.log("i18n: Застосовано мову за замовчуванням 'uk'");
      return callback("uk");

    } catch (error) {
      console.error("i18n: Помилка детектора мови:", error);
      callback("uk"); // Запасний варіант при помилці
    }
  },
  
  init: () => {},
  
  cacheUserLanguage: async (lng) => {
    // 3. Зберігаємо вибір користувача в AsyncStorage
    try {
      await AsyncStorage.setItem(USER_LANG_KEY, lng);
      console.log("i18n: Збережено мову користувача:", lng);
    } catch (error) {
      console.error("i18n: Помилка збереження мови:", error);
    }
  },
};

i18n
  .use(languageDetector) // ✅ Використовуємо наш новий детектор
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "uk", // Мова за замовчуванням, якщо все інше не спрацює
    
    // Важливо: ми хочемо, щоб мова зберігалася
    // коли ми викликаємо i18n.changeLanguage
    detection: {
      order: ["asyncStorage"], // Ви можете тут вказати порядок, але наш кастомний детектор це вже робить
      caches: ["asyncStorage"], // Вказуємо 'asyncStorage' як кеш
      lookupAsyncStorage: USER_LANG_KEY, // Ключ для AsyncStorage
    },

    debug: true,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3",
  });

export default i18n;