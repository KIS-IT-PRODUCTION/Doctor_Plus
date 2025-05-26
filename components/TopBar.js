// components/TabBar.js
import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const TabBar = ({ activeTab, onTabPress }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handlePress = (tabName, screenName) => {
    onTabPress(tabName);

    if (navigation.isFocused()) {
      const state = navigation.getState();
      const currentRouteName = state.routes[state.index].name;

      if (currentRouteName !== screenName) {
        navigation.replace(screenName);
      }
    }
  };

  return (
    <View style={[styles.tabBarContainer, { bottom: 10 + insets.bottom }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Home" && styles.activeTabButton, 
        ]}
        onPress={() => handlePress("Home", "Patsient_Home")}
      >
        <Ionicons
          name="home-outline" 
          size={28}
          color={activeTab === "Home" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Home" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("home")} 
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Questions" && styles.activeTabButton, 
        ]}
        onPress={() => handlePress("Questions", "Faq")}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={28}
          color={activeTab === "Questions" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Questions" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("questions")} 
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Headphones" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Headphones", "Support")}
      >
        <Ionicons
          name="headset-outline"
          size={28}
          color={activeTab === "Headphones" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Headphones" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("support")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "Stars" && styles.activeTabButton,
        ]}
        onPress={() => handlePress("Stars", "Review")}
      >
        <Ionicons
          name="star-outline"
          size={28}
          color={activeTab === "Stars" ? "#0EB3EB" : "white"}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === "Stars" ? "#0EB3EB" : "white" },
          ]}
        >
          {t("Review")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgb(14, 180, 235)",
    height: 70,
    width: Dimensions.get("window").width * 0.9,
    borderRadius: 555,
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 10,
    zIndex: 10,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    paddingVertical: 5,
  },
  activeTabButton: {
    borderRadius: 555,
    backgroundColor: "white",
    width: 60,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Mont-Regular",
  },
});

export default TabBar;
