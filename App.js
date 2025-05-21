import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React, { useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider, useAuth, Clerk } from "@clerk/clerk-expo"; // Видалено Clerk
import Constants from "expo-constants";
// import { supabase } from "./supabaseClient"; // Supabase не потрібно тут, якщо він в AuthProvider

// Імпортуємо ваш AuthProvider
import { AuthProvider } from "./AuthProvider"; // <--- ДОДАНО ІМПОРТ AuthProvider

// Імпортуємо ваші екрани
import RegisterScreen from "./app/RegisterScreen";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
import HomeScreen from "./app/HomeScreen";

const Stack = createNativeStackNavigator();

const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;

// КОМПОНЕНТ CLERKSUPABASESYNCER БІЛЬШЕ НЕ ПОТРІБЕН ОКРЕМО, ЙОГО ЛОГІКА ПЕРЕНЕСЕНА В AUTHPROVIDER
// function ClerkSupabaseSyncer() { /* ... */ }

// Компонент, який визначає початковий маршрут на основі стану автентифікації Clerk
function InitialNavigator() {
  const { isLoaded, isSignedIn } = useAuth(); // Цей useAuth тепер з вашого AuthProvider

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження...</Text>
      </View>
    );
  }

  const initialRoute = isSignedIn ? "Patsient_Home" : "HomeScreen";

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
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
  if (!publishableKey) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <Text
          style={{
            color: "red",
            fontSize: 18,
            textAlign: "center",
            padding: 20,
          }}
        >
          Missing Clerk Publishable Key. Please add it to your app.config.js
          'extra' field.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AuthProvider>
        {" "}
        {/* <--- ОБГОРНІТЬ ВАШУ НАВІГАЦІЮ КОМПОНЕНТОМ AUTHPROVIDER */}
        <NavigationContainer>
          <InitialNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ClerkProvider>
  );
}
