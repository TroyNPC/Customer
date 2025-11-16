import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../../components/AppHeader';

type ShopBranch = {
  id: string;
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  shop_id: string | null;
  is_active: boolean | null;
  branch_methods?: { 
    method_id: string;
    shop_methods?: { code: string; label: string } 
  }[];
};

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [branches, setBranches] = useState<ShopBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [methodsData, setMethodsData] = useState<{[key: string]: string}>({});
  const [webViewReady, setWebViewReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState<string | null>(null);
  const clickCount = useRef<{ [key: string]: { count: number; time: number } }>({});
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, []);

  // Calculate distance between user and shop
  const calculateDistance = (shopLat: number, shopLng: number): string => {
    if (!location) return '';
    
    const R = 6371; // Earth's radius in km
    const dLat = (shopLat - location.latitude) * Math.PI / 180;
    const dLng = (shopLng - location.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location.latitude * Math.PI / 180) * Math.cos(shopLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`;
  };

  // HTML template for Leaflet map with proper routing
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
      let map = null;
      let shops = [];
      const markers = {};
      let userMarker = null;
      let routeControl = null;
      let activeMarker = null;
      let isInitialized = false;

      function initializeMap() {
        if (isInitialized) return;
        
        try {
          map = L.map('map').setView([9.307, 123.305], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            maxZoom: 19, 
            attribution: '© OpenStreetMap contributors' 
          }).addTo(map);
          
          isInitialized = true;
          
          // Notify React Native that map is ready
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: "mapReady",
              message: "Map initialized successfully"
            }));
          }
        } catch (error) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: "error",
              message: "Map initialization failed: " + error.message
            }));
          }
        }
      }

      function updateShops(newShops) {
        if (!isInitialized) initializeMap();
        
        // Clear existing markers
        Object.values(markers).forEach(marker => map.removeLayer(marker));
        shops.length = 0; // Clear array
        
        // Add new shops
        shops.push(...newShops);
        shops.forEach(shop => {
          const marker = L.marker([shop.lat, shop.lng]).addTo(map).bindPopup('<b>' + shop.name + '</b><br>Dumaguete City');
          markers[shop.id] = marker;
        });
      }

      function focusShop(id, track = false) {
        if (!isInitialized || !map) return;
        
        const shop = shops.find(s => s.id === id);
        if (!shop) return;

        // Fly to shop location
        map.flyTo([shop.lat, shop.lng], 17);
        markers[id].openPopup();

        // Highlight the selected marker
        if (activeMarker) activeMarker.getElement().classList.remove('highlight-marker');
        const el = markers[id].getElement();
        if (el) el.classList.add('highlight-marker');
        activeMarker = markers[id];

        // Calculate and show route if user location is available
        if (window.currentUser) {
          if (routeControl) map.removeControl(routeControl);
          
          routeControl = L.Routing.control({
            waypoints: [
              L.latLng(window.currentUser.lat, window.currentUser.lng), 
              L.latLng(shop.lat, shop.lng)
            ],
            lineOptions: { 
              styles: [{ color: 'red', weight: 5, opacity: 0.8 }] 
            },
            addWaypoints: false,
            createMarker: () => null,
            show: false,
          }).addTo(map);

          // If tracking is enabled, fit bounds to show both user and shop
          if (track) {
            const bounds = L.latLngBounds([
              [window.currentUser.lat, window.currentUser.lng],
              [shop.lat, shop.lng]
            ]);
            map.fitBounds(bounds.pad(0.1));
          }
        }
        
        // Notify React Native that route is calculated
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            action: "routeCalculated",
            id: id
          }));
        }
      }

      function setUserMarker(lat, lng) {
        if (!isInitialized || !map) return;
        
        const icon = L.divIcon({ className: 'user-marker', iconSize: [24, 24], iconAnchor: [12, 12] });
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], { icon }).addTo(map).bindPopup("You are here");
          // Only set view on initial user location
          map.setView([lat, lng], 15);
        }
        
        // Store current user location for routing
        window.currentUser = { lat: lat, lng: lng };
      }

      function centerOnUser() {
        if (!isInitialized || !map || !window.currentUser) return;
        map.setView([window.currentUser.lat, window.currentUser.lng], 15);
      }

      function cleanupMap() {
        if (routeControl) {
          map.removeControl(routeControl);
          routeControl = null;
        }
        if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }
        Object.values(markers).forEach(marker => map.removeLayer(marker));
        shops.length = 0;
        if (map) {
          map.remove();
          map = null;
        }
        isInitialized = false;
        window.currentUser = null;
      }

      // Initialize map on load
      document.addEventListener('DOMContentLoaded', initializeMap);

      // Handle messages from React Native
      document.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'focusShop') {
            focusShop(data.id, data.track);
          } else if (data.action === 'setUserLocation') {
            window.currentUser = { lat: data.lat, lng: data.lng };
            setUserMarker(data.lat, data.lng);
          } else if (data.action === 'centerUser') {
            centerOnUser();
          } else if (data.action === 'updateShops') {
            updateShops(data.shops);
          } else if (data.action === 'cleanup') {
            cleanupMap();
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Cleanup before unload
      window.addEventListener('beforeunload', cleanupMap);
    </script>
  </body>
  </html>`;

  // Initialize location
  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!mounted) return;

        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setLocation(coords);

        // Send location to WebView immediately
        if (webViewRef.current && webViewReady) {
          webViewRef.current.postMessage(
            JSON.stringify({ action: "setUserLocation", lat: coords.latitude, lng: coords.longitude })
          );
        }

        // Start watching location
        locationWatcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 2,
          },
          (newLoc) => {
            if (!mounted) return;

            const newCoords = {
              latitude: newLoc.coords.latitude,
              longitude: newLoc.coords.longitude,
            };
            setLocation(newCoords);
            
            if (webViewRef.current && webViewReady) {
              webViewRef.current.postMessage(
                JSON.stringify({ action: "setUserLocation", lat: newCoords.latitude, lng: newCoords.longitude })
              );

              // If tracking is enabled and a shop is selected, refocus
              if (selectedShop && tracking) {
                webViewRef.current.postMessage(
                  JSON.stringify({ action: "focusShop", id: selectedShop, track: true })
                );
              }
            }
          }
        );
      } catch (error) {
        // Error handling without console log
      }
    };
    
    initializeLocation();
    return () => {
      mounted = false;
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, [webViewReady, selectedShop, tracking]);

  // Fetch branches with methods
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data: branchesData, error } = await supabase
          .from('shop_branches')
          .select(`
            *,
            branch_methods (method_id)
          `)
          .eq('is_active', true);
        
        if (error) throw error;
        
        setBranches(branchesData || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load laundry shops');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranches();
  }, []);

  // Get shop methods data
  useEffect(() => {
    const fetchShopMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('shop_methods')
          .select('id, code');
        
        if (error) throw error;
        
        const methodsMap: {[key: string]: string} = {};
        data?.forEach(method => {
          if (method.code) {
            methodsMap[method.id] = method.code;
          }
        });
        
        setMethodsData(methodsMap);
      } catch (error) {
        // Error handling without console log
      }
    };
    
    fetchShopMethods();
  }, []);

  // Send shops to WebView when both data and WebView are ready
  const sendShopsToMap = useCallback(() => {
    if (branches.length > 0 && webViewReady && webViewRef.current) {
      const shopsData = branches
        .filter(branch => branch.latitude && branch.longitude)
        .map(branch => ({
          id: branch.id,
          name: branch.name || 'Laundry Shop',
          lat: branch.latitude!,
          lng: branch.longitude!
        }));

      webViewRef.current.postMessage(
        JSON.stringify({ 
          action: "updateShops", 
          shops: shopsData 
        })
      );
    }
  }, [branches, webViewReady]);

  // Update WebView when branches data changes or WebView becomes ready
  useEffect(() => {
    sendShopsToMap();
  }, [sendShopsToMap]);

  // WebView message handler
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.action) {
        case "routeCalculated":
          setCalculatingRoute(null);
          break;
        case "mapReady":
          setWebViewReady(true);
          break;
        case "error":
          setCalculatingRoute(null);
          break;
        default:
          // Handle unknown actions silently
      }
    } catch (error) {
      // Error handling without console log
    }
  }, []);

  // Center on user location
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
      
      if (webViewRef.current && webViewReady) {
        webViewRef.current.postMessage(
          JSON.stringify({ action: "setUserLocation", lat: coords.latitude, lng: coords.longitude })
        );
        webViewRef.current.postMessage(JSON.stringify({ action: "centerUser" }));
      }
    } catch (error) {
      // Error handling without console log
    }
  };

  // Improved click handler with better state management
  const handleListClick = useCallback((shopId: string) => {
    if (!isMounted.current || !webViewReady) return;
    
    const now = Date.now();
    const lastClickTime = clickCount.current[shopId]?.time || 0;
    const clickCountValue = clickCount.current[shopId]?.count || 0;
    
    // If it's been more than 500ms since last click, reset counter
    if (now - lastClickTime > 500) {
      clickCount.current[shopId] = { count: 1, time: now };
      
      // Single click: Focus on shop with route
      setSelectedShop(shopId);
      setCalculatingRoute(shopId);
      
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ 
            action: "focusShop", 
            id: shopId, 
            track: tracking 
          })
        );
      }
      
      // Set timeout to reset click counter
      setTimeout(() => {
        if (isMounted.current && clickCount.current[shopId]?.count === 1) {
          clickCount.current[shopId] = { count: 0, time: 0 };
          // Clear calculating route after timeout if still set
          setTimeout(() => {
            if (isMounted.current && calculatingRoute === shopId) {
              setCalculatingRoute(null);
            }
          }, 2000);
        }
      }, 400);
    } else {
      // Double click detected
      clickCount.current[shopId] = { count: 0, time: 0 };
      setCalculatingRoute(null);
      
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        if (isMounted.current) {
          router.push(`/shop/${shopId}`);
        }
      }, 100);
    }
  }, [webViewReady, tracking, calculatingRoute, router]);

  const getBranchMethodCodes = (branch: ShopBranch): string[] => {
    if (!branch.branch_methods) return [];
    
    const methodCodes = branch.branch_methods
      .map(method => methodsData[method.method_id])
      .filter((code): code is string => code !== undefined && code !== null);
    
    return methodCodes;
  };

  const locationsWithCoords = branches.filter(branch => 
    branch.latitude && branch.longitude
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0AADFF" />
          <Text style={styles.loadingText}>Loading laundry shops...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Laundry Shops Nearby"
        rightElement={
          <TouchableOpacity 
            style={styles.trackingButton} 
            onPress={() => setTracking(!tracking)}
          >
            <Ionicons name={tracking ? "navigate" : "navigate-outline"} size={24} color="white" />
          </TouchableOpacity>
        }
      />

      {/* Leaflet Map in WebView */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: leafletHTML }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            setWebViewReady(true);
          }}
          onError={(syntheticEvent) => {
            setWebViewReady(false);
          }}
          onHttpError={(syntheticEvent) => {
            // Handle HTTP error silently
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0AADFF" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        />

        {/* GPS Button */}
        <TouchableOpacity style={styles.gpsButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Legend & Instructions */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Ionicons name="bicycle" size={16} color="#000" />
            <Text style={styles.legendText}>Delivery</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="cube" size={16} color="#000" />
            <Text style={styles.legendText}>Pickup</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="walk" size={16} color="#000" />
            <Text style={styles.legendText}>Dropoff</Text>
          </View>
        </View>
        <Text style={styles.instructionText}>💡 Tap to view route • Double-tap to open shop</Text>
      </View>

      {/* Branch List */}
      <FlatList
        data={locationsWithCoords}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const methodCodes = getBranchMethodCodes(item);
          const isCalculatingRouteForThisShop = calculatingRoute === item.id;
          const isSelected = selectedShop === item.id;
          
          return (
            <TouchableOpacity 
              style={[
                styles.shopCard,
                isSelected && styles.selectedShopCard,
                isCalculatingRouteForThisShop && styles.calculatingShopCard
              ]} 
              onPress={() => handleListClick(item.id)}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <View style={styles.leftIcons}>
                {isCalculatingRouteForThisShop ? (
                  <ActivityIndicator size="small" color="#3864C3" />
                ) : (
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={isSelected ? "#3864C3" : "#666"} 
                  />
                )}
              </View>

              <View style={styles.shopInfo}>
                <View style={styles.shopHeader}>
                  <Text style={styles.shopName}>{item.name || 'Laundry Branch'}</Text>
                  {isCalculatingRouteForThisShop && (
                    <ActivityIndicator size="small" color="#3864C3" style={styles.routeLoading} />
                  )}
                </View>
                <Text style={styles.shopCity}>{item.address || 'Dumaguete City'}</Text>
                <View style={styles.shopDetails}>
                  <Text style={styles.shopHours}>Hours: 8:00 AM - 9:00 PM</Text>
                  {location && item.latitude && item.longitude && (
                    <Text style={styles.distance}>
                      {calculateDistance(item.latitude, item.longitude)}
                    </Text>
                  )}
                </View>
              </View>

              {/* METHOD ICONS */}
              <View style={styles.methodIcons}>
                {methodCodes.includes('delivery') && (
                  <Ionicons name="bicycle" size={22} color="#000" />
                )}
                {methodCodes.includes('pickup') && (
                  <Ionicons name="cube" size={22} color="#000" style={styles.methodIcon} />
                )}
                {methodCodes.includes('dropoff') && (
                  <Ionicons name="walk" size={22} color="#000" style={styles.methodIcon} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No laundry shops found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  trackingButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mapContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  gpsButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#3864C3',
    padding: 12,
    borderRadius: 50,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Legend Styles
  legendContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  instructionText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  shopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedShopCard: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3864C3',
  },
  calculatingShopCard: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0AADFF',
  },
  leftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  routeLoading: {
    marginLeft: 8,
  },
  shopCity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shopDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  shopHours: {
    fontSize: 12,
    color: '#888',
  },
  distance: {
    fontSize: 11,
    color: '#3864C3',
    fontWeight: '500',
  },
  methodIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});