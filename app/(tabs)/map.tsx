import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const vbW = 1440;
const vbH = 320;

// Approximate bounding box for Dumaguete
const DUMAGUETE_BOUNDS = {
  minLat: 9.25,
  maxLat: 9.38,
  minLng: 123.25,
  maxLng: 123.35,
};

// Sample laundry shops
const laundryShops = [
  { id: "1", name: "DJW Laundry Shop", lat: 9.307, lng: 123.305 },
  { id: "2", name: "JNK Laundry Shop", lat: 9.315, lng: 123.31 },
  { id: "3", name: "Hangyu Laundry Shop", lat: 9.31, lng: 123.299 },
  { id: "4", name: "Zandy Laundry Shop", lat: 9.312, lng: 123.307 },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Request user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

const [isNavigating, setIsNavigating] = useState(false); // 👈 add this


const focusOnShop = (shop: any) => {
  if (lastClicked === shop.id) {
    if (isNavigating) return;
    setIsNavigating(true);

    // Go to shop UI page directly
    router.push(`/shop/${shop.id}`);

    setLastClicked(null);
    setTimeout(() => setIsNavigating(false), 500);
  } else {
    mapRef.current?.animateToRegion({
      latitude: shop.lat,
      longitude: shop.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setLastClicked(shop.id);
  }
};


  return (
    <View style={styles.container}>
      {/* ===== Header Box ===== */}
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
            d={`
              M0,${vbH * 0.2}
              C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2}
              L${vbW},0
              L0,0
              Z
            `}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LAUNDRY SHOPS NEARBY</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* ===== Map with responsive height ===== */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 9.307,
            longitude: 123.305,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          onRegionChangeComplete={(region) => {
            // Keep user inside Dumaguete bounds
            if (
              region.latitude < DUMAGUETE_BOUNDS.minLat ||
              region.latitude > DUMAGUETE_BOUNDS.maxLat ||
              region.longitude < DUMAGUETE_BOUNDS.minLng ||
              region.longitude > DUMAGUETE_BOUNDS.maxLng
            ) {
              mapRef.current?.animateToRegion({
                latitude: 9.307,
                longitude: 123.305,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              });
            }
          }}
          customMapStyle={[
            { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ]}
        >
          {/* Laundry Shops */}
          {laundryShops.map((shop) => (
            <Marker
              key={shop.id}
              coordinate={{ latitude: shop.lat, longitude: shop.lng }}
              title={shop.name}
              description="Dumaguete City"
            />
          ))}

          {/* User Location Marker */}
          <Marker
            coordinate={{
              latitude: location?.latitude || 9.290, // fallback: Junob
              longitude: location?.longitude || 123.305,
            }}
            title="You are here"
            pinColor="blue"
          />
        </MapView>

        {/* Floating GPS Button */}
        <TouchableOpacity style={styles.gpsButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* ===== Shop List Below Map ===== */}
      <FlatList
        data={laundryShops}
        keyExtractor={(item) => item.id}
        style={styles.shopList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.shopCard} onPress={() => focusOnShop(item)}>
            {/* Left icons */}
            <View style={styles.leftIcons}>
              <Ionicons name="location" size={20} color="#3864C3" />
              <Ionicons name="search" size={20} color="#3864C3" style={{ marginLeft: 8 }} />
            </View>

            {/* Shop Info */}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.shopCity}>Dumaguete City</Text>
              <Text style={styles.shopHours}>Hours: 8:00 AM - 9:00 PM</Text>
            </View>

            {/* Right service icon */}
            <Ionicons name="bicycle" size={22} color="#000" margin-left="10px" />
            <Ionicons name="cube" size={22} color="#000" />
          </TouchableOpacity>
        )}
      />
    </View>
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
    paddingHorizontal: 20,
    zIndex: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "white", textAlign: "center" },

  mapContainer: {
    width: "100%",
    height: screenHeight * 0.35,
    marginBottom: 10,
    position: "relative",
  },
  map: { width: "100%", height: "100%" },
  gpsButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#3864C3",
    padding: 12,
    borderRadius: 50,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  shopList: { flex: 1, marginTop: 10 },
  shopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  leftIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopName: { fontSize: 16, fontWeight: "bold" },
  shopCity: { fontSize: 14, color: "gray" },
  shopHours: { fontSize: 12, color: "gray" },
});
