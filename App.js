import 'core-js/actual/structured-clone';
import "react-native-url-polyfill/auto";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  AppState, 
  Alert,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import "./i18n";
import * as Notifications from 'expo-notifications';
import { useTranslation } from "react-i18next"; 
import Constants from 'expo-constants'; 

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

const SplashPlaceholderScreen = () => {
  const { t } = useTranslation(); 
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color="#0EB3EB" />
      <Text style={{ marginTop: 10, fontFamily: "Mont-Regular" }}>{t("splash_loading")}</Text>
    </View>
  );
}

function RootNavigator() {
  const { session, loading, userRole, authError } = useAuth();
  const navigationRef = useRef();
  const [isNavigationReady, setNavigationReady] = useState(false);
  const [hasNavigatedInitially, setHasNavigatedInitially] = useState(false);
  const appState = useRef(AppState.currentState); 

  const notificationListener = useRef();
  const responseListener = useRef();

  const handleNotificationNavigation = (response) => {
    console.log("RootNavigator: Обробка натискання сповіщення. Роль:", userRole);
    if (!navigationRef.current || !userRole) {
      console.log("RootNavigator: Навігація не готова або роль невідома. Навігацію скасовано.");
      return;
    }
    
    if (userRole === 'doctor') {
      console.log("RootNavigator: Перехід на 'Messege' (лікар)");
      navigationRef.current.navigate('Messege');
    } else if (userRole === 'patient') {
      console.log("RootNavigator: Перехід на 'PatientMessages' (пацієнт)");
      navigationRef.current.navigate('PatientMessages');
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Загальні сповіщення',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Помилка', 'Не вдалося отримати дозвіл на push-сповіщення!');
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error("Push Notifications: projectId не знайдено в extra.eas.projectId");
        Alert.alert("Помилка конфігурації", "Не вдалося знайти projectId для сповіщень.");
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("RootNavigator: Отримано ExpoPushToken:", token);

    } catch (e) {
      console.error("RootNavigator: Помилка отримання ExpoPushToken:", e);
      Alert.alert("Помилка", "Не вдалося отримати токен для сповіщень.");
    }

    return token;
  }

  useEffect(() => {
    if (session && session.user && userRole) {
      console.log("RootNavigator: Користувач увійшов. Реєстрація для push-сповіщень...");
      registerForPushNotificationsAsync();
    }
  }, [session, userRole]); 

  useEffect(() => {
    if (!isNavigationReady || !userRole) {
      return;
    }
    console.log("RootNavigator: Налаштування слухачів сповіщень для ролі:", userRole);

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log("RootNavigator: Додаток запущено з закритого стану сповіщенням.");
        handleNotificationNavigation(response);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("RootNavigator: Отримано відповідь на сповіщення (додаток у фоні/відкритий).");
      handleNotificationNavigation(response);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("RootNavigator: Сповіщення отримано, коли додаток відкритий:", notification.request.content.title);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isNavigationReady, userRole]); 


  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {

    if (isNavigationReady && appState.current.match(/inactive|background/) && !hasNavigatedInitially) {
        if (hasNavigatedInitially) {
             console.log("RootNavigator Effect: Повернення з фону, навігацію не змінюємо.");
             return;
        }
    }

    if (isNavigationReady && !loading && navigationRef.current && navigationRef.current.isReady()) {
      
      if (session && session.user && userRole === null && authError === null) {
        console.log("RootNavigator Effect: Сесія є, але роль 'null' (і немає помилок). Чекаємо на визначення ролі.");
        return; 
      }

      let targetRouteName;
      let targetParams = {};

      if (session && session.user && authError === null) {
        if (userRole === "doctor") {
          targetRouteName = "Profile_doctor";
          targetParams = { doctorId: session.user.id };
        } else if (userRole === "patient") {
          targetRouteName = "Patsient_Home";
        } else {
          console.warn(`RootNavigator: Невідома роль (${userRole}), перехід на Patsient_Home.`);
          targetRouteName = "Patsient_Home";
        }
      } else {
        targetRouteName = "HomeScreen";
      }

      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log(`RootNavigator Effect: Current: ${currentRoute}, Target: ${targetRouteName}, Session: ${session ? 'Active' : 'None'}, Loading: ${loading}, Role: ${userRole}, Has Navigated Initially: ${hasNavigatedInitially}`);

      if (
        !hasNavigatedInitially ||
        (currentRoute !== targetRouteName &&
         !(session === null && (currentRoute === "LoginScreen" || currentRoute === "RegisterScreen" || currentRoute === "Login" || currentRoute === "Register" || currentRoute === "ResetPasswordScreen")))
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
        if (!hasNavigatedInitially) {
           SplashScreen.hideAsync();
           setHasNavigatedInitially(true); 
        }
      }
    } else if (!loading && !isNavigationReady && !hasNavigatedInitially) {
        console.log("RootNavigator Effect: Чекаємо на готовність NavigationContainer.");
    } else if (loading) {
        console.log("RootNavigator Effect: AuthProvider все ще завантажується (loading: true).");
    }
    
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
        await Font.loadAsync({
          "Mont-Regular": require("./assets/Font/static/Montserrat-Regular.ttf"),
          "Mont-Medium": require("./assets/Font/static/Montserrat-Medium.ttf"),
          "Mont-Bold": require("./assets/Font/static/Montserrat-Bold.ttf"),
          "Mont-SemiBold": require("./assets/Font/static/Montserrat-SemiBold.ttf"),
        });
        console.log("App.js: Шрифти завантажені.");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Загальні сповіщення',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
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