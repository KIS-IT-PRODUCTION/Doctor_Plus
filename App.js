import 'core-js/actual/structured-clone';
import "react-native-url-polyfill/auto";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform, // Імпортуємо Platform
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
// import * as Linking from "expo-linking"; // Linking не використовується безпосередньо тут, можна видалити якщо не використовується ніде в App.js
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import "./i18n";
import * as Notifications from 'expo-notifications'; // Імпортуємо Notifications

// ВАЖЛИВО: Для коректної роботи Intl API (який використовується для часових зон),
// якщо ви орієнтуєтеся на старіші Android або деякі JS-двигуни, можливо, знадобиться
// розкоментувати наступні рядки. Для більшості сучасних Expo SDK це може бути не потрібно.
// import 'intl';
// import 'intl/locale-data/jsonp/en'; // Додайте локалі, які ви використовуєте, наприклад, 'uk'
// import 'intl/locale-data/jsonp/uk'; // Приклад для української локалі

// Імпорти екранів (переконайтеся, що всі шляхи правильні)
import ChooseSpecial from "./app/ChooseSpecial";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import Search from "./app/Search";
import Messege from "./app/doctor/Messege";
import Faq from "./app/Faq";
import Faq_doctor from "./app/doctor/Faq_doctor";
import Support from "./app/Support";
import Support_doctor from "./app/doctor/Support_doctor";
import Review from "./app/Rewiew";
import Rewiew_app from "./app/doctor/Rewiew_app";
import WriteReview from "./app/WriteRewiew";
import Profile from "./app/Profile";
import Register from "./app/doctor/Register";
import Login from "./app/doctor/Login";
import Anketa_Settings from "./app/doctor/Anketa_Settings";
import Profile_doctor from "./app/doctor/Profile_doctor";
import ConsultationTime from "./app/doctor/ConsultationTime";
import ConsultationTimePatient from "./app/ConsultationTimePatient";
import PatientMessages from "./app/PatientMessages";
import ResetPasswordScreen from "./app/doctor/ResetPasswordScreen";
import FeedbackModal from "./components/FeedbackModal"
import PrivacyPolice from "./app/PrivacyPolice";
import { DoctorProfileProvider } from "./components/DoctorProfileContext";
import { enableScreens } from 'react-native-screens';
import PartnershipAgreementScreen from "./app/PartnershipAgreementScreen";
enableScreens();
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const SplashPlaceholderScreen = () => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color="#0EB3EB" />
    <Text style={{ marginTop: 10, fontFamily: "Mont-Regular" }}>Завантаження даних...</Text>
  </View>
);


function RootNavigator() {
  // [ЗМІНА] Отримуємо `authError` з useAuth()
  const { session, loading, userRole, authError } = useAuth();
  const navigationRef = useRef();
  const [isNavigationReady, setNavigationReady] = useState(false);
  const [hasNavigatedInitially, setHasNavigatedInitially] = useState(false);

  useEffect(() => {
    if (isNavigationReady && !loading && navigationRef.current && navigationRef.current.isReady()) {
      
      // [ЗМІНА] Головна логіка виправлення:
      // Ми повинні "чекати" (тобто нічого не робити), якщо сесія вже є,
      // але роль ще не визначена (userRole === null).
      // Ми чекаємо, ТІЛЬКИ якщо немає помилки автентифікації.
      if (session && session.user && userRole === null && authError === null) {
        console.log("RootNavigator Effect: Сесія є, але роль 'null' (і немає помилок). Чекаємо на визначення ролі.");
        // Нічого не робимо і виходимо. useEffect запуститься знову,
        // коли userRole або authError оновиться.
        // Це запобігає некоректному "стрибку" на HomeScreen.
        // Якщо це початкове завантаження, ми просто продовжуємо показувати SplashPlaceholder.
        return; 
      }

      // Якщо ми дійшли сюди, це означає:
      // 1. Немає сесії (session === null)
      // 2. Є сесія І роль (userRole === 'doctor' або 'patient')
      // 3. Є сесія, але сталася помилка (authError !== null)

      let targetRouteName;
      let targetParams = {};

      // [ЗМІНА] Трохи чистіша логіка визначення маршруту
      if (session && session.user && authError === null) {
        // У нас є сесія, роль І немає помилок
        if (userRole === "doctor") {
          targetRouteName = "Profile_doctor";
          targetParams = { doctorId: session.user.id };
        } else if (userRole === "patient") {
          targetRouteName = "Patsient_Home";
        } else {
          // Безпечний запасний варіант, якщо роль дивна, але сесія є
          console.warn(`RootNavigator: Невідома роль (${userRole}), перехід на Patsient_Home.`);
          targetRouteName = "Patsient_Home";
        }
      } else {
        // Немає сесії АБО сталася помилка
        // У будь-якому випадку, показуємо публічний екран
        targetRouteName = "HomeScreen";
      }

      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log(`RootNavigator Effect: Current: ${currentRoute}, Target: ${targetRouteName}, Session: ${session ? 'Active' : 'None'}, Loading: ${loading}, Role: ${userRole}, Has Navigated Initially: ${hasNavigatedInitially}`);

      if (
        !hasNavigatedInitially ||
        (currentRoute !== targetRouteName &&
         !(session === null && (currentRoute === "LoginScreen" || currentRoute === "RegisterScreen" || currentRoute === "Login" || currentRoute === "Register" || currentRoute === "ResetPasswordScreen"))) // [ЗМІНА] Додав ResetPasswordScreen до винятків
      ) {
        console.log(`RootNavigator Effect: Виконуємо reset на ${targetRouteName}.`);
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: targetRouteName, params: targetParams }],
        });
        setHasNavigatedInitially(true);
        SplashScreen.hideAsync();
      } else {
        console.log(`RootNavigator Effect: Вже на цільовому маршруті (${currentRoute}). Ховаємо SplashScreen.`);
        SplashScreen.hideAsync();
      }
    } else if (!loading && !isNavigationReady && !hasNavigatedInitially) {
        console.log("RootNavigator Effect: Чекаємо на готовність NavigationContainer.");
    } else if (loading) {
        console.log("RootNavigator Effect: AuthProvider все ще завантажується (loading: true).");
    }
    
  // [ЗМІНА] Додаємо `authError` до списку залежностей
  }, [session, loading, userRole, authError, isNavigationReady, hasNavigatedInitially]);


  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setNavigationReady(true);
        console.log("RootNavigator: NavigationContainer готовий!");
      }}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "fade", animationDuration: 0 }}
        initialRouteName="SplashPlaceholder"
      >
        <Stack.Screen name="SplashPlaceholder" component={SplashPlaceholderScreen} />
        {/* Всі інші екрани - їх тут завжди рендеримо, не умовно */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

        <Stack.Screen name="Patsient_Home" component={Patsient_Home} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Faq" component={Faq} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="Review" component={Review} />
        <Stack.Screen name="ChooseSpecial" component={ChooseSpecial} />
        <Stack.Screen name="WriteReview" component={WriteReview} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ConsultationTimePatient" component={ConsultationTimePatient} />
        <Stack.Screen name="PatientMessages" component={PatientMessages} />
        <Stack.Screen name="FeedbackModal" component={FeedbackModal} />

        <Stack.Screen name="Anketa_Settings" component={Anketa_Settings} />
        <Stack.Screen name="Profile_doctor" component={Profile_doctor} />
        <Stack.Screen name="Messege" component={Messege} />
        <Stack.Screen name="Faq_doctor" component={Faq_doctor} />
        <Stack.Screen name="Support_doctor" component={Support_doctor} />
        <Stack.Screen name="Rewiew_app" component={Rewiew_app} />
        <Stack.Screen name="ConsultationTime" component={ConsultationTime} />
        <Stack.Screen name="PrivacyPolice" component={PrivacyPolice} />
        <Stack.Screen name="PartnershipAgreementScreen" component={PartnershipAgreementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Завантаження шрифтів
        await Font.loadAsync({
          "Mont-Regular": require("./assets/Font/static/Montserrat-Regular.ttf"),
          "Mont-Medium": require("./assets/Font/static/Montserrat-Medium.ttf"),
          "Mont-Bold": require("./assets/Font/static/Montserrat-Bold.ttf"),
          "Mont-SemiBold": require("./assets/Font/static/Montserrat-SemiBold.ttf"),
        });
        console.log("App.js: Шрифти завантажені.");

        // Ініціалізація каналів сповіщень для Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Загальні сповіщення',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default', // Використовувати системний звук за замовчуванням
          });
          console.log("App.js: Android канал сповіщень 'default' налаштовано.");
        }

      } catch (e) {
        console.warn("App.js: Помилка завантаження шрифтів або ініціалізації:", e);
      } finally {
        setAppIsReady(true);
        console.log("App.js: appIsReady встановлено в true.");
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Тут не ховаємо сплеш-екран, це робить RootNavigator
    }
  }, [appIsReady]);

  if (!appIsReady) {
    console.log("App.js: Додаток ще не готовий, показуємо null (продовжується показ сплеш-екрану).");
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <ConditionalDoctorProfileProvider>
          {/* RootNavigator тепер завжди рендериться, якщо appIsReady */}
          <RootNavigator />
        </ConditionalDoctorProfileProvider>
      </AuthProvider>
    </View>
  );
}

function ConditionalDoctorProfileProvider({ children }) {
  const { userRole, loading } = useAuth();

  if (loading || userRole === 'patient' || userRole === null) {
    return <>{children}</>;
  }

  if (userRole === 'doctor') {
    return (
      <DoctorProfileProvider>
        {children}
      </DoctorProfileProvider>
    );
  }

  return <>{children}</>;
}


const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
