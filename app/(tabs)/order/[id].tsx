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
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../../lib/authContext";
import { supabaseClient } from "../../../lib/supabaseClient";
import { Database } from "../../../types/supabase";

type ShopService = Database['public']['Tables']['shop_services']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type ShopMethod = Database['public']['Tables']['shop_methods']['Row'];
type DetergentType = Database['public']['Tables']['detergent_types']['Row'];
type SoftenerType = Database['public']['Tables']['softener_types']['Row'];
type User = Database['public']['Tables']['users']['Row'];

// Define Profile type manually since it's not in Database type
interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const vbW = 1440;
const vbH = 320;

export default function OrderPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const shopId = Array.isArray(params.id) ? params.id[0] : params.id;
  const method = Array.isArray(params.method) ? params.method[0] : params.method;

  // Check if we're returning from location map with selected location
  const selectedLocationFromMap = Array.isArray(params.selectedLocation) 
    ? params.selectedLocation[0] 
    : params.selectedLocation;

  console.log('=== ORDER PAGE DEBUG ===');
  console.log('shopId:', shopId);
  console.log('method:', method);
  console.log('selectedLocationFromMap:', selectedLocationFromMap);
  console.log('========================');
  
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState<string>("");
  const [detergent, setDetergent] = useState("");
  const [softener, setSoftener] = useState("");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ShopService[]>([]);
  const [detergents, setDetergents] = useState<DetergentType[]>([]);
  const [softeners, setSofteners] = useState<SoftenerType[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Set location when returning from location map
  useEffect(() => {
    if (selectedLocationFromMap) {
      setLocation(selectedLocationFromMap);
      console.log('Location set from map:', selectedLocationFromMap);
    }
  }, [selectedLocationFromMap]);

  // Fetch services and options from database
  useEffect(() => {
    console.log('=== FETCHING DATA ===');
    console.log('shopId:', shopId);
    
    const fetchData = async () => {
      if (!shopId) {
        console.error('No shopId provided');
        return;
      }

      try {
        // Fetch services for this branch
        const { data: servicesData, error: servicesError } = await supabaseClient
          .from('shop_services')
          .select('*')
          .eq('branch_id', shopId)
          .eq('is_active', true)
          .order('name');

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Fetch available detergents for this branch
        const { data: detergentsData, error: detergentsError } = await supabaseClient
          .from('branch_detergents')
          .select(`
            is_available,
            custom_price,
            detergent_types (
              id,
              name,
              base_price,
              description
            )
          `)
          .eq('branch_id', shopId)
          .eq('is_available', true)
          .order('display_order');

        if (detergentsError) throw detergentsError;

        // Fetch available softeners for this branch
        const { data: softenersData, error: softenersError } = await supabaseClient
          .from('branch_softeners')
          .select(`
            is_available,
            custom_price,
            softener_types (
              id,
              name,
              base_price,
              description
            )
          `)
          .eq('branch_id', shopId)
          .eq('is_available', true)
          .order('display_order');

        if (softenersError) throw softenersError;

        // Extract detergents and softeners
        const availableDetergents = detergentsData
          ?.filter(item => item.detergent_types)
          .map(item => item.detergent_types) as DetergentType[] || [];

        const availableSofteners = softenersData
          ?.filter(item => item.softener_types)
          .map(item => item.softener_types) as SoftenerType[] || [];

        setDetergents(availableDetergents);
        setSofteners(availableSofteners);

      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load services and options');
      }
    };

    if (shopId) {
      fetchData();
    }
  }, [shopId]);

  // Set user data if available
  useEffect(() => {
    if (userProfile && !isGuest) {
      setName(userProfile.full_name || '');
      setContact(userProfile.phone || '');
    }
  }, [userProfile, isGuest]);

  const handleGuestChoice = (choice: 'login' | 'guest') => {
    setShowGuestModal(false);
    
    if (choice === 'guest') {
      setIsGuest(true);
      if (userProfile) {
        setName('');
        setContact('');
      }
      handlePrepareOrder();
    } else {
      router.push('/login');
    }
  };

  const handleSubmit = () => {
    // Check all required fields for ALL methods
    if (!name || !contact || !service || !detergent || !softener) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }

    // For delivery & pickup, check if location is selected
    if ((method === 'delivery' || method === 'pickup') && !location) {
      Alert.alert("Missing Info", "Please select your location.");
      return;
    }

    // If user is not logged in, show guest modal
    if (!user && !isGuest) {
      setShowGuestModal(true);
      return;
    }

    handlePrepareOrder();
  };

  const handlePrepareOrder = async () => {
    setLoading(true);
    try {
      // Find the actual detergent/softener objects to get their IDs
      const selectedDetergentObj = detergents.find(d => d.name === detergent);
      const selectedSoftenerObj = softeners.find(s => s.name === softener);
      const selectedServiceObj = services.find(s => s.id === service);

      if (!selectedDetergentObj || !selectedSoftenerObj || !selectedServiceObj) {
        throw new Error('Invalid selection data');
      }

      // Prepare form data to pass to QR scan
      const formData = {
        name,
        contact,
        serviceId: service,
        detergentId: selectedDetergentObj.id,
        softenerId: selectedSoftenerObj.id,
        location: (method === 'delivery' || method === 'pickup') ? location : null,
        isGuest: !user?.id,
        // Keep names for easy display
        detergentName: selectedDetergentObj.name,
        softenerName: selectedSoftenerObj.name,
        serviceName: selectedServiceObj.name,
        servicePrice: selectedServiceObj.price_per_kg
      };

      // For dropoff and delivery, navigate to QR scan first
      if (method === 'dropoff' || method === 'delivery') {
        router.push({
          pathname: "/(tabs)/order/scan-qr",
          params: { 
            shopId,
            method,
            formData: JSON.stringify(formData)
          }
        });
      } 
      // For pickup, create order directly (no QR needed)
      else if (method === 'pickup') {
        await handleCreateOrder(formData);
      }

    } catch (error) {
      console.error('Error preparing order:', error);
      Alert.alert("Error", "Failed to prepare order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (formData: any) => {
    try {
      const methodId = await getMethodId(method);
      if (!methodId) throw new Error('Invalid order method');

      // Use the database function instead of direct insert
      const { data: orderId, error } = await supabaseClient.rpc('create_laundry_order', {
        p_customer_id: user?.id || '00000000-0000-0000-0000-000000000000',
        p_branch_id: shopId as string,
        p_method_id: methodId,
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
          // For dropoff/delivery, QR verification happens later
          ...(method === 'dropoff' || method === 'delivery' ? {} : {
            order_created_at: new Date().toISOString()
          })
        }
      });

      if (error) throw error;

      // Handle success based on method
      if (method === 'pickup') {
        Alert.alert("Success", "Pickup order submitted successfully!", [
          {
            text: "OK",
            onPress: () => router.push("/map"),
          },
        ]);
      } else {
        // For dropoff/delivery, this should be handled in QR scan screen
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

  // Helper function to get method ID
  const getMethodId = async (methodCode: string): Promise<string | null> => {
    const { data, error } = await supabaseClient
      .from('shop_methods')
      .select('id')
      .eq('code', methodCode)
      .single();

    if (error) {
      console.error('Error fetching method ID:', error);
      return null;
    }
    return data.id;
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
      case 'dropoff': return 'Continue to QR Scan';
      case 'delivery': return 'Continue to QR Scan';
      case 'pickup': return 'Submit Pickup Order';
      default: return 'Submit Order';
    }
  };

  const handleLocationSelect = () => {
    router.push({
      pathname: "/(tabs)/order/location-map",
      params: { 
        shopId, 
        method,
        currentName: name,
        currentContact: contact,
        currentService: service,
        currentDetergent: detergent,
        currentSoftener: softener
      }
    });
  };

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
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <View style={{ width: s(30) }} />
        </View>
      </View>

      {/* Scrollable Form */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: mvs(80) }}
        style={{ flex: 1, backgroundColor: "white" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            placeholderTextColor="#000"
            value={name}
            onChangeText={(text) => setName(text)}
          />

          <Text style={styles.label}>Contact Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Contact Number"
            placeholderTextColor="#000"
            keyboardType="phone-pad"
            value={contact}
            onChangeText={(text) => setContact(text)}
          />

          {/* Location field for delivery and pickup */}
          {(method === 'delivery' || method === 'pickup') && (
            <>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity 
                style={styles.locationInput}
                onPress={handleLocationSelect}
              >
                <Text style={location ? styles.locationText : styles.locationPlaceholder}>
                  {location || "Select Location on Map"}
                </Text>
                <Ionicons name="map" size={ms(20)} color="#3864C3" />
              </TouchableOpacity>
              {location && (
                <Text style={styles.selectedLocationText}>
                  Selected: {location}
                </Text>
              )}
            </>
          )}

          <Text style={styles.label}>Select Preferred Service</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={service}
              onValueChange={(itemValue) => setService(itemValue)}
            >
              <Picker.Item label="Select Preferred Service" value="" />
              {services.map((srv) => (
                <Picker.Item 
                  key={srv.id} 
                  label={`${srv.name} - ₱${srv.price_per_kg}/${srv.unit}`} 
                  value={srv.id} 
                />
              ))}
            </Picker>
          </View>

          {/* Detergent and Softener fields for ALL methods */}
          <Text style={styles.label}>Select Type of Detergent</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={detergent}
              onValueChange={(itemValue) => setDetergent(itemValue)}
            >
              <Picker.Item label="Select Type of Detergent" value="" />
              {detergents.map((det) => (
                <Picker.Item key={det.id} label={det.name} value={det.name} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Select Type of Softener</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={softener}
              onValueChange={(itemValue) => setSoftener(itemValue)}
            >
              <Picker.Item label="Select Type of Softener" value="" />
              {softeners.map((soft) => (
                <Picker.Item key={soft.id} label={soft.name} value={soft.name} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
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
          {(method === 'delivery' || method === 'pickup') && (
            <Text style={styles.infoText}>
              You'll need to select your location on the map to continue.
            </Text>
          )}
          {method === 'dropoff' && (
            <Text style={styles.infoText}>
              You'll need to scan the shop's QR code after submitting.
            </Text>
          )}

          {/* Guest user info */}
          {!user && (
            <Text style={styles.guestInfoText}>
              {isGuest ? "Continuing as guest" : "You can continue as guest or login for order tracking"}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Guest/Login Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGuestModal(false)}
      >
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
              <Ionicons name="log-in" size={ms(20)} color="white" />
              <Text style={styles.loginButtonText}>Login to Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => handleGuestChoice('guest')}
            >
              <Ionicons name="person-outline" size={ms(20)} color="#3864C3" />
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
  formContainer: {
    paddingHorizontal: s(20),
    marginTop: mvs(20),
  },
  label: {
    fontSize: ms(16),
    fontWeight: "bold",
    color: "#000000",
    marginTop: mvs(15),
  },
  input: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    marginTop: 6,
    color: "#000",
  },
  locationInput: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F7F7F7",
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: ms(12),
    color: "#3864C3",
    marginTop: mvs(5),
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: s(8),
    marginTop: 6,
    backgroundColor: "#F7F7F7",
  },
  sendButton: {
    backgroundColor: "#1939BB",
    borderRadius: s(12),
    marginTop: mvs(30),
    alignItems: "center",
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: ms(18),
    fontWeight: "bold",
  },
  infoText: {
    fontSize: ms(12),
    color: "#666",
    textAlign: "center",
    marginTop: mvs(10),
    fontStyle: 'italic',
  },
  guestInfoText: {
    fontSize: ms(11),
    color: "#3864C3",
    textAlign: "center",
    marginTop: mvs(8),
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(20),
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: s(16),
    padding: s(20),
    width: '100%',
    maxWidth: s(300),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: mvs(8),
    color: '#092B75',
  },
  modalSubtitle: {
    fontSize: ms(14),
    textAlign: 'center',
    marginBottom: mvs(20),
    color: '#666',
    lineHeight: mvs(20),
  },
  loginButton: {
    backgroundColor: '#3864C3',
    borderRadius: s(12),
    paddingVertical: mvs(14),
    paddingHorizontal: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mvs(10),
  },
  loginButtonText: {
    color: 'white',
    fontSize: ms(16),
    fontWeight: 'bold',
    marginLeft: s(8),
  },
  guestButton: {
    borderWidth: 2,
    borderColor: '#3864C3',
    borderRadius: s(12),
    paddingVertical: mvs(14),
    paddingHorizontal: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mvs(10),
    backgroundColor: 'white',
  },
  guestButtonText: {
    color: '#3864C3',
    fontSize: ms(16),
    fontWeight: 'bold',
    marginLeft: s(8),
  },
  cancelButton: {
    paddingVertical: mvs(12),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: ms(14),
  },
});