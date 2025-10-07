import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    moderateScale,
    scale,
    verticalScale,
} from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

export default function LaundryInfo() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width={"100%"}
          height={verticalScale(160)}
          viewBox="0 0 1440 320"
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d="M0,64 C480,-32 720,256 1440,64 L1440,0 L0,0 Z"
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push("/shop/1")}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(22)}
              color="white"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>(BRAND) LAUNDRY SHOP</Text>
          <View style={{ width: moderateScale(24) }} />
        </View>
      </View>

      {/* Scrollable Info Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        contentContainerStyle={{ paddingBottom: verticalScale(60) }}
      >
        {/* Info Section - Extended to fill space */}
        <View style={styles.infoBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Laundry Shop Information</Text>
            <Text style={styles.infoDesc}>
              Welcome to our Laundry Shop! We offer high-quality washing,
              drying, and folding services with both pick-up and delivery
              options. Our machines are regularly maintained to ensure that your
              clothes are treated with care and freshness. Whether you have
              everyday laundry or special fabric care needs, our team guarantees
              clean, crisp results every time.
            </Text>
            <Text style={styles.infoDesc}>
              With our efficient service, we aim to provide convenience,
              affordability, and customer satisfaction. Our laundry solutions
              are perfect for busy professionals, students, and families who
              want clean clothes without the hassle.
            </Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/shop/1")}
            >
              <Text style={styles.backButtonText}>← Go Back</Text>
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: "https://i.ibb.co/3shhNns/laundry-logo.png" }}
            style={styles.shopLogo}
            resizeMode="contain"
          />
        </View>

        {/* Address Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address & Time</Text>
          <Text style={styles.cardText}>
            Address: Example 123 Rizal St., Dumaguete City
          </Text>
          <Text style={styles.cardText}>
            Operating Hours: 8:00 AM – 8:00 PM (Open Daily)
          </Text>
          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Contact Number & Email</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={moderateScale(16)} color="#000" />
            <Text style={styles.contactText}>09352537960</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={moderateScale(16)} color="#000" />
            <Text style={styles.contactText}>(035) 555 5550</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={moderateScale(16)} color="#000" />
            <Text style={styles.contactText}>somebodysemail@gmail.com</Text>
          </View>
        </View>

        {/* Policy Section */}
        <View style={[styles.card, { marginBottom: verticalScale(80) }]}>
          <Text style={styles.cardTitle}>Operating Policy</Text>
          <Text style={styles.cardText}>
            Please claim your laundry within 7 days after completion. Unclaimed
            items beyond this period will be subject to storage fees.
          </Text>
          <Text style={styles.cardText}>
            Damages or missing items must be reported within 24 hours of
            collection to be eligible for review and compensation.
          </Text>
          <Text style={styles.cardText}>
            For hygiene purposes, we do not accept wet or heavily soiled items
            for processing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBox: {
    width: "100%",
    height: verticalScale(130),
    backgroundColor: "#0AADFF",
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
    marginTop: verticalScale(30),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#D4F6F9",
    padding: scale(20),
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#000",
    marginBottom: verticalScale(6),
  },
  infoDesc: {
    fontSize: moderateScale(13),
    color: "#333",
    marginBottom: verticalScale(10),
    lineHeight: verticalScale(18),
  },
  backButton: {
    backgroundColor: "#193ABC",
    borderRadius: scale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "white",
    fontSize: moderateScale(12.5),
    fontWeight: "bold",
  },
  shopLogo: {
    width: scale(90),
    height: scale(90),
    marginLeft: scale(10),
    borderRadius: scale(45),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(15),
    padding: scale(16),
    marginHorizontal: scale(20),
    marginVertical: verticalScale(10),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "bold",
    color: "#000",
    marginBottom: verticalScale(8),
  },
  cardText: {
    fontSize: moderateScale(12.5),
    color: "#333",
    marginBottom: verticalScale(5),
    lineHeight: verticalScale(18),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    marginVertical: verticalScale(10),
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  contactText: {
    fontSize: moderateScale(12.5),
    color: "#000",
    marginLeft: scale(6),
  },
});
