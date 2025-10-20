// app/(tabs)/order/scan-qr.tsx
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabaseClient } from '../../../lib/supabaseClient';

interface QRScanParams {
  shopId: string;
  method: string;
  formData: string;
}

interface OrderFormData {
  name: string;
  contact: string;
  location: string;
  serviceId: string;
  detergentId: string;
  softenerId: string;
  serviceName: string;
  detergentName: string;
  softenerName: string;
  servicePrice: number;
  isGuest: boolean;
}

interface QRData {
  branch_id: string;
  branch_name?: string;
}

export default function ScanQRPage() {
  const router = useRouter();
  const params = useLocalSearchParams() as Partial<QRScanParams>;
  
  const shopId = params.shopId;
  const method = params.method;
  const formData = params.formData ? JSON.parse(params.formData) as OrderFormData : null;

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;
    setScanned(true);
    
    try {
      const qrData: QRData = JSON.parse(data);
      
      if (qrData.branch_id === shopId) {
        Alert.alert("Success", "QR Code Verified!", [
          { text: "Continue", onPress: () => completeOrder(qrData) }
        ]);
      } else {
        Alert.alert("Invalid QR", "Wrong shop QR code.", [
          { text: "Try Again", onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      // If QR is not JSON, check if it's just the shop ID
      if (data === shopId) {
        Alert.alert("QR Verified", "Shop QR code verified!", [
          { text: "Continue", onPress: () => completeOrder({ branch_id: data }) }
        ]);
      } else {
        Alert.alert("Invalid QR", "Please scan a valid code.", [
          { text: "Try Again", onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  const completeOrder = async (qrData: QRData) => {
    if (!formData || !shopId || !method) {
      Alert.alert("Error", "Missing order data.");
      return;
    }

    setLoading(true);
    try {
      // Get method ID
      const { data: methodData } = await supabaseClient
        .from('shop_methods')
        .select('id')
        .eq('code', method)
        .single();

      if (!methodData) throw new Error('Invalid order method');

      // Create order
      const { data: orderId, error } = await supabaseClient.rpc('create_laundry_order', {
        p_customer_id: formData.isGuest ? '00000000-0000-0000-0000-000000000000' : '00000000-0000-0000-0000-000000000000',
        p_branch_id: shopId,
        p_method_id: methodData.id,
        p_detergent_id: formData.detergentId,
        p_softener_id: formData.softenerId,
        p_customer_name: formData.name,
        p_customer_contact: formData.contact,
        p_delivery_location: formData.location,
        p_service_id: formData.serviceId,
        p_service_price: formData.servicePrice,
        p_meta: {
          is_guest_order: formData.isGuest,
          detergent_name: formData.detergentName,
          softener_name: formData.softenerName,
          service_name: formData.serviceName,
          qr_verified_at: new Date().toISOString(),
          qr_branch_name: qrData.branch_name
        }
      });

      if (error) throw error;

      router.push({
        pathname: "/(tabs)/order/confirmation",
        params: { orderId }
      });

    } catch (error) {
      console.error('Order creation error:', error);
      Alert.alert("Error", "Failed to create order. Please try again.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.subtitle}>
          We need camera access to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!formData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No order data found.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Shop QR Code</Text>
        <Text style={styles.headerSubtitle}>
          Point camera at the shop's QR code
        </Text>
      </View>

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <Text style={styles.summaryText}>Name: {formData.name}</Text>
        <Text style={styles.summaryText}>Service: {formData.serviceName}</Text>
        <Text style={styles.summaryText}>Total: ₱{formData.servicePrice}</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        {!loading ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        ) : (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3864C3" />
            <Text style={styles.loadingText}>Creating Order...</Text>
          </View>
        )}
        
        {/* Scanner Frame */}
        <View style={styles.scanFrame} />
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        {scanned && !loading && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.secondaryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3864C3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  headerSubtitle: {
    textAlign: 'center' as const,
    marginTop: 5,
    color: '#666',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  summaryTitle: {
    fontWeight: 'bold' as const,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontWeight: 'bold' as const,
  },
  scanFrame: {
    position: 'absolute' as const,
    top: '25%',
    alignSelf: 'center' as const,
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
  },
  cancelText: {
    color: '#3864C3',
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
  },
};