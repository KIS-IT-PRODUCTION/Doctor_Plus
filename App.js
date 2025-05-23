import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  LogBox,
} from "react-native"; // Додано LogBox
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthProvider, useAuth } from "./providers/AuthProvider";

// --- ІМПОРТ ДЛЯ i18n ---
// Просто імпортуємо файл конфігурації i18n, щоб він ініціалізувався
// Якщо ваш i18n.js знаходиться в іншій папці, оновіть шлях.
import "./i18n"; // <-- ВАЖЛИВО: переконайтеся, що шлях правильний!

// Імпорти екранів
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import Search from "./app/Search";

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// LogBox.ignoreLogs([
//   "Warning: Text strings must be rendered within a <Text> component.",
// ]);
// LogBox.ignoreAllLogs(true);

// Компонент, який визначає початковий маршрут на основі стану автентифікації
function InitialNavigator() {
  const { session, loading } = useAuth(); // Отримуємо сесію та стан завантаження

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження автентифікації...</Text>{" "}
        {/* Цей текст вже коректно обгорнутий в <Text> */}
      </View>
    );
  }

  const initialRouteName =
    session && session.user ? "Patsient_Home" : "HomeScreen";

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterScreen"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Patsient_Home"
        component={Patsient_Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
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
        });
        // Додаткові асинхронні операції, якщо є
        // Тут немає потреби чекати на i18n, оскільки він ініціалізується при імпорті файлу i18n.js
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
    return null; // Тут можна відобразити власний екран завантаження, поки шрифти та i18n не готові
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <InitialNavigator />
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
