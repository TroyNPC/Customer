// app/(tabs)/order/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../lib/authContext";
import { supabaseClient } from "../../../lib/supabaseClient";
import { Database } from "../../../types/supabase";

// Simplified types based on your schema
type ShopService = Database['public']['Tables']['shop_services']['Row'];
type DetergentType = Database['public']['Tables']['detergent_types']['Row'];
type SoftenerType = Database['public']['Tables']['softener_types']['Row'];
type User = Database['public']['Tables']['users']['Row'];

// Form data interface
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

// Props for navigation
interface OrderPageParams {
  id: string;
  method: 'dropoff' | 'delivery' | 'pickup';
  selectedLocation?: string;
}

export default function OrderPage() {
  const router = useRouter();
  const params = useLocalSearchParams() as Partial<OrderPageParams>;
  const { user } = useAuth();
  
  const shopId = params.id;
  const method = params.method;
  const selectedLocationFromMap = params.selectedLocation;

  // Single state for form data
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    location: "",
    serviceId: "",
    detergentId: "",
    softenerId: ""
  });

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ShopService[]>([]);
  const [detergents, setDetergents] = useState<DetergentType[]>([]);
  const [softeners, setSofteners] = useState<SoftenerType[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Memoized data fetches
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedLocationFromMap) {
      setFormData(prev => ({ ...prev, location: selectedLocationFromMap }));
    }
  }, [selectedLocationFromMap]);

  useEffect(() => {
    if (shopId) {
      fetchShopData();
    }
  }, [shopId]);

  // Optimized data fetching
  const fetchUserProfile = async () => {
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('full_name, phone')
        .eq('id', user!.id)
        .single();
      
      if (data) {
        setUserProfile(data);
        if (!isGuest) {
          setFormData(prev => ({
            ...prev,
            name: data.full_name || '',
            contact: data.phone || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchShopData = async () => {
    if (!shopId) return;

    try {
      // Fetch all data in parallel
      const [servicesRes, detergentsRes, softenersRes] = await Promise.all([
        supabaseClient
          .from('shop_services')
          .select('*')
          .eq('branch_id', shopId)
          .eq('is_active', true)
          .order('name'),
        
        supabaseClient
          .from('branch_detergents')
          .select('detergent_types(*)')
          .eq('branch_id', shopId)
          .eq('is_available', true)
          .order('display_order'),
        
        supabaseClient
          .from('branch_softeners')
          .select('softener_types(*)')
          .eq('branch_id', shopId)
          .eq('is_available', true)
          .order('display_order')
      ]);

      setServices(servicesRes.data || []);
      
      // Extract nested data safely
      setDetergents(
        detergentsRes.data
          ?.map(item => item.detergent_types)
          .filter((det): det is DetergentType => det !== null) || []
      );
      
      setSofteners(
        softenersRes.data
          ?.map(item => item.softener_types)
          .filter((soft): soft is SoftenerType => soft !== null) || []
      );

    } catch (error) {
      console.error('Error fetching shop data:', error);
      Alert.alert('Error', 'Failed to load services and options');
    }
  };

  const handleGuestChoice = (choice: 'login' | 'guest') => {
    setShowGuestModal(false);
    
    if (choice === 'guest') {
      setIsGuest(true);
      setFormData(prev => ({ ...prev, name: '', contact: '' }));
      handlePrepareOrder();
    } else {
      router.push('/login');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.contact || !formData.serviceId || !formData.detergentId || !formData.softenerId) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return false;
    }

    if ((method === 'delivery' || method === 'pickup') && !formData.location) {
      Alert.alert("Missing Info", "Please select your location.");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (!user && !isGuest) {
      setShowGuestModal(true);
      return;
    }

    handlePrepareOrder();
  };

  const handlePrepareOrder = async () => {
    if (!shopId || !method) return;
    
    setLoading(true);
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      const selectedDetergent = detergents.find(d => d.id === formData.detergentId);
      const selectedSoftener = softeners.find(s => s.id === formData.softenerId);

      if (!selectedService || !selectedDetergent || !selectedSoftener) {
        throw new Error('Invalid selection data');
      }

      const orderData: OrderFormData = {
        name: formData.name,
        contact: formData.contact,
        location: (method === 'delivery' || method === 'pickup') ? formData.location : '',
        serviceId: formData.serviceId,
        detergentId: formData.detergentId,
        softenerId: formData.softenerId,
        serviceName: selectedService.name,
        detergentName: selectedDetergent.name,
        softenerName: selectedSoftener.name,
        servicePrice: selectedService.price_per_kg || 0,
        isGuest: !user?.id
      };

      // Route based on method
      if (method === 'dropoff' || method === 'delivery') {
        router.push({
          pathname: "/(tabs)/order/scan-qr",
          params: { 
            shopId,
            method,
            formData: JSON.stringify(orderData)
          }
        });
      } else if (method === 'pickup') {
        await handleCreateOrder(orderData);
      }

    } catch (error) {
      console.error('Error preparing order:', error);
      Alert.alert("Error", "Failed to prepare order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData: OrderFormData) => {
    if (!shopId || !method) return;

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
        p_customer_id: user?.id || '00000000-0000-0000-0000-000000000000',
        p_branch_id: shopId,
        p_method_id: methodData.id,
        p_detergent_id: orderData.detergentId,
        p_softener_id: orderData.softenerId,
        p_customer_name: orderData.name,
        p_customer_contact: orderData.contact,
        p_delivery_location: orderData.location,
        p_service_id: orderData.serviceId,
        p_service_price: orderData.servicePrice,
        p_meta: {
          is_guest_order: orderData.isGuest,
          detergent_name: orderData.detergentName,
          softener_name: orderData.softenerName,
          service_name: orderData.serviceName,
          order_created_at: new Date().toISOString()
        }
      });

      if (error) throw error;

      if (method === 'pickup') {
        Alert.alert("Success", "Pickup order submitted successfully!", [
          { text: "OK", onPress: () => router.push("/map") },
        ]);
      } else {
        router.push({
          pathname: "/(tabs)/order/confirmation",
          params: { orderId }
        });
      }

    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = () => {
    if (!shopId || !method) return;
    
    router.push({
      pathname: "/(tabs)/order/location-map",
      params: { 
        shopId, 
        method,
        ...formData
      }
    });
  };

  const getHeaderTitle = () => {
    switch (method) {
      case 'dropoff': return 'Drop Off Order';
      case 'delivery': return 'Delivery Order';
      case 'pickup': return 'Pickup Order';
      default: return 'Create Order';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Preparing...';
    switch (method) {
      case 'dropoff': 
      case 'delivery': return 'Continue to QR Scan';
      case 'pickup': return 'Submit Pickup Order';
      default: return 'Submit Order';
    }
  };

  // Early return if missing required params
  if (!shopId || !method) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid parameters</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#3864C3' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Simplified Header */}
      <View style={{ backgroundColor: "#3864C3", padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ 
            color: "white", 
            fontSize: 18, 
            fontWeight: "bold", 
            marginLeft: 20,
            flex: 1,
            textAlign: 'center'
          }}>
            {getHeaderTitle()}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Scrollable Form */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          value={formData.name}
          onChangeText={(text) => updateFormField('name', text)}
        />

        <Text style={styles.label}>Contact Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Contact Number"
          keyboardType="phone-pad"
          value={formData.contact}
          onChangeText={(text) => updateFormField('contact', text)}
        />

        {/* Location field for delivery and pickup */}
        {(method === 'delivery' || method === 'pickup') && (
          <>
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={handleLocationSelect}
            >
              <Text style={formData.location ? styles.locationText : styles.locationPlaceholder}>
                {formData.location || "Select Location on Map"}
              </Text>
              <Ionicons name="map" size={20} color="#3864C3" />
            </TouchableOpacity>
            {formData.location && (
              <Text style={styles.selectedLocationText}>
                Selected: {formData.location}
              </Text>
            )}
          </>
        )}

        <Text style={styles.label}>Select Preferred Service</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.serviceId}
            onValueChange={(value) => updateFormField('serviceId', value)}
          >
            <Picker.Item label="Select Preferred Service" value="" />
            {services.map((service) => (
              <Picker.Item 
                key={service.id} 
                label={`${service.name} - ₱${service.price_per_kg}/${service.unit}`} 
                value={service.id} 
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Select Type of Detergent</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.detergentId}
            onValueChange={(value) => updateFormField('detergentId', value)}
          >
            <Picker.Item label="Select Type of Detergent" value="" />
            {detergents.map((detergent) => (
              <Picker.Item key={detergent.id} label={detergent.name} value={detergent.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Select Type of Softener</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.softenerId}
            onValueChange={(value) => updateFormField('softenerId', value)}
          >
            <Picker.Item label="Select Type of Softener" value="" />
            {softeners.map((softener) => (
              <Picker.Item key={softener.id} label={softener.name} value={softener.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.sendButtonText}>{getButtonText()}</Text>
          )}
        </TouchableOpacity>

        {/* Info text */}
        <Text style={styles.infoText}>
          {method === 'dropoff' && "You'll need to scan the shop's QR code after submitting."}
          {(method === 'delivery' || method === 'pickup') && "You'll need to select your location on the map to continue."}
        </Text>

        {!user && (
          <Text style={styles.guestInfoText}>
            {isGuest ? "Continuing as guest" : "You can continue as guest or login for order tracking"}
          </Text>
        )}
      </ScrollView>

      {/* Guest/Login Modal */}
      <Modal visible={showGuestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Continue with Account</Text>
            <Text style={styles.modalSubtitle}>
              Login to track your orders and save your preferences, or continue as guest.
            </Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleGuestChoice('login')}
            >
              <Ionicons name="log-in" size={20} color="white" />
              <Text style={styles.loginButtonText}>Login to Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => handleGuestChoice('guest')}
            >
              <Ionicons name="person-outline" size={20} color="#3864C3" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#000000",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    marginBottom: 15,
    color: "#000",
  },
  locationInput: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    marginBottom: 15,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  locationText: {
    color: "#000",
    fontSize: 14,
  },
  locationPlaceholder: {
    color: "#666",
    fontSize: 14,
  },
  selectedLocationText: {
    fontSize: 12,
    color: "#3864C3",
    marginTop: -10,
    marginBottom: 15,
    fontStyle: 'italic' as const,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#F7F7F7",
  },
  sendButton: {
    backgroundColor: "#1939BB",
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center" as const,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold" as const,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center" as const,
    marginTop: 10,
    fontStyle: 'italic' as const,
  },
  guestInfoText: {
    fontSize: 11,
    color: "#3864C3",
    textAlign: "center" as const,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
    color: '#092B75',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#3864C3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 8,
  },
  guestButton: {
    borderWidth: 2,
    borderColor: '#3864C3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  guestButtonText: {
    color: '#3864C3',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
};