import { useAuth } from "@/hooks/useAuth"; // 👈 added
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;

const svgHeight = screenHeight * 0.25;
const vbW = 1440;
const vbH = 320;

export default function LoginScreen() {
  const router = useRouter();
  const { setLoggedIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = () => {
    if (form.email && form.password) {
      setLoggedIn(true);
      Alert.alert("Login Successful", "Welcome back!", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);
    } else {
      Alert.alert("Missing Fields", "Please enter both email and password.");
    }
  };

  const handleGuest = () => {
    setLoggedIn(true);
    router.push("/(tabs)/profile?guest=true");
  };

  return (
    <View style={styles.container}>
      {/* ===== Top Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(300)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.topWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,0 L0,${vbH * 0.3} C ${vbW * 0.3},${vbH * 0.1} ${vbW * 0.6},${vbH *
            0.8} ${vbW},${vbH * 0.7} L${vbW},0 Z`}
        />
      </Svg>

      {/* ===== Content ===== */}
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/Monochrome.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>LaundryGo</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back!</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
          />

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleLogin}
          >
            <Text style={[styles.buttonText, { color: "white" }]}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGuest}>
            <Text style={styles.signupText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)/signup")}>
            <Text style={[styles.signupText, { color: "#355fc7" }]}>
              Don’t have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Bottom Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(120)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.bottomWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,${vbH * 0.2} C ${vbW * 0.25},${vbH * 0.9} ${vbW * 0.55},${vbH *
            -0.2} ${vbW},${vbH * 0.4} L ${vbW},${vbH} L 0,${vbH} Z`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0AADFF",
    alignItems: "center",
  },
  topWave: { position: "absolute", top: 0, left: 0 },
  bottomWave: { position: "absolute", bottom: 0, left: 0 },
  content: {
    width: "85%",
    marginTop: svgHeight * 0.4,
    alignItems: "center",
  },
  icon: {
    width: scale(300),
    height: verticalScale(150),
    marginTop: verticalScale(-20),
  },
  title: {
    fontSize: scale(36),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: verticalScale(25),
  },
  card: {
    zIndex: 1,
    backgroundColor: "white",
    width: "100%",
    borderRadius: 15,
    alignItems: "center",
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "black",
    marginBottom: verticalScale(20),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    width: "100%",
    justifyContent: "center",
    marginBottom: verticalScale(15),
  },
  submitButton: { backgroundColor: "#0AADFF" },
  buttonText: { fontSize: scale(16), fontWeight: "600" },
  signupText: {
    fontSize: scale(15),
    fontWeight: "500",
    color: "black",
    marginTop: verticalScale(10),
  },
  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    fontSize: scale(16),
    color: "#000",
    marginBottom: verticalScale(15),
  },
});
