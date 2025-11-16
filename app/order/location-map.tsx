// app/(tabs)/order/location-map.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Dimensions
} from "react-native";
import WebView from 'react-native-webview';
import { AppHeader } from '../../components/AppHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Leaflet map HTML template with better location handling
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
        .selected-marker {
            filter: hue-rotate(120deg) brightness(1.2);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let marker;
        let selectedLocation = null;
        let isInitialized = false;

        function initMap(lat, lng) {
            if (isInitialized) return;
            
            map = L.map('map').setView([lat, lng], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            // Add click listener for location selection
            map.on('click', async function(e) {
                const { lat, lng } = e.latlng;
                selectedLocation = { lat, lng };
                
                // Remove existing marker
                if (marker) {
                    map.removeLayer(marker);
                }
                
                // Add new marker with custom styling
                marker = L.marker([lat, lng], { className: 'selected-marker' })
                    .addTo(map)
                    .bindPopup('Selected Location<br>Tap confirm to use this location')
                    .openPopup();

                try {
                    // Reverse geocode to get address
                    const response = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`);
                    const data = await response.json();
                    const address = data.display_name || 'Selected location';
                    
                    // Send location and address to React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'locationSelected',
                            location: selectedLocation,
                            address: address
                        }));
                    }
                } catch (error) {
                    // Fallback if geocoding fails
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'locationSelected',
                            location: selectedLocation,
                            address: 'Selected location'
                        }));
                    }
                }
            });

            // Add initial marker for current location
            marker = L.marker([lat, lng]).addTo(map)
                .bindPopup('Your Current Location<br>Tap anywhere on map to select different location')
                .openPopup();

            isInitialized = true;
        }

        function updateLocation(lat, lng) {
            if (map) {
                map.setView([lat, lng], 16);
                if (marker) {
                    map.removeLayer(marker);
                }
                marker = L.marker([lat, lng]).addTo(map)
                    .bindPopup('Current Location Updated')
                    .openPopup();
                selectedLocation = { lat, lng };
            }
        }

        function cleanupMap() {
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
            if (map) {
                map.remove();
                map = null;
            }
            selectedLocation = null;
            isInitialized = false;
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanupMap);
    </script>
</body>
</html>
`;

interface SelectedLocation {
    lat: number;
    lng: number;
    address?: string;
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
    const webViewRef = useRef<WebView>(null);
    const isMounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
            
            // Clean up the map in WebView
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    if (typeof cleanupMap === 'function') {
                        cleanupMap();
                    }
                    true;
                `);
            }
        };
    }, []);

    // Get user's current location
    useEffect(() => {
        const getLocation = async () => {
            if (!isMounted.current) return;

            try {
                // Request location permissions
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (isMounted.current) {
                        Alert.alert(
                            'Location Permission Required', 
                            'Please enable location access to select your location on the map.'
                        );
                        setLoading(false);
                    }
                    return;
                }

                // Get current location
                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                if (isMounted.current) {
                    setLocation(currentLocation.coords);
                    setLoading(false);
                    
                    // Auto-select current location
                    setSelectedLocation({
                        lat: currentLocation.coords.latitude,
                        lng: currentLocation.coords.longitude,
                        address: 'Current Location'
                    });
                }
            } catch (error) {
                if (isMounted.current) {
                    Alert.alert('Location Error', 'Failed to get your current location. Please try again.');
                    setLoading(false);
                }
            }
        };

        getLocation();
    }, []);

    // Handle messages from WebView (Leaflet map)
    const handleWebViewMessage = (event: any) => {
        if (!isMounted.current) return;

        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'locationSelected') {
                setSelectedLocation({
                    lat: data.location.lat,
                    lng: data.location.lng,
                    address: data.address
                });
            }
        } catch (error) {
            // Error handled silently
        }
    };

    // Use current GPS location
    const useCurrentLocation = async () => {
        if (!isMounted.current) return;

        try {
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = currentLocation.coords;
            const newLocation = { lat: latitude, lng: longitude, address: 'Current Location' };
            
            setSelectedLocation(newLocation);
            
            // Update map to show current location
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    updateLocation(${latitude}, ${longitude});
                    true;
                `);
            }
        } catch (error) {
            Alert.alert('Location Error', 'Failed to get current location. Please try again.');
        }
    };

    // Confirm location selection and navigate back - FIXED VERSION
    const confirmLocation = () => {
        if (!isMounted.current) return;

        if (!selectedLocation) {
            Alert.alert('No Location Selected', 'Please select a location on the map first.');
            return;
        }
        
        // Use address if available, otherwise use coordinates
        const locationString = selectedLocation.address || 
            `Location (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`;

        // Create params object with ALL necessary data
        const navigationParams: any = { 
            shopId: shopId as string,
            method: method as string,
            // Pass all the original form data
            currentName: currentName as string,
            currentContact: currentContact as string,
            currentService: currentService as string,
            currentDetergent: currentDetergent as string,
            currentSoftener: currentSoftener as string,
            // Pass the new location data
            delivery_location: locationString,
            delivery_latitude: selectedLocation.lat.toString(),
            delivery_longitude: selectedLocation.lng.toString(),
            timestamp: Date.now().toString() // Force refresh
        };

        // Use router.back() instead of replace to maintain navigation stack
        // and pass params back to previous screen
        router.back();
        
        // Use setTimeout to ensure the navigation happens after state updates
        setTimeout(() => {
            // Update the previous screen's params
            router.setParams(navigationParams);
        }, 100);
    };

    // Handle back button - navigate back without location data
    const handleBack = () => {
        if (!isMounted.current) return;
        
        // Navigate back without any location data
        router.back();
    };

    // Initialize map when WebView is ready and location is available
    useEffect(() => {
        if (!isMounted.current) return;

        if (webViewReady && location) {
            const { latitude, longitude } = location;
            webViewRef.current?.injectJavaScript(`
                initMap(${latitude}, ${longitude});
                true;
            `);
        }
    }, [webViewReady, location]);

    const handleWebViewLoad = () => {
        if (isMounted.current) {
            setWebViewReady(true);
        }
    };

    const handleWebViewError = (error: any) => {
        Alert.alert("Map Error", "Failed to load map. Please check your internet connection.");
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader 
                    title={`Select ${method === 'delivery' ? 'Delivery' : 'Pickup'} Location`}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3864C3" />
                    <Text style={styles.loadingText}>Loading map...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <AppHeader 
                title={`Select ${method === 'delivery' ? 'Delivery' : 'Pickup'} Location`}
                rightElement={
                    <TouchableOpacity 
                        style={styles.gpsHeaderButton}
                        onPress={useCurrentLocation}
                    >
                        <Ionicons name="locate" size={24} color="white" />
                    </TouchableOpacity>
                }
            />

            {/* Instructions */}
            <View style={styles.instructions}>
                <Ionicons name="map" size={20} color="#3864C3" />
                <Text style={styles.instructionsText}>
                    Tap anywhere on the map to select your {method === 'delivery' ? 'delivery' : 'pickup'} location
                </Text>
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: mapHtml }}
                    style={styles.webview}
                    onMessage={handleWebViewMessage}
                    onLoadEnd={handleWebViewLoad}
                    onError={handleWebViewError}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                />
                
                {/* GPS Button */}
                <TouchableOpacity 
                    style={styles.gpsButton}
                    onPress={useCurrentLocation}
                >
                    <Ionicons name="locate" size={24} color="#3864C3" />
                </TouchableOpacity>
            </View>

            {/* Selected Location Info */}
            {selectedLocation && (
                <View style={styles.locationInfo}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <View style={styles.locationDetails}>
                        <Text style={styles.locationLabel}>Selected Location:</Text>
                        <Text style={styles.locationAddress} numberOfLines={2}>
                            {selectedLocation.address || `Location (${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)})`}
                        </Text>
                        <Text style={styles.coordinatesText}>
                            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleBack}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        !selectedLocation && styles.confirmButtonDisabled
                    ]}
                    onPress={confirmLocation}
                    disabled={!selectedLocation}
                >
                    <Text style={styles.confirmButtonText}>
                        Confirm {method === 'delivery' ? 'Delivery' : 'Pickup'} Location
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    gpsHeaderButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    instructions: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    instructionsText: {
        fontSize: 14,
        color: '#3864C3',
        marginLeft: 12,
        flex: 1,
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
        bottom: 20,
        right: 20,
        backgroundColor: 'white',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    locationDetails: {
        flex: 1,
        marginLeft: 12,
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3864C3',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: '#333',
        lineHeight: 18,
        marginBottom: 2,
    },
    coordinatesText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3864C3',
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#3864C3',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 2,
        padding: 16,
        backgroundColor: '#3864C3',
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
});