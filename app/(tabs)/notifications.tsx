import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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

export default function Notifications() {
  const router = useRouter();

  const notifications = [
    {
      id: 1,
      title: "DJW Laundry Shop - Laundry is ready for Pickup/Delivery",
      location: "Dumaguete City",
      time: "1 Hour Ago",
      status: "UNPAID",
      icon: "shirt-outline",
      color: "#3864C3",
    },
    {
      id: 2,
      title: "JNK Laundry Shop - Laundry Received",
      location: "Dumaguete City",
      time: "4 Days Ago",
      status: "PAID",
      icon: "checkmark-circle",
      color: "#27AE60",
    },
    {
      id: 3,
      title: "Hangyu Laundry Shop - Laundry Received",
      location: "Dumaguete City",
      time: "5 Days Ago",
      status: "PAID",
      icon: "checkmark-circle",
      color: "#27AE60",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Wave */}
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
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Notification List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: mvs(40) }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={item.icon}
                size={ms(26)}
                color={item.color}
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
              {item.status === "PAID" ? (
                <Ionicons
                  name="checkmark-circle"
                  size={ms(22)}
                  color="#27AE60"
                />
              ) : (
                <Text style={styles.unpaid}>UNPAID</Text>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.time}>{item.time}</Text>
              {item.status === "PAID" && (
                <Text style={styles.paid}>PAID</Text>
              )}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: s(12),
    marginHorizontal: s(16),
    marginTop: mvs(12),
    padding: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: s(10),
  },
  cardTitle: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
  },
  location: {
    fontSize: ms(12),
    color: "#777",
    marginTop: mvs(3),
  },
  unpaid: {
    fontSize: ms(13),
    color: "#E63946",
    fontWeight: "bold",
  },
  cardFooter: {
    marginTop: mvs(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: ms(12),
    color: "#999",
  },
  paid: {
    fontSize: ms(13),
    color: "#27AE60",
    fontWeight: "bold",
  },
});
