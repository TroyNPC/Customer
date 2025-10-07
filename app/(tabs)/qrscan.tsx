import { BarCodeScanner } from "expo-barcode-scanner";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { ScaledSheet, verticalScale } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");
const vbW = 1440;
const vbH = 320;

export default function qrscan() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  // 📸 Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // 📱 QR code handler
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // ✅ Always lead to senddeliveryinfo page after scan
    router.push("/sendinfoafterqr");
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting for camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== Top Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(300)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.topWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,0 L0,${vbH * 0.3} C ${vbW * 0.3},${vbH * 0.1} ${vbW * 0.6},${vbH * 0.8} ${vbW},${vbH * 0.7} L${vbW},0 Z`}
        />
      </Svg>

      {/* ===== Header ===== */}
      <Text style={styles.headerText}>Drop off - Delivery</Text>

      {/* ===== Scanner ===== */}
      <View style={styles.scannerBox}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <Text style={styles.scanningText}>
        {scanned ? "Scanned!" : "Scanning..."}
      </Text>

      {/* ===== Bottom Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(120)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.bottomWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,${vbH * 0.2} C ${vbW * 0.25},${vbH * 0.9} ${vbW * 0.55},${vbH * -0.2} ${vbW},${vbH * 0.4} L ${vbW},${vbH} L 0,${vbH} Z`}
        />
      </Svg>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topWave: {
    position: "absolute",
    top: 0,
  },
  bottomWave: {
    position: "absolute",
    bottom: 0,
  },
  headerText: {
    marginTop: "40@vs",
    textAlign: "center",
    fontSize: "22@ms",
    fontWeight: "bold",
    color: "white",
    position: "absolute",
    top: "30@vs",
    width: "100%",
  },
  scannerBox: {
    flex: 1,
    marginHorizontal: "20@s",
    marginTop: "140@vs",
    marginBottom: "80@vs",
    borderRadius: "20@s",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  scanningText: {
    textAlign: "center",
    fontSize: "18@ms",
    fontWeight: "500",
    marginBottom: "80@vs",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
