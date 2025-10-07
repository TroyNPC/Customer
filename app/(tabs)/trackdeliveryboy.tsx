// TrackDriver.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";
import { WebView } from "react-native-webview";

const vbW = 1440;
const vbH = 320;

export default function TrackDriver(): JSX.Element {
  const router = useRouter();

  const leafletHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const userLatLng = [9.3065, 123.307];
        const driverLatLng = [9.316, 123.298];

        const map = L.map('map').setView(userLatLng, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const driverIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/3468/3468361.png',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        const userMarker = L.marker(userLatLng).addTo(map).bindPopup('You are here');
        const driverMarker = L.marker(driverLatLng, { icon: driverIcon }).addTo(map).bindPopup('Delivery Boy');

        // Fetch the driving route using OSRM (free public API)
        const url = \`https://router.project-osrm.org/route/v1/driving/\${driverLatLng[1]},\${driverLatLng[0]};\${userLatLng[1]},\${userLatLng[0]}?overview=full&geometries=geojson\`;

        fetch(url)
          .then(response => response.json())
          .then(data => {
            const route = data.routes[0].geometry;
            const coordinates = route.coordinates.map(c => [c[1], c[0]]);
            const polyline = L.polyline(coordinates, { color: 'blue', weight: 4 }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
          })
          .catch(err => console.error('Routing error:', err));
      </script>
    </body>
  </html>
  `;

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
          <Path fill="#3864C3" d={"M0,64 C480,-32 720,256 1440,64 L1440,0 L0,0 Z"} />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/orderhistory')}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Info box */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          For: <Text style={styles.bold}>Edwards Richards</Text>
        </Text>

        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={ms(16)} color="#000" />
          <Text style={[styles.infoText, { marginLeft: s(8) }]}>09756612095</Text>

          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          Pick Up Accepted at: <Text style={styles.bold}>10:20 AM</Text>
        </Text>
        <Text style={styles.infoText}>
          Estimated Arrival: <Text style={styles.bold}>10:34 AM</Text>
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: leafletHTML }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="compatibility"
          allowFileAccess
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
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
  infoContainer: {
    backgroundColor: "#F5F6FA",
    padding: s(12),
    marginHorizontal: s(12),
    borderRadius: s(10),
    marginTop: mvs(10),
    elevation: 2,
  },
  infoText: { fontSize: ms(13), color: "#000", marginBottom: mvs(4) },
  bold: { fontWeight: "bold", color: "#000" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: mvs(6),
  },
  callButton: {
    backgroundColor: "#2F73E0",
    paddingVertical: mvs(5),
    paddingHorizontal: s(14),
    borderRadius: s(6),
    marginLeft: "auto",
  },
  callButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: ms(12),
  },
  mapContainer: {
    flex: 1,
    borderRadius: s(12),
    overflow: "hidden",
    margin: s(12),
    marginTop: mvs(10),
    elevation: 3,
  },
});
