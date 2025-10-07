import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (size) => (screenWidth / 375) * size;
const vbW = 1440;
const vbH = 320;

export default function Shop2() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width={screenWidth}
          height={screenHeight * 0.4}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push("/map")}>
            <Ionicons name="arrow-back" size={scale(22)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>(BRAND) LAUNDRY SHOP</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* On-going Shop Placeholder */}
      <View style={styles.placeholderContainer}>
        <Ionicons name="construct" size={scale(60)} color="#3864C3" />
        <Text style={styles.placeholderTitle}>On-going Shop</Text>
        <Text style={styles.placeholderSubtitle}>(To be placed)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  headerBox: {
    width: "100%",
    height: screenHeight * 0.15,
    backgroundColor: "#0AADFF",
    paddingTop: screenHeight * 0.05,
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    zIndex: 2,
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  placeholderTitle: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#092B75",
    marginTop: scale(15),
  },
  placeholderSubtitle: {
    fontSize: scale(14),
    color: "#555",
    marginTop: scale(6),
  },
});
