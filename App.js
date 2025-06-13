import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  LogBox, // Можливо, варто розглянути видалення LogBox.ignoreAllLogs() для виробництва
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as Linking from "expo-linking"; // <<<<<<<< ДОДАНО: Імпорт Linking
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import "./i18n";

// Імпорти для ваших екранів
import ChooseSpecial from "./app/ChooseSpecial";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import Search from "./app/Search";
import Messege from "./app/doctor/Messege";
import Faq from "./app/Faq";
import Support from "./app/Support";
import Review from "./app/Rewiew";
import WriteReview from "./app/WriteRewiew";
import Profile from "./app/Profile";
import Register from "./app/doctor/Register";
import Login from "./app/doctor/Login";
import Anketa_Settings from "./app/doctor/Anketa_Settings";
import Profile_doctor from "./app/doctor/Profile_doctor";
import ConsultationTime from "./app/doctor/ConsultationTime";
import ConsultationTimePatient from "./app/ConsultationTimePatient";
import PatientMessages from "./app/PatientMessages";
import ResetPasswordScreen from "./app/ResetPasswordScreen";

SplashScreen.preventAutoHideAsync();

// Створюємо навігаційний стек
const Stack = createNativeStackNavigator();

// <<<<<<<< ДОДАНО: Визначення префіксу для Deep Linking
// Цей префікс має відповідати вашій схемі в app.json (наприклад, "doctor")
const prefix = Linking.createURL("doctor://");

/**
 * InitialNavigator визначає, який екран відображати першим,
 * залежно від стану автентифікації та ролі користувача.
 */
function InitialNavigator() {
  const { session, loading, userRole } = useAuth(); // Отримуємо стан сесії, завантаження та роль користувача з AuthProvider

  // Відображаємо індикатор завантаження, поки автентифікація перевіряється
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження автентифікації...</Text>
      </View>
    );
  }

  // Визначаємо початковий маршрут на основі сесії та ролі користувача
  let initialRouteName;
  let initialRouteParams = {}; // Об'єкт для передачі початкових параметрів

  if (session && session.user) {
    // Якщо користувач увійшов
    if (userRole === "doctor") {
      initialRouteName = "Profile_doctor";
      // Передаємо ID користувача як doctorId для профілю лікаря
      initialRouteParams = { doctorId: session.user.id };
    } else {
      initialRouteName = "Patsient_Home";
      // Для пацієнта, якщо потрібно передати ID поточного користувача
      // initialRouteParams = { patientId: session.user.id };
    }
  } else {
    // Якщо користувач не увійшов
    initialRouteName = "HomeScreen";
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false, // Приховати заголовок для всіх екранів за замовчуванням
        animation: "fade", // Плавний перехід між екранами
        animationDuration: 0, // Без анімації, якщо потрібно миттєвий перехід
      }}
    >
      {/* Визначення всіх екранів у навігаційному стеку */}
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Anketa_Settings" component={Anketa_Settings} />
      <Stack.Screen name="Patsient_Home" component={Patsient_Home} />
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="Messege" component={Messege} />
      <Stack.Screen name="Faq" component={Faq} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="ChooseSpecial" component={ChooseSpecial} />
      <Stack.Screen name="WriteReview" component={WriteReview} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ConsultationTimePatient" component={ConsultationTimePatient} />
      <Stack.Screen name="PatientMessages" component={PatientMessages} />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
      {/* Екран для лікаря, який може бути доступний лише для лікарів */}
      <Stack.Screen
        name="Profile_doctor"
        component={Profile_doctor}
        // Передача initialParams, якщо поточний екран є Profile_doctor
        initialParams={initialRouteName === "Profile_doctor" ? initialRouteParams : undefined}
      />
      <Stack.Screen name="ConsultationTime" component={ConsultationTime} />
    </Stack.Navigator>
  );
}

/**
 * Основний компонент App, який обгортає навігацію в AuthProvider
 * та відповідає за завантаження шрифтів та приховування Splash Screen.
 */
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          "Mont-Regular": require("./assets/Font/static/Montserrat-Regular.ttf"),
          "Mont-Medium": require("./assets/Font/static/Montserrat-Medium.ttf"),
          "Mont-Bold": require("./assets/Font/static/Montserrat-Bold.ttf"),
          "Mont-SemiBold": require("./assets/Font/static/Montserrat-SemiBold.ttf"),
        });
        // LogBox.ignoreAllLogs(); // Знов нагадую, подумайте, чи потрібне це у продакшені
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // <<<<<<<< ДОДАНО: Конфігурація Linking для навігаційного контейнера
  const linking = {
    prefixes: [prefix], // Використовуємо наш раніше визначений префікс
    config: {
      // Тут ми зіставляємо шляхи Deep Link (які приходять з URL)
      // з назвами екранів у вашому Stack.Navigator
      screens: {
        // 'ResetPasswordScreen' - це назва екрану у вашому Stack.Navigator
        // 'reset-password' - це частина шляху у Deep Link (наприклад, doctor://reset-password)
        ResetPasswordScreen: "reset-password",
        // Ви можете додати інші екрани, якщо плануєте використовувати Deep Links для них
        Login: "doctor-login",
        LoginScreen: "patient-login",
        HomeScreen: "home",
        Profile_doctor: "profile-doctor",
      },
    },
  };

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        {/* <<<<<<<< ЗМІНЕНО: Передача linking об'єкта до NavigationContainer */}
        <NavigationContainer linking={linking}>
          <InitialNavigator />
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}

// Стилі для централізованого індикатора завантаження
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});