import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

export default function SendDropQRInfo() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [detergent, setDetergent] = useState("");
  const [refreshener, setRefreshener] = useState("");

  const handleSend = useCallback(() => {
    if (!name || !contact || !location || !service || !detergent || !refreshener) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }

    Alert.alert("Success", "Successfully Sent Information!", [
      {
        text: "OK",
        onPress: () => router.push("/map"),
      },
    ]);
  }, [name, contact, location, service, detergent, refreshener, router]);

  const services = [
    "Bulk",
    "Dry & Fold",
    "Dry Only",
    "Fold Only",
    "Iron Only",
    "Wash Dry Fold",
    "Wash Only",
  ];

  const detergents = ["Tide", "Ariel", "Surf", "Downy", "Breeze", "Pride"];
  const refresheners = ["Downy", "Comfort", "Sta-Soft", "Del", "Hygienix"];

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
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/shop/1")}>
            <Ionicons name="arrow-back" size={ms(25)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop off & Delivery</Text>
          <View style={{ width: s(30) }} />
        </View>
      </View>

      {/* Scrollable Form */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: mvs(80) }}
        style={{ flex: 1, backgroundColor: "white" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            placeholderTextColor="#000"
            value={name}
            onChangeText={(text) => setName(text)}
          />

          <Text style={styles.label}>Contact Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Contact Number"
            placeholderTextColor="#000"
            keyboardType="phone-pad"
            value={contact}
            onChangeText={(text) => setContact(text)}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Location"
            placeholderTextColor="#000"
            value={location}
            onChangeText={(text) => setLocation(text)}
          />

          <Text style={styles.label}>Select Preferred Service</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={service}
              onValueChange={(itemValue) => setService(itemValue)}
            >
              <Picker.Item label="Select Preferred Service" value="" />
              {services.map((srv, index) => (
                <Picker.Item key={index} label={srv} value={srv} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Select Type of Detergent</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={detergent}
              onValueChange={(itemValue) => setDetergent(itemValue)}
            >
              <Picker.Item label="Select Type of Detergent" value="" />
              {detergents.map((det, index) => (
                <Picker.Item key={index} label={det} value={det} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Select Type of Refreshener</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={refreshener}
              onValueChange={(itemValue) => setRefreshener(itemValue)}
            >
              <Picker.Item label="Select Type of Refreshener" value="" />
              {refresheners.map((ref, index) => (
                <Picker.Item key={index} label={ref} value={ref} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: ms(22),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  formContainer: {
    paddingHorizontal: s(20),
    marginTop: mvs(20),
  },
  label: {
    fontSize: ms(16),
    fontWeight: "bold",
    color: "#000000",
    marginTop: mvs(15),
  },
  input: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    paddingVertical: 10, // ✅ static value avoids lag
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    marginTop: 6,
    color: "#000",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    marginTop: 6,
    backgroundColor: "#F7F7F7",
  },
  sendButton: {
    backgroundColor: "#1939BB",
    borderRadius: s(12),
    marginTop: mvs(30),
    alignItems: "center",
    paddingVertical: 12,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: ms(18),
    fontWeight: "bold",
  },
});
