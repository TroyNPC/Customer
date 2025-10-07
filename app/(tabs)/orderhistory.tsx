import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

export default function OrderHistory() {
  const router = useRouter();

  const orders = [
    {
      id: 1,
      name: "Edward Richards - Delivery Boy",
      status: "Ongoing",
      date: "June 2, 2025",
      time: "",
      type: "Delivery - Drop off",
      pay: "Unknown Pay",
      service: "Fold Only",
      shop: "DJW Laundry Shop",
      color: "#FDF59F",
      icon: "bicycle",
      iconColor: "#FFD93D",
      showTrackButton: true,
    },
    {
      id: 2,
      name: "Pwerto Sinto - Staff",
      status: "On-site : Drop - Off",
      date: "June 1, 2025",
      time: "11:25 AM",
      pay: "₱160 (PAYED)",
      service: "",
      shop: "JNK Laundry Shop",
      color: "#DFFFE0",
      icon: "thumbs-up",
      iconColor: "#28A745",
      showTrackButton: false,
    },
    {
      id: 3,
      name: "Sintas Mansa - Staff",
      status: "On-site : Drop - Off",
      date: "March 25, 2025",
      time: "9:25 AM",
      pay: "₱360 (PAYED)",
      service: "",
      shop: "Hangyu Laundry Shop",
      color: "#DFFFE0",
      icon: "thumbs-up",
      iconColor: "#28A745",
      showTrackButton: false,
    },
    {
      id: 4,
      name: "Mansa Claire - Staff",
      status: "On-site : Pick - Up",
      date: "March 25, 2025",
      time: "",
      pay: "₱360 (CANCELLED)",
      service: "",
      shop: "JNK Laundry Shop",
      color: "#FFD7D7",
      icon: "thumbs-down",
      iconColor: "#DC3545",
      showTrackButton: false,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width="100%"
          height={mvs(300)}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH *
              0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Scroll Section */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F6FA" }}
        contentContainerStyle={{ paddingBottom: mvs(100), paddingTop: mvs(10) }}
      >
        {orders.map((order) => (
          <View
            key={order.id}
            style={[styles.orderCard, { backgroundColor: order.color }]}
          >
            {/* Icon and Info */}
            <View style={styles.orderRow}>
              <View style={[styles.iconContainer, { backgroundColor: order.color }]}>
                <Ionicons
                  name={order.icon}
                  size={ms(28)}
                  color={order.iconColor}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{order.name}</Text>
                {order.showTrackButton ? (
                  <>
                    <Text style={styles.subText}>
                      On-the-way : {order.type}
                    </Text>
                    <Text style={styles.subText}>
                      {order.pay} - Service: {order.service}
                    </Text>
                    <Text style={styles.shopText}>
                      Laundry Shop : {order.shop}
                    </Text>
                    <TouchableOpacity style={styles.trackButton}>
                      <Text style={styles.trackButtonText}>
                        Track Driver Location
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.dateRight}>{order.status}</Text>
                    <Text style={styles.dateText}>{order.date}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.subText}>{order.status}</Text>
                    <Text style={styles.subText}>Pay: {order.pay}</Text>
                    <Text style={styles.shopText}>
                      Laundry Shop : {order.shop}
                    </Text>
                    <Text style={styles.dateSmall}>
                      {order.time}{"\n"}
                      {order.date}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  orderCard: {
    borderRadius: s(12),
    marginHorizontal: s(15),
    marginVertical: mvs(7),
    padding: s(15),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: s(40),
    height: s(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: s(30),
    marginRight: s(10),
  },
  name: {
    fontSize: ms(15),
    fontWeight: "bold",
    color: "#000000",
  },
  subText: {
    fontSize: ms(13),
    color: "#000000",
  },
  shopText: {
    fontSize: ms(12),
    color: "#000000",
    fontStyle: "italic",
    marginTop: mvs(3),
  },
  dateRight: {
    color: "#1939BB",
    fontWeight: "bold",
    textAlign: "right",
    marginTop: mvs(8),
  },
  dateText: {
    fontSize: ms(12),
    color: "#1939BB",
    textAlign: "right",
  },
  dateSmall: {
    fontSize: ms(11),
    color: "#1939BB",
    marginTop: mvs(5),
  },
  trackButton: {
    backgroundColor: "#2F73E0",
    paddingVertical: mvs(8),
    paddingHorizontal: s(15),
    borderRadius: s(10),
    alignSelf: "flex-start",
    marginTop: mvs(10),
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: ms(13),
  },
});
