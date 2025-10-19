import { useAuth } from "@/hooks/useAuth";
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

export default function SignUpScreen() {
  const router = useRouter();
  const { setLoggedIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleGuest = () => {
    setLoggedIn(true);
    router.push("/(tabs)/profile?guest=true"); // ✅ add query to detect guest
  };

  const handleSignUpSubmit = () => {
    if (form.name && form.email && form.password) {
      setLoggedIn(true);
      Alert.alert(
        "Registration Successful",
        "You have successfully registered!",
        [{ text: "OK", onPress: () => router.push("/(tabs)/profile") }]
      );
    } else {
      Alert.alert("Missing Fields", "Please fill in all fields.");
    }
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
          <Text style={styles.cardTitle}>Create Your Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#888"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
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
            onPress={handleSignUpSubmit}
          >
            <Text style={[styles.buttonText, { color: "white" }]}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGuest}>
            <Text style={styles.signupText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)/login")}>
            <Text style={[styles.signupText, { color: "#355fc7" }]}>
              Already have an account? Login
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
    marginTop: verticalScale(15),
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
