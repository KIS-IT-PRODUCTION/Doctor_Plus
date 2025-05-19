
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RegisterScreen from "./app/RegisterScreen";
import HomeScreen from "./app/HomeScreen";
import LoginScreen from "./app/LoginScreen";
import Patsient_Home from "./app/Patsient_Home";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="Patsient_Home" component={Patsient_Home} options={{ headerShown: false }} />
        </Stack.Navigator>
        </NavigationContainer>
  );
}

