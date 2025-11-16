import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';
import { AppHeader } from '../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { ScaledSheet, ms, mvs, s } from 'react-native-size-matters';
import { Database } from '../../types/database.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define the types based on your database schema
type DeliveryRow = Database['public']['Tables']['deliveries']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

type DeliveryWithRelations = DeliveryRow & {
  users: Pick<UserRow, 'full_name' | 'phone' | 'avatar_url'> | null;
  orders: Pick<OrderRow, 'customer_name' | 'delivery_location' | 'delivery_latitude' | 'delivery_longitude'> | null;
};

type DriverLocation = {
  lat: number;
  lng: number;
  updated_at: string;
};

type DeliveryStatus = 'unassigned' | 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered';

export default function CustomerTrackOrder() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  
  console.log('📦 ALL PARAMS:', params);
  console.log('🚚 deliveryId:', params.deliveryId);
  console.log('📋 orderId:', params.orderId);

  const deliveryId = params.deliveryId as string;
  const orderId = params.orderId as string;
  const customerName = params.customerName as string;
  const deliveryLocation = params.deliveryLocation as string;
  const deliveryLat = parseFloat(params.deliveryLat as string) || 0;
  const deliveryLng = parseFloat(params.deliveryLng as string) || 0;
  const orderMethod = params.orderMethod as string;

  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [driverInfo, setDriverInfo] = useState<Pick<UserRow, 'full_name' | 'phone' | 'avatar_url'> | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('unassigned');
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string>("Calculating...");
  const [eta, setEta] = useState<string>("Calculating...");

  // Handle call button press
  const handleCallDriver = () => {
    if (driverInfo?.phone) {
      Linking.openURL(`tel:${driverInfo.phone}`);
    }
  };

  // Get Leaflet map HTML with PROPER ROAD ROUTING
  const getCustomerMapHTML = (driverLat: number, driverLng: number) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
          <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; width: 100%; margin: 0; padding: 0; }
            #map { height: 100%; width: 100%; }
            
            .driver-marker {
              background: #007AFF;
              border: 3px solid white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            .destination-marker {
              background: #FF3B30;
              border: 3px solid white;
              border-radius: 50%;
              width: 16px;
              height: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            .loading-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: #f8f9fa;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
              flex-direction: column;
            }

            .route-info {
              position: absolute;
              top: 10px;
              left: 10px;
              right: 10px;
              background: white;
              padding: 10px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              z-index: 1000;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .route-info-item {
              text-align: center;
              flex: 1;
            }
            
            .route-info-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }
            
            .route-info-value {
              font-size: 14px;
              font-weight: bold;
              color: #007AFF;
            }

            /* Hide routing control UI */
            .leaflet-routing-container {
              display: none !important;
            }
            
            .leaflet-routing-alt {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="loadingOverlay" class="loading-overlay">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>Loading driver location and route...</div>
          </div>
          
          <div id="map"></div>
          
          <div class="route-info">
            <div class="route-info-item">
              <div class="route-info-label">DISTANCE TO DRIVER</div>
              <div class="route-info-value" id="live-distance">Calculating...</div>
            </div>
            <div class="route-info-item">
              <div class="route-info-label">ESTIMATED TIME</div>
              <div class="route-info-value" id="live-eta">Calculating...</div>
            </div>
          </div>
          
          <script>
            let map, driverMarker, destinationMarker, routeControl;
            let mapInitialized = false;
            
            const style = document.createElement('style');
            style.textContent = \`
              @keyframes spin { 
                0% { transform: rotate(0deg); } 
                100% { transform: rotate(360deg); } 
              }
            \`;
            document.head.appendChild(style);

            function initMap() {
              if (mapInitialized) return;
              
              map = L.map('map', {
                zoomControl: false,
                attributionControl: false
              }).setView([${deliveryLat}, ${deliveryLng}], 13);
              
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
              }).addTo(map);

              // Add destination marker (customer location)
              destinationMarker = L.circleMarker([${deliveryLat}, ${deliveryLng}], {
                radius: 8,
                fillColor: "#FF3B30",
                color: "white",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8,
                className: 'destination-marker'
              }).addTo(map).bindPopup("Your Location");
              
              mapInitialized = true;
              
              // If we already have driver location, add it
              if (window.initialDriverLocation) {
                updateDriverLocation(window.initialDriverLocation.lat, window.initialDriverLocation.lng);
              }
              
              setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
              }, 1000);
            }

            // Setup proper routing with OSRM
            function setupRouting(driverLat, driverLng) {
              console.log('Setting up routing from:', driverLat, driverLng, 'to:', ${deliveryLat}, ${deliveryLng});
              
              // Remove existing route control
              if (routeControl) {
                map.removeControl(routeControl);
              }

              // Initialize routing control with OSRM
              routeControl = L.Routing.control({
                waypoints: [
                  L.latLng(driverLat, driverLng),
                  L.latLng(${deliveryLat}, ${deliveryLng})
                ],
                router: L.Routing.osrmv1({
                  serviceUrl: 'https://router.project-osrm.org/route/v1'
                }),
                lineOptions: {
                  styles: [{ 
                    color: '#007AFF', 
                    weight: 6, 
                    opacity: 0.8,
                    dashArray: null
                  }]
                },
                routeWhileDragging: false,
                showAlternatives: false,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                show: false,
                createMarker: function() { return null; },
                collapsible: false
              }).addTo(map);

              routeControl.on('routesfound', function(e) {
                const routes = e.routes;
                if (routes && routes.length > 0) {
                  const route = routes[0];
                  const totalDistance = (route.summary.totalDistance / 1000).toFixed(1);
                  const totalTime = Math.round(route.summary.totalTime / 60);
                  
                  console.log('Route found! Distance:', totalDistance, 'km, Time:', totalTime, 'min');
                  
                  // Update display with accurate road-based distance and time
                  document.getElementById('live-distance').textContent = totalDistance + ' km';
                  document.getElementById('live-eta').textContent = totalTime + ' min';
                  
                  // Send accurate route info to React Native
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'route_calculated',
                      distance: totalDistance,
                      eta: totalTime,
                      driverLat: driverLat,
                      driverLng: driverLng
                    }));
                  }
                }
              });

              routeControl.on('routingerror', function(e) {
                console.error('Routing error:', e.error);
                // Fallback to straight line calculation
                drawStraightLine(driverLat, driverLng);
              });
            }

            function drawStraightLine(driverLat, driverLng) {
              const straightDistance = map.distance([driverLat, driverLng], [${deliveryLat}, ${deliveryLng}]);
              const distanceKm = (straightDistance / 1000).toFixed(1);
              const estimatedTime = Math.round((straightDistance / 1000) * 3);
              
              // Draw straight line as fallback
              if (window.routeLine) {
                map.removeLayer(window.routeLine);
              }
              
              window.routeLine = L.polyline([
                [driverLat, driverLng],
                [${deliveryLat}, ${deliveryLng}]
              ], {
                color: '#007AFF',
                weight: 4,
                opacity: 0.6,
                dashArray: '10, 10'
              }).addTo(map);
              
              // Update display with fallback values
              document.getElementById('live-distance').textContent = distanceKm + ' km';
              document.getElementById('live-eta').textContent = estimatedTime + ' min';
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'distance_update',
                  distance: distanceKm,
                  eta: estimatedTime,
                  driverLat: driverLat,
                  driverLng: driverLng,
                  fallback: true
                }));
              }
            }

            function updateDriverLocation(lat, lng) {
              if (!mapInitialized) {
                window.initialDriverLocation = { lat, lng };
                return;
              }
              
              if (!driverMarker) {
                // Create driver marker
                driverMarker = L.circleMarker([lat, lng], {
                  radius: 10,
                  fillColor: "#007AFF",
                  color: "white",
                  weight: 3,
                  opacity: 1,
                  fillOpacity: 0.8,
                  className: 'driver-marker'
                }).addTo(map).bindPopup("Driver Location");
                
                // Fit map to show both driver and destination
                const group = new L.FeatureGroup([driverMarker, destinationMarker]);
                map.fitBounds(group.getBounds().pad(0.1));
                
                // Setup routing when we first get driver location
                setupRouting(lat, lng);
              } else {
                // Update existing marker
                driverMarker.setLatLng([lat, lng]);
                
                // Update routing when driver moves significantly
                const distanceMoved = window.lastDriverLocation ? 
                  map.distance([window.lastDriverLocation.lat, window.lastDriverLocation.lng], [lat, lng]) : 0;
                
                if (distanceMoved > 100) { // Update route if moved more than 100 meters
                  console.log('Driver moved significantly, updating route...');
                  setupRouting(lat, lng);
                }
              }
              
              window.lastDriverLocation = { lat, lng };
              
              // Calculate straight-line distance as temporary display
              const straightDistance = map.distance([lat, lng], [${deliveryLat}, ${deliveryLng}]);
              const distanceKm = (straightDistance / 1000).toFixed(1);
              const estimatedTime = Math.round((straightDistance / 1000) * 3);
              
              // Update temporary display
              document.getElementById('live-distance').textContent = distanceKm + ' km';
              document.getElementById('live-eta').textContent = estimatedTime + ' min';
              
              // Send temporary distance to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'distance_update',
                  distance: distanceKm,
                  eta: estimatedTime,
                  driverLat: lat,
                  driverLng: lng
                }));
              }
            }

            // Initialize map when ready
            if (document.readyState === 'complete') {
              initMap();
            } else {
              window.addEventListener('load', initMap);
            }

            // Handle messages from React Native
            document.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                if (data.action === 'updateDriverLocation') {
                  updateDriverLocation(data.lat, data.lng);
                }
              } catch (e) {
                console.error('Error parsing message:', e);
              }
            });

            window.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                if (data.action === 'updateDriverLocation') {
                  updateDriverLocation(data.lat, data.lng);
                }
              } catch (e) {
                console.error('Error parsing message:', e);
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Fetch initial delivery data and set up real-time subscription
  useEffect(() => {
    if (!deliveryId) return;

    const fetchDeliveryData = async () => {
      try {
        setLoading(true);
        
        // Fetch delivery with driver info and order details
        const { data: deliveryData, error } = await supabase
          .from('deliveries')
          .select(`
            *,
            users (
              full_name,
              phone,
              avatar_url
            ),
            orders (
              customer_name,
              delivery_location,
              delivery_latitude,
              delivery_longitude
            )
          `)
          .eq('id', deliveryId)
          .single();

        if (error) throw error;

        if (deliveryData) {
          const delivery = deliveryData as DeliveryWithRelations;
          
          setDriverInfo(delivery.users);
          setDeliveryStatus((delivery.status || 'unassigned') as DeliveryStatus);
          
          // Set initial driver location if available
          if (delivery.current_lat && delivery.current_lng) {
            setDriverLocation({
              lat: delivery.current_lat,
              lng: delivery.current_lng,
              updated_at: delivery.updated_at || new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Error fetching delivery data:', err);
        Alert.alert('Error', 'Failed to load delivery information');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryData();

    // Set up real-time subscription for driver location updates
    const subscription = supabase
      .channel(`driver_location_${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`
        },
        (payload) => {
          const updatedDelivery = payload.new as Database['public']['Tables']['deliveries']['Row'];
          
          // Update driver location
          if (updatedDelivery.current_lat && updatedDelivery.current_lng) {
            const newLocation = {
              lat: updatedDelivery.current_lat,
              lng: updatedDelivery.current_lng,
              updated_at: updatedDelivery.updated_at || new Date().toISOString()
            };
            
            setDriverLocation(newLocation);
            
            // Send to WebView
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                action: 'updateDriverLocation',
                lat: newLocation.lat,
                lng: newLocation.lng
              }));
            }
          }
          
          // Update status
          if (updatedDelivery.status) {
            setDeliveryStatus(updatedDelivery.status as DeliveryStatus);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deliveryId]);

  const getStatusInfo = (status: DeliveryStatus) => {
    const statusConfig = {
      unassigned: { label: 'Waiting for Driver', color: '#FFA000', icon: 'time-outline' as const },
      assigned: { label: 'Driver Assigned', color: '#2196F3', icon: 'person-outline' as const },
      picked_up: { label: 'Picked Up', color: '#4CAF50', icon: 'cube-outline' as const },
      out_for_delivery: { label: 'Out for Delivery', color: '#FFD93D', icon: 'car-outline' as const },
      delivered: { label: 'Delivered', color: '#34C759', icon: 'checkmark-done' as const }
    };
    
    return statusConfig[status] || statusConfig.unassigned;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Enhanced WebView message handler
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data.type, data);
      
      switch (data.type) {
        case 'distance_update':
          // Temporary straight-line distance
          setDistance(data.distance + ' km');
          setEta(data.eta + ' min');
          break;
          
        case 'route_calculated':
          // ✅ Accurate road-based distance and ETA
          setDistance(data.distance + ' km');
          setEta(data.eta + ' min');
          console.log('Route calculated successfully:', data.distance, 'km', data.eta, 'min');
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Track Your Delivery" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading delivery information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(deliveryStatus);
  const initialDriverLocation = driverLocation || { 
    lat: deliveryLat, 
    lng: deliveryLng,
    updated_at: new Date().toISOString()
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Track Your Delivery" />
      
      <ScrollView style={styles.container}>
        {/* Driver Info Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <Ionicons name="person-circle" size={ms(50)} color="#3864C3" />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {driverInfo?.full_name || 'Driver Assigned Soon'}
              </Text>
              <Text style={styles.driverStatus}>
                {statusInfo.label}
              </Text>
              {driverLocation && (
                <Text style={styles.locationTime}>
                  Updated {formatTimeAgo(driverLocation.updated_at)}
                </Text>
              )}
            </View>
          </View>
          
          {driverInfo?.phone && (
            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={ms(20)} color="#FFF" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: getCustomerMapHTML(initialDriverLocation.lat, initialDriverLocation.lng) }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={styles.map}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => {
              // Send initial driver location to WebView once it's loaded
              if (driverLocation && webViewRef.current) {
                setTimeout(() => {
                  webViewRef.current?.postMessage(JSON.stringify({
                    action: 'updateDriverLocation',
                    lat: driverLocation.lat,
                    lng: driverLocation.lng
                  }));
                }, 1000);
              }
            }}
          />
        </View>

        {/* Delivery Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Delivery Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={ms(20)} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue}>{deliveryLocation}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={ms(20)} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>
                {orderMethod === 'pickup' ? 'Pickup & Return Service' : 'Delivery Service'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={ms(20)} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Distance to Driver</Text>
              <Text style={styles.detailValue}>{distance}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="speedometer" size={ms(20)} color="#666" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Estimated Arrival</Text>
              <Text style={styles.detailValue}>{eta}</Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Delivery Progress</Text>
          
          <View style={styles.timeline}>
            {['unassigned', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'].map((status, index) => {
              const isCompleted = 
                status === 'unassigned' || 
                (status === 'assigned' && deliveryStatus !== 'unassigned') ||
                (status === 'picked_up' && ['assigned', 'picked_up', 'out_for_delivery', 'delivered'].includes(deliveryStatus)) ||
                (status === 'out_for_delivery' && ['picked_up', 'out_for_delivery', 'delivered'].includes(deliveryStatus)) ||
                (status === 'delivered' && deliveryStatus === 'delivered');
              
              const isCurrent = status === deliveryStatus;
              
              return (
                <View key={status} style={styles.timelineStep}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted ? styles.timelineDotCompleted : styles.timelineDotPending,
                    isCurrent && styles.timelineDotCurrent
                  ]}>
                    {isCompleted && !isCurrent && (
                      <Ionicons name="checkmark" size={ms(12)} color="#FFF" />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineStepText,
                      isCompleted ? styles.timelineStepCompleted : styles.timelineStepPending
                    ]}>
                      {getStatusInfo(status as DeliveryStatus).label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: mvs(10),
    fontSize: ms(16),
    color: "#666",
  },
  driverCard: {
    backgroundColor: '#FFF',
    margin: s(15),
    padding: s(15),
    borderRadius: s(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverDetails: {
    marginLeft: s(10),
    flex: 1,
  },
  driverName: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: '#000',
  },
  driverStatus: {
    fontSize: ms(14),
    color: '#666',
    marginTop: mvs(2),
  },
  locationTime: {
    fontSize: ms(12),
    color: '#3864C3',
    marginTop: mvs(2),
  },
  callButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: mvs(8),
    paddingHorizontal: s(15),
    borderRadius: s(20),
  },
  callButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: s(5),
  },
  mapContainer: {
    height: mvs(300),
    marginHorizontal: s(15),
    borderRadius: s(12),
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    margin: s(15),
    padding: s(15),
    borderRadius: s(12),
    marginTop: mvs(10),
  },
  detailsTitle: {
    fontSize: ms(16),
    fontWeight: 'bold',
    marginBottom: mvs(15),
    color: '#000',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: mvs(12),
  },
  detailTextContainer: {
    marginLeft: s(10),
    flex: 1,
  },
  detailLabel: {
    fontSize: ms(12),
    color: '#666',
    marginBottom: mvs(2),
  },
  detailValue: {
    fontSize: ms(14),
    color: '#000',
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: '#FFF',
    margin: s(15),
    padding: s(15),
    borderRadius: s(12),
    marginBottom: mvs(20),
  },
  timelineTitle: {
    fontSize: ms(16),
    fontWeight: 'bold',
    marginBottom: mvs(15),
    color: '#000',
  },
  timeline: {
    // Timeline styles
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: mvs(15),
  },
  timelineDot: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(10),
  },
  timelineDotPending: {
    backgroundColor: '#CCCCCC',
  },
  timelineDotCompleted: {
    backgroundColor: '#34C759',
  },
  timelineDotCurrent: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepText: {
    fontSize: ms(14),
    fontWeight: '500',
  },
  timelineStepPending: {
    color: '#666',
  },
  timelineStepCompleted: {
    color: '#000',
  },
});