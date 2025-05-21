import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React, { useState, useEffect, useCallback } from "react";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen"; // Для керування екраном завантаження
import * as Font from "expo-font"; // Для завантаження шрифтів

// Імпортуємо ваш AuthProvider
import { AuthProvider, useAuth } from "./providers/AuthProvider";

// Імпортуємо ваші екрани
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";

// Запобігаємо автоматичному приховуванню екрану завантаження
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Компонент, який визначає початковий маршрут на основі стану автентифікації
function InitialNavigator() {
  const { session, loading } = useAuth(); // Отримуємо сесію та стан завантаження

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження автентифікації...</Text>
      </View>
    );
  }

  // Визначаємо початковий маршрут
  const initialRouteName =
    session && session.user ? "Patsient_Home" : "HomeScreen";
  // Якщо HomeScreen - це вступний екран без авторизації, можна змінити на "HomeScreen"

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {/* Приклад: якщо HomeScreen - це екран-заставка перед входом */}
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
          // Додайте інші варіанти Montserrat, якщо вони вам потрібні
        });
        // Додаткові асинхронні операції, якщо є
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
    return null; // Або ваш власний компонент завантаження
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
