import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabaseClient } from '../../../lib/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

export default function ScanQRPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { shopId, method, formData } = params;
  
   // Ensure shopId is a string (not an array)
  const shopIdString = Array.isArray(shopId) ? shopId[0] : shopId;
  const methodString = Array.isArray(method) ? method[0] : method;

  // Parse the form data that was passed from OrderPage
  const parsedFormData = formData ? JSON.parse(formData as string) : null;
  
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(true);

  // Request camera permission on component mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    setCameraActive(false);
    
    console.log('=== QR SCAN DEBUG ===');
    console.log('Scanned QR Data:', data);
    console.log('Expected Shop ID:', shopId);
    console.log('====================');
    
    // Verify the scanned QR code matches the expected shop
    try {
      const qrData = JSON.parse(data);
      
      console.log('Parsed QR Data:', qrData);
      
      // Check if QR code contains the expected branch_id
      if (qrData.branch_id === shopIdString) {
        console.log('✅ QR Code Verified - Branch ID matches!');
        Alert.alert(
          "QR Code Verified", 
          `Shop: ${qrData.branch_name}\nQR verified successfully!`,
          [
            {
              text: "Continue",
              onPress: () => handleCreateOrder()
            },
          ]
        );
      } else {
        console.log('❌ QR Code Mismatch');
        console.log('QR Branch ID:', qrData.branch_id);
        console.log('Expected Branch ID:', shopId);
        Alert.alert(
          "Invalid QR Code", 
          `This QR code is for: ${qrData.branch_name}\nPlease scan the correct shop QR code.`,
          [
            {
              text: "Try Again",
              onPress: () => {
                setScanned(false);
                setCameraActive(true);
              }
            },
          ]
        );
      }
    } catch (error) {
      console.log('❌ Error parsing QR data:', error);
      // If QR data is not JSON, check if it's a simple shop ID
      if (data === shopId) {
        Alert.alert(
          "QR Code Verified", 
          "Shop QR code verified successfully!",
          [
            {
              text: "Continue",
              onPress: () => handleCreateOrder()
            },
          ]
        );
      } else {
        Alert.alert(
          "Invalid QR Code", 
          "This QR code format is not recognized. Please scan a valid shop QR code.",
          [
            {
              text: "Try Again",
              onPress: () => {
                setScanned(false);
                setCameraActive(true);
              }
            },
          ]
        );
      }
    }
  };

  const handleCreateOrder = async () => {
    if (!parsedFormData) {
      Alert.alert("Error", "No order data found. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      // Get method ID
      const { data: methodData } = await supabaseClient
      .from('shop_methods')
      .select('id')
      .eq('code', methodString)
      .single();

      if (!methodData) throw new Error('Invalid order method');

      // Use the database function instead of direct insert
      const { data: orderId, error } = await supabaseClient.rpc('create_laundry_order', {
        p_customer_id: '00000000-0000-0000-0000-000000000000', // Guest order
        p_branch_id: shopIdString,
        p_method_id: methodData.id,
        p_detergent_id: parsedFormData.detergentId,
        p_softener_id: parsedFormData.softenerId,
        p_customer_name: parsedFormData.name,
        p_customer_contact: parsedFormData.contact,
        p_delivery_location: parsedFormData.location,
        p_service_id: parsedFormData.serviceId,
        p_service_price: parsedFormData.servicePrice,
        p_meta: {
          is_guest_order: parsedFormData.isGuest,
          detergent_name: parsedFormData.detergentName,
          softener_name: parsedFormData.softenerName,
          service_name: parsedFormData.serviceName,
          qr_verified_at: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Success - navigate to confirmation
      router.push({
        pathname: "/(tabs)/order/confirmation",
        params: { orderId }
      });

    } catch (error) {
      console.error('Error creating order after QR scan:', error);
      Alert.alert("Error", "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const resetScanner = () => {
    setScanned(false);
    setCameraActive(true);
  };

  // Show permission request
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.subtitle}>
          We need camera access to scan QR codes. Please allow camera permissions to continue.
        </Text>
        <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading or error if no form data
  if (!parsedFormData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No order data found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR Code</Text>
      <Text style={styles.subtitle}>
        Point your camera at the QR code located at the laundry shop
      </Text>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <Text style={styles.summaryText}>Name: {parsedFormData.name}</Text>
        <Text style={styles.summaryText}>Contact: {parsedFormData.contact}</Text>
        {parsedFormData.location && (
          <Text style={styles.summaryText}>Location: {parsedFormData.location}</Text>
        )}
        <Text style={styles.summaryText}>Service: {parsedFormData.serviceName}</Text>
        <Text style={styles.summaryText}>Detergent: {parsedFormData.detergentName}</Text>
        <Text style={styles.summaryText}>Softener: {parsedFormData.softenerName}</Text>
        <Text style={styles.summaryText}>Method: {method}</Text>
        <Text style={styles.summaryText}>Total: ₱{parsedFormData.servicePrice}</Text>
      </View>

      {/* QR Scanner Container */}
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
            {/* Overlay with absolute positioning */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
              <Text style={styles.scanText}>Align QR code within frame</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>QR Code Scanned</Text>
            <Text style={styles.cameraPlaceholderSubtext}>Processing your order...</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {scanned && (
        <TouchableOpacity 
          style={styles.rescanButton} 
          onPress={resetScanner}
          disabled={loading}
        >
          <Text style={styles.rescanButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back to Form</Text>
      </TouchableOpacity>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Creating your order...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#092B75',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3864C3',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#092B75',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cameraContainer: {
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative', // Important for absolute positioning
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cameraPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3864C3',
    marginBottom: 8,
  },
  cameraPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // This makes it cover the entire camera
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3864C3',
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3864C3',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3864C3',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3864C3',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  scanButton: {
    backgroundColor: '#3864C3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rescanButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  backButtonText: {
    color: '#3864C3',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});