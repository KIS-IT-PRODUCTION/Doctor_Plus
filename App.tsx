import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// Імпортуємо ClerkProvider
import { ClerkProvider } from "@clerk/clerk-expo"; // Це для Expo. Якщо ви використовуєте звичайний React Native без Expo, можливо, @clerk/clerk-react буде більш доречним, але @clerk/clerk-expo зазвичай працює і там.

import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";

const Stack = createNativeStackNavigator();

// Отримуємо ключ Clerk зі змінних оточення
// Це важливо для коректної роботи ClerkProvider
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Перевірка, чи ключ доступний. У реальному проекті можна додати більш детальну обробку помилок.
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file.");
}


export default function App() {
  return (
    // Обгортаємо весь NavigationContainer компонентом ClerkProvider
    // Це робить Clerk доступним для всіх екранів та компонентів у вашому додатку
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="Patsient_Home" component={Patsient_Home} options={{ headerShown: false }} />
          </Stack.Navigator>
      </NavigationContainer>
    </ClerkProvider>
  );
}