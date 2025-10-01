import { useRouter } from "expo-router"; // 👈 import router
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// 📱 Scaling helpers for responsiveness
const scale = (size: number) => (screenWidth / 375) * size;   // base iPhone width
const verticalScale = (size: number) => (screenHeight / 812) * size; // base iPhone height

const svgHeight = screenHeight * 0.25; 
const vbW = 1440; 
const vbH = 320;  

export default function HomeScreen() {
  const router = useRouter(); // 👈 hook

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

        {/* Button - now navigates to map.tsx */}
        <TouchableOpacity style={styles.button} onPress={() => router.push("/map")}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
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
  button: {
    backgroundColor: "black",
    marginTop: verticalScale(60),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(100),
    borderRadius: 40,
    textAlign: "center",
  },
  buttonText: {
    color: "white",
    fontSize: scale(20),
    fontWeight: "bold",
  },
});
