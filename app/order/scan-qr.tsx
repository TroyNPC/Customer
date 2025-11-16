import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  BackHandler,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/Auth';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';
import { AppHeader } from '../../components/AppHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ShopService = Database['public']['Tables']['shop_services']['Row'];
type DetergentType = Database['public']['Tables']['detergent_types']['Row'];
type SoftenerType = Database['public']['Tables']['softener_types']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];

interface FormData {
  name: string;
  contact: string;
  location: string;
  service: string;
  detergent: string;
  softener: string;
  latitude?: string | null;
  longitude?: string | null;
}

export default function ScanQRPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const shopId = Array.isArray(params.shopId) ? params.shopId[0] : params.shopId;
  const method = Array.isArray(params.method) ? params.method[0] : params.method;
  
  // Parse form data with all location fields
  const formData: FormData = params.formData ? JSON.parse(params.formData as string) : null;
  
  // Also check for individual location params (from map selection)
  const deliveryLocation = Array.isArray(params.delivery_location) ? params.delivery_location[0] : params.delivery_location;
  const deliveryLatitude = Array.isArray(params.delivery_latitude) ? params.delivery_latitude[0] : params.delivery_latitude;
  const deliveryLongitude = Array.isArray(params.delivery_longitude) ? params.delivery_longitude[0] : params.delivery_longitude;

  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  const isMounted = useRef(true);
  const alertShown = useRef(false);

  useEffect(() => {
    console.log('📍 QR Page - Received ALL params:', {
      shopId: params.shopId,
      method: params.method,
      delivery_location: params.delivery_location,
      delivery_latitude: params.delivery_latitude,
      delivery_longitude: params.delivery_longitude,
      formData: params.formData ? JSON.parse(params.formData as string) : null
    });
  }, [params]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      alertShown.current = false;
    };
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // FIXED: Better location data combination with null safety
  const getCompleteFormData = (): FormData => {
    const baseData = formData || {
      name: '',
      contact: '',
      location: '',
      service: '',
      detergent: '',
      softener: ''
    };
    
    // Priority: Use direct params first, then form data
    const combinedData: FormData = {
      ...baseData,
      // Override with location data from map if available
      location: deliveryLocation || baseData.location,
      // Handle coordinates properly - they might be null for dropoff
      latitude: deliveryLatitude !== undefined ? deliveryLatitude : baseData.latitude,
      longitude: deliveryLongitude !== undefined ? deliveryLongitude : baseData.longitude
    };
    
    return combinedData;
  };

  // FIXED: Safe coordinate parsing with null safety
  const parseCoordinate = (coord: string | null | undefined): number | null => {
    if (!coord) return null;
    try {
      const parsed = parseFloat(coord);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  };

  const showAlert = (title: string, message: string, buttons: any[]) => {
    if (isMounted.current && !alertShown.current) {
      alertShown.current = true;
      Alert.alert(title, message, buttons);
      setTimeout(() => {
        alertShown.current = false;
      }, 1000);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !isMounted.current) return;
    
    setScanned(true);
    setCameraActive(false);
    
    try {
      const qrData = JSON.parse(data);
      
      // Verify QR code matches the expected shop
      if (qrData.branch_id === shopId || qrData.shopId === shopId) {
        await handleCreateOrder(qrData);
      } else {
        showAlert(
          "Invalid QR Code", 
          `This QR code is for a different shop. Please scan the correct shop QR code.`,
          [
            {
              text: "Try Again",
              onPress: resetScanner
            },
          ]
        );
      }
    } catch (error) {
      // Fallback: Check if raw data matches shop ID
      if (data === shopId) {
        await handleCreateOrder({ branch_id: shopId });
      } else {
        showAlert(
          "Invalid QR Code", 
          "This QR code format is not recognized. Please scan a valid shop QR code.",
          [
            {
              text: "Try Again",
              onPress: resetScanner
            },
          ]
        );
      }
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log('🔙 Hardware back button pressed');
        // Stop camera and go back without scanning
        setCameraActive(false);
        setScanned(false);
        router.back();
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove();
  }, [router]);

  // FIXED: Complete order creation with proper coordinate handling
  const handleCreateOrder = async (qrData: any) => {
    const completeFormData = getCompleteFormData();
    
    if (!completeFormData || !isMounted.current) return;
    
    console.log('💾 handleCreateOrder - Final data before saving:', {
      method: method,
      location: completeFormData.location,
      latitude: completeFormData.latitude,
      longitude: completeFormData.longitude,
      hasCoordinates: !!(completeFormData.latitude && completeFormData.longitude)
    });
    
    // Validate delivery data if method is delivery
    if (method === 'delivery') {
      if (!completeFormData.location) {
        showAlert(
          "Missing Delivery Location", 
          "Please select a delivery location before scanning the QR code.",
          [
            {
              text: "Go Back",
              onPress: () => router.back()
            },
          ]
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Get method ID
      const { data: methodData, error: methodError } = await supabase
        .from('shop_methods')
        .select('id')
        .eq('code', method)
        .single();

      if (methodError) throw new Error('Invalid order method');

      // Get selected service, detergent, and softener details
      const { data: serviceData } = await supabase
        .from('shop_services')
        .select('*')
        .eq('id', completeFormData.service)
        .single();

      const { data: detergentData } = await supabase
        .from('detergent_types')
        .select('*')
        .eq('name', completeFormData.detergent)
        .single();

      const { data: softenerData } = await supabase
        .from('softener_types')
        .select('*')
        .eq('name', completeFormData.softener)
        .single();

      if (!serviceData || !detergentData || !softenerData) {
        throw new Error('Invalid service selection');
      }

      // FIXED: Better coordinate handling with null safety
      const deliveryLatitude = parseCoordinate(completeFormData.latitude);
      const deliveryLongitude = parseCoordinate(completeFormData.longitude);

      console.log('📍 Creating order with location data:', {
        location: completeFormData.location,
        latitude: deliveryLatitude,
        longitude: deliveryLongitude,
        method: method
      });

      // FIXED: Prepare the order data with proper typing and coordinate handling
      const orderData: OrderInsert = {
        customer_id: user?.id || null,
        branch_id: shopId || null,
        method_id: methodData.id || null,
        detergent_id: detergentData.id || null,
        softener_id: softenerData.id || null,
        customer_name: completeFormData.name || null,
        customer_contact: completeFormData.contact || null,
        delivery_location: completeFormData.location || null,
        service_id: completeFormData.service || null,
        // FIXED: Use parsed coordinates (could be null for dropoff)
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        meta: {
          is_guest_order: !user?.id,
          order_created_at: new Date().toISOString(),
          order_type: method,
          detergent_name: completeFormData.detergent,
          softener_name: completeFormData.softener,
          service_name: serviceData.name,
          service_price: serviceData.price_per_kg,
          qr_verified_at: new Date().toISOString(),
          qr_data: qrData,
          user_id: user?.id,
          user_email: user?.email,
          // FIXED: Only include coordinates if they exist
          delivery_coordinates: deliveryLatitude && deliveryLongitude ? {
            lat: deliveryLatitude,
            lng: deliveryLongitude
          } : null,
          order_flow: method === 'delivery' ? 'pickup_and_delivery' : 'dropoff_only',
          // FIXED: Add location source info for debugging
          location_source: deliveryLocation ? 'from_map_params' : 'from_form_data'
        }
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (!isMounted.current) return;

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ Order created successfully:', order.id);

      // Navigate to confirmation with order details
      router.replace({
        pathname: "/order/confirmation",
        params: { 
          id: order.id,
          method: method,
          isDelivery: method === 'delivery' ? 'true' : 'false'
        }
      });

    } catch (error: any) {
      if (!isMounted.current) return;

      console.error('💥 Order creation failed:', error);
      showAlert(
        "Order Failed", 
        error.message || "Failed to create order. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              if (isMounted.current) {
                resetScanner();
                setLoading(false);
              }
            }
          }
        ]
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const resetScanner = () => {
    if (isMounted.current) {
      setScanned(false);
      setCameraActive(true);
    }
  };

  // FIXED: Better location display with coordinate formatting
  const getLocationDisplay = () => {
    const completeFormData = getCompleteFormData();
    
    if (method === 'delivery') {
      const lat = parseCoordinate(completeFormData.latitude);
      const lng = parseCoordinate(completeFormData.longitude);
      
      if (lat !== null && lng !== null) {
        return `${completeFormData.location} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
      return completeFormData.location || 'Location not set';
    } else {
      return 'Shop Location (Dropoff)';
    }
  };

  const getMethodDescription = () => {
    if (method === 'delivery') {
      return "Scan the QR code to confirm your delivery order.";
    } else {
      return "Scan the QR code to confirm your dropoff order.";
    }
  };

  const getOrderTypeBadge = () => {
    if (method === 'delivery') {
      return {
        label: 'Delivery',
        icon: 'car' as const,
        color: '#3864C3',
        description: 'Pickup + Delivery Service'
      };
    } else {
      return {
        label: 'Drop Off',
        icon: 'briefcase' as const,
        color: '#10B981',
        description: 'Shop Dropoff Only'
      };
    }
  };

  // Permission states
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Scan QR Code" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Scan QR Code" />
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#FF6B6B" />
          <Text style={styles.title}>Camera Access Required</Text>
          <Text style={styles.subtitle}>
            We need camera access to scan QR codes for order verification.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completeFormData = getCompleteFormData();
  if (!completeFormData) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Scan QR Code" />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.title}>Missing Order Data</Text>
          <Text style={styles.subtitle}>
            Please go back and fill out the order form first.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Back to Form</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const orderTypeBadge = getOrderTypeBadge();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title="Scan QR Code"
        rightElement={
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowSummary(!showSummary)}
            >
              <Ionicons name={showSummary ? "eye-off" : "eye"} size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.flashButton}
              onPress={() => {
                Alert.alert(
                  "Camera Help",
                  "Point your camera at the shop's QR code. Make sure it's well-lit and within the frame.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Ionicons name="help-circle" size={22} color="white" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Order Type Badge */}
      <View style={[styles.orderTypeBadge, { backgroundColor: orderTypeBadge.color }]}>
        <Ionicons name={orderTypeBadge.icon} size={16} color="white" />
        <Text style={styles.orderTypeBadgeText}>{orderTypeBadge.label}</Text>
        <Text style={styles.orderTypeBadgeDescription}>{orderTypeBadge.description}</Text>
      </View>

      {/* Compact Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="qr-code" size={20} color="#3864C3" />
        <Text style={styles.instructionsTitle}>
          Scan Shop QR Code
        </Text>
      </View>

      {/* Summary Toggle Button at Top */}
      {!showSummary && (
        <TouchableOpacity 
          style={styles.summaryToggleButtonTop}
          onPress={() => setShowSummary(true)}
        >
          <Ionicons name="list" size={16} color="#3864C3" />
          <Text style={styles.summaryToggleTextTop}>View Order Summary</Text>
        </TouchableOpacity>
      )}

      {/* Expandable Order Summary */}
      {showSummary && (
        <View style={styles.orderSummary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <TouchableOpacity onPress={() => setShowSummary(false)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.summaryContent} showsVerticalScrollIndicator={false}>
            {/* Compact Summary Rows */}
            <View style={styles.compactSummary}>
              <View style={styles.compactRow}>
                <Ionicons name="person" size={14} color="#666" />
                <Text style={styles.compactLabel}>Name:</Text>
                <Text style={styles.compactValue}>{completeFormData.name}</Text>
              </View>
              
              <View style={styles.compactRow}>
                <Ionicons name="call" size={14} color="#666" />
                <Text style={styles.compactLabel}>Contact:</Text>
                <Text style={styles.compactValue}>{completeFormData.contact}</Text>
              </View>
              
              <View style={styles.compactRow}>
                <Ionicons name={method === 'delivery' ? "location" : "business"} size={14} color="#666" />
                <Text style={styles.compactLabel}>
                  {method === 'delivery' ? 'Delivery To:' : 'Dropoff At:'}
                </Text>
                <Text style={styles.compactLocation} numberOfLines={1}>
                  {getLocationDisplay()}
                </Text>
              </View>
              
              <View style={styles.compactRow}>
                <Ionicons name="shirt" size={14} color="#666" />
                <Text style={styles.compactLabel}>Service:</Text>
                <Text style={styles.compactValue}>{completeFormData.service}</Text>
              </View>
              
              <View style={styles.servicesRow}>
                <View style={styles.serviceItem}>
                  <Ionicons name="water" size={12} color="#3864C3" />
                  <Text style={styles.serviceText}>{completeFormData.detergent}</Text>
                </View>
                <View style={styles.serviceItem}>
                  <Ionicons name="flower" size={12} color="#10B981" />
                  <Text style={styles.serviceText}>{completeFormData.softener}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Main Camera Area - Now takes most space */}
      <View style={styles.cameraContainer}>
        {cameraActive ? (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scanGuideText}>Align QR code within frame</Text>
            </View>
          </View>
        ) : (
          <View style={styles.scanComplete}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.scanCompleteText}>QR Code Scanned</Text>
            <Text style={styles.scanCompleteSubtext}>
              {method === 'delivery' 
                ? 'Processing your delivery order...' 
                : 'Processing your dropoff order...'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {scanned ? (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={resetScanner}
              disabled={loading}
            >
              <Ionicons name="refresh" size={18} color="#3864C3" />
              <Text style={styles.secondaryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.tertiaryButton}
              onPress={handleBack}
              disabled={loading}
            >
              <Text style={styles.tertiaryButtonText}>
                {method === 'delivery' ? 'Change Location' : 'Back to Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3864C3" />
            <Text style={styles.loadingText}>
              {method === 'delivery' 
                ? 'Creating your delivery order...' 
                : 'Creating your dropoff order...'
              }
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  flashButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orderTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  orderTypeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 6,
  },
  orderTypeBadgeDescription: {
    color: 'white',
    fontSize: 10,
    opacity: 0.9,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3864C3',
    marginLeft: 8,
  },
  summaryToggleButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3864C3',
  },
  summaryToggleTextTop: {
    color: '#3864C3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3864C3',
    maxHeight: 200,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#092B75',
  },
  summaryContent: {
    paddingHorizontal: 12,
  },
  compactSummary: {
    paddingVertical: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 8,
    width: 60,
  },
  compactValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  compactLocation: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    fontStyle: 'italic',
  },
  servicesRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
    marginLeft: 4,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 300,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#3864C3',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanGuideText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  scanComplete: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scanCompleteText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  scanCompleteSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    padding: 12,
    backgroundColor: 'white',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3864C3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3864C3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#3864C3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tertiaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tertiaryButtonText: {
    color: '#666',
    fontSize: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#092B75',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
});