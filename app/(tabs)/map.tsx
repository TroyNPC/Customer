import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";
import { WebView } from "react-native-webview";

const laundryShops = [
  { id: "1", name: "DJW Laundry Shop", lat: 9.307, lng: 123.305 },
  { id: "2", name: "JNK Laundry Shop", lat: 9.315, lng: 123.31 },
  { id: "3", name: "Hangyu Laundry Shop", lat: 9.31, lng: 123.299 },
  { id: "4", name: "Zandy Laundry Shop", lat: 9.312, lng: 123.307 },
];

export default function MapScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const webRef = useRef<WebView>(null);
  const clickCount = useRef<{ [key: string]: number }>({});
  const [tracking, setTracking] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const locationWatcher = useRef<any>(null);

  // Request location immediately & set up initial GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to show your position.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);

      // Immediately show the user's location on the map
      webRef.current?.postMessage(
        JSON.stringify({ action: "setUserLocation", lat: coords.latitude, lng: coords.longitude })
      );

      // Start watching for live updates
      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 2,
        },
        (newLoc) => {
          const newCoords = {
            latitude: newLoc.coords.latitude,
            longitude: newLoc.coords.longitude,
          };
          setLocation(newCoords);
          webRef.current?.postMessage(
            JSON.stringify({ action: "setUserLocation", lat: newCoords.latitude, lng: newCoords.longitude })
          );

          if (selectedShop) {
            webRef.current?.postMessage(JSON.stringify({ action: "focusShop", id: selectedShop, track: true }));
          }
        }
      );
    })();

    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
        locationWatcher.current = null;
      }
    };
  }, []);

  // Reapply tracking whenever user toggles tracking or shop selection changes
  useEffect(() => {
    if (!tracking || !selectedShop || !location) return;
    webRef.current?.postMessage(JSON.stringify({ action: "focusShop", id: selectedShop, track: true }));
  }, [tracking, selectedShop, location]);

  const leafletHTML = `<!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .highlight-marker { filter: hue-rotate(180deg) brightness(1.6); }
      .user-marker {
        width: 24px;
        height: 24px;
        background: rgba(0, 136, 255, 0.3);
        border: 4px solid #007bff;
        border-radius: 50%;
        position: relative;
      }
      .user-marker::after {
        content: '';
        position: absolute;
        top: -8px;
        left: 8px;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #007bff;
      }
      .leaflet-routing-container { display: none !important; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map').setView([9.307, 123.305], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);

      const shops = ${JSON.stringify(laundryShops)};
      const markers = {};
      let userMarker = null;
      let routeControl = null;
      let activeMarker = null;

      shops.forEach(shop => {
        const marker = L.marker([shop.lat, shop.lng]).addTo(map).bindPopup('<b>' + shop.name + '</b><br>Dumaguete City');
        markers[shop.id] = marker;
      });

      function focusShop(id) {
        const shop = shops.find(s => s.id === id);
        if (!shop) return;

        map.flyTo([shop.lat, shop.lng], 17);
        markers[id].openPopup();

        if (activeMarker) activeMarker.getElement().classList.remove('highlight-marker');
        const el = markers[id].getElement();
        if (el) el.classList.add('highlight-marker');
        activeMarker = markers[id];

        if (window.currentUser) {
          if (routeControl) map.removeControl(routeControl);
          routeControl = L.Routing.control({
            waypoints: [L.latLng(window.currentUser.lat, window.currentUser.lng), L.latLng(shop.lat, shop.lng)],
            lineOptions: { styles: [{ color: 'red', weight: 5, opacity: 0.8 }] },
            addWaypoints: false,
            createMarker: () => null,
            show: false,
          }).addTo(map);
        }
      }

      function setUserMarker(lat, lng) {
        const icon = L.divIcon({ className: 'user-marker', iconSize: [24, 24], iconAnchor: [12, 12] });
        if (userMarker) userMarker.setLatLng([lat, lng]);
        else {
          userMarker = L.marker([lat, lng], { icon }).addTo(map).bindPopup("You are here");
          map.setView([lat, lng], 15);
        }
      }

      document.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'focusShop') focusShop(data.id);
        else if (data.action === 'setUserLocation') {
          window.currentUser = { lat: data.lat, lng: data.lng };
          setUserMarker(data.lat, data.lng);
        } else if (data.action === 'centerUser') {
          if (window.currentUser) map.setView([window.currentUser.lat, window.currentUser.lng], 15);
        }
      });
    </script>
  </body>
  </html>`;

  const handleMessage = (event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.action === "navigate" && !isNavigating) {
      setIsNavigating(true);
      router.push(`/shop/${msg.id}`);
      setTimeout(() => setIsNavigating(false), 800);
    }
  };

  const centerOnUser = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);
      webRef.current?.postMessage(
        JSON.stringify({ action: "setUserLocation", lat: coords.latitude, lng: coords.longitude })
      );
      webRef.current?.postMessage(JSON.stringify({ action: "centerUser" }));
    } catch (err) {
      console.error("Error getting location:", err);
    }
  };

  const handleListClick = (id: string) => {
    clickCount.current[id] = (clickCount.current[id] || 0) + 1;
    setSelectedShop(id);

    if (clickCount.current[id] === 1) {
      webRef.current?.postMessage(JSON.stringify({ action: "focusShop", id, track: tracking }));
    } else if (clickCount.current[id] === 2) {
      router.push(`/shop/${id}`);
    }

    setTimeout(() => (clickCount.current[id] = 0), 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Svg width="100%" height={mvs(300)} viewBox="0 0 1440 320" style={styles.waveTop} preserveAspectRatio="none">
          <Path fill="#3864C3" d="M0,64 C720,-32 720,160 1440,64 L1440,0 L0,0 Z" />
        </Svg>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LAUNDRY SHOPS NEARBY</Text>
          <TouchableOpacity onPress={() => setTracking(!tracking)}>
            <Ionicons name={tracking ? "navigate" : "navigate-outline"} size={ms(24)} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <WebView ref={webRef} originWhitelist={["*"]} source={{ html: leafletHTML }} onMessage={handleMessage} style={{ flex: 1 }} />
        <TouchableOpacity style={styles.gpsButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={ms(28)} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={laundryShops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.shopCard} onPress={() => handleListClick(item.id)}>
            <View style={styles.leftIcons}>
              <Ionicons name="location" size={ms(20)} color="#3864C3" />
              <Ionicons name="search" size={ms(20)} color="#3864C3" style={{ marginLeft: s(8) }} />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.shopCity}>Dumaguete City</Text>
              <Text style={styles.shopHours}>Hours: 8:00 AM - 9:00 PM</Text>
            </View>
            <Ionicons name="bicycle" size={ms(22)} color="#000" />
            <Ionicons name="cube" size={ms(22)} color="#000" style={{ marginLeft: s(5) }} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  headerBox: { width: "100%", height: mvs(120), backgroundColor: "#0AADFF", justifyContent: "center", overflow: "hidden" },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: s(20), zIndex: 2 },
  headerTitle: { fontSize: ms(18), fontWeight: "bold", color: "white", textAlign: "center" },
  mapContainer: { width: "100%", height: mvs(250), position: "relative" },
  gpsButton: { position: "absolute", bottom: mvs(15), right: s(15), backgroundColor: "#3864C3", padding: s(12), borderRadius: ms(50), elevation: 6 },
  shopCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: mvs(12), borderBottomWidth: 1, borderColor: "#ddd" },
  leftIcons: { flexDirection: "row", alignItems: "center" },
  shopInfo: { flex: 1, marginLeft: s(12) },
  shopName: { fontSize: ms(16), fontWeight: "bold" },
  shopCity: { fontSize: ms(14), color: "gray" },
  shopHours: { fontSize: ms(12), color: "gray" },
});
