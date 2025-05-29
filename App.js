import "react-native-url-polyfill/auto"; // Важливо для Supabase в React Native
import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  LogBox,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthProvider, useAuth } from "./providers/AuthProvider"; 
import "./i18n";
import ChooseSpecial from './app/ChooseSpecial';
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
import Profile  from "./app/Profile";
import Register from "./app/doctor/Register";
import Login from "./app/doctor/Login";
import Anketa_Settings from "./app/doctor/Anketa_Settings";

SplashScreen.preventAutoHideAsync();
const Stack = createNativeStackNavigator();

function InitialNavigator() {
  const { session, loading } = useAuth(); 
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Завантаження автентифікації...</Text>
      </View>
    );
  }

  const initialRouteName = session && session.user ? "Patsient_Home" : "HomeScreen";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 0,
      }}
    >
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
    </Stack.Navigator>
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