import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

  const handleSend = () => {
    if (!name || !contact || !location || !service || !detergent) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }

    Alert.alert("Success", "Successfully Sent Information!", [
      {
        text: "OK",
        onPress: () => router.push("/map"),
      },
    ]);
  };

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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(25)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop off & Delivery</Text>
          <View style={{ width: s(30) }} />
        </View>
      </View>

      {/* Scrollable Form */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: mvs(80) }}
        style={{ flex: 1, backgroundColor: "white" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Contact Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Contact Number"
            keyboardType="phone-pad"
            value={contact}
            onChangeText={setContact}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Location"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Select Preferred Service</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={service}
              onValueChange={(itemValue) => setService(itemValue)}
            >
              <Picker.Item label="Select Preferred Service" value="" />
              <Picker.Item label="Bulk Laundry" value="Bulk Laundry" />
              <Picker.Item label="Wash" value="Wash" />
              <Picker.Item label="Dry & Fold Only" value="Dry & Fold Only" />
              <Picker.Item label="Wash Only" value="Wash Only" />
              <Picker.Item label="Fold Only" value="Fold Only" />
              <Picker.Item label="Dry Only" value="Dry Only" />
              <Picker.Item label="Iron Only" value="Iron Only" />
            </Picker>
          </View>

          <Text style={styles.label}>Select Preferred Detergent</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={detergent}
              onValueChange={(itemValue) => setDetergent(itemValue)}
            >
              <Picker.Item label="Select Preferred Detergent" value="" />
              <Picker.Item label="Tide" value="Tide" />
              <Picker.Item label="Ariel" value="Ariel" />
              <Picker.Item label="Surf" value="Surf" />
              <Picker.Item label="Downy" value="Downy" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
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
    paddingVertical: mvs(10),
    paddingHorizontal: s(12),
    fontSize: ms(14),
    backgroundColor: "#F7F7F7",
    marginTop: mvs(5),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    marginTop: mvs(5),
    backgroundColor: "#F7F7F7",
  },
  sendButton: {
    backgroundColor: "#1939BB",
    borderRadius: s(12),
    marginTop: mvs(30),
    alignItems: "center",
    paddingVertical: mvs(12),
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: ms(18),
    fontWeight: "bold",
  },
});
