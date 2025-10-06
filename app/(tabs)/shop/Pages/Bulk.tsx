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

export default function Bulk() {
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

                {/* Bulk Laundry Info Bar (BELOW header, ABOVE pricelist) */}
                <View 
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#B3DAFE",
                    paddingTop: 46,
                    paddingBottom: 49,
                    paddingLeft: 4,
                  }}>
                  {/* Text description section */}
                  <View style={{ marginRight: 25 }}>
                    <Text 
                      style={{
                        color: "#092B75",
                        fontSize: 36,
                        fontWeight: "bold",
                        marginBottom: 9,
                        marginHorizontal: 21,
                      }}>
                      {"Bulk Laundry"}
                    </Text>
                    <Text 
                      style={{
                        color: "#092B75",
                        fontSize: 16,
                        marginLeft: 21,
                        marginRight: 7,
                        width: 223,
                      }}>
                      {"This Laundry Service for the usual laundry such as towels, rugs, and sheets"}
                    </Text>
                  </View>

                  {/* Icon image on right side */}
                  <Image
                    source={{uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1ea31e45-7037-4c56-8102-0e860069e0a8"}} 
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
              Mixed Wash (Up to 6 Kg) {'\n'}Affordable all-in-one wash, dry, and fold for everyday laundry.
            </Text>
            <Text style={styles.pricelistItemPrice}>₱180</Text>
          </View>

          <View style={styles.pricelistItemRowAlt}>
            <Text style={styles.pricelistItemDescription}>
              Separate Wash (Up to 12 KG){'\n'}Separate handling of lights and darks, washed, dried, and folded.
            </Text>
            <Text style={styles.pricelistItemPriceAlt}>₱540</Text>
          </View>

          <View style={styles.pricelistItemRow}>
            <Text style={[styles.pricelistItemDescription, { fontWeight: 'bold' }]}>Each Additional 1 KG</Text>
            <Text style={styles.pricelistItemPrice}>₱45</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navbar (always above layout) */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => alert('Drop Off Pressed!')}
        >
          <Text style={styles.buttonText}>Drop Off</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => alert('Pickup Pressed!')}
        >
          <Text style={styles.buttonText}>Pick Up & Delivery</Text>
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ✅ kept everything exactly the same as your code
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  headerBackground: {
    backgroundColor: "#D9D9D966"
  },
  headerPadding: {
    paddingBottom: 108
  },
  headerImageBackground: {
    paddingTop: 13,
    paddingBottom: 132
  },
  statusBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 45,
    marginHorizontal: 22
  },
  statusBarTime: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 14
  },
  statusBarIcons: {
    width: 67,
    height: 11
  },
  headerTitleRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 35
  },
  headerTitleIcon: {
    width: 18,
    height: 15,
    marginRight: 10
  },
  headerTitleText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold"
  },
  headerFooterBar: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    flexDirection: "row",
    backgroundColor: "#B3DAFE",
    paddingTop: 46,
    paddingBottom: 49,
    paddingLeft: 4
  },
  headerFooterTextContainer: {
    marginRight: 25
  },
  headerFooterTitle: {
    color: "#092B75",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 9,
    marginHorizontal: 21
  },
  headerFooterDescription: {
    color: "#092B75",
    fontSize: 16,
    marginLeft: 21,
    marginRight: 7,
    width: 223
  },
  headerFooterImage: {
    width: 88,
    height: 88
  },
  pricelistSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 1
  },
  pricelistTitle: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 19,
    marginLeft: 17,
    marginRight: 136
  },
  pricelistItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginHorizontal: 16
  },
  pricelistItemRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 46,
    marginHorizontal: 16
  },
  pricelistItemDescription: {
    color: "#000000",
    fontSize: 16,
    marginRight: 4,
    flex: 1
  },
  pricelistItemPrice: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    flex: 1
  },
  pricelistItemPriceAlt: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 18,
    flex: 1
  },
  pricelistButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#607DFF",
    borderTopWidth: 1,
    paddingHorizontal: 25,
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: "#1939BB",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 30
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold"
  },
  dividerLine: {
    height: 1,
    marginBottom: 1
  },
  footerContainer: {
    backgroundColor: "#09ADFF",
    paddingVertical: 20
  },
  footerRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 2,
    marginBottom: 7,
    marginLeft: 32
  },
  footerItem: {
    borderRadius: 20,
    marginRight: 62,
    alignItems: 'center'
  },
  footerItemWithMargin: {
    borderRadius: 20,
    marginRight: 25,
    alignItems: 'center'
  },
  footerIcon: {
    borderRadius: 20,
    width: 24,
    height: 24,
    marginHorizontal: 8
  },
  footerIconWithMarginBottom: {
    borderRadius: 20,
    width: 24,
    height: 24,
    marginBottom: 3,
    marginHorizontal: 16
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 11
  },
  footerTextLight: {
    color: "#F7F9FF",
    fontSize: 11
  },
  footerIndicatorContainer: {
    alignItems: "center"
  },
  footerIndicator: {
    width: 148,
    height: 5,
    backgroundColor: "#0F172A",
    borderRadius: 100
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
});
