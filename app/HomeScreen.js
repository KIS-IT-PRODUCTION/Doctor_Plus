import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "../assets/icon.svg";
import Box from "../assets/Main/check_box.svg";
import Box2 from "../assets/Main/check_box_outline_blank.svg";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);

  const handlePatientSelect = () => {
    console.log("Patient selected");
    navigation.navigate("RegisterScreen"); // Змінено на 'Register'
  };

  const handleDoctorSelect = () => {
    console.log("Doctor selected");
    navigation.navigate("RegisterScreen"); // Вам потрібно буде створити цей екран
  };

  const handlePrivacyPolicyToggle = () => {
    setPrivacyPolicyAgreed(!privacyPolicyAgreed);
  };

  const handlePrivacyPolicyPress = () => {
    console.log("Privacy Policy Clicked");
    // You might use Linking.openURL here to open a web page
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Icon width={190} height={190} />
      </View>

      <Text style={styles.title}>Онлайн-консультації лікарів</Text>
      <Text style={styles.subtitle}>
        Здоров'я - це найцінніший скарб, і ми тут, щоб допомогти вам його
        зберегти.
      </Text>

      <Text style={styles.chooseText}>Обери себе!</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePatientSelect}>
          <Text style={styles.buttonText}>Пацієнт</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleDoctorSelect}>
          <Text style={styles.buttonText}>Лікар</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.privacyPolicyContainer}>
        <TouchableOpacity onPress={handlePrivacyPolicyToggle}>
          {privacyPolicyAgreed ? (
            <Box width={24} height={24} />
          ) : (
            <Box2 width={24} height={24} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrivacyPolicyPress}>
          <Text style={styles.privacyPolicyText}>
            <Text style={styles.privacyPolicyText2}>Я погоджуюсь з </Text>
            Політикою конфіденційності
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white", // Змінено колір фону на білий
  },
  logoContainer: {
    marginTop: 60,

    // backgroundColor: 'lightblue', // Для налагодження
  },
  title: {
    fontSize: 24, // Трохи зменшено розмір шрифту
    color: "#333",
    textAlign: "center",
    fontFamily: "Mont-SemiBold",
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    fontFamily: "Mont-Regular",
    marginBottom: 72,
    paddingHorizontal: 20,
    lineHeight: 22,
    marginTop: 9,
  },
  chooseText: {
    fontSize: 32,
    fontFamily: "Mont-SemiBold",
    color: "#555",
    marginBottom: 9,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0EB3EB", // Колір кнопок як на зображенні
    borderRadius: 555, // Заокруглені кути
    alignItems: "center",
    justifyContent: "center", // Додано для вертикального центрування
    marginBottom: 9,
    width: 258,
    height: 58,
  },
  buttonText: {
    color: "white",
    fontFamily: "Mont-SemiBold",
    fontSize: 20,
    textAlign: "center",
  },
  privacyPolicyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  privacyPolicyText: {
    fontSize: 10,
    color: "#337AB7", // Колір посилання
    textDecorationLine: "underline",
    fontFamily: "Mont-SemiBold",
  },
  privacyPolicyText2: {
    fontSize: 10,
    color: "black", // Колір посилання
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
  },
});

export default HomeScreen;
