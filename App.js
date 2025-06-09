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
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import "./i18n";

// Імпорти для ваших екранів
import ChooseSpecial from "./app/ChooseSpecial";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import Search from "./app/Search";
import Messege from "./app/Messege";
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
// Запобігаємо автоматичному прихованню Splash Screen, доки програма не буде готова
SplashScreen.preventAutoHideAsync();

// Створюємо навігаційний стек
const Stack = createNativeStackNavigator();

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
      <Stack.Screen
        name="Profile_doctor"
        component={Profile_doctor}
        // Передача initialParams, якщо поточний екран є Profile_doctor
        initialParams={initialRouteName === "Profile_doctor" ? initialRouteParams : undefined}
      />
      {/* Для екрану ConsultationTime, doctorId також може бути потрібен,
          але зазвичай він передається з Profile_doctor або іншого екрану,
          а не як initialParam для всього додатку. */}
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
        // Завантаження користувацьких шрифтів
        await Font.loadAsync({
          "Mont-Regular": require("./assets/Font/static/Montserrat-Regular.ttf"),
          "Mont-Medium": require("./assets/Font/static/Montserrat-Medium.ttf"),
          "Mont-Bold": require("./assets/Font/static/Montserrat-Bold.ttf"),
          "Mont-SemiBold": require("./assets/Font/static/Montserrat-SemiBold.ttf"),
        });
        // Можливо, ігнорування всіх попереджень не є найкращою практикою для виробництва
        // LogBox.ignoreAllLogs();
      } catch (e) {
        console.warn(e); // Виводимо попередження, якщо завантаження шрифтів не вдалося
      } finally {
        setAppIsReady(true); // Встановлюємо appIsReady в true після завершення підготовки
      }
    }

    prepare();
  }, []);

  // Коллбек для приховування Splash Screen після готовності програми
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Якщо програма ще не готова, не відображаємо нічого (або Splash Screen)
  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* Обгортаємо всю навігацію в AuthProvider для доступу до контексту автентифікації */}
      <AuthProvider>
        <NavigationContainer>
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