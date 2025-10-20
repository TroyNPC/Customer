// app/(tabs)/order/location-map.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";
import WebView from 'react-native-webview';

const vbW = 1440;
const vbH = 320;

// Leaflet map HTML template
const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let marker;
        let selectedLocation = null;

        function initMap(lat, lng) {
            map = L.map('map').setView([lat, lng], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add click listener
            map.on('click', function(e) {
                const { lat, lng } = e.latlng;
                selectedLocation = { lat, lng };
                
                // Remove existing marker
                if (marker) {
                    map.removeLayer(marker);
                }
                
                // Add new marker
                marker = L.marker([lat, lng]).addTo(map)
                    .bindPopup('Selected Location<br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6))
                    .openPopup();

                // Send location to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    location: selectedLocation
                }));
            });

            // Add initial marker
            marker = L.marker([lat, lng]).addTo(map)
                .bindPopup('Current Location<br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6))
                .openPopup();
        }

        function updateLocation(lat, lng) {
            if (map) {
                map.setView([lat, lng], 15);
                if (marker) {
                    map.removeLayer(marker);
                }
                marker = L.marker([lat, lng]).addTo(map)
                    .bindPopup('Current Location<br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6))
                    .openPopup();
            }
        }
    </script>
</body>
</html>
`;

interface SelectedLocation {
    lat: number;
    lng: number;
}

export default function LocationMap() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { 
        shopId, 
        method,
        currentName,
        currentContact,
        currentService,
        currentDetergent,
        currentSoftener 
    } = params;
    
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [webViewReady, setWebViewReady] = useState(false);
    const webViewRef = React.useRef<WebView>(null);

    // Get user's current location
    useEffect(() => {
        const getLocation = async () => {
            try {
                // Request location permissions
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission denied', 'Location permission is required to use this feature.');
                    setLoading(false);
                    return;
                }

                // Get current location
                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                setLocation(currentLocation.coords);
                setLoading(false);
            } catch (error) {
                console.error('Error getting location:', error);
                Alert.alert('Error', 'Failed to get your current location.');
                setLoading(false);
            }
        };

        getLocation();
    }, []);

    // Handle messages from WebView (Leaflet map)
    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'locationSelected') {
                setSelectedLocation(data.location);
            }
        } catch (error) {
            console.error('Error parsing WebView message:', error);
        }
    };

    // Use current GPS location
    const useCurrentLocation = () => {
        if (location && webViewRef.current) {
            const { latitude, longitude } = location;
            setSelectedLocation({ lat: latitude, lng: longitude });
            
            // Update map to show current location
            webViewRef.current.injectJavaScript(`
                updateLocation(${latitude}, ${longitude});
                true;
            `);
        }
    };

    // Confirm location selection
    const confirmLocation = () => {
        if (!selectedLocation) {
            Alert.alert('No Location Selected', 'Please select a location on the map first.');
            return;
        }

        // Format the location for display
        const locationString = `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`;
        
        // Navigate back to order page WITH the selected location as parameter
        router.push({
            pathname: "/(tabs)/order/[id]",
            params: { 
                id: shopId as string,
                method: method as string,
                selectedLocation: locationString,
                // Pass back all the form data so user doesn't lose their progress
                currentName: currentName as string,
                currentContact: currentContact as string,
                currentService: currentService as string,
                currentDetergent: currentDetergent as string,
                currentSoftener: currentSoftener as string
            }
        });
    };

    // Initialize map when WebView is ready and location is available
    useEffect(() => {
        if (webViewReady && location && !selectedLocation) {
            const { latitude, longitude } = location;
            webViewRef.current?.injectJavaScript(`
                initMap(${latitude}, ${longitude});
                true;
            `);
        }
    }, [webViewReady, location]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3864C3" />
                    <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={ms(25)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Location</Text>
                    <View style={{ width: s(30) }} />
                </View>
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: mapHtml }}
                    style={styles.webview}
                    onMessage={handleWebViewMessage}
                    onLoadEnd={() => setWebViewReady(true)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
                
                {/* GPS Button */}
                <TouchableOpacity 
                    style={styles.gpsButton}
                    onPress={useCurrentLocation}
                >
                    <Ionicons name="locate" size={ms(20)} color="#3864C3" />
                </TouchableOpacity>
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Selected Location:</Text>
                    <Text style={styles.locationText}>
                        {selectedLocation 
                            ? `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`
                            : 'Tap on the map to select a location'
                        }
                    </Text>
                </View>
                
                <TouchableOpacity
                    style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
                    onPress={confirmLocation}
                    disabled={!selectedLocation}
                >
                    <Text style={styles.confirmButtonText}>Confirm Location</Text>
                </TouchableOpacity>
            </View>
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
    waveTop: { 
        position: "absolute", 
        top: 0, 
        left: 0, 
        zIndex: 1 
    },
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loadingText: {
        marginTop: mvs(10),
        fontSize: ms(16),
        color: '#666',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    webview: {
        flex: 1,
    },
    gpsButton: {
        position: 'absolute',
        top: mvs(20),
        right: s(20),
        backgroundColor: 'white',
        width: s(50),
        height: s(50),
        borderRadius: s(25),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    actionBar: {
        backgroundColor: 'white',
        padding: s(20),
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    locationInfo: {
        marginBottom: mvs(15),
    },
    locationLabel: {
        fontSize: ms(14),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: mvs(5),
    },
    locationText: {
        fontSize: ms(12),
        color: '#666',
        fontStyle: 'italic',
    },
    confirmButton: {
        backgroundColor: "#1939BB",
        borderRadius: s(12),
        paddingVertical: mvs(14),
        alignItems: "center",
    },
    confirmButtonDisabled: {
        backgroundColor: "#cccccc",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: ms(16),
        fontWeight: "bold",
    },
});