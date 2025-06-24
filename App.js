
import "react-native-url-polyfill/auto";

import React, { useState, useEffect, useCallback } from "react";

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

import * as Linking from "expo-linking"; // Залишаємо Linking, якщо використовуєте його для інших цілей

import { AuthProvider, useAuth } from "./providers/AuthProvider";

import "./i18n";



// Імпорти екранів

import ChooseSpecial from "./app/ChooseSpecial";

import LoginScreen from "./app/LoginScreen"; // Ймовірно, для пацієнтів

import Patsient_Home from "./app/Patsient_Home";

import RegisterScreen from "./app/RegisterScreen"; // Ймовірно, для пацієнтів

import HomeScreen from "./app/HomeScreen";

import Search from "./app/Search";

import Messege from "./app/doctor/Messege";

import Faq from "./app/Faq";

import Faq_doctor from "./app/doctor/Faq_doctor"; // Ймовірно, для лікарів

import Support from "./app/Support";

import Support_doctor from "./app/doctor/Support_doctor"; // Ймовірно, для лікарів

import Review from "./app/Rewiew";

import Rewiew_app from "./app/doctor/Rewiew_app"; // Ймовірно, для лікарів

import WriteReview from "./app/WriteRewiew";

import Profile from "./app/Profile";

import Register from "./app/doctor/Register"; // Ймовірно, для лікарів

import Login from "./app/doctor/Login"; // Ймовірно, для лікарів

import Anketa_Settings from "./app/doctor/Anketa_Settings";

import Profile_doctor from "./app/doctor/Profile_doctor";

import ConsultationTime from "./app/doctor/ConsultationTime";

import ConsultationTimePatient from "./app/ConsultationTimePatient";

import PatientMessages from "./app/PatientMessages";

import ResetPasswordScreen from "./app/doctor/ResetPasswordScreen"; // ВИДАЛЯЄМО: Цей екран більше не потрібен для скидання пароля



SplashScreen.preventAutoHideAsync();



const Stack = createNativeStackNavigator();



// Якщо у вас немає інших deep links, окрім scheme "doctor", то можна спростити prefixes

// const prefix = Linking.createURL("doctor://"); // Залишаємо, якщо schema "doctor" використовується



function InitialNavigator() {

const { session, loading, userRole } = useAuth();



if (loading) {

console.log("InitialNavigator: Auth loading...");

return (

<View style={styles.centeredContainer}>

<ActivityIndicator size="large" color="#0EB3EB" />

<Text style={{ marginTop: 10, fontFamily: "Mont-Regular" }}>Завантаження даних користувача...</Text>

</View>

);

}



let defaultInitialRouteName;

let initialRouteParams = {};



if (session && session.user) {

if (userRole === "doctor") {

defaultInitialRouteName = "Anketa_Settings";

initialRouteParams = { doctorId: session.user.id };

console.log(`InitialNavigator: Session active, user is doctor. Initial route: ${defaultInitialRouteName}`);

} else if (userRole === "patient") {

defaultInitialRouteName = "Patsient_Home";

console.log(`InitialNavigator: Session active, user is patient. Initial route: ${defaultInitialRouteName}`);

} else {

defaultInitialRouteName = "HomeScreen";

console.log("InitialNavigator: Session active, but user role not determined. Defaulting to HomeScreen.");

}

} else {

defaultInitialRouteName = "HomeScreen";

console.log(`InitialNavigator: No active session. Initial route: ${defaultInitialRouteName}`);

}



return (

<Stack.Navigator

initialRouteName={defaultInitialRouteName}

screenOptions={{

headerShown: false,

animation: "fade",

animationDuration: 0,

}}

>

{/* УВАГА! ПЕРЕВІРТЕ ТУТ ЗАЙВІ ПРОБІЛИ АБО ПОРОЖНІ РЯДКИ */}

<Stack.Screen name="HomeScreen" component={HomeScreen} />

<Stack.Screen name="LoginScreen" component={LoginScreen} />

<Stack.Screen name="Login" component={Login} />

<Stack.Screen name="RegisterScreen" component={RegisterScreen} />

<Stack.Screen name="Register" component={Register} />

<Stack.Screen name="Anketa_Settings" component={Anketa_Settings} />

<Stack.Screen name="Patsient_Home" component={Patsient_Home} />

<Stack.Screen name="Search" component={Search} />

<Stack.Screen name="Faq_doctor" component={Faq_doctor} />

<Stack.Screen name="Support_doctor" component={Support_doctor} />

<Stack.Screen name="Rewiew_app" component={Rewiew_app} />

<Stack.Screen name="Messege" component={Messege} />

<Stack.Screen name="Faq" component={Faq} />

<Stack.Screen name="Support" component={Support} />

<Stack.Screen name="Review" component={Review} />

<Stack.Screen name="ChooseSpecial" component={ChooseSpecial} />

<Stack.Screen name="WriteReview" component={WriteReview} />

<Stack.Screen name="Profile" component={Profile} />

<Stack.Screen name="ConsultationTimePatient" component={ConsultationTimePatient} />

<Stack.Screen name="PatientMessages" component={PatientMessages} />

<Stack.Screen

name="ResetPasswordScreen"

component={ResetPasswordScreen}

/>

<Stack.Screen

name="Profile_doctor"

component={Profile_doctor}

initialParams={defaultInitialRouteName === "Profile_doctor" ? initialRouteParams : undefined}

/>

<Stack.Screen name="ConsultationTime" component={ConsultationTime} />

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



// Якщо ви більше не використовуєте Deep Linking взагалі,

// то можна прибрати весь об'єкт 'linking' або залишити лише для `scheme`.

const linking = {

// Залишаємо лише вашу кастомну схему, якщо вона використовується для інших цілей.

// Якщо ви плануєте використовувати deep linking для інших екранів (наприклад, перехід до конкретного профілю лікаря),

// то вам потрібно буде розширити цей об'єкт.

prefixes: [Linking.createURL("doctor://")], // Залишаємо лише це

config: {

screens: {

// Ми видалили 'ResetPasswordScreen' звідси, оскільки він більше не є ціллю Deep Link

// Залишіть інші екрани, якщо ви плануєте, що до них буде Deep Linking.

// Наприклад:

// Login: "doctor-login",

// Profile_doctor: "profile-doctor/:doctorId",

},

},

// Ці функції можна залишити, вони не зашкодять, але й не будуть використовуватись для скидання пароля

async getInitialURL() {

const url = await Linking.getInitialURL();

if (url) {

console.log('App.js Deep Linking: Додаток запущено з Initial URL:', url);

return url;

}

console.log('App.js Deep Linking: Додаток запущено без Initial URL.');

return null;

},

subscribe(listener) {

const onReceiveURL = ({ url }) => {

console.log('App.js Deep Linking: Отримано URL (додаток на передньому плані):', url);

listener(url);

};



const subscription = Linking.addEventListener('url', onReceiveURL);

return () => {

console.log('App.js Deep Linking: Відписано від слухача URL.');

subscription.remove();

};

},

};





return (

<View style={{ flex: 1 }} onLayout={onLayoutRootView}>

<AuthProvider>

<NavigationContainer linking={linking}>

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

backgroundColor: "#fff",

},

});