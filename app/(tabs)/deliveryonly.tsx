import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // ✅ dropdown
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

export default function deliveryonly() {
  const router = useRouter();
  const { width } = useWindowDimensions(); // ✅ responsiveness
  const [selectedService, setSelectedService] = useState("");

  const services = [
    "Bulk",
    "Dry & Fold",
    "Dry Only",
    "Fold Only",
    "Iron Only",
    "Wash Dry Fold",
    "Wash Only",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      {/* ===== Header ===== */}
      <View style={[styles.headerBox, { height: width * 0.25 }]}>
        <Svg
          width="100%"
          height={mvs(300)}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d={`M0,${vbH * 0.2}
              C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2}
              L${vbW},0
              L0,0
              Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push("/shop/1")}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick Up & Delivery</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* ===== Delivery Info Form ===== */}
      <ScrollView contentContainerStyle={[styles.formContainer, { flexGrow: 1 }]}>
        <Text style={styles.label}>Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor="#777"
        />

        <Text style={styles.label}>Location:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          placeholderTextColor="#777"
        />

        <Text style={styles.label}>Number:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter contact number"
          keyboardType="phone-pad"
          placeholderTextColor="#777"
        />

        <Text style={styles.label}>Type of Service:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedService}
            onValueChange={(itemValue) => setSelectedService(itemValue)}
            style={styles.picker}
            dropdownIconColor="#3864C3"
          >
            <Picker.Item label="Select a service" value="" />
            {services.map((service, index) => (
              <Picker.Item key={index} label={service} value={service} />
            ))}
          </Picker>
        </View>

        {/* ===== Submit Button ===== */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => console.log("Submitted:", selectedService)}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBox: {
    width: "100%",
    minHeight: mvs(120),
    backgroundColor: "#0AADFF",
    paddingTop: mvs(40),
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: {
    position: "absolute",
    top: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(20),
  },
  headerTitle: {
    fontSize: ms(16),
    color: "#fff",
    fontWeight: "bold",
  },
  formContainer: {
    marginTop: mvs(50),
    paddingHorizontal: s(24),
    paddingBottom: mvs(100),
  },
  label: {
    fontSize: ms(14),
    fontWeight: "bold",
    color: "#000",
    marginBottom: mvs(6),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: s(10),
    paddingVertical: mvs(10),
    paddingHorizontal: s(12),
    fontSize: ms(13),
    marginBottom: mvs(16),
    color: "#000",
    backgroundColor: "#F8F8F8",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: s(10),
    marginBottom: mvs(16),
    backgroundColor: "#F8F8F8",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: "#000",
  },
  submitButton: {
    backgroundColor: "#3864C3",
    borderRadius: s(10),
    paddingVertical: mvs(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: mvs(10),
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: ms(14),
  },
});
