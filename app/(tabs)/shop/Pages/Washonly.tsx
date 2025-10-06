import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const vbW = 1440;
const vbH = 320;

export default function WashOnly() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
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
            d={`
              M0,${vbH * 0.2}
              C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2}
              L${vbW},0
              L0,0
              Z
            `}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push("/shop/1")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>(BRAND) LAUNDRY SHOP</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Wash Only Info Bar (BELOW header, ABOVE pricelist) */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#B3DAFE",
          paddingTop: 46,
          paddingBottom: 49,
          paddingLeft: 4,
        }}
      >
        {/* Text description section */}
        <View style={{ marginRight: 25 }}>
          <Text
            style={{
              color: "#092B75",
              fontSize: 36,
              fontWeight: "bold",
              marginBottom: 9,
              marginHorizontal: 21,
            }}
          >
            {"Wash Only"}
          </Text>
          <Text
            style={{
              color: "#092B75",
              fontSize: 16,
              marginLeft: 21,
              marginRight: 7,
              width: 223,
            }}
          >
            {
              "This Laundry Service for the usual laundry such as towels, rugs, and sheets"
            }
          </Text>
        </View>

        {/* Icon image on right side */}
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c935e4f4-2ed3-492c-908c-8fd5bdd2f35c",
          }}
          resizeMode="stretch"
          style={{
            width: 88,
            height: 88,
          }}
        />
      </View>

      {/* Scrollable Pricelist Section */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#D9D9D966" }}
        bounces={false}
        overScrollMode="never"
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: screenHeight * 0.15 }} // ⬅️ give space for sticky buttons
      >
        {/* Pricelist Section */}
        <View style={styles.pricelistSection}>
          <Text style={styles.pricelistTitle}>Pricelist (Price Per KG)</Text>

          <View style={styles.pricelistItemRow}>
            <Text style={styles.pricelistItemDescription}>
              Mixed Wash (Up to 6 Kg) {"\n"}Light and dark clothes washed
              together at 30°C. Can request for other temperature.
            </Text>
            <Text style={styles.pricelistItemPrice}>₱240</Text>
          </View>

          <View style={styles.pricelistItemRowAlt}>
            <Text style={styles.pricelistItemDescription}>
              Separate Wash (Up to 12 KG){"\n"}Light and dark clothes washed
              together at 30°C. Can request for other temperature.
            </Text>
            <Text style={styles.pricelistItemPriceAlt}>₱540</Text>
          </View>

          <View style={styles.pricelistItemRow}>
            <Text
              style={[styles.pricelistItemDescription, { fontWeight: "bold" }]}
            >
              Each Additional 1 KG
            </Text>
            <Text style={styles.pricelistItemPrice}>₱45</Text>
          </View>
        </View>
      </ScrollView>

      {/* ⬇️ Sticky Buttons (Always above layout, responsive) */}
      <View style={styles.pricelistButtonsRow}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => alert("Pressed!")}
        >
          <Text style={styles.buttonText}>Drop Off</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => alert("Pressed!")}
        >
          <Text style={styles.buttonText}>Pick Up & Delivery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pricelistSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 1,
  },
  pricelistTitle: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 19,
    marginLeft: 17,
    marginRight: 136,
  },
  pricelistItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginHorizontal: 16,
  },
  pricelistItemRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 46,
    marginHorizontal: 16,
  },
  pricelistItemDescription: {
    color: "#000000",
    fontSize: 16,
    marginRight: 4,
    flex: 1,
  },
  pricelistItemPrice: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
  pricelistItemPriceAlt: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 18,
    flex: 1,
  },
  pricelistButtonsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#607DFF",
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  buttonPrimary: {
    backgroundColor: "#1939BB",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
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
    paddingHorizontal: 20,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});
