import React, { useState } from "react";
import {
  View,
  Text, // <-- Упевніться, що Text імпортовано
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
    navigation.navigate("RegisterScreen");
  };

  const handleDoctorSelect = () => {
    console.log("Doctor selected");
    navigation.navigate("Register");
  };

  const handlePrivacyPolicyToggle = () => {
    setPrivacyPolicyAgreed(!privacyPolicyAgreed);
  };

  const handlePrivacyPolicyPress = () => {
    console.log("Privacy Policy Clicked");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Icon width={190} height={190} />
      </View>
      <Text style={styles.title}>Online Doctor Consultations</Text>
      <Text style={styles.subtitle}>
        Health is the most valuable treasure, and we are here to help you
        preserve it.
      </Text>
      <Text style={styles.chooseText}>Choose your role!</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePatientSelect}>
          <Text style={styles.buttonText}>Patient</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleDoctorSelect}>
          <Text style={styles.buttonText}>Doctor</Text>
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
            <Text>I agree with </Text>
            <Text style={styles.privacyPolicyText2}>Privacy Policy</Text>
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
    backgroundColor: "white",
    paddingTop: 120,
  },

  title: {
    fontSize: 24,
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
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#337AB7",
    textDecorationLine: "underline",
    fontFamily: "Mont-SemiBold",
  },
  privacyPolicyText2: {
    fontSize: 10,
    color: "black",
    textDecorationLine: "underline",
    fontFamily: "Mont-Medium",
  },
});

export default HomeScreen;
