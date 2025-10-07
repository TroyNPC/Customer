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
const scale = (size: number) => (screenWidth / 375) * size; // responsive scale for all sizes
const vbW = 1440;
const vbH = 320;

export default function Shop1() {
  const router = useRouter();

  const services = [
    {
      name: "Wash Only",
      desc: "This Laundry Service is for towels, rugs, and sheets.",
      details: "Includes Wash + Dry + In a Bag",
      price: "₱45",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4428d013-0638-4b6a-8b5f-30e52387319f",
      link: "shop/Pages/Washonly",
    },
    {
      name: "Dry Only",
      desc: "This Laundry Service is for delicate fabrics and clothes.",
      details: "Dry Cleaning + Ironing + Hangers",
      price: "₱45",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5ad4f214-42f0-4003-a4b7-fdaa819dd8e8",
      link: "shop/Pages/Dryonly",
    },
    {
      name: "Wash, Dry & Fold",
      desc: "For regular laundry including drying and folding.",
      details: "Wash + Dry + Iron + Fold + Hanger",
      price: "₱30",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1887029d-96aa-465b-b8b3-9973d47238d8",
      link: "shop/Pages/Washdryfold",
    },
    {
      name: "Iron Only",
      desc: "This service is for items that are already clean.",
      details: "Dry Cleaning + Ironing + Hangers",
      price: "₱75",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0a392eb9-7103-4c0d-b1be-0bfc186d0043",
      link: "shop/Pages/Irononly",
    },
    {
      name: "Bulk Laundry",
      desc: "Standard bulk washing for everyday clothes.",
      details: "Wash + Dry + Iron + Fold + Hanger",
      price: "₱45",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e64a5b17-4e6c-4fbc-b5f0-d06d32ad248b",
      link: "shop/Pages/Bulk",
    },
    {
      name: "Fold Only",
      desc: "Folding Service for laundries that are already done.",
      details: "Ironing + Hangers",
      price: "₱45",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/dae2b417-e99a-4c50-9f5a-924a5ceabe7a",
      link: "shop/Pages/Foldonly",
    },
    {
      name: "Dry & Fold",
      desc: "Drying and folding cleaned clothes.",
      details: "Wash + Dry + Fold + Hanger",
      price: "₱25",
      img: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e300e31a-2a3f-4e3f-aead-a0126378df9f",
      link: "shop/Pages/Dry&Fold",
    },
  ];

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

      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingVertical: scale(10) }}
        showsVerticalScrollIndicator={true}
      >
        {/* Shop Info Section */}
        <View style={styles.shopInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopTitle}>Laundry Shop Information</Text>
            <Text style={styles.shopDesc}>
              Pick-up and Delivery available. Tailored to the services you
              choose.
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <TouchableOpacity style={styles.shopButton}>
                <Text style={styles.buttonText}>Learn More</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shopButton}>
                <Text style={styles.buttonText}>Rating & Reviews</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Image
            source={{ uri: "https://i.ibb.co/3shhNns/laundry-logo.png" }}
            style={styles.shopLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Available Laundry Services</Text>
        </View>

        {/* Laundry Services List */}
        {services.map((service, index) => (
          <View key={index} style={styles.card}>
            <Image
              source={{ uri: service.img }}
              resizeMode="contain"
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>{service.name}</Text>
            <Text style={styles.cardDesc}>{service.desc}</Text>
            <View style={styles.detailTag}>
              <Text style={styles.detailText}>{service.details}</Text>
            </View>
            <TouchableOpacity
              style={styles.priceButton}
              onPress={() => router.push(service.link)}
            >
              <Text style={styles.priceText}>Price Per KG: {service.price}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
  shopInfo: {
    backgroundColor: "#D4F6F9",
    padding: scale(15),
    flexDirection: "row",
    alignItems: "center",
  },
  shopTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#000",
    marginBottom: scale(6),
  },
  shopDesc: {
    fontSize: scale(13),
    color: "#333",
    marginBottom: scale(12),
  },
  shopButton: {
    backgroundColor: "#193ABC",
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
    marginRight: scale(8),
    marginBottom: scale(5),
  },
  buttonText: {
    color: "white",
    fontSize: scale(12),
    fontWeight: "bold",
  },
  shopLogo: {
    width: scale(80),
    height: scale(80),
    marginLeft: scale(10),
    borderRadius: scale(40),
  },
  servicesHeader: {
    backgroundColor: "#3864C3",
    paddingVertical: scale(12),
    alignItems: "center",
    marginTop: scale(10),
  },
  servicesTitle: {
    color: "#FFFFFF",
    fontSize: scale(20),
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(15),
    padding: scale(15),
    marginHorizontal: scale(20),
    marginBottom: scale(15),
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 30,
  },
  cardImage: {
    width: scale(70),
    height: scale(70),
    marginBottom: scale(10),
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#092B75",
    marginBottom: scale(5),
  },
  cardDesc: {
    fontSize: scale(12),
    color: "#092B75",
    textAlign: "center",
    marginBottom: scale(8),
  },
  detailTag: {
    backgroundColor: "#09ADFF",
    borderRadius: scale(5),
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    marginBottom: scale(8),
  },
  detailText: {
    color: "white",
    fontSize: scale(10),
    fontWeight: "bold",
    textAlign: "center",
  },
  priceButton: {
    backgroundColor: "#3864C3",
    borderRadius: scale(6),
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
  },
  priceText: {
    color: "white",
    fontSize: scale(14),
    fontWeight: "bold",
  },
});
