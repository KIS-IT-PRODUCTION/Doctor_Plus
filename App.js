import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Імпортуємо ваш AuthProvider
import { AuthProvider, useAuth } from "./AuthProvider"; // <--- ДОДАНО ІМПОРТ useAuth з AuthProvider

// Імпортуємо ваші екрани (припускаючи, що вони знаходяться в корені проекту, як і раніше)
import LoginScreen from "./app/LoginScreen"; // Змінено шлях
import Patsient_Home from "./app/Patsient_Home"; // Змінено шлях
// Примітка: HomeScreen та RegisterScreen не були надані, але залишені для повноти,
// якщо вони існують у вашому проекті в корені.
import RegisterScreen from "./app/RegisterScreen"; // Змінено шлях
import HomeScreen from "./app/HomeScreen"; // Змінено шлях


const Stack = createNativeStackNavigator();

// Компонент, який визначає початковий маршрут на основі стану автентифікації
function InitialNavigator() {
  // Використовуємо useAuth з нашого AuthProvider
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження автентифікації...</Text>
      </View>
    );
  }

  // Визначаємо початковий маршрут: якщо сесія існує, то Patsient_Home, інакше LoginScreen
  // Примітка: Ви можете налаштувати це на HomeScreen, якщо це ваш основний екран без авторизації

  return (
    <Stack.Navigator >
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
      {/* Якщо у вас є HomeScreen, який не вимагає авторизації, його можна залишити */}
     
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    // Обгортаємо всю навігацію компонентом AuthProvider
    <AuthProvider>
      <NavigationContainer>
        <InitialNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

