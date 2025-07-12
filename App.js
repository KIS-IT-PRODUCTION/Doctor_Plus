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

import { DoctorProfileProvider } from "./components/DoctorProfileContext";
import { enableScreens } from 'react-native-screens';

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
  const { session, loading, userRole } = useAuth();
  const navigationRef = useRef();
  const [isNavigationReady, setNavigationReady] = useState(false);
  const [hasNavigatedInitially, setHasNavigatedInitially] = useState(false);

  // Цей useEffect тепер відповідає виключно за виконання reset навігації
  // коли всі умови виконані.
  useEffect(() => {
    // Чекаємо, поки NavigationContainer готовий, AuthProvider завершить завантаження,
    // і поки ми не виконали початкову навігацію, АБО коли сесія/роль змінюється.
    if (isNavigationReady && !loading && navigationRef.current && navigationRef.current.isReady()) {
      let targetRouteName;
      let targetParams = {};

      if (session && session.user) {
        if (userRole === "doctor") {
          targetRouteName = "Profile_doctor";
          targetParams = { doctorId: session.user.id };
        } else if (userRole === "patient") {
          targetRouteName = "Patsient_Home";
        } else {
          targetRouteName = "HomeScreen"; // Запасний варіант, якщо роль не визначена
        }
      } else {
        targetRouteName = "HomeScreen"; // Неавтентифікований користувач
      }

      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log(`RootNavigator Effect: Current: ${currentRoute}, Target: ${targetRouteName}, Session: ${session ? 'Active' : 'None'}, Loading: ${loading}, Role: ${userRole}, Has Navigated Initially: ${hasNavigatedInitially}`);

      // Виконуємо reset тільки якщо:
      // 1. Ми ще не навігували спочатку (для першого запуску)
      // АБО
      // 2. Цільовий маршрут відрізняється від поточного (для входу/виходу)
      // І ми не перебуваємо на "безпечних" неавтентифікованих екранах, коли сесія null
      if (
        !hasNavigatedInitially ||
        (currentRoute !== targetRouteName &&
         !(session === null && (currentRoute === "LoginScreen" || currentRoute === "RegisterScreen" || currentRoute === "Login" || currentRoute === "Register")))
      ) {
        console.log(`RootNavigator Effect: Performing reset to ${targetRouteName}.`);
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: targetRouteName, params: targetParams }],
        });
        setHasNavigatedInitially(true); // Позначаємо, що початкова навігація виконана
        SplashScreen.hideAsync(); // Приховуємо сплеш
      } else {
        // Якщо ми вже на потрібному екрані або на безпечному неавтентифікованому екрані,
        // просто приховуємо сплеш, якщо він ще не прихований.
        console.log(`RootNavigator Effect: Already on/near target route (${currentRoute}). Hiding SplashScreen if not already hidden.`);
        SplashScreen.hideAsync();
      }
    } else if (!loading && !isNavigationReady && !hasNavigatedInitially) {
        console.log("RootNavigator Effect: Waiting for NavigationContainer to be ready.");
    } else if (loading) {
        console.log("RootNavigator Effect: AuthProvider is still loading.");
    }
  }, [session, loading, userRole, isNavigationReady, hasNavigatedInitially]);


  // Ми завжди рендеримо NavigationContainer, як тільки appIsReady і AuthProvider не завантажується
  // (тобто, коли RootNavigator взагалі рендериться).
  // Це дозволяє navigationRef і isNavigationReady правильно ініціалізуватися.
  // Блокуємо рендеринг лише на рівні App.js, поки шрифти не завантажаться.
  // SplashPlaceholderScreen служить візуальним індикатором, поки відбувається reset.
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
        initialRouteName="SplashPlaceholder" // Завжди починаємо з заглушки
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
