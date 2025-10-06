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

export default function IronOnly() {
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

      {/* Iron Only Info Bar */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#B3DAFE",
          paddingTop: 38,
          paddingBottom: 49,
          paddingHorizontal: 20,
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
              marginHorizontal: 7,
            }}
          >
            {"Iron Only"}
          </Text>
          <Text
            style={{
              color: "#092B75",
              fontSize: 16,
              marginHorizontal: 5,
              width: 223,
            }}
          >
            {"This Laundry Services is for the items that are already clean"}
          </Text>
        </View>

        {/* Icon image on right side */}
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ecbe5313-0122-492b-8f5d-6f289dddd5db",
          }}
          resizeMode="stretch"
          style={{
            width: 88,
            height: 88,
          }}
        />
      </View>

      {/* Scrollable Pricelist Section */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ flex: 1, backgroundColor: "white" }}
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={true}
        >
          {/* Pricelist Section */}
          <View style={styles.pricelistSection}>
            <Text style={styles.pricelistTitle}>Pricelist (Price Per KG)</Text>

            <View style={styles.pricelistItemRow}>
              <Text style={styles.pricelistItemDescription}>
                ₱75 / kg {"\n"}Clothes already washed are pressed neatly for a
                crisp finish.
              </Text>
              <Text style={styles.pricelistItemPrice}>₱75</Text>
            </View>

            <View style={styles.pricelistItemRowAlt}>
              <Text style={styles.pricelistItemDescription}>
                Each Additional 1 KG {"\n"}Extra pressing charged per kilogram
                beyond the first load.
              </Text>
              <Text style={styles.pricelistItemPriceAlt}>₱75</Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navbar */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => alert("Drop Off Pressed!")}
          >
            <Text style={styles.buttonText}>Drop Off</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => alert("Pickup Pressed!")}
          >
            <Text style={styles.buttonText}>Pick Up & Delivery</Text>
          </TouchableOpacity>
        </View>
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
  fixedBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#607DFF",
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
