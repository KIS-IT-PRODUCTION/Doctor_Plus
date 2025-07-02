import "react-native-url-polyfill/auto";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import "./i18n";

// Імпорти екранів
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
import TabBar_doctor from "./components/TopBar_doctor";

import { DoctorProfileProvider } from "./components/DoctorProfileContext";
import { enableScreens } from 'react-native-screens';

enableScreens();
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, loading, userRole } = useAuth();
  const navigationRef = useRef();
  const [isNavigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    if (!isNavigationReady || !navigationRef.current) {
      console.log("RootNavigator Effect: Навігатор не готовий або посилання недоступне, пропускаємо навігацію.");
      return;
    }

    if (session && session.user) {
      if (userRole === "doctor") {
        console.log("RootNavigator Effect: Сесія активна, роль - лікар. Перехід до Profile_doctor.");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "Profile_doctor", params: { doctorId: session.user.id } }],
        });
      } else if (userRole === "patient") {
        console.log("RootNavigator Effect: Сесія активна, роль - пацієнт. Перехід до Patsient_Home.");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "Patsient_Home" }],
        });
      } else {
        console.log("RootNavigator Effect: Сесія активна, але роль не визначена. Перехід до HomeScreen.");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "HomeScreen" }],
        });
      }
    } else {
      console.log("RootNavigator Effect: Сесії немає. Перехід до HomeScreen.");
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    }
  }, [session, userRole, isNavigationReady]);

  if (loading) {
    console.log("RootNavigator: AuthProvider завантажується (первинна ініціалізація)...");
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0EB3EB" />
        <Text style={{ marginTop: 10, fontFamily: "Mont-Regular" }}>Завантаження даних користувача...</Text>
      </View>
    );
  }

  console.log(`RootNavigator (RENDER): Сесія: ${session ? 'Присутня' : 'Відсутня'}, Роль: ${userRole}, Навігатор готовий: ${isNavigationReady}, AuthProvider Loading: ${loading}`);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setNavigationReady(true);
        console.log("RootNavigator: NavigationContainer готовий!");
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade", animationDuration: 0 }}>
        {/* Неавтентифіковані екрани */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

        {/* Автентифіковані екрани (пацієнти) */}
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

        {/* Автентифіковані екрани (лікарі) */}
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
        await Font.loadAsync({
          "Mont-Regular": require("./assets/Font/static/Montserrat-Regular.ttf"),
          "Mont-Medium": require("./assets/Font/static/Montserrat-Medium.ttf"),
          "Mont-Bold": require("./assets/Font/static/Montserrat-Bold.ttf"),
          "Mont-SemiBold": require("./assets/Font/static/Montserrat-SemiBold.ttf"),
        });
        console.log("App.js: Шрифти завантажені.");
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
      await SplashScreen.hideAsync();
      console.log("App.js: SplashScreen приховано.");
    }
  }, [appIsReady]);

  if (!appIsReady) {
    console.log("App.js: Додаток ще не готовий, показуємо null.");
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        {/*
          Умовне рендеринг DoctorProfileProvider
          Він буде працювати тільки тоді, коли userRole визначено як 'doctor'
        */}
        <ConditionalDoctorProfileProvider>
          <RootNavigator />
        </ConditionalDoctorProfileProvider>
      </AuthProvider>
    </View>
  );
}

// Новий компонент для умовного рендерингу DoctorProfileProvider
function ConditionalDoctorProfileProvider({ children }) {
  const { userRole, loading } = useAuth();

  // Показуємо дітей без провайдера, якщо роль пацієнт або ще завантажується
  if (loading || userRole === 'patient' || userRole === null) {
    return <>{children}</>;
  }

  // Якщо роль - лікар, тоді обгортаємо дітей у DoctorProfileProvider
  if (userRole === 'doctor') {
    return (
      <DoctorProfileProvider>
        {children}
      </DoctorProfileProvider>
    );
  }

  // Дефолтний випадок, якщо роль невідома або інша, також показуємо дітей без провайдера
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