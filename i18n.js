// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

// Імпортуйте ваші файли перекладів
import enTranslation from "./locales/en.json"; // Переконайтеся, що шлях правильний
import ukTranslation from "./locales/uk.json"; // Переконайтеся, що шлях правильний

const resources = {
  en: {
    translation: enTranslation,
  },
  uk: {
    // Використовуйте 'uk' для української мови
    translation: ukTranslation,
  },
};

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    // Тут можна додати логіку для отримання збереженої мови з AsyncStorage
    // const savedLanguage = await AsyncStorage.getItem('user_language');
    // if (savedLanguage) {
    //   return callback(savedLanguage);
    // }

    const deviceLocale = Localization.getLocales()[0].languageCode;
    const supportedLocale = resources[deviceLocale] ? deviceLocale : "uk";
    callback(supportedLocale);
  },
  init: () => {},
  cacheUserLanguage: (lng) => {
    // Тут можна зберігати обрану мову в AsyncStorage
    // AsyncStorage.setItem('user_language', lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "uk",
    debug: true, // Увімкніть для налагодження
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3",
  });

export default i18n;
