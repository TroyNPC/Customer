import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;

const svgHeight = screenHeight * 0.25; 
const vbW = 1440; 
const vbH = 320;  

export default function HomeScreen() {
  const router = useRouter();
  const { loginAsGuest } = useAuth();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleGuest = () => {
    loginAsGuest();
    router.push("/(tabs)/map");
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
          d={`
            M0,0 
            L0,${vbH * 0.3} 
            C ${vbW * 0.3},${vbH * 0.1} ${vbW * 0.6},${vbH * 0.8} ${vbW},${vbH * 0.7} 
            L${vbW},0 
            Z
          `}
        />
      </Svg>

      {/* ===== Content ===== */}
      <View style={styles.content}>
        {/* Icon */}
        <Image 
          source={require("../../assets/images/Monochrome.png")}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>LaundryGo</Text>

        {/* Features */}
        <View style={styles.textBlock}>
          <Text style={styles.feature}>✅ Professional Cleanings</Text>
          <Text style={styles.feature}>✅ Laundry Shops in GPS</Text>
          <Text style={styles.feature}>✅ Easy to Use</Text>
          <Text style={styles.feature}>✅ Multiple Shops with Branches</Text>
        </View>

        {/* Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Login Button */}
          <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          {/* Guest Button */}
          <TouchableOpacity style={[styles.button, styles.guestButton]} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
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
          d={`
            M0,${vbH * 0.2}  
            C ${vbW * 0.25},${vbH * 0.9} ${vbW * 0.55},${vbH * -0.2} ${vbW},${vbH * 0.4}
            L ${vbW},${vbH} 
            L 0,${vbH} 
            Z
          `}
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
  topWave: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  bottomWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  content: {
    width: "85%",
    marginTop: svgHeight * 0.4,
    alignItems: "center",
  },
  icon: {
    width: scale(300),
    height: verticalScale(150),
    marginTop: verticalScale(-20),
    marginBottom: 0,
  },
  title: {
    fontSize: scale(36),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: verticalScale(25),
  },
  textBlock: {
    marginTop: verticalScale(30),
    width: "100%",
    marginBottom: verticalScale(30),
    alignItems: "flex-start",
  },
  feature: {
    fontSize: scale(20),
    color: "white",
    marginVertical: verticalScale(6),
    textAlign: "left",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  button: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(15),
  },
  loginButton: {
    backgroundColor: "white",
  },
  loginButtonText: {
    color: "#0AADFF",
    fontSize: scale(18),
    fontWeight: "bold",
  },
  guestButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "white",
  },
  guestButtonText: {
    color: "white",
    fontSize: scale(18),
    fontWeight: "bold",
  },
});