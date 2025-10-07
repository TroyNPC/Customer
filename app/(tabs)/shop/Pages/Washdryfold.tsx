import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

export default function WashDryFold() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width="100%"
          height={mvs(120)}
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
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>(BRAND) LAUNDRY SHOP</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Wash, Dry & Fold Info Bar */}
      <View style={styles.infoBar}>
        {/* Text description section */}
        <View style={{ flex: 1, marginRight: s(10) }}>
          <Text style={styles.infoTitle}>Wash, Dry & Fold</Text>
          <Text style={styles.infoDescription}>
            Complete laundry service including washing, drying, and neatly folding your clothes.
          </Text>
        </View>

        {/* Icon image on right side */}
        <View style={{ flexShrink: 0, justifyContent: "center", alignItems: "flex-end" }}>
          <Image
            source={{
              uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4e530eb0-7f1a-44c4-939b-74ab94e932ea",
            }}
            resizeMode="contain"
            style={{
              width: s(88),
              height: s(88),
              maxWidth: s(88),
              maxHeight: s(88),
            }}
          />
        </View>
      </View>

      {/* Scrollable Pricelist Section */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: mvs(120) }}
          style={{ flex: 1, backgroundColor: "white" }}
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.pricelistSection}>
            <Text style={styles.pricelistTitle}>Pricelist (Price Per KG)</Text>

            <View style={styles.pricelistItemRow}>
              <Text style={styles.pricelistItemDescription}>
                Mixed Wash (Up to 6 Kg) {"\n"}Affordable all-in-one wash, dry, and fold for everyday laundry.
              </Text>
              <Text style={styles.pricelistItemPrice}>₱180</Text>
            </View>

            <View style={styles.pricelistItemRowAlt}>
              <Text style={styles.pricelistItemDescription}>
                Separate Wash (Up to 12 KG) {"\n"}Separate handling of lights and darks, washed, dried, and folded.
              </Text>
              <Text style={styles.pricelistItemPriceAlt}>₱540</Text>
            </View>

            <View style={styles.pricelistItemRow}>
              <Text style={[styles.pricelistItemDescription, { fontWeight: "bold" }]}>
                Each Additional 1 KG
              </Text>
              <Text style={styles.pricelistItemPrice}>₱30</Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navbar */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.buttonPrimary}
             onPress={() => router.push("/onlyscan")}
          >
            <Text style={styles.buttonText}>Drop Off</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => router.push("/deliveryonly")}
          >
            <Text style={styles.buttonText}>Pick Up & Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  pricelistSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: mvs(20),
    paddingBottom: mvs(5),
  },
  pricelistTitle: {
    color: "#000000",
    fontSize: ms(22),
    fontWeight: "bold",
    marginBottom: mvs(10),
    marginLeft: s(15),
    marginRight: s(60),
  },
  pricelistItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: mvs(15),
    marginHorizontal: s(16),
  },
  pricelistItemRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: mvs(25),
    marginHorizontal: s(16),
  },
  pricelistItemDescription: {
    color: "#000000",
    fontSize: ms(16),
    marginRight: s(4),
    flex: 1,
  },
  pricelistItemPrice: {
    color: "#000000",
    fontSize: ms(15),
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
  pricelistItemPriceAlt: {
    color: "#000000",
    fontSize: ms(15),
    fontWeight: "bold",
    textAlign: "right",
    marginTop: mvs(8),
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: "#1939BB",
    borderRadius: s(12),
    paddingVertical: mvs(8),
    paddingHorizontal: s(30),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: ms(18),
    fontWeight: "bold",
  },
  fixedBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: mvs(15),
    backgroundColor: "#607DFF",
  },
  headerBox: {
    width: "100%",
    height: mvs(120),
    backgroundColor: "#0AADFF",
    paddingTop: mvs(40),
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    zIndex: 2,
  },
  headerTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  infoBar: {
    flexDirection: "row",
    backgroundColor: "#B3DAFE",
    paddingTop: mvs(15),
    paddingBottom: mvs(15),
    paddingHorizontal: s(15),
    alignItems: "center",
  },
  infoTitle: {
    color: "#092B75",
    fontSize: ms(20),
    fontWeight: "bold",
    marginBottom: mvs(5),
    marginHorizontal: s(5),
  },
  infoDescription: {
    color: "#092B75",
    fontSize: ms(14),
    marginHorizontal: s(5),
    flexShrink: 1,
  },
});
